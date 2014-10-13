/*
	TODO:
	[ ] World Peace
	[ ] npm publish
	[?] Parallel testing
	[?] Support for CSV files
	[ ] Add mousedown/move/up support (drag & drop)
	[ ] "Touch" flag that skips mousemove sequence
	[?] .dummyjsrc file support with default options
	[ ] JS function documentation
*/


var _start_time         = new Date();
var _cli_args           = require('./lib/arguments').parseArguments();
var _tests              = require('./lib/testreader').readTestFiles();
var _parser             = require('./lib/testparser');
var _screendump         = require('./lib/screendump');
var _page               = require('./lib/page').page;
var _actions            = require('./lib/actions').actions;
var _logger             = require('./lib/logger');
var _formatter          = require('./lib/formatter');
var _current_test       = null;
var _current_action     = null;
var _total_actions      = 0;
var _passed             = [];
var _failed             = [];
var _remembered         = {};
var _last_action_status = '';


/**
 * Proceeds with the next test file in the queue
 */
function nextTestFile() {
	_logger.mute(_cli_args.quiet > 0);

	_current_test = _tests.shift();

	if (!_current_test) {
		return done();
	}

	if (_cli_args.reformat) {
		_formatter.reformat(_current_test);
		// No actions are executed when reformatting
		return nextTestFile();
	}

	// If this is not the first test, create some space in the log
	if (_passed.length || _failed.length) {
		_logger.log('');
	}

	// If this is not the only test, create a heading for it in the log
	var total = _passed.length + _failed.length + _tests.length;
	if (total) _logger.title('Starting: ' + _current_test.path);

	_page.clearCookies();
	_page.is_loaded = false;
	_page.is_loading = false;

	_current_test.start_time = new Date();
	nextAction();
}


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
		} else if (_current_action.optional) {
			// If it didn't pass but is optional we can skip it
			nextAction();
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
		failCallback();
	}
}


/**
 * Execute the next action in the current test file. If no actions are left,
 * continue with the next test file.
 */
function nextAction() {
	_current_action = _current_test.actions.shift();

	if (!_current_action) {
		// If there are no more actions in the current test file
		// the test has passed...
		// 
		// 
		
		_passed.push({
			duration: new Date() - _current_test.start_time,
			test: _current_test
		});

		// ...and we continue with the next
		nextTestFile();
		return;
	} else if (_current_action.type === 'done') {
		// The action "done" skips the rest of the test file
		// Useful for debugging
		_current_test.actions.length = 0;
		nextAction();
		return;
	}

	// Replace special argument formats
	_current_action.args = _parser.parseArguments(_current_action.args);

	var handler = _actions[_current_action.type];
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
		_last_action_status = 'Unknown action: <' + _current_action.type + '>';
		failCurrentAction();
	}
}


/**
 * Register the current action as passed and log it to the console
 */
function passCurrentAction() {
	if (_current_action.type !== 'log') {
		// If --passdump is passed make a screendump
		if (_cli_args.passdump) _screendump.dump('passdump_' + new Date().valueOf());

		var args = [_current_action.type].concat(_current_action.args);

		var message = _logger.format(args, _current_test.columns);
		_logger.log('  ✓ ' + message);
		_total_actions++;
	}

	_current_test.passed.push(_current_action);

	// If the previous action resulted in a page (re)load we need to give it
	// some time to trigger the onNavigationRequested event. Until the next
	// page is loaded, the next action will fail
	setTimeout(nextAction, 5);
}


/**
 * Register the current action as failed and log it to the console
 */
function failCurrentAction() {
		// If --faildump is passed make a screendump
	if (_cli_args.faildump) _screendump.dump('faildump' + _current_test.path.replace(/\.?\//g, '__'));

	var args = [_current_action.type].concat(_current_action.args);
	var message = _logger.format(args, _current_test.columns);

	_logger.error('  ✗ ' + message);
	_logger.error('    ' + _last_action_status);

	// _failed.push({
	// 	path: _current_test.path,
	// 	action: message,
	// 	error: _last_action_status
	// });
	_failed.push({
		test: _current_test,
		duration: new Date() - _current_test.start_time,
		action: message,
		error: _last_action_status
	});

	nextTestFile();
}


/**
 * All tests have completed, log to the console and exit
 */
function done() {
	if (_cli_args.reformat) {
		return phantom.exit(0);
	}

	_logger.mute(_cli_args.quiet > 1);

	var result = 'PASS';
	var exit_code = 0;

	var total_time = ((new Date() - _start_time) / 1000).toFixed(2);
	var total_tests = _passed.length + _failed.length;

	// If any test has failed, the result is FAIL
	if (_failed.length) {
		result = 'FAIL';
		exit_code = 1;

		// If more than one test file is run, show a list of failed tests
		if (total_tests > 1) {
			_logger.comment('\n----------------------------------------------------------------');
			_logger.error('# Failed ' + _failed.length + ' of ' + total_tests + ':');

			for (var i = 0; i < _failed.length; i++) {
				var fail = _failed[i];
				_logger.error('  ✗ ' + fail.test.path);
				_logger.error('    ' + fail.action);
				_logger.error('    ' + fail.error);
			}
		}
	}

	_logger.mute(_cli_args.quiet > 2);
	_logger[result.toLowerCase()]('\n[' + result + '] Executed ' + _total_actions + ' actions from ' + total_tests + ' tests in ' + total_time + 's.');

	phantom.exit(exit_code);
}


// Get the party started
nextTestFile();
