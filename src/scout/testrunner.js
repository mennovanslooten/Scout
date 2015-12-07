'use strict';

var _logger = require('../logger/logger');
var _cli = require('../utils/cli');


function isUserAction(type) {
    return ['include', 'click', 'moveMouseTo', 'type', 'open', 'uploadFile', 'back', 'forward'].indexOf(type) > -1;
}


/**
 * Sequentially run all the actions in a test. Run passCallback if all
 * actions are succesfully completed, otherwise run failCallback after the
 * first failed action.
 */
exports.run = function(test_data, passCallback, failCallback) {

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
        testcontainer.runAction(action_data, passAction, skipAction, failAction);
    }


    function handleCompareResult(action_data) {
        if (action_data.message) {
            _logger.skipAction(action_data, test_data);
        }
        nextAction();
    }


    /**
     * Register an action as passed
     */
    function passAction(action_data) {
        _logger.passAction(action_data, test_data);
        testcontainer.passDump(action_data, test_data);
        test_data.passed.push(action_data);

        if (_cli.compare && isUserAction(action_data.type)) {
            testcontainer.compareActionResult(action_data, handleCompareResult);
        } else {
            nextAction();
        }
    }


    /**
     * Register an action as skipped
     */
    function skipAction(action_data) {
        _logger.skipAction(action_data, test_data);
        test_data.skipped.push(action_data);
        nextAction();
    }


    /**
     * Register an action as failed or skipped
     */
    function failAction(action_data) {
        _logger.failAction(action_data, test_data);
        testcontainer.failDump(action_data, test_data);
        testcontainer.close();
        failCallback(test_data);
    }


    /**
     * All actions completed, the test has passed
     */
    function done() {
        testcontainer.close();
        passCallback(test_data);
    }

    // Kick off the first action
    nextAction();
};
