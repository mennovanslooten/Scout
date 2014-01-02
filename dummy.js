var _start_time        = new Date();
var _test_files        = require('./lib/testreader').readTestFiles();
var screendump         = require('./lib/screendump');
var page               = require('webpage').create();
var _action_handlers   = require('./lib/action_handlers').action_handlers;
var _current_test_file = null;
var _total_actions     = 0;
var _skipped           = [];
var _waitfor_pause     = 50;


page.is_loaded = false;
page.is_loading = false;


page.viewportSize = {
	width: 1280,
	height: 1280
};

page.onInitialized = function() {
	page.evaluate(function() {
		window.localStorage.clear();
	});
};

page.onLoadFinished = function() {
	//console.log('onLoadFinished', page.url);

	var has_jquery = page.evaluate(function() {
		return 'jQuery' in window;
	});

	if (!has_jquery) {
		page.injectJs('./lib/jquery-2.0.3.js');
		page.evaluate(function() {
			jQuery.noConflict();
		});
	}

	page.is_loaded = true;
	page.is_loading = false;
};

page.onLoadStarted = function() {
	//console.log('onLoadStarted');
	page.is_loaded = false;
	page.is_loading = true;
};

page.onError = function() { };

/*
page.onInitialized  = function() {
	console.log('onInitialized');
	_is_loaded = false;

	page.evaluate(function() {
		window.localStorage.clear();
	});

};
*/


/*
page.onLoadStarted = function() {
	_is_loaded = false;
};


page.onLoadFinished = function() {
	console.log('onLoadFinished', page.url);
	_is_loaded = true;

	var has_jquery = page.evaluate(function() {
		return 'jQuery' in window;
	});

	if (has_jquery) {
		nextAction();
	} else {
		page.injectJs('./phantom_lib/jquery-2.0.3.js');
		page.evaluate(function() {
			jQuery.noConflict();
		});
		nextAction();
	}
};
*/


function nextTestFile() {
	// Clean up after ourselves
	if (_current_test_file) {
		page.evaluate(function() {
			window.localStorage.clear();
		});
	}

	_current_test_file = _test_files.shift();
	if (!_current_test_file) {
		done();
		return;
	}

	console.log('\n\nStarting ' + _current_test_file.path + ' (' + _current_test_file.actions.length + ' actions)');
	_current_test_file.actions.forEach(function(item) {
		//console.log(' - ' + item.type + ' : ' + item.args.join('   '));
	});
	page.is_loaded = false;
	page.is_loading = false;
	nextAction();
}


function waitFor(conditionCallback, passCallback, failCallback, timeout) {
	//console.log('waitFor', page.is_loaded, page.is_loading);
	if (timeout > 0) {
		var is_passed = !page.is_loading && conditionCallback();
		if (is_passed) {
			passCallback();
		} else {
			setTimeout(function() {
				waitFor(conditionCallback, passCallback, failCallback, timeout - _waitfor_pause);
			}, _waitfor_pause);
		}
	} else {
		failCallback();
	}
}



function nextAction() {
	var action = _current_test_file.actions.shift();

	if (!action) {
		nextTestFile();
		return;
	}

	var handler = _action_handlers[action.type];
	if (handler) {
		waitFor(

			// Keep executing until it returns true
			function() {
				return handler.apply(_action_handlers, action.args);
			},

			// Run after true is returned
			function() {
				if (action.type !== 'log') {
					//screendump.dump('pass-' + action.type);
					var args = [action.type].concat(action.args);

					//console.log('  ✓ ' + action.type + ' ' + action.args.join('    '));
					pass(tabularize(args));
					//_total_actions++;
				}
				nextAction();
			},

			// Or run this after timeout is reached
			function() {
				screendump.dump('fail-' + action.type);
				var args = [action.type].concat(action.args);
				fail(tabularize(args));

				//fail(action.type + ' ' + action.args.join('    '));
			},

			5000);
	} else {
		utils.dump(action);
		fail('Action not found: ' + action.type);
	}
}


function pass(message) {
	console.log('  ✓ ' + message);
	_total_actions++;
}


function tabularize(args) {
	var result = '';
	args.forEach(function(item) {
		result += item;
		if (item.length < 20) {
			result += new Array(20 - item.length).join(' ');
		} else {
			result += '    ';
		}
	});
	return result;
}


function fail(message) {
	_skipped.push(message);
	//console.log('SKIPPED:', message);
	console.log('  ✗ ' + message);
	nextTestFile();
}



function done() {
	var total_time = new Date().valueOf() - _start_time;
	var message = 'Executed ' + _total_actions + ' actions';

	if (_skipped.length) {
		message += ', Failed ' + _skipped.length + ' actions';
	}

	message += ' in ' + total_time + 'ms.';
	console.log(message);
	phantom.exit();
}


// Get the party started
nextTestFile();
