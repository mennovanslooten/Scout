var _has_jquery = false;
var _focused = '';
var _mouse_step = 25;
var _mouse = {
	x: 0,
	y: 0,

	dblclick: function(x, y) {
		if (this.moveTo(x, y)) {
			page.sendEvent('doubleclick', this.x, this.y - _viewport.top);
			return true;
		}
		return false;
	},

	click: function(x, y) {
		if (this.moveTo(x, y)) {
			page.sendEvent('click', this.x, this.y - _viewport.top);
			return true;
		}
		return false;
	},

	moveTo: function(x, y) {
		if (!_viewport.isInViewPort(y)) {
			_viewport.scrollTo(y);
		}

		if (this.isHovering(x, y)) {
			return true;
		}

		var delta_x = x - _mouse.x;
		var delta_y = y - _mouse.y;

		if (delta_x > _mouse_step) {
			_mouse.x += _mouse_step;
		} else if (delta_x < _mouse_step * -1) {
			_mouse.x -= _mouse_step;
		} else {
			_mouse.x = x;
		}

		if (delta_y > _mouse_step) {
			_mouse.y += _mouse_step;
		} else if (delta_y < _mouse_step * -1) {
			_mouse.y -= _mouse_step;
		} else {
			_mouse.y = y;
		}

		//console.log('mousemove', this.x, this.y - _viewport.top);
		page.sendEvent('mousemove', this.x, this.y - _viewport.top);
		return false;
	},

	isHovering: function(x, y) {
		return x === this.x && y === this.y;
	}
};


var _viewport = {
	top: null,
	bottom: null,
	isInViewPort: function(y) {
		if (this.top === null || this.bottom !== null) {
			this.calculateViewport();
		}
		return y >= this.top && y <= this.bottom;
	},

	calculateViewport: function() {
		var viewport = page.evaluate(function() {
			var $win = jQuery(window);
			var $doc = jQuery(document);

			var win_h = $win.height();
			var scroll_top = $doc.scrollTop();

			return {
				top: scroll_top,
				bottom: scroll_top + win_h
			};
		});

		this.top = viewport.top;
		this.bottom = viewport.bottom;
	},

	scrollTo: function(y) {
		var viewport_h = this.bottom - this.top;
		var new_scroll_top = y - Math.round(viewport_h / 2);

		page.evaluate(function(new_scroll_top) {
			var $doc = jQuery(document);
			$doc.scrollTop(new_scroll_top);
		}, new_scroll_top);
	}
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

	render: function(title) {
		screendump.dump(title);
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

	click: function(destination) {
		var center = this.getCoordinates(destination);
		if (!center) return false;

		if (_mouse.click(center.left, center.top)) {
			_focused = destination;
			return true;
		}
		return false;
	},

	// destination can be either a string containing "123, 567" or a css
	// selector
	moveMouseTo: function(destination) {
		var center = this.getCoordinates(destination);
		if (!center) return false;

		return _mouse.moveTo(center.left, center.top);
	},

	dblclick: function(destination) {
		var center = this.getCoordinates(destination);
		if (!center) return false;

		if (_mouse.dblclick(center.left, center.top)) {
			_focused = destination;
			return true;
		}
		return false;

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

	getCoordinates: function(destination) {
		getJQuery();
		var coordinates_rx = /(\d+), ?(\d+)/;
		var coordinates = destination.match(coordinates_rx);

		if (coordinates && coordinates.length) {
			return {
				left: parseInt(coordinates[0], 10),
				top: parseInt(coordinates[1], 10)
			};
		} else if (this.assertVisible(destination)) {
			return this.getCenter(destination);
		}

		return null;
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
