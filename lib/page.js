var _logger             = require('./logger');

exports.create = function() {
	var _page        = require('webpage').create();

	_page.is_loaded  = false;
	_page.is_loading = false;


	_page.customHeaders = {
		'Accept-Language': 'en-US'
	};


	_page.onLoadFinished = function pageLoadFinished() {
		if (_page.is_loaded) return;

		setupPage();

		_page.is_loaded = true;
		_page.is_loading = false;
	};


	_page.onLoadStarted = function pageLoadStarted() {
		_page.is_loaded = false;
		_page.is_loading = true;
		_page.scrollPosition = {
			top: 0,
			left: 0
		};
	};


	_page.onInitialized = function initialized() {
		_page.evaluate(function() {
			window.localStorage.clear();
		});
	};


	_page.onError = function pageError() {
		if (!_cli_args.debug || !arguments.length) return;
		_logger.error('Error on page: ' + arguments[0]);
	};


	_page.onConsoleMessage = function pageConsoleMessage(message) {
		if (_cli_args.debug) {
			_logger.comment('    // ', message);
		}
	};


	_page.getURL = function() {
		return _page.evaluate(function() {
			return location.href;
		});
	};


	_page.dump = function(title, boundaries) {
		_page.clipRect = boundaries ? boundaries : {
			top: _page.scrollPosition.top,
			left: _page.scrollPosition.left,
			width: _page.viewportSize.width,
			height: _page.viewportSize.height
		};

		//console.dir('clipRect:', _page.clipRect.top, _page.clipRect.left, _page.clipRect.width, _page.clipRect.height);

		_page.render(title + '.png');
	};
	

	/**
	 * Check if jQuery is loaded on the page, if not: load it
	 * Then load the DummyJS jQuery assertions and utilities
	 */
	function setupPage() {
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

		// PhantomJS default bg color is transparent
		// This makes for strange screenshots
		_page.evaluate(function() {
			document.body.bgColor = 'white';
		});
	}

	return _page;
};
