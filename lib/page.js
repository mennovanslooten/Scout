var _page = require('webpage').create();

_page.is_loaded = false;
_page.is_loading = false;


_page.onLoadFinished = function pageLoadFinished() {

	if (_page.is_loaded) return;

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


_page.onInitialized = function pageError() {
	_page.evaluate(function() {
		window.localStorage.clear();
	});
};


_page.onError = function pageError() {
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
