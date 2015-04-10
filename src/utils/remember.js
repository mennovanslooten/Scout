'use strict';

/**
 * Basic utility for a shared key-value store
 */

var _remembered = {};

exports.set = function(name, value) {
    _remembered[name] = value;
};

exports.get = function(name) {
    return _remembered[name];
};

