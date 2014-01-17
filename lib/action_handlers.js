var _has_jquery = false;
var _focused = '';
var _mouse_step = 25;
var _mouse = {
	x: 0,
	y: 0
};


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


function jQueryAssert(type) {
	return function() {
		getJQuery();
		// args = ['.selector', 'Some text']
		var args = [].slice.call(arguments, 0);

		// args = ['assertText', '.selector', 'Some text']
		args.unshift(type);

		var remoteAssert = function() {
			var type = arguments[0];
			var selector = arguments[1];
			var args = [].slice.call(arguments, 2);
			var $result = jQuery(selector);
			return $result['dummy_' + type].apply($result, args);
		};

		args.unshift(remoteAssert);

		var result = page.evaluate.apply(page, args);

		return result;
	};
}

var action_handlers = {
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
		_logger.info('\n# ' + message);

		return true;
	},

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

		if (text.length === 1) {
			page.sendEvent('keypress', text, null, null, 0);
		} else {
			while (text) {
				/*
					Matches all keys from
					https://github.com/ariya/phantomjs/commit/cab2635e66d74b7e665c44400b8b20a8f225153a
					in the form <KeyName>
				*/
				var special_keys = /^<([^>]+)>/;
				var matches = text.match(special_keys);

				if (matches && matches.length) {
					var key = matches[1];
					text = text.substr(matches[0].length);
					page.sendEvent('keypress', page.event.key[key], null, null, 0);
				} else {
					var character = text.charAt(0);
					this.type(selector, character);
					text = text.substr(1);
				}
			}

			// Reset focused element, as keyevent may have triggered a blur()
			_focused = '';
		}

		return true;
	},

	/*
	click: function(selector) {
		getJQuery();

		if (!this.assertVisible(selector)) {
			return false;
		}

		var center = this.getCenter(selector);

		var viewport = this.getViewPort(selector);

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
	*/

	click: function(selector) {
		getJQuery();

		if (!this.assertVisible(selector)) {
			return false;
		}

		if (!this.isInViewPort(selector)) {
			this.scrollIntoView(selector);
			return false;
		}

		if (!this.isMouseHovering(selector)) {
			this.moveMouseTo(selector);
			return false;
		}

		var center = this.getCenter(selector);
		var viewport = this.getViewPort(selector);

		page.sendEvent('click', center.left, center.top - viewport.scroll_top);

		_focused = selector;
		return true;
	},

	isInViewPort: function(selector) {
		var center = this.getCenter(selector);
		var viewport = this.getViewPort(selector);
		return viewport.scroll_top <= center.top && viewport.scroll_top + viewport.h >= center.top;
	},

	scrollIntoView: function(selector) {
		var center = this.getCenter(selector);
		var viewport = this.getViewPort(selector);
		var new_scroll_top = center.top - (viewport.h / 2);

		page.evaluate(function(new_scroll_top) {
			var $doc = jQuery(document);
			$doc.scrollTop(new_scroll_top);
		}, new_scroll_top);

	},

	isMouseHovering: function(selector) {
		var center = this.getCenter(selector);
		var delta_x = Math.abs(center.left - _mouse.x);
		var delta_y = Math.abs(center.top  - _mouse.y);
		return delta_x === 0 && delta_y === 0;
	},

	moveMouseTo: function(selector) {
		var center = this.getCenter(selector);
		var delta_x = center.left - _mouse.x;
		var delta_y = center.top  - _mouse.y;

		if (delta_x > _mouse_step) {
			_mouse.x += _mouse_step;
		} else if (delta_x < _mouse_step * -1) {
			_mouse.x -= _mouse_step;
		} else {
			_mouse.x = center.left;
		}

		if (delta_y > _mouse_step) {
			_mouse.y += _mouse_step;
		} else if (delta_y < _mouse_step * -1) {
			_mouse.y -= _mouse_step;
		} else {
			_mouse.y = center.top;
		}

		page.sendEvent('mousemove', _mouse.x, _mouse.y);
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
	}
};

[
	'assertText',
	'assertExists',
	'assertVisible',
	'assertHidden',
	'assertEmpty',
	'assertNotEmpty',
	'assertLength',
	'assertMinLength',
	'assertMaxLength',
	'assertValue',
	'assertHasClass',
	'assertNotHasClass',
	'assertDisabled',
	'getCenter',
	'getViewPort'
].forEach(function(type) {
	action_handlers[type] = jQueryAssert(type);
});

exports.action_handlers = action_handlers;
