'use strict';

/**
 * This is the top-level data structure that will contain all tests, actions
 * etc, that will be run this session.
 */
module.exports = {
    tests: require('./filereader').readTestFiles(),
    start_time: new Date()
};
