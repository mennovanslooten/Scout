var _logger             = require('./logger');

exports.create = function() {
	var _page        = require('webpage').create();

	_page.is_loaded  = false;
	_page.is_loading = false;

	_page.customHeaders = {
		'Accept-Language': 'en-US'
	};

	/**
	 * Keep track of resource requests, the test shouldn't start until they are
	 * complete
	 */
	var _resource_requests = [];
	_page.onResourceRequested = function pageResourceRequested(resource) {
		_resource_requests.push(resource.id);
	};


	/**
	 * Find the tracked resource request and remove it when it's done or failed
	 */
	_page.onResourceError = _page.onResourceReceived = _page.onResourceTimeout = function pageResourceDone(resource) {
		var index = _resource_requests.indexOf(resource.id);

		if (index > -1) {
			_resource_requests.splice(index, 1);
		}
	};


	/**
	 * PhantomJS thinks the page is done, start checking the resource request
	 * queue
	 */
	_page.onLoadFinished = function pageLoadFinished() {
		// Give in-page scripts some time to kick off new requests
		checkFinished();
		//setTimeout(checkFinished, 50);
	};


	/**
	 * Reset page properties
	 */
	_page.onLoadStarted = function pageLoadStarted() {
		_resource_request = [];
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


	_page.onError = function pageError(msg, args) {
		if (!_cli_args.debug || !arguments.length) return;
		_logger.error('Error on page: ' + msg);
		for (var i = 0; i < args.length; i++) {
			//_logger.error(' - ', args[i]);
			_logger.dir(args[i]);
		}


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
	

	function checkFinished() {
		if (_page.is_loaded) return;

		if (_resource_requests.length) {
			console.log(_resource_requests.length);
			//setTimeout(checkFinished, 100);
			//return;
		}

		setupPage();
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

		_page.injectJs('./lib/jquery.dummy.js');
		//_page.injectJs('./client/run.js');
		//_page.injectJs('./client/utils.js');
		//_page.injectJs('./client/assert.js');

		// PhantomJS default bg color is transparent
		// This makes for strange screenshots
		_page.evaluate(function() {
			document.body.bgColor = 'white';
		});

		_page.is_loaded = true;
		_page.is_loading = false;
	}

	return _page;
};
