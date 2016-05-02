'use strict';

var topics = {};
var subscriber_id = -1;


function getSubscribers(topic) {
    if (!topics[topic]) {
        topics[topic] = [];
    }
    return topics[topic];
}


exports.subscribe = function(topic, func) {
    subscriber_id++;

    getSubscribers(topic).push({
        token: subscriber_id,
        func: func
    });

    return subscriber_id;
};


exports.publish = function(topic /*, args*/) {
    var subscribers = getSubscribers(topic);
    if (!subscribers.length) {
        return false;
    }

    var args = [].slice.call(arguments, 1);

    subscribers.forEach(function(subscriber) {
        try {
            subscriber.func.apply(null, args);
        } catch (ex) { }
    });

    return true;
};


exports.unsubscribe = function(token) {
    for (var topic in topics) {
        if (!topics.hasOwnProperty(topic)) {
            continue;
        }

        var subscribers = topics[topic];
        for (var i = 0; i < subscribers.length; i++) {
            var subscriber = subscribers[i];
            if (subscriber.token === token) {
                topics[topic].splice(i, 1);
                return true;
            }
        }
    }

    return false;
};
