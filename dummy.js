/*
	TODO:
	[ ] World Peace
*/

phantom.clearCookies();

function dir(obj) {
	for (var p in obj) {
		console.log(p, ':', obj[p]);
	}
}

var _start_time        = new Date();
var _cli_args          = require('./lib/arguments').parseArguments();
var _test_files        = require('./lib/testreader').readTestFiles();
var _screendump        = require('./lib/screendump');
var _page              = require('./lib/page').page;
var _actions           = require('./lib/actions').actions;
var _logger            = require('./lib/logger');
var _current_test_file = null;
var _current_action    = null;
var _total_actions     = 0;
var _failed            = [];
var _last_action_status = '';


function nextTestFile() {
	_current_test_file = _test_files.shift();
	if (!_current_test_file) {
		return done();
	}


	_logger.title('Starting ' + _current_test_file.path + ' (' + _current_test_file.actions.length + ' actions)');

	_page.is_loaded = false;
	_page.is_loading = false;

	nextAction();
}


function waitFor(conditionCallback, passCallback, failCallback, timeout) {
	if (timeout > 0) {
		var is_passed = false;

		if (!_page.is_loading) {
			_last_action_status = conditionCallback();
			if (typeof _last_action_status !== 'string') {
				_last_action_status = 'Unknown error';
			}

			is_passed = _last_action_status === '';
		}

		if (is_passed) {
			passCallback();
		} else {
			var d1 = new Date();
			setTimeout(function() {
				var d2 = new Date();
				var elapsed = d2 - d1;
				waitFor(conditionCallback, passCallback, failCallback, timeout - elapsed);
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
	} else if (_current_action.type === 'done') {
		_current_test_file.actions.length = 0;
		nextAction();
		return;
	}

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
		failCurrentAction();
	}
}


function passCurrentAction() {
	if (_current_action.type !== 'log') {
		if (_cli_args.passdump) _screendump.dump('passdump_' + new Date().valueOf());

		var args = [_current_action.type].concat(_current_action.args);
		message = _logger.tabularize(args);
		_logger.log('  ✓ ' + message);
		_total_actions++;
	}

	_current_test_file.passed.push(_current_action);

	// If the previous action resulted in a page (re)load we need to give it
	// some time to trigger the onNavigationRequested event. Until the next
	// page is loaded, the next action will fail
	setTimeout(nextAction, 5);
}


function failCurrentAction() {
	if (_cli_args.faildump) _screendump.dump('faildump' + _current_test_file.path.replace(/\.?\//g, '__'));

	var args = [_current_action.type].concat(_current_action.args);
	message = _logger.tabularize(args);
	_logger.error('  ✗ ' + message);
	_logger.error('    ' + _last_action_status);
	_failed.push(_current_test_file.path);
	nextTestFile();
}


function done() {
	var exit_code = 0;
	var result = 'PASS';
	var total_time = Math.round((new Date().valueOf() - _start_time) / 1000);
	var message = 'Executed ' + _total_actions + ' actions';

	if (_failed.length) {
		exit_code = 1;
		result = 'FAIL';
		message += ', Failed ' + _failed.length + ' test files:';
		message += ' in ' + _failed.join(', ');
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
