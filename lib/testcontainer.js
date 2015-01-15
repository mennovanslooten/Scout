'use strict';

var _cli = require('./arguments');
var _testparser = require('./testparser');

exports.create = function(path) {
    var _page               = require('./page').create();
    var _handlers           = require('./handlers').create(_page, path);
    var _last_action_status = '';


    /**
     * Execute conditionCallback() repeatedly until it returns an empty string
     * ("" = no error), then call passCallback. If conditionCallback does not
     * return "" within a given time, call failCallback
     */
    function waitFor(action_data, conditionCallback, passCallback, skipCallback, failCallback, remaining_time) {
        if (remaining_time > 0) {
            var is_passed = false;

            if (!_page.is_loading) {
                // A test or action has passed when it returns an empty string,
                // which means there were no errors to report
                _last_action_status = conditionCallback();
                if (typeof _last_action_status !== 'string') {
                    _last_action_status = 'Unknown error';
                }

                is_passed = _last_action_status === '';
            }

            if (is_passed) {
                passCallback();
            } else if (action_data.optional) {
                // If it didn't pass but is optional skip it
                skipCallback(_last_action_status);
            } else {
                // otherwise schedule another try
                var d1 = new Date();
                setTimeout(function() {
                    var d2 = new Date();
                    var elapsed = d2 - d1;
                    remaining_time -= elapsed;

                    waitFor(action_data, conditionCallback, passCallback, skipCallback, failCallback, remaining_time);
                }, _cli.step);
            }
        } else {
            failCallback(_last_action_status);
        }
    }


    return {
        close: function() {
            _page.close();
        },


        failDump: function(action_data, test_data) {
            if (_cli.faildump) {
                var title = 'faildump__' + test_data.path.replace(/\.?\//g, '_');
                _page.dump(title);
            }
        },


        passDump: function(action_data, test_data) {
            if (_cli.passdump) {
                var title = 'passdump__' + test_data.path.replace(/\.?\//g, '_');
                title += '__' + new Date().valueOf();
                _page.dump(title);
            }
        },


        runAction: function(action_data, passCallback, skipCallback, failCallback) {
            var handler = _handlers.getHandler(action_data.type);
            action_data.args = _testparser.parseArguments(action_data.args);
            action_data.start_time = new Date();

            if (handler) {
                waitFor(
                    action_data,

                    // Keep executing until it returns ""
                    function() {
                        return handler.apply(null, action_data.args);
                    },

                    // Run when "" is returned
                    function() {
                        action_data.message = '';
                        action_data.end_time = new Date();
                        passCallback(action_data);
                    },

                    // Or run this when the action is skipped
                    function(result) {
                        action_data.message = result;
                        skipCallback(action_data);
                    },

                    // Or run this after timeout is reached...
                    function(result) {
                        action_data.message = result;
                        failCallback(action_data);
                    },

                    // ...which is this long:
                    _cli.timeout);
            } else {
                action_data.message = 'Unknown action: <' + action_data.type + '>';
                failCallback(action_data);
            }
        }

    };
};
