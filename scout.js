'use strict';

var _cli        = require('./lib/arguments');
var _testrunner = require('./lib/testrunner');
var _logger     = require('./lib/logger');
var _suite      = require('./lib/testsuite');


function scout() {
    var _test_index = -1;
    var _running    = 0;

    /**
     * Run the next test from _suite.tests
     */
    function nextTest() {
        // Maximum parallel tests running
        if (_running >= _cli.parallel) return;

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

        checkDone();
    }


    /**
     * Register a test as failed
     */
    function failTest(test_data) {
        _running--;
        test_data.end_time = new Date();
        _suite.failed.push(test_data);

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
        var is_passed = _suite.failed.length === 0;
        var exit_code = is_passed ? 0 : 1;

        // Temporary fix for https://github.com/ariya/phantomjs/issues/12697
        setTimeout(function() {
            phantom.exit(exit_code);
        }, 0);

        phantom.onError = function() {};
        throw new Error('');
    }

    // Get the party started
    nextTest();
}


if (_cli.version) {
    // if --version is passed, print version and exit
    var json = require('./package.json');
    var version = json.version;

    console.log('Scout v' + version);
    console.log('http://mennovanslooten.github.io/Scout/');

    phantom.exit(0);
} else if (_cli.reformat) {
    // if --reformat is passed, reformat and exit
    _logger.reformat(_suite);
    phantom.exit(0);
} else if (_suite.tests.length) {
    // otherwise, kick off the tests
    scout();
} else {
    console.log('No .scout files to run');
    phantom.exit(0);
}
