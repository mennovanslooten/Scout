'use strict';

var _cli             = require('../utils/cli');
var _test_controller = require('./test_controller');
var _suite           = require('./testsuite');
var _db              = require('./db');
var _hub             = require('./hub');

exports.start = function() {
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
        _test_controller.run(test_data, completeTest);

        // Add more tests until max running tests
        nextTest();
    }


    /**
     * Register a test as completed
     */
    function completeTest() {
        _running--;
        checkDone();
    }


    /**
     * If all test are either passed or failed we are done, otherwise run the
     * next test
     */
    function checkDone() {
        if (_db.isCompletedSuite(_suite)) return done();
        nextTest();
    }


    /**
     * Done testing. Log and exit.
     */
    function done() {
        _suite.end_time = new Date();
        _hub.publish('suite.done', _suite);

        // _logger.done(_suite);
        var is_passed = _db.isPassedSuite(_suite);
        var exit_code = is_passed ? 0 : 1;

        // Temporary fix for https://github.com/ariya/phantomjs/issues/12697
        setTimeout(function() {
            phantom.exit(exit_code);
        }, 0);

        phantom.onError = function() {};
        throw new Error('');
    }

    if (_suite.tests.length) {
        // Get the party started
        _hub.publish('suite.start', _suite);
        nextTest();
    } else {
        console.log('No .scout files to run');
        phantom.exit(0);
    }
};
