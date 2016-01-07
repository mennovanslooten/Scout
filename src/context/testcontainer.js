'use strict';

var _hub = require('../core/hub');

exports.create = function(test_data) {
    var page = require('./page').create(test_data);
    var mouse = require('./mouse').create(page);
    var keyboard = require('./keyboard').create(page);
    var remote = require('./remote').create(page);
    var request = require('./request').create(page, test_data);
    var dumps = require('./screendumps').create(page);

    var env = {
        page: page,
        mouse: mouse,
        keyboard: keyboard,
        remote: remote,
        request: request,
        dumps: dumps
    };

    var action_runner = require('./handlers').create(env, test_data);


    function runAction(action_data) {
        if (!page.isReady()) {
            return 'Could not finish loading <' + page.getURL() + '>';
        }

        return action_runner.run(action_data);
    }


    var sub_id = _hub.subscribe('test.done', function(done_test_data) {
        if (done_test_data === test_data) {
            env.page.close();
            _hub.unsubscribe(sub_id);
        }
    });

    return {
        runAction: runAction
    };
};
