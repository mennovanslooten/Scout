'use strict';

var _logger = require('../logger/logger');
var _cli = require('../utils/cli');
var _db         = require('./db');


/**
 * Sequentially run all the actions in a test. Run passCallback if all
 * actions are succesfully completed, otherwise run failCallback after the
 * first failed action.
 */
exports.run = function(test_data, completeCallback) {

    // testcontainer is the context in which a test is run, webpage, mouse,
    // keyboard, etc
    var testcontainer = require('../context/testcontainer').create(test_data.path);
    var action_index = -1;

    // Remember when we started this test
    test_data.start_time = new Date();
    _logger.startTest(test_data);

    /**
     * Run the next action from the queue
     */
    function nextAction() {
        action_index++;
        if (action_index >= test_data.actions.length) return done();

        var action_data = test_data.actions[action_index];
        // testcontainer.runAction(action_data, passAction, skipAction, failAction);
        testcontainer.runAction(action_data, completeAction);
    }


    /**
     * Register an action as completed
     */
    function completeAction(action_data) {
        action_data.end_time = new Date();
        _logger.logAction(action_data, test_data);

        if (_db.isFailedAction(action_data)) {
            testcontainer.failDump(action_data);
            testcontainer.close();
            completeCallback(test_data);
        } else if (_cli.compare && action_data.user_action) {
            testcontainer.passDump(action_data);
            testcontainer.compareActionResult(action_data, passAction, skipAction);
        } else {
            testcontainer.passDump(action_data);
            nextAction();
        }
    }


    /**
     * Register an action as passed
     */
    function passAction(action_data) {
        action_data.end_time = new Date();
        _logger.passAction(action_data, test_data);
        testcontainer.passDump(action_data);
        // test_data.passed.push(action_data);

        if (_cli.compare && action_data.user_action) {
            testcontainer.compareActionResult(action_data, passAction, skipAction);
        } else {
            nextAction();
        }
    }


    /**
     * Register an action as skipped
     */
    function skipAction(action_data) {
        action_data.end_time = new Date();
        _logger.skipAction(action_data, test_data);
        nextAction();
    }


    /**
     * Register an action as failed or skipped
     */
    function failAction(action_data) {
        action_data.end_time = new Date();
        _logger.failAction(action_data, test_data);
        testcontainer.failDump(action_data);
        testcontainer.close();
        completeCallback(test_data);
    }


    /**
     * All actions completed, the test has passed
     */
    function done() {
        testcontainer.close();
        completeCallback(test_data);
    }

    // Kick off the first action
    nextAction();
};
