'use strict';

var _cli = require('../utils/cli');
var parseArguments = require('../utils/parser').parseArguments;

exports.create = function(path) {
    var page = require('./page').create(path);
    var getHandler = require('./handlers').create(page, path).getHandler;


    function checkActionResult(action_data, completeCallback) {
        if (!_cli.compare || !action_data.user_action) {
            completeCallback(action_data);
            return;
        }

        // console.log('checkActionResult', action_data.type);

        var filename = page.createDumpName(action_data, 'compare');

        var resemble_action = {
            optional: true,
            type: 'assertResembles',
            args: [filename],
            path: action_data.path
        };

        runAction(resemble_action, function() {
            // console.log('--->', resemble_action.message);

            if (resemble_action.message) {
                action_data.optional = true;
                action_data.message = resemble_action.message;
            }

            completeCallback(action_data);
        });

    }


    /**
     * Execute conditionCallback() repeatedly until it returns an empty string
     * ("" = no error) or the time runs out. Call completeCallback when done.
     */
    function waitFor(action_data, conditionCallback, completeCallback, remaining_time) {
        // console.log('waitFor', action_data.type, remaining_time, action_data.message);
        if (remaining_time < 0) {
            completeCallback(action_data);
            return;
        }

        if (page.isReady()) {
            if (action_data.message === '') {
                checkActionResult(action_data, completeCallback);
                return;
            }

            action_data.message = conditionCallback();
        }

        var d1 = new Date();
        setTimeout(function() {
            var elapsed = new Date() - d1;
            waitFor(action_data, conditionCallback, completeCallback, remaining_time - elapsed);
        }, _cli.step);
    }


    function runAction(action_data, completeCallback) {
        var handler = getHandler(action_data.type);
        action_data.args = parseArguments(action_data.args);
        action_data.start_time = new Date();

        if (handler) {
            waitFor(
                action_data,

                // Keep executing until it returns ""
                function() {
                    return handler.apply(null, action_data.args);
                },

                // Run this after success or timeout is reached...
                completeCallback,

                // ...which is this long:
                _cli.timeout);
        } else {
            action_data.message = 'Unknown action: <' + action_data.type + '>';
            completeCallback(action_data);
        }
    }


    return {
        close: function() {
            page.close();
        },

        runAction: runAction


        // compareActionResult: function(action_data, completeCallback) {
        //     var filename = _screendumps.createDumpName(action_data, 'compare');
        //
        //     var resemble_action = {
        //         optional: true,
        //         type: 'assertResembles',
        //         args: [filename],
        //         path: action_data.path
        //     };
        //
        //     this.runAction(resemble_action, completeCallback);
        // }

    };
};
