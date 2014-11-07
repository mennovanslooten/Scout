var _logger             = require('./logger');

exports.run = function(test_data, passCallback, failCallback) {
	var environment = require('./environment').create(test_data.path);
	var action_index = -1;

	test_data.start_time = new Date();
	_logger.startTest(test_data);

	function nextAction() {
		action_index++;
		if (action_index >= test_data.actions.length) return done();

		var action_data = test_data.actions[action_index];
		environment.runAction(action_data, passAction, failAction);
	}


	function passAction(action_data) {
		_logger.passAction(action_data, test_data);
		environment.passDump(action_data, test_data);
		test_data.passed.push(action_data);

		// If the previous action resulted in a page (re)load we need to give it
		// some time to trigger the onNavigationRequested event. Until the next
		// page is loaded, the next action will fail
		setTimeout(nextAction, 5);
	}


	function failAction(action_data) {
		_logger.failAction(action_data, test_data);
		environment.failDump(action_data, test_data);
		environment.close();
		failCallback(test_data);
	}


	function done() {
		environment.close();
		passCallback(test_data);
	}

	nextAction();
}

