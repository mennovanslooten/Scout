/*
	TODO:
	[ ] Actions & Asserts
		[ ] Save succesful tests screendump and compare with crrent action
	[ ] CLI arguments:
		[ ] Behavior on fail (continue, next, stop)
		[X] Colorize output
		[X] Screendumps
		[X] Waitfor timeout
		[X] Waitfor step
	[ ] Viewport size config action
	[X] Better <select> handling
	[-] Detect colorized output support
	[-] Dynamically erase/create screendump dir
	[ ] Log files
	[ ] Failure messages
	[X] Generic <special> key handlers
	[ ] SlimerJS compatibility?
	[ ] assertCSS    prop    value
*/

phantom.clearCookies();

var _start_time        = new Date();
var _cli_args          = require('./lib/arguments').parseArguments();
var _test_files        = require('./lib/testreader').readTestFiles();
var screendump         = require('./lib/screendump');
var page               = require('webpage').create();
var _actions           = require('./lib/actions').actions;
var _logger            = require('./lib/logger');
var _current_test_file = null;
var _current_action    = null;
var _total_actions     = 0;
var _skipped           = [];
var _waitfor_step      = 10;
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
	if (_cli_args.debug) {
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
				waitFor(conditionCallback, passCallback, failCallback, timeout - _cli_args.step);
			}, _cli_args.step);
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

	var handler = _actions[_current_action.type];
	var args = [_current_action.type].concat(_current_action.args);

	if (handler) {
		waitFor(

			// Keep executing until it returns true
			function() {
				return handler.apply(_actions, _current_action.args);
			},

			// Run after true is returned
			passCurrentAction,

			// Or run this after timeout is reached...
			failCurrentAction,

			// ...which is this long:
			_cli_args.timeout);
	} else {
		failCurrentAction();
	}
}


function passCurrentAction() {
	if (_current_action.type !== 'log') {
		//screendump.dump('pass-' + _current_action.type);
		var args = [_current_action.type].concat(_current_action.args);
		message = _logger.tabularize(args);
		_logger.log('  ✓ ' + message);
		_total_actions++;
	}

	// If the previous action resulted in a page (re)load we need to give it
	// some time to trigger the onNavigationRequested event. Until the next
	// page is loaded, the next action will fail
	setTimeout(nextAction, 5);
}


function failCurrentAction() {
	if (_cli_args.faildump) screendump.dump('faildump' + _current_test_file.path.replace(/\.?\//g, '__'));

	var args = [_current_action.type].concat(_current_action.args);
	message = _logger.tabularize(args);
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




// Get the party started
nextTestFile();
