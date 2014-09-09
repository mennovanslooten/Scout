/*
	TODO:
	[ ] World Peace
	[?] Parallel testing
	[ ] Back/forward button action
	[?] Support for CSV files
	[X] Remove resemble.js dependency
	[ ] Add mousedown/move/up support (drag & drop)
	[ ] "Touch" flag that skips mousemove sequence
	[?] .dummyjsrc file support with default options
	[ ] JS function documentation
	[X] Add check for elements being covered by other elements
	[ ] Improve detection of page navigation
	[ ] Add (non) verbose option
*/

phantom.clearCookies();

var _start_time         = new Date();
var _cli_args           = require('./lib/arguments').parseArguments();
var _test_files         = require('./lib/testreader').readTestFiles();
var _screendump         = require('./lib/screendump');
var _page               = require('./lib/page').page;
var _actions            = require('./lib/actions').actions;
var _logger             = require('./lib/logger');
var _formatter          = require('./lib/formatter');
var _current_test_file  = null;
var _current_action     = null;
var _total_actions      = 0;
var _passed             = [];
var _failed             = [];
var _last_action_status = '';


_logger.mute(_cli_args.verbosity > 0);


function nextTestFile() {
	_current_test_file = _test_files.shift();
	if (!_current_test_file) {
		return done();
	}

	if (_cli_args.reformat) {
		_formatter.reformat(_current_test_file);
		return nextTestFile();
	}

	if (_passed.length || _failed.length) {
		_logger.log('');
	}

	if (_test_files.length) _logger.title('Starting: ' + _current_test_file.path);

	_page.is_loaded = false;
	_page.is_loading = false;

	nextAction();
}


function waitFor(conditionCallback, passCallback, failCallback, timeout) {
	if (timeout > 0) {
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
		} else {
			var d1 = new Date();
			setTimeout(function() {
				if (!_page.is_loading) {
					var d2 = new Date();
					var elapsed = d2 - d1;
					timeout -= elapsed;
				}
				waitFor(conditionCallback, passCallback, failCallback, timeout);
			}, _cli_args.step);
		}
	} else {
		failCallback();
	}
}


function nextAction() {
	_current_action = _current_test_file.actions.shift();

	if (!_current_action) {
		_passed.push({
			path: _current_test_file.path
		});
		nextTestFile();
		return;
	} else if (_current_action.type === 'done') {
		_current_test_file.actions.length = 0;
		nextAction();
		return;
	}

	var handler = _actions[_current_action.type];
	var args = _current_action.args.map(function(arg) {
		/*
			Selectors of this form: 
				"Some text"
			will be transformed to this form:
				:textEquals("Some text")
		*/
		var inside_quotes = /^"([^"]+)"$/;
		if (inside_quotes.test(arg)) {
			return ':textEquals(' + arg + ')';
		}
		return arg
	});
	if (handler) {
		waitFor(

			// Keep executing until it returns true
			function() {
				//return handler.apply(_actions, _current_action.args);
				return handler.apply(_actions, args);
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
	//_failed.push(_current_test_file.path);
	_failed.push({
		path: _current_test_file.path,
		action: message,
		error: _last_action_status
	});
	nextTestFile();
}


function done() {
	if (_cli_args.reformat) {
		return phantom.exit(0);
	}

	_logger.mute(_cli_args.verbosity > 1);

	var result = 'PASS';
	var exit_code = 0;

	//var result = 'PASS';
	var total_time = Math.round((new Date().valueOf() - _start_time) / 1000);
	//var message = 'Executed ' + _total_actions + ' actions';
	//
	var total = _passed.length + _failed.length;

	if (total > 1) {
		//_logger.title('Results');
	}

	if (_failed.length) {
		result = 'FAIL';
		exit_code = 1;

		// If more than one test file is run, show a list of failures tests
		if (total > 1) {
			_logger.comment('\n----------------------------------------------------------------');
			_logger.error('# Failed ' + _failed.length + ' of ' + total + ':');

			for (var i = 0; i < _failed.length; i++) {
				var fail = _failed[i];
				_logger.error('  ✗ ' + fail.path);
				_logger.error('    ' + fail.action);
				_logger.error('    ' + fail.error);
			}
		}
	}

	/*
	if (_passed.length) {
		if (total > 1) {
			_logger.comment('\n# Passed ' + _passed.length + ' of ' + total + ':');
			for (var i = 0; i < _passed.length; i++) {
				_logger.log('  ✓ ' + _passed[i].path);
			}
		}
	}
	*/

	_logger.mute(_cli_args.verbosity > 2);
	_logger[result.toLowerCase()]('\n[' + result + '] Executed ' + _total_actions + ' actions in ' + total_time + 's.');

	phantom.exit(exit_code);
}


// Get the party started
nextTestFile();

function dir(obj) {
	for (var p in obj) {
		console.log(p, ':', obj[p]);
	}
}

