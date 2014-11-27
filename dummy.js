/*
	TODO:
	[ ] Iterate assert over $elts to find match
	[ ] choose shoull return error msg if option not available
	[ ] XML logger
*/

var _cli_args   = require('./lib/arguments').parseArguments();
var _testrunner = require('./lib/testrunner');
var _parser     = require('./lib/testparser');
var _logger     = require('./lib/logger');
var _xunit      = require('./lib/xunit');
var _remembered = {};

var _suite = {
	tests: require('./lib/testreader').readTestFiles(),
	start_time: new Date(),
	passed: [],
	failed: []
};


function Dummy() {
	var _test_index = -1;
	var _running    = 0;

	/**
	 * Run the next test from _suite.tests
	 */
	function nextTest() {
		// Maximum parallel tests running
		if (_running >= _cli_args.parallel) return;

		_test_index++;

		// No more tests left to run
		if (_test_index >= _suite.tests.length) return;

		// Start the next test in the queue
		var test_data = _suite.tests[_test_index];

		_running++;
		_testrunner.run(test_data, passTest, failTest);

		// Add more tests until max running tests
		nextTest();
	}


	/**
	 * Register a test as passed
	 */
	function passTest(test_data) {
		_running--;
		test_data.end_time = new Date();
		_suite.passed.push(test_data);

		//_logger.passTest(test_data, _suite);
		checkDone();
	}


	/**
	 * Register a test as failed
	 */
	function failTest(test_data) {
		_running--;
		test_data.end_time = new Date();
		_suite.failed.push(test_data);

		//_logger.failTest(test_data, _suite);
		checkDone();
	}


	/**
	 * If all test are either passed or failed we are done, otherwise run the
	 * next test
	 */
	function checkDone() {
		if (_suite.passed.length + _suite.failed.length === _suite.tests.length) {
			return done();
		}

		nextTest();
	}


	/**
	 * Done testing. Log and exit.
	 */
	function done() {
		_suite.end_time = new Date();
		_logger.done(_suite);
		//_xunit.log(_suite);
		var is_passed = _suite.failed.length === 0;
		var exit_code = is_passed ? 0 : 1;

		// Temporary fix for https://github.com/ariya/phantomjs/issues/12697
		setTimeout(function(){ phantom.exit(exit_code); }, 0);
		phantom.onError = function(){};
		throw new Error('');
		//return phantom.exit(exit_code);
	}

	// Get the party started
	nextTest();
}


Dummy();
