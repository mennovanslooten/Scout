var _logger = require('./logger');

/**
 * Sequentially run all the actions in a test. Run passCallback if all
 * actions are succesfully completed, otherwise run failCallback
 */
exports.run = function(test_data, passCallback, failCallback) {

	// testcontainer is the context in which a test is run, webpage, mouse,
	// keyboard, etc
	var testcontainer = require('./testcontainer').create(test_data.path);
	var action_index = -1;

	// Remember when we started this test
	test_data.start_time = new Date();
	_logger.startTest(test_data);

	/**
	 * Run the next action from the queue
	 */
	function nextAction() {
		action_index++;
		if (action_index >= test_data.actions.length) return done();

		var action_data = test_data.actions[action_index];
		testcontainer.runAction(action_data, passAction, skipAction, failAction);
	}


	/**
	 * Register an action as passed
	 */
	function passAction(action_data) {
		_logger.passAction(action_data, test_data);
		testcontainer.passDump(action_data, test_data);
		test_data.passed.push(action_data);
		nextAction();
	}


	/**
	 * Register an action as skipped
	 */
	function skipAction(action_data) {
		_logger.skipAction(action_data, test_data);
		test_data.skipped.push(action_data);
		nextAction();
	}


	/**
	 * Register an action as failed or skipped
	 */
	function failAction(action_data) {
		_logger.failAction(action_data, test_data);
		testcontainer.failDump(action_data, test_data);
		testcontainer.close();
		failCallback(test_data);
	}


	/**
	 * All actions completed, the test has passed
	 */
	function done() {
		testcontainer.close();
		passCallback(test_data);
	}

	// Kick off the first action
	nextAction();
};

