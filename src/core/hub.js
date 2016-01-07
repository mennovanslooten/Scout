'use strict';

var topics = {};
var subUid = -1;

exports.subscribe = function(topic, func) {
    if (!topics[topic]) {
        topics[topic] = [];
    }
    var token = (++subUid).toString();
    topics[topic].push({
        token: token,
        func: func
    });
    return token;
};


exports.publish = function(topic /*, args*/) {
    if (!topics[topic]) {
        return false;
    }

    var args = [].slice.call(arguments, 1);

    // setTimeout(function() {
        var subscribers = topics[topic];
        var len = subscribers ? subscribers.length : 0;

        while (len--) {
            subscribers[len].func.apply(null, args);
        }
    // }, 0);

    return true;
};


exports.unsubscribe = function(token) {
    for (var m in topics) {
        if (topics[m]) {
            for (var i = 0, j = topics[m].length; i < j; i++) {
                if (topics[m][i].token === token) {
                    topics[m].splice(i, 1);
                    return token;
                }
            }
        }
    }
    return false;
};
