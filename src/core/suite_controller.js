'use strict';

var _cli             = require('../utils/cli');
var _test_controller = require('./test_controller');
var _db              = require('../data/db');
var _hub             = require('./hub');

exports.start = function(suite_data) {
    var _test_index = -1;
    var _running    = 0;

    /**
     * Run the next test from suite_data.tests
     */
    function nextTest() {
        // Maximum parallel tests running
        if (_running >= _cli.parallel) return;

        _test_index++;

        // No more tests left to run
        if (_test_index >= suite_data.tests.length) return;

        // Start the next test in the queue
        var test_data = suite_data.tests[_test_index];

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
        if (_db.isCompletedSuite(suite_data)) return done();
        nextTest();
    }


    /**
     * Done testing.
     */
    function done() {
        suite_data.end_time = new Date();
        _hub.publish('suite.done', suite_data);

        var is_passed = _db.isPassedSuite(suite_data);
        var exit_code = is_passed ? 0 : 1;

        // Temporary fix for https://github.com/ariya/phantomjs/issues/12697
        setTimeout(function() {
            phantom.exit(exit_code);
        }, 1000);

        phantom.onError = function() {};
        throw new Error('');
    }

    if (suite_data.tests.length) {
        // Get the party started
        _hub.publish('suite.start', suite_data);
        nextTest();
    } else {
        console.log('No .scout files to run');
        phantom.exit(0);
    }
};
