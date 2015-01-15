'use strict';

module.exports = {
    tests: require('./testreader').readTestFiles(),
    start_time: new Date(),
    passed: [],
    failed: []
};

