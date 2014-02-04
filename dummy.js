/*
	TODO:
	[ ] API docs
	[ ] Possible bug: localStorage shouldn't be cleared between page loads in one test
	[ ] Actions & Asserts
		[ ] Save succesful tests screendump and compare with crrent action
		[ ] Configure CLI options at start of .dummy file
		[ ] Cookie contents test
	[ ] CLI arguments:
		[ ] Help
		[ ] Behavior on fail (continue, next, stop)
	[X] Viewport size config action
		[X] Resize action with resize event
	[ ] Log files
	[ ] Failure messages
	[ ] SlimerJS compatibility?
	[ ] assertCSS    prop    value
	[ ] Really think about when to test for visibility
	[ ] oninput event support?
	[ ] Horizontal scrolling support
		[X] Use page.scrollPosition()
			http://phantomjs.org/api/webpage/property/scroll-position.html
*/

phantom.clearCookies();

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
		var is_passed = !_page.is_loading && conditionCallback();
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
		//_screendump.dump('pass-' + _current_action.type);
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
	if (_cli_args.faildump) _screendump.dump('faildump' + _current_test_file.path.replace(/\.?\//g, '__'));

	var args = [_current_action.type].concat(_current_action.args);
	message = _logger.tabularize(args);
	_logger.error('  ✗ ' + message);
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
