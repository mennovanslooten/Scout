var _logger = require('./logger');

exports.run = function(test_data, passCallback, failCallback) {
	var testcontainer = require('./testcontainer').create(test_data.path);
	var action_index = -1;

	test_data.start_time = new Date();
	_logger.startTest(test_data);

	function nextAction() {
		action_index++;
		if (action_index >= test_data.actions.length) return done();

		var action_data = test_data.actions[action_index];
		testcontainer.runAction(action_data, passAction, failAction);
	}


	function passAction(action_data) {
		_logger.passAction(action_data, test_data);
		testcontainer.passDump(action_data, test_data);
		test_data.passed.push(action_data);

		// If the previous action resulted in a page (re)load we need to give it
		// some time to trigger the onNavigationRequested event. Until the next
		// page is loaded, the next action will fail
		setTimeout(nextAction, 5);
	}


	function failAction(action_data) {
		_logger.failAction(action_data, test_data);
		testcontainer.failDump(action_data, test_data);
		testcontainer.close();
		failCallback(test_data);
	}


	function done() {
		testcontainer.close();
		passCallback(test_data);
	}

	nextAction();
};

