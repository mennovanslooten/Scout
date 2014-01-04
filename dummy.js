phantom.clearCookies();

var _start_time        = new Date();
var _test_files        = require('./lib/testreader').readTestFiles();
var screendump         = require('./lib/screendump');
var page               = require('webpage').create();
var _action_handlers   = require('./lib/action_handlers').action_handlers;
var _current_test_file = null;
var _total_actions     = 0;
var _skipped           = [];
var _waitfor_pause     = 550;


page.is_loaded = false;
page.is_loading = false;


page.viewportSize = {
	width: 1280,
	height: 1280
};


function setupPage() {
	if (page.is_loaded) {
		//console.log('page already setup');
		return;
	}

	page.evaluate(function() {
		window.localStorage.clear();
	});

	var has_jquery = page.evaluate(function() {
		return 'jQuery' in window;
	});

	//console.log('setupPage', page.url, has_jquery);

	if (!has_jquery) {
		page.injectJs('./lib/jquery-2.0.3.js');
		page.evaluate(function() {
			jQuery.noConflict();
		});
	}

	page.is_loaded = true;
	page.is_loading = false;
}


function hasJQuery() {
	var has_jquery = page.evaluate(function() {
		return 'jQuery' in window;
	});

	//console.log('hasJQuery', page.url, has_jquery);

	if (!has_jquery) {
		page.injectJs('./lib/jquery-2.0.3.js');
		page.evaluate(function() {
			jQuery.noConflict();
		});
	}

	return true;
}


page.onUrlChanged = function(targetUrl) {
	//console.log('New URL: ' + targetUrl);
};

/*
page.onInitialized = function() {
	console.log('onInitialized', page.url);
	page.evaluate(function() {
		window.localStorage.clear();
	});
};


page.onLoadFinished = function() {
	console.log('onLoadFinished', page.url);
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
*/


page.onInitialized = setupPage;
page.onLoadFinished = setupPage;


page.onLoadStarted = function() {
	//console.log('onLoadStarted', page.url);
	page.is_loaded = false;
	page.is_loading = true;
};


page.onError = function() { };


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

	console.log('\n################################################################');
	console.log('# Starting ' + _current_test_file.path + ' (' + _current_test_file.actions.length + ' actions)');
	console.log('################################################################');

	page.is_loaded = false;
	page.is_loading = false;

	nextAction();
}


function waitFor(conditionCallback, passCallback, failCallback, timeout) {
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
					pass(tabularize(args));
				}
				nextAction();
			},

			// Or run this after timeout is reached
			function() {
				screendump.dump('fail-' + action.type);
				var args = [action.type].concat(action.args);
				fail(tabularize(args));
				nextTestFile();
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


function fail(message) {
	_skipped.push(message);
	console.log('  ✗ ' + message);
}


function done() {
	var exit_code = 0;
	var result = 'PASS';
	var total_time = Math.round((new Date().valueOf() - _start_time) / 1000);
	var message = 'Executed ' + _total_actions + ' actions';

	if (_skipped.length) {
		exit_code = 1;
		result = 'FAIL';
		message += ', Failed ' + _skipped.length + ' actions';
	}

	message += ' in ' + total_time + 's.';

	console.log(result + ': ' + message);
	phantom.exit(exit_code);
}


function tabularize(args) {
	var result = '';
	args.forEach(function(item) {
		result += item;
		if (item.length < 25) {
			result += new Array(25 - item.length).join(' ');
		} else {
			result += '    ';
		}
	});
	return result;
}


// Get the party started
nextTestFile();
