'use strict';

var _hub = require('../core/hub');
var parseArguments = require('../utils/parser').parseArguments;

exports.create = function(test_data) {
    var page = require('./page').create(test_data.path);
    var getHandler = require('./handlers').create(page, test_data.path).getHandler;


    function runAction(action_data) {
        var handler = getHandler(action_data.type);
        action_data.args = parseArguments(action_data.args);

        if (!handler) {
            return 'Unknown action: <' + action_data.type + '>';
        }

        if (!page.isReady()) {
            return 'Could not finish loading <' + page.getURL() + '>';
        }

        return handler.apply(null, action_data.args);
    }


    var sub_id = _hub.subscribe('test.done', function(done_test_data) {
        if (done_test_data === test_data) {
            page.close();
            _hub.unsubscribe(sub_id);
        }
    });

    return {
        runAction: runAction
    };
};
