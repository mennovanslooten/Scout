var _logger             = require('./logger');

exports.create = function(path) {
	var _page               = require('./page').create();
	var _mouse              = require('./mouse').create(_page);
	var _keyboard           = require('./keyboard').create(_page);
	var _resemble           = require('./resemble').create(_page);
	var _focused            = '';
	var _last_action_status = '';
	

	/**
	 * Generic wrapper for in-browser assertions using jQuery
	 */
	function jQueryAssert(type) {
		return function() {
			// args = ['.selector', 'Some text']
			var args = [].slice.call(arguments, 0);

			// args = ['assertText', '.selector', 'Some text']
			args.unshift(type);

			var remoteAssert = function() {
				var type = arguments[0];
				var selector = arguments[1];
				var args = [].slice.call(arguments, 2);

				// Get all the elements matching the selector
				//var $result = jQuery(selector);
				return Dummy.assert(type, selector, args);

				// Then run the assertion on the individual elements
				return $result.dummyAssert.call($result, type, args);
			};

			// args = [remoteAssert, 'assertText', '.selector', 'Some text']
			args.unshift(remoteAssert);

			var result = _page.evaluate.apply(_page, args);

			return result;
		};
	}


	var handlers = {
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
			//_logger.log('\n## ' + message);
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
			//getJQuery();
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
			_page.dump(filename, boundaries);
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
		handlers[type] = jQueryAssert(type);
	});


	/**
	 * Execute conditionCallback() repeatedly until it returns an empty string
	 * ("" = no error), then call passCallback. If conditionCallback does not
	 * return "" within a given time, call failCallback
	 */
	function waitFor(conditionCallback, passCallback, failCallback, remaining_time) {
		if (remaining_time > 0) {
			var is_passed = false;

			if (!_page.is_loading) {
				// A test or action has passed when it returns an empty string,
				// which means there were no errors to report
				_last_action_status = conditionCallback();
				if (typeof _last_action_status !== 'string') {
					_last_action_status = 'Unknown error';
				}

				is_passed = _last_action_status === '';
			}

			if (is_passed) {
				passCallback();
			//} else if (_current_action.optional) {
				//// If it didn't pass but is optional we can skip it
				//nextAction();
			} else {
				// If it didn't pass we'll schedule another try
				var d1 = new Date();
				setTimeout(function() {
					var d2 = new Date();
					var elapsed = d2 - d1;
					remaining_time -= elapsed;

					waitFor(conditionCallback, passCallback, failCallback, remaining_time);
				}, _cli_args.step);
			}
		} else {
			failCallback(_last_action_status);
		}
	}


	return {
		close: function() {
			_page.close();
		},


		dump: function(title, boundaries) {
			_page.dump(title, boundaries);
		},


		failDump: function(action_data, test_data) {
			if (_cli_args.faildump) {
				var title = 'faildump__' + test_data.path.replace(/\.?\//g, '_');
				_page.dump(title);
			}
		},


		passDump: function(action_data, test_data) {
			if (_cli_args.passdump) {
				var title = 'passdump__' + test_data.path.replace(/\.?\//g, '_');
				title += '__' + new Date().valueOf();
				_page.dump(title);
			}
		},


		runAction: function(action_data, passCallback, failCallback) {
			var handler = handlers[action_data.type];
			action_data.args = _parser.parseArguments(action_data.args);
			action_data.start_time = new Date();
			//_logger.dir(action_data);

			if (handler) {
				waitFor(

					// Keep executing until it returns ""
					function() {
						return handler.apply(handlers, action_data.args);
					},

					// Run when "" is returned
					function() {
						action_data.message = '';
						action_data.end_time = new Date();
						passCallback(action_data);
					},

					// Or run this after timeout is reached...
					function(result) {
						action_data.message = result;
						failCallback(action_data);
					},

					// ...which is this long:
					_cli_args.timeout);
			} else {
				action_data.message = 'Unknown action: <' + action_data.type + '>';
				failCallback(action_data);
			}
		}

	};
};
