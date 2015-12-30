'use strict';

var _cli = require('../utils/cli');
var _hub = require('./hub');
var createDumpName = require('../utils/strings').createDumpName;

exports.create = function(test_data) {
    // testcontainer is the context in which a test is run, webpage, mouse,
    // keyboard, etc
    var testcontainer = require('../context/testcontainer').create(test_data);


    function checkActionResult(action_data, completeCallback) {
        var filename = createDumpName(action_data, 'compare');

        var resemble_action = {
            optional: true,
            type: 'assertResembles',
            args: [filename],
            path: action_data.path
        };

        runAction(resemble_action, function() {
            if (resemble_action.message) {
                action_data.optional = true;
                action_data.message = resemble_action.message;
            }

            completeCallback(action_data);
        });

    }


    function completeAction(action_data, completeCallback) {
        if (_cli.compare && action_data.user_action) {
            checkActionResult(action_data, completeCallback);
        } else {
            completeCallback(action_data);
        }
    }


    /**
     * Execute conditionCallback() repeatedly until it returns an empty string
     * ("" = no error) or the time runs out. Call completeAction when done.
     */
    function waitFor(action_data, conditionCallback, completeCallback, remaining_time) {
        action_data.message = conditionCallback();

        if (!action_data.message || remaining_time < 0) {
            completeAction(action_data, completeCallback);
            return;
        }

        var d1 = new Date();
        setTimeout(function() {
            var elapsed = new Date() - d1;
            waitFor(action_data, conditionCallback, completeCallback, remaining_time - elapsed);
        }, _cli.step);
    }


    function runAction(action_data, completeCallback) {
        action_data.start_time = new Date();
        _hub.publish('action.start', action_data, test_data);

        waitFor(
            action_data,

            // Keep executing until it returns ""
            function() {
                return testcontainer.runAction(action_data);
            },

            // Run this after success or timeout is reached...
            completeCallback,

            // ...which is this long:
            _cli.timeout);
    }


    return {
        runAction: runAction
    };
};
