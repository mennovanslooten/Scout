var _focused = '';
var _mouse = {
	x: 0,
	y: 0
};


var _has_jquery = false;
function getJQuery() {
	var has_jquery = page.evaluate(function() {
		return 'jQuery' in window;
	});


	if (!has_jquery) {
		page.injectJs('./lib/jquery-2.0.3.js');

		page.evaluate(function() {
			jQuery.noConflict();
		});
	}

	var has_dummy = page.evaluate(function() {
		return 'dummy' in jQuery;
	});

	if (!has_dummy) {
		page.injectJs('./lib/jquery.assert.js');
	}
}


function getVisible(selector) {
	getJQuery();

	return page.evaluate(function(selector) {
		return jQuery(selector).filter(':visible');
	}, selector);
}


function evaluate(remoteCallback) {
	return function(selector, text) {
		getJQuery();
		var args = [].slice.call(arguments, 0);
		args.unshift(remoteCallback);
		return page.evaluate.apply(page, args);
	};
}


function jQueryAssert(type) {
	return function(selector, text) {
		getJQuery();
		// args = ['.selector', 'Some text']
		var args = [].slice.call(arguments, 0);

		// args = ['assertText', '.selector', 'Some text']
		args.unshift(type);

		var remoteAssert = function(type, selector, text) {
			return jQuery(selector)[type](text);
		};

		args.unshift(remoteAssert);

		var result = page.evaluate.apply(page, args);

		/*
		console.log(args.join(' - '));
		console.log(type, [].join.call(arguments, ', '), result);
		if (type==='assertMinLength') {
			for (var i = 0; i < arguments.length; i++) {
				console.log(i, arguments[i], typeof arguments[i]);
			}
			var num_visible = page.evaluate(function(selector) {
				return jQuery(selector).filter(':visible').length;
			}, selector);
			console.log('visible', num_visible);
		}
		*/
		return result;
	};
}

exports.action_handlers = {
	open: function(url) {
		if (page.is_loaded) {
			return true;
		}

		if (page.is_loading) {
			return false;
		}

		page.is_loaded = false;
		page.is_loading = true;
		page.open(url);

		return false;
	},

	assertTitle: function(sub_title) {
		var title = page.evaluate(function() {
			return document.title;
		});
		return title.indexOf(sub_title) !== -1;
	},

	assertPage: function(sub_url) {
		var url = page.evaluate(function() {
			return location.href;
		});
		return url.indexOf(sub_url) !== -1;
	},

	assertUrl: function(expression) {
		var url = page.evaluate(function() {
			return location.href;
		});
		return new RegExp(expression).test(url);
	},

	log: function(message) {
		//console.log('\n# ' + message);
		_logger.info('\n# ' + message);

		return true;
	},

	/*
	assertText: function(selector, text) {
		getJQuery();
		return page.evaluate(function(selector, text) {
			return jQuery(selector).is(':contains(' + text + ')');
		}, selector, text);
	},
	*/

	assertText: jQueryAssert('assertText'),

	/*
	assertExists: function(selector) {
		getJQuery();

		return page.evaluate(function(selector) {
			return jQuery(selector).length > 0;
		}, selector);
	},
	*/

	assertExists: jQueryAssert('assertExists'),

	/*
	assertVisible: function(selector) {
		getJQuery();
		return page.evaluate(function(selector) {
			return jQuery(selector).is(':visible');
		}, selector);
	},
	*/

	assertVisible: jQueryAssert('assertVisible'),

	/*
	assertHidden: function(selector) {
		getJQuery();
		return page.evaluate(function(selector) {
			var $result = jQuery(selector);
			var is_hidden = $result.is(':hidden');
			var is_display_none = $result.css('display') === 'none';
			var is_visibility_hidden = $result.css('visibility') === 'hidden';
			var is_opacity_0 = parseInt($result.css('opacity'), 10) === 0;
			return !$result.length || is_hidden || is_display_none || is_visibility_hidden || is_opacity_0;
		}, selector);
	},
	*/

	assertHidden: jQueryAssert('assertHidden'),

	/*
	assertEmpty: function(selector) {
		getJQuery();
		var has_no_text = page.evaluate(function(selector) {
			var $result = jQuery(selector);
			return jQuery.trim($result.text()) === '';
		}, selector);
		return has_no_text && this.assertElementCount(selector + ' > *', 0);
	},
	*/

	assertEmpty: jQueryAssert('assertEmpty'),

	/*
	assertNotEmpty: function(selector) {
		getJQuery();
		var has_text = page.evaluate(function(selector) {
			var $result = jQuery(selector);
			return jQuery.trim($result.text()) !== '';
		}, selector);
		return has_text || this.getLength(selector + ' > *') > 0;
	},
	*/

	assertNotEmpty: jQueryAssert('assertNotEmpty'),

	/*
	getLength: function(selector) {
		getJQuery();
		return page.evaluate(function(selector) {
			return jQuery(selector).filter(':visible').length;
		}, selector);
	},
	*/

	/*
	assertLength: function(selector, num) {
		return this.assertElementCount(selector, num);
	},
	*/

	assertLength: jQueryAssert('assertLength'),

	/*
	assertMinLength: function(selector, num) {
		num = parseInt(num, 10);
		var num_visible = this.getLength(selector);
		return num_visible >= num;
	},
	*/

	assertMinLength: jQueryAssert('assertMinLength'),

	/*
	assertMaxLength: function(selector, num) {
		num = parseInt(num, 10);
		var num_visible = this.getLength(selector);
		return num_visible <= num;
	},
	*/

	assertMaxLength: jQueryAssert('assertMaxLength'),


	/*
	assertElementCount: function(selector, num) {
		getJQuery();
		num = parseInt(num, 10);

		return this.getLength(selector) === num;
	},
	*/

	/*
	assertValue: function(selector, value) {
		getJQuery();

		var val = page.evaluate(function(selector) {
			return jQuery(selector).val();
		}, selector);

		//console.log(selector, val, value);

		return page.evaluate(function(selector, value) {
			return jQuery(selector).val() === value;
		}, selector, value);
	},
	*/

	assertValue: jQueryAssert('assertValue'),

	choose: function() {
		getJQuery();
		var args = [].slice.call(arguments, 0);
		var selector = args.shift();

		if (!this.assertVisible(selector)) {
			return false;
		}

		args.forEach(function(option_text) {
			page.evaluate(function(selector, option_text) {
				var $select = jQuery(selector);
				var $option = $select.find('option').filter(':contains(' + option_text + ')');
				$select.val($option.attr('value') || option_text);
			}, selector, option_text);
		});

		return true;
	},

	submit: function(selector, text) {
		getJQuery();
		if (!this.assertVisible(selector)) {
			return false;
		}

		page.evaluate(function(selector) {
			jQuery(selector).trigger('submit');
		}, selector);

		return true;
	},

	type: function(selector, text) {
		if (!this.assertVisible(selector)) {
			return false;
		}

		if (!text.length) {
			return true;
		}

		if (_focused !== selector) {
			this.click(selector);
			return false;
			// _focused = selector;
		}

		/*
			TODO: Use all possible keys from
			https://github.com/ariya/phantomjs/commit/cab2635e66d74b7e665c44400b8b20a8f225153a
		*/
		if (text.length === 1) {
			page.sendEvent('keypress', text, null, null, 0);
		} else {
			while (text) {
				if (text.indexOf('<enter>') === 0) {
					text = text.substr('<enter>'.length);
					page.sendEvent('keypress', page.event.key.Enter, null, null, 0);
				} else {
					var character = text.charAt(0);
					this.type(selector, character);
					text = text.substr(1);
				}
			}
		}

		return true;
	},

	click: function(selector) {
		getJQuery();

		if (!this.assertVisible(selector)) {
			return false;
		}

		var center = page.evaluate(function(selector) {
			var $result = jQuery(selector).first();
			var offset = $result.offset();

			return {
				left: offset.left + $result.outerWidth() / 2,
				top:  offset.top + $result.outerHeight() / 2
			};
		}, selector);

		var viewport = page.evaluate(function() {
			var $win = jQuery(window);
			var $doc = jQuery(document);

			var win_h = $win.height();
			var win_w = $win.width();
			var scroll_top = $doc.scrollTop();

			return {
				h: win_h,
				w: win_w,
				scroll_top: scroll_top
			};
		}, selector);

		var is_in_viewport = viewport.scroll_top <= center.top && viewport.scroll_top + viewport.h >= center.top;

		if (!is_in_viewport) {
			// Scroll element into view and try again later
			var new_scroll_top = center.top - (viewport.h / 2);

			page.evaluate(function(new_scroll_top) {
				var $doc = jQuery(document);
				$doc.scrollTop(new_scroll_top);
			}, new_scroll_top);

			return false;
		}

		var delta_x = center.left - _mouse.x;
		var delta_y = center.top  - _mouse.y;

		var mouse_step = 25;
		if (delta_x > mouse_step) {
			_mouse.x += mouse_step;
		} else if (delta_x < mouse_step * -1) {
			_mouse.x -= mouse_step;
		} else {
			_mouse.x = center.left;
		}

		if (delta_y > mouse_step) {
			_mouse.y += mouse_step;
		} else if (delta_y < mouse_step * -1) {
			_mouse.y -= mouse_step;
		} else {
			_mouse.y = center.top;
		}

		page.sendEvent('mousemove', _mouse.x, _mouse.y);

		if (_mouse.x !== center.left || _mouse.y !== center.top) {
			return false;
		}

		page.sendEvent('click', center.left, center.top - viewport.scroll_top);
		_focused = selector;
		return true;
	},

	dblclick: function(selector) {
		getJQuery();
		if (!this.assertVisible(selector)) {
			return false;
		}

		var offset = page.evaluate(function(selector) {
			var $result = jQuery(selector);
			return $result.offset();
		}, selector);

		page.sendEvent('doubleclick', offset.left, offset.top);
		return true;
	},

	/*
	assertHasClass: function(selector, class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		return this.assertVisible(selector + class_name);
	},
	*/

	assertHasClass: jQueryAssert('assertHasClass'),

	/*
	assertDisabled: function(selector) {
		getJQuery();
		if (!this.assertVisible(selector)) {
			return false;
		}

		return page.evaluate(function(selector) {
			return jQuery(selector).is(':disabled');
		}, selector);
	}
	*/

	assertDisabled: jQueryAssert('assertDisabled')
};


