var _page = require('webpage').create();

_page.is_loaded = false;
_page.is_loading = false;


_page.onLoadFinished = function pageLoadFinished() {
	if (_page.is_loaded) return;

	_page.evaluate(function() {
		window.localStorage.clear();
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


_page.onError = function pageError() {
};


_page.onConsoleMessage = function pageConsoleMessage(message) {
	if (_cli_args.debug) {
		_logger.comment('    // ', message);
	}
};

exports.page = _page;
