'use strict';

var _db = require('./db');
var _hub = require('./hub');
// var _cli = require('../utils/cli');


/**
 * Sequentially run all the actions in a test. Run completeCallback after the first failed action or after all have
 * completed
 */
exports.run = function(test_data, completeCallback) {

    // testcontainer is the context in which a test is run, webpage, mouse,
    // keyboard, etc
    var testcontainer = require('../context/testcontainer').create(test_data.path);
    var action_index = -1;


    /**
     * Run the next action from the queue
     */
    function nextAction() {
        action_index++;
        if (action_index >= test_data.actions.length) return done();

        var action_data = test_data.actions[action_index];
        testcontainer.runAction(action_data, completeAction);
    }


    /**
     * Register an action as completed
     */
    function completeAction(action_data) {
        action_data.end_time = new Date();
        _hub.publish('action.done', action_data, test_data);

        if (_db.isFailedAction(action_data)) {
            done();
        } else {
            nextAction();
        }
    }


    /**
     * All actions completed
     */
    function done() {
        test_data.end_time = new Date();
        testcontainer.close();
        _hub.publish('test.done', test_data);
        completeCallback(test_data);
    }


    /**
     * Start it up
     */
    function start() {
        test_data.start_time = new Date();
        _hub.publish('test.start', test_data);
        nextAction();
    }

    start();
};
