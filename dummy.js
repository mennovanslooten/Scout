/*
	TODO:
	[ ] CLI arguments:
		[ ] Continue on fail
		[ ] Screendumps
	[ ] Viewport size config action
	[ ] Detect colorized output support
	[ ] Dynamically erase/create screendump dir
	[ ] Log files
	[ ] Failure messages
	[ ] Generic <special> key handlers
	[ ] SlimerJS compatibility?
*/

phantom.clearCookies();

var _start_time        = new Date();
var _test_files        = require('./lib/testreader').readTestFiles();
var screendump         = require('./lib/screendump');
var page               = require('webpage').create();
var _action_handlers   = require('./lib/action_handlers').action_handlers;
var _logger            = require('./lib/logger');
var system = require('system');
var _current_test_file = null;
var _current_action    = null;
var _total_actions     = 0;
var _skipped           = [];
var _waitfor_pause     = 10;
var _waitfor_timeout   = 5000;
var _options           = {
	debug: false
};

/*
for (var key in page.event.key) {
	console.log(key, page.event.key[key]);
}
//*/

page.is_loaded = false;
page.is_loading = false;


page.viewportSize = {
	width: 1280,
	height: 1280
};

// Translate --optionName args to _option.optionName = true;
var args = system.args.slice(1);
args.forEach(function(arg) {
	var option = /^--(\w+)$/;
	var matches = arg.match(option);
	if (matches && matches.length) {
		_options[matches[1]] = true;
	}
});


function setupPage() {
	if (page.is_loaded) return;

	page.evaluate(function() {
		window.localStorage.clear();
	});

	page.is_loaded = true;
	page.is_loading = false;
}


page.onInitialized = setupPage;
page.onLoadFinished = setupPage;

page.onNavigationRequested = function() {
	//console.log('navigating to', arguments[0], arguments[1]);
	//page.is_loaded = false;
	//page.is_loading = true;
};

page.onLoadStarted = function() {
	//console.log('page load started');
	page.is_loaded = false;
	page.is_loading = true;
};


page.onError = function() {
};


page.onConsoleMessage = function(message) {
	if (_options.debug) {
		_logger.comment('    // ', message);
	}
};


function nextTestFile() {
	// Clean up after ourselves
	if (_current_test_file && _current_action) {
		page.evaluate(function() {
			window.localStorage.clear();
		});
	}

	_current_action = null;
	_current_test_file = _test_files.shift();
	if (!_current_test_file) {
		done();
		return;
	}

	_logger.comment('\n################################################################');
	_logger.comment('# Starting ' + _current_test_file.path + ' (' + _current_test_file.actions.length + ' actions)');
	_logger.comment('################################################################');

	page.is_loaded = false;
	page.is_loading = false;

	nextAction();
}


function waitFor(conditionCallback, passCallback, failCallback, timeout) {
	if (timeout > 0) {
		var is_passed = !page.is_loading && conditionCallback();
		if (is_passed) {
			passCallback();
		} else {
			setTimeout(function() {
				waitFor(conditionCallback, passCallback, failCallback, timeout - _waitfor_pause);
			}, _waitfor_pause);
		}
	} else {
		failCallback();
	}
}


function parseSelector(selector) {
	var inside_quotes = /^"(.+)"$/;
	if (inside_quotes.test(selector)) {
		//var text = selector.match(inside_quotes)[1];
		return ':contains(' + selector + ')';
	}
	return selector;
}


function nextAction() {
	_current_action = _current_test_file.actions.shift();

	if (!_current_action) {
		nextTestFile();
		return;
	}

	var handler = _action_handlers[_current_action.type];
	var args = [_current_action.type].concat(_current_action.args);

	if (handler) {
		waitFor(

			// Keep executing until it returns true
			function() {
				return handler.apply(_action_handlers, _current_action.args);
			},

			// Run after true is returned
			passCurrentAction,

			// Or run this after timeout is reached...
			failCurrentAction,

			// ...which is this long:
			_waitfor_timeout);
	} else {
		// utils.dump(_current_action);
		failCurrentAction();
	}
}


function passCurrentAction() {
	if (_current_action.type !== 'log') {
		//screendump.dump('pass-' + _current_action.type);
		var args = [_current_action.type].concat(_current_action.args);
		message = tabularize(args);
		_logger.log('  ✓ ' + message);
		_total_actions++;
	}

	// If the previous action resulted in a page (re)load we need to give it
	// some time to trigger the onNavigationRequested event. Until the next
	// page is loaded, the next action will fail
	setTimeout(nextAction, 5);
}


function failCurrentAction() {
	//screendump.dump('fail-' + _current_action.type);
	var args = [_current_action.type].concat(_current_action.args);
	message = tabularize(args);
	_logger.error('  ✗ ' + message);
	_skipped.push(_current_test_file.path);
	nextTestFile();
}


function done() {
	var exit_code = 0;
	var result = 'PASS';
	var total_time = Math.round((new Date().valueOf() - _start_time) / 1000);
	var message = 'Executed ' + _total_actions + ' actions';

	if (_skipped.length) {
		exit_code = 1;
		result = 'FAIL';
		message += ', Failed ' + _skipped.length + ' test files:';
		message += ' in ' + _skipped.join(', ');
	} else {
		message += ' in ' + total_time + 's.';
	}


	var codes = [30, 41];
	message = result + ': ' + message;
	_logger[result.toLowerCase()](message);
	phantom.exit(exit_code);
}


function tabularize(args) {
	var result = '';
	args.forEach(function(item) {
		result += item;
		if (item.length < 25) {
			result += new Array(25 - item.length).join(' ');
		} else {
			result += '    ';
		}
	});
	return result;
}


// Get the party started
nextTestFile();
