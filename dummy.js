/*
	TODO:
	[ ] Passdump/faildump
	[ ] External logger
	[ ] XML logger
	[ ] --parallel parameter
*/

var _cli_args           = require('./lib/arguments').parseArguments();
var _testrunner         = require('./lib/testrunner');
var _parser             = require('./lib/testparser');
var _logger             = require('./lib/logger');
var _remembered         = {};

var _suite = {
	tests: require('./lib/testreader').readTestFiles(),
	start_time: new Date(),
	passed: [],
	failed: []
}



function Dummy() {
	var _test_index = -1;
	var _running    = 0;

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


	function passTest(test_data) {
		_running--;
		test_data.end_time = new Date();
		_suite.passed.push(test_data);

		_logger.passTest(test_data, _suite);
		checkDone();
	}


	function failTest(test_data) {
		_running--;
		test_data.end_time = new Date();
		_suite.failed.push(test_data);

		_logger.failTest(test_data, _suite);
		checkDone();
	}


	function checkDone() {
		if (_suite.passed.length + _suite.failed.length === _suite.tests.length) {
			return done();
		}

		nextTest();
	}


	function done() {
		_suite.end_time = new Date();
		_logger.done(_suite);
		var is_passed = _suite.failed.length === 0;
		var exit_code = is_passed ? 0 : 1;
		return phantom.exit(exit_code);
	}

	nextTest()
};


Dummy();
