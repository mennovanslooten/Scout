exports.create = function(_page, path) {
	var _mouse              = require('./mouse').create(_page);
	var _keyboard           = require('./keyboard').create(_page);
	var _resemble           = require('./resemble').create(_page);
	var _remote             = require('./remote').create(_page);
	var _focused            = '';
	var _remember           = require('./remember');

	var local = {
		open: function(url, dimensions) {
			if (url.indexOf('./') === 0) {
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
				local.resize(dimensions);
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
				boundaries = _remote.getBoundaries(selector);
			}
			var result = _resemble.compare(boundaries, orig_filename);
			return result;
		},

		log: function(message) {
			//_logger.log('\n## ' + message);
			return '';
		},

		type: function(selector, text, is_replace) {
			if (_remote.assertVisible(selector) !== '') {
				return 'Element not visible: ' + selector;
			}

			if (!text.length) {
				return '';
			}

			if (_focused !== selector) {
				if (is_replace === true) {
					local.dblclick(selector);
				} else {
					local.click(selector);
				}
				return 'Element not focused';
			}

			var result = _keyboard.type(text);

			// Reset focused element, as keyevent may have triggered a blur()
			if (!result) _focused = '';

			return result;
		},

		click: function(destination) {
			var center = local.getCoordinates(destination);
			if (!center) return 'No coordinates for element';

			if (_mouse.sendEvent('click', center.left, center.top)) {
				_focused = destination;
				return '';
			}
			return 'Mouse not over element';
		},

		moveMouseTo: function(destination) {
			var center = local.getCoordinates(destination);
			if (!center) return 'No coordinates for element';

			if (_mouse.moveTo(center.left, center.top)) {
				return '';
			}
			return 'Mouse not over element';
		},

		dblclick: function(destination) {
			var center = local.getCoordinates(destination);
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
			var coordinates_rx = /(\d+), ?(\d+)/;
			var coordinates = destination.match(coordinates_rx);

			if (coordinates && coordinates.length) {
				return {
					left: parseInt(coordinates[0], 10),
					top: parseInt(coordinates[1], 10)
				};
			} else if (_remote.assertVisible(destination) === '') {
				return _remote.getCoordinate(destination);
			}

			return null;
		},

		screendump: function(filename, selector) {
			var boundaries;
			if (selector) {
				// TODO: check for visibility of element
				boundaries = _remote.getBoundaries(selector);
			}
			_page.dump(filename, boundaries);
			return '';
		},

		remember: function(selector, variable_name) {
			var error = _remote.assertVisible(selector);
			if (error) return error;

			var value_or_text = _remote.getValueOrText(selector);
			_remember.set(variable_name, value_or_text);

			return '';
		}
	};

	return {
		getHandler: function(type) {
			return local[type] || _remote[type];
		}
	};

};
