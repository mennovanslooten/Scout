var style = require('./logstyle');
var fg = style.fg;
var bg = style.bg;
var bold = style.bold;
var inverted = style.inverted;


/*
function log(message) {
	//if (_is_muted) return;
	if (_cli_args.color) {
		var postfix = '\u001b[0m';
		var codes = [].slice.call(arguments, 1);
		console.log(prefix.apply(this, codes) + message + postfix);
	} else {
		console.log(message);
	}
}
*/

function log() {
	console.log.apply(console, arguments);
}

//function prefix() {
	//var codes = Array.prototype.join.call(arguments, ';');
	//return '\u001b[' + codes + 'm';
//}


function comment() {
	//var message = Array.prototype.join.call(arguments, ' ');
	log(fg.blue(arguments));
};


function error() {
	//var message = Array.prototype.join.call(arguments, ' ');
	log(fg.red(arguments));
};


function columnize(args, columns) {
	var result = '';
	//args.forEach(function(item, index) {
		//result += item;
		//var length = columns[index] + 4;
		//if (item.length < length) {
			//result += new Array(length - item.length).join(' ');
		//}
	//});

	columns.forEach(function(col_width, index) {
		col_width += 4;
		var arg = args[index] || '';
		result += arg;
		if (arg.length < col_width) {
			result += new Array(col_width - arg.length).join(' ');
		}
	});
	return result;
};


exports.comment = comment;


exports.error = error;


exports.log = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(message, 36);
};


exports.passAction = function(action_data, test_data) {
	if (_cli_args.parallel > 1) return;

	if (action_data.type === 'log') {
		log(fg.magenta('\n## ' + action_data.args));
	} else {
		var args = [action_data.type].concat(action_data.args);
		var message = columnize(args, test_data.columns);
		var duration = action_data.end_time - action_data.start_time;
		duration = '[' + duration + 'ms]';

		log(fg.green('  ✓ '), fg.cyan(message), fg.blue(duration));
	}
};


exports.failAction = function(action_data, test_data) {
	if (_cli_args.parallel > 1) return;

	var args = [action_data.type].concat(action_data.args);
	var message = columnize(args, test_data.columns);

	if (action_data.optional) {
		log(fg.yellow('  ★ '), fg.cyan(message));
		log(fg.yellow('     ' + action_data.message));
	} else {
		log(fg.red('  ✗ '), fg.cyan(message));
		log(fg.red('     ' + action_data.message));
	}
};



exports.startTest = function(test_data) {
	if (_suite.tests.length < 2) return;

	if (_cli_args.parallel > 1) {
		comment('# Starting: ' + test_data.path);
		return;
	}

	log(fg.white('\n################################################################'));
	log(fg.white('#'), fg.white(test_data.path));
	log(fg.white('################################################################'));
};


exports.passTest = function(test_data) {
	var duration = test_data.end_time - test_data.start_time;
	var message = '# [pass] ' + test_data.path;
	message += ' > Executed ' + test_data.passed.length + ' actions in ' + duration + 'ms';
	log(message, 32, 1);
};


exports.failTest = function(test_data) {
	var duration = test_data.end_time - test_data.start_time;
	var message = '# [fail] ' + test_data.path;
	message += ' > Executed ' + test_data.passed.length + ' actions in ' + duration + 'ms';
	log(message, 31, 1);
};


exports.done = function(suite) {
	var duration = suite.end_time - suite.start_time;
	var message = 'Executed ' + suite.tests.length + ' tests in ' + duration + 'ms';
	var is_passed = suite.failed.length === 0;

	if (is_passed) {
		log(bold(fg.green('\nPASS: ' + message)));
	} else {
		log(bold(fg.red('\nFAIL: ' + message)));
		//log('      ' + suite.failed.length + ' tests failed', 31, 1);
		log(fg.blue('----------------------------------------------------------------'));
		log(fg.blue('# Failed ' + suite.failed.length + ' of ' + suite.tests.length + ' tests:'));

		for (var i = 0; i < suite.failed.length; i++) {
			var fail = suite.failed[i];
			var action_index = fail.passed.length + fail.skipped.length;
			var action_data = fail.actions[action_index];
			var args = [action_data.type].concat(action_data.args);
			var message = columnize(args, fail.columns);

			// If the failed action comes from an included file, print that
			// path as well
			var action_path = (fail.path === action_data.path)
				? '' 
				: ' of ' + action_data.path;

			var action_line = ' (line ' + action_data.line_nr + action_path + ')';

			log(fg.red('\n  ✗ ' + fail.path + action_line));
			log(fg.red('    ' + message));
			log(fg.red('    ' + action_data.message));
		}
	}
};

exports.dir = function(obj) {
	log('\n---------');
	for (var p in obj) {
		log(' - ', p, ':', obj[p]);
	}
	log('---------\n');

}
