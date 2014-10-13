var _mouse      = require('./mouse');
var _keyboard   = require('./keyboard');
var _screendump = require('./screendump');
var _resemble   = require('./resemble');

var _focused    = '';


/**
 * Check if jQuery is loaded on the page, if not: load it
 * Then load the DummyJS jQuery assertions and utilities
 */
function getJQuery() {
	var has_jquery = _page.evaluate(function() {
		try {
			jQuery.isFunction(jQuery);
			return true;
		} catch (ex) {
			return false;
		}
	});


	if (!has_jquery) {
		_page.injectJs('./lib/jquery-2.0.3.js');

		_page.evaluate(function() {
			jQuery.noConflict();
		});
	}

	var is_dummy_ready = _page.evaluate(function() {
		return 'is_dummy_ready' in jQuery;
	});

	if (!is_dummy_ready) {
		_page.injectJs('./lib/jquery.dummy.js');
	}
}


/**
 * Generic wrapper for in-browser assertions using jQuery
 */
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

			// Get all the elements matching the selector
			var $result = jQuery(selector);

			// Then run the assertion on the individual elements
			return $result.dummyAssert.call($result, type, args);
		};

		// args = [remoteAssert, 'assertText', '.selector', 'Some text']
		args.unshift(remoteAssert);

		var result = _page.evaluate.apply(_page, args);

		return result;
	};
}


var actions = {
	open: function(url, dimensions) {
		if (url.indexOf('./') === 0) {
			var path = _current_test.path;
			url = path.substr(0, path.lastIndexOf('/')) + url.substr(1);
		}

		if (_page.is_loaded) {
			if (_page.getURL() === 'about:blank') {
				return 'Error opening <' + url + '>';
			}

			_mouse.reset();
			return '';
		}

		if (_page.is_loading) {
			return 'Opening <' + url + '> took too long';
		}

		if (dimensions) {
			this.resize(dimensions);
		} else {
			_page.viewportSize = {
				width: 1280,
				height: 1280
			};
		}

		_page.is_loaded = false;
		_page.is_loading = true;

		_page.open(url);

		return 'Opening <' + url + '> took too long';
	},

	back: function() {
		_page.goBack();
		return '';
	},

	forward: function() {
		_page.goForward();
		return '';
	},

	assertTitle: function(sub_title) {
		var title = _page.evaluate(function() {
			return document.title;
		});

		if (title.indexOf(sub_title) !== -1) {
			return '';
		}

		return '<' + sub_title + '> is not a substring of <' + title + '>';
	},

	assertPage: function(sub_url) {
		var url = _page.getURL();
		if (url.indexOf(sub_url) !== -1) {
			return '';
		}

		return '<' + sub_url + '> is not a substring of <' + url + '>';
	},

	assertUrl: function(expression) {
		var url = _page.getURL();
		if (new RegExp(expression).test(url)) {
			return '';
		}

		return '<' + expression + '> does not match <' + url + '>';
	},

	assertResembles: function(orig_filename, selector) {
		var boundaries;
		if (selector) {
			boundaries = this.getBoundaries(selector);
		}
		var result = _resemble.compare(boundaries, orig_filename);
		return result;
	},

	log: function(message) {
		_logger.info('\n## ' + message);
		return '';
	},

	type: function(selector, text, is_replace) {
		if (this.assertVisible(selector) !== '') {
			return 'Element not visible: ' + selector;
		}

		if (!text.length) {
			return '';
		}

		if (_focused !== selector) {
			if (is_replace === true) {
				this.dblclick(selector);
			} else {
				this.click(selector);
			}
			return 'Element not focused';
		}

		var result = _keyboard.type(text);

		// Reset focused element, as keyevent may have triggered a blur()
		if (!result) _focused = '';

		return result;
	},

	click: function(destination) {
		var center = this.getCoordinates(destination);
		if (!center) return 'No coordinates for element';

		if (_mouse.sendEvent('click', center.left, center.top)) {
			_focused = destination;
			return '';
		}
		return 'Mouse not over element';
	},

	moveMouseTo: function(destination) {
		var center = this.getCoordinates(destination);
		if (!center) return 'No coordinates for element';

		if (_mouse.moveTo(center.left, center.top)) {
			return '';
		}
		return 'Mouse not over element';
	},

	dblclick: function(destination) {
		var center = this.getCoordinates(destination);
		if (!center) return 'No coordinates for element';

		if (_mouse.sendEvent('doubleclick', center.left, center.top)) {
			_focused = destination;
			return '';
		}
		return 'Mouse not over element';
	},

	resize: function(dimensions) {
		var widthxheight = /^(\d+)x(\d+)$/;
		var matches = dimensions.match(widthxheight);
		if (matches && matches.length === 3) {
			_page.viewportSize = {
				width: parseInt(matches[1], 10),
				height: parseInt(matches[2], 10)
			};
		}

		return '';
	},

	getCoordinates: function(destination) {
		// destination can be either a string containing "123, 567" or a css
		// selector
		getJQuery();
		var coordinates_rx = /(\d+), ?(\d+)/;
		var coordinates = destination.match(coordinates_rx);

		if (coordinates && coordinates.length) {
			return {
				left: parseInt(coordinates[0], 10),
				top: parseInt(coordinates[1], 10)
			};
		} else if (this.assertVisible(destination) === '') {
			return this.getCoordinate(destination);
		}

		return null;
	},

	screendump: function(filename, selector) {
		var boundaries;
		if (selector) {
			// TODO: check for visibility of element
			boundaries = this.getBoundaries(selector);
		}
		_screendump.dump(filename, boundaries);
		return '';
	},

	remember: function(selector, variable_name) {
		var error = this.assertVisible(selector);
		if (error) return error;

		var value_or_text = this.getValueOrText(selector);
		_remembered[variable_name] = value_or_text;

		return '';
	}
};

// All these asserts and actions are defined in jquery.dummy.js and executed
// in the context of the webpage
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
	'choose',
	'getCenter',
	'getCoordinate',
	'getBoundaries',
	'assertInViewport',
	'assertNotInViewport',
	'getValueOrText'
	//'getViewPort'
].forEach(function(type) {
	actions[type] = jQueryAssert(type);
});

exports.actions = actions;
