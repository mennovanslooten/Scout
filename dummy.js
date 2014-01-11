/*
	TODO:
	[ ] CLI arguments:
		[ ] Continue on fail
		[ ] Screendumps
	[ ] Viewport size config action
	[ ] Detect colorized output support
	[ ] Dynamically erase/create screendump dir
*/

phantom.clearCookies();

var _start_time        = new Date();
var _test_files        = require('./lib/testreader').readTestFiles();
var screendump         = require('./lib/screendump');
var page               = require('webpage').create();
var _action_handlers   = require('./lib/action_handlers').action_handlers;
var _logger            = require('./lib/logger');
var _current_test_file = null;
var _current_action    = null;
var _total_actions     = 0;
var _skipped           = [];
var _waitfor_pause     = 10;
var _waitfor_timeout   = 5000;


page.is_loaded = false;
page.is_loading = false;


page.viewportSize = {
	width: 1280,
	height: 1280
};


function setupPage() {
	if (page.is_loaded) return;

	page.evaluate(function() {
		window.localStorage.clear();
	});

	page.is_loaded = true;
	page.is_loading = false;
}


//page.onError = function() { };
page.onInitialized = setupPage;
page.onLoadFinished = setupPage;

page.onNavigationRequested = function() {
	//console.log('navigating to', arguments[0]);
};

page.onLoadStarted = function() {
	page.is_loaded = false;
	page.is_loading = true;
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
	nextAction();
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
