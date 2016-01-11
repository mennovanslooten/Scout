'use strict';

// An action is completed if it has a start and end time
function isCompletedAction(action_data) {
    return typeof action_data.start_time !== 'undefined' && typeof action_data.end_time !== 'undefined';
}


// An action is failed if it has completed and a non-empty message
function isFailedAction(action_data) {
    return isCompletedAction(action_data) && action_data.message !== '' && !action_data.optional;
}


// An action is skipped if it has failed and is optional
function isSkippedAction(action_data) {
    return isCompletedAction(action_data) && action_data.message !== '' && action_data.optional;
    // return isFailedAction(action_data) && action_data.optional;
}


// An action is passed if it has completed and an empty message
function isPassedAction(action_data) {
    return isCompletedAction(action_data) && action_data.message === '';
}


// An action is passed or skipped if it has passed or skipped :P
function isPassedOrSkippedAction(action_data) {
    return isPassedAction(action_data) || isSkippedAction(action_data);
}


// A test is failed if at least one action failed
function isFailedTest(test_data) {
    return test_data.actions.some(isFailedAction);
}


// A test is completed if it has failed or all actions have completed
function isCompletedTest(test_data) {
    return isFailedTest(test_data) || test_data.actions.every(isCompletedAction);
}


// A test is passed if every action passed or skipped
function isPassedTest(test_data) {
    return test_data.actions.every(isPassedOrSkippedAction);
}


// The suite is completed if all tests are completed
function isCompletedSuite(suite) {
    return suite.tests.every(isCompletedTest);
}


// The suite is passedd if all tests are passed
function isPassedSuite(suite) {
    return suite.tests.every(isPassedTest);
}


// Returns all failed tests
function getFailedTests(suite) {
    return suite.tests.filter(isFailedTest);
}


// Returns all tests with skipped actions
function getTestsWithSkippedActions(suite) {
    return suite.tests.filter(function(test_data) {
        return test_data.actions.some(isSkippedAction);
    });
}


function getFailedAction(test_data) {
    var failed_actions = test_data.actions.filter(isFailedAction);
    if (failed_actions.length) return failed_actions.pop();
    return null;
}


function getPassedActions(test_data) {
    return test_data.actions.filter(isPassedAction);
}


function getSkippedActions(test_data) {
    return test_data.actions.filter(isSkippedAction);
}


function getPassedTests(suite) {
    return suite.tests.filter(isPassedTest);
}

exports.isCompletedAction = isCompletedAction;
exports.isFailedAction = isFailedAction;
exports.isSkippedAction = isSkippedAction;
exports.isPassedAction = isPassedAction;
exports.isPassedOrSkippedAction = isPassedOrSkippedAction;
exports.isFailedTest = isFailedTest;
exports.isCompletedTest = isCompletedTest;
exports.isPassedTest = isPassedTest;
exports.isCompletedSuite = isCompletedSuite;
exports.isPassedSuite = isPassedSuite;
exports.getFailedTests = getFailedTests;
exports.getPassedActions = getPassedActions;
exports.getSkippedActions = getSkippedActions;
exports.getFailedAction = getFailedAction;
exports.getPassedTests = getPassedTests;
exports.getTestsWithSkippedActions = getTestsWithSkippedActions;
