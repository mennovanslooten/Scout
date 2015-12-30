'use strict';

/**
 * This is the top-level data structure that will contain all tests, actions
 * etc, that will be run this session. Passed test objects are moved from
 * tests to passed, failed are moved to failed.
 */
module.exports = {
    tests: require('./filereader').readTestFiles(),
    start_time: new Date(),
    passed: [],
    failed: []
};
