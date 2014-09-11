var _page = require('webpage').create();

_page.is_loaded = false;
_page.is_loading = false;

_page.customHeaders = {
	'Accept-Language': 'en-US'
};


_page.onLoadFinished = function pageLoadFinished() {
	if (_page.is_loaded) return;

	// PhantomJS default bg color is transparent
	// This makes for strange screenshots
	_page.evaluate(function() {
		document.body.bgColor = 'white';
	});

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

exports.page = _page;
