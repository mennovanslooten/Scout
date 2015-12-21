'use strict';

var _cli = require('../utils/cli');
var _screendumps = require('../utils/screendumps');
var parseArguments = require('../utils/parser').parseArguments;

exports.create = function(path) {
    var _page               = require('./page').create(path);
    var _handlers           = require('./handlers').create(_page, path);
    var _ignore_list        = ['log', 'set', 'htmldump', 'screendump', 'mockRequest', 'unmockRequest'];

    /**
     * Execute conditionCallback() repeatedly until it returns an empty string
     * ("" = no error) or the time runs out. Call completeCallback when done.
     */
    function waitFor(action_data, conditionCallback, completeCallback, remaining_time) {
        if (remaining_time < 0) {
            completeCallback(action_data);
            return;
        }

        var d1 = new Date();
        var is_passed = false;

        if (_page.isReady()) {
            if (action_data.message === '') {
                is_passed = true;
            } else {
                action_data.message = conditionCallback();
            }
        }

        if (is_passed) {
            completeCallback(action_data);
        } else {
            // otherwise schedule another try
            setTimeout(function() {
                var d2 = new Date();
                var elapsed = d2 - d1;
                remaining_time -= elapsed;

                waitFor(action_data, conditionCallback, completeCallback, remaining_time);
            }, _cli.step);
        }
    }


    return {
        close: function() {
            _page.close();
        },


        failDump: function(action_data) {
            if (_cli.faildump) {
                var filename = _screendumps.createDumpName(action_data, 'faildump');
                _page.dump(filename, null, action_data);
            }
        },


        passDump: function(action_data) {
            var ignore = _ignore_list.indexOf(action_data.type) > -1;
            if (_cli.passdump && !ignore) {
                var filename = _screendumps.createDumpName(action_data, 'passdump');
                _page.dump(filename, null, action_data);
            }
        },


        runAction: function(action_data, completeCallback) {
            var handler = _handlers.getHandler(action_data.type);
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
        },


        compareActionResult: function(action_data, completeCallback) {
            var filename = _screendumps.createDumpName(action_data, 'compare');

            var resemble_action = {
                optional: true,
                type: 'assertResembles',
                args: [filename],
                path: action_data.path
            };

            this.runAction(resemble_action, completeCallback);
        }

    };
};
