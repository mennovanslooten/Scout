'use strict';

var _style = require('./logstyle');
var _suite = require('./testsuite');
var _cli = require('./arguments');
var fg = _style.fg;
//var bg = _style.bg;
var bold = _style.bold;
var inverted = _style.inverted;


function log() {
	console.log.apply(console, arguments);
}


function comment() {
	log(fg.blue(arguments));
}


function error() {
	log(fg.red(arguments));
}


function columnize(args, columns) {
	var result = '';

	columns.forEach(function(col_width, index) {
		col_width += 5;
		var arg = args[index] || '';
		result += arg;
		if (arg.length < col_width) {
			result += new Array(col_width - arg.length).join(' ');
		}
	});

	return result;
}


exports.reformat = function() {
	_suite.tests.forEach(function(test) {

		//log('\n# ---- ' + test.path + ' ----\n');

		var last_line_nr = 0;

		test.actions.forEach(function(action) {
			var out = '';

			// Add empty lines
			var newlines = action.line_nr - last_line_nr;
			if (newlines > 1) {
				out += new Array(newlines).join('\n');
			}
			last_line_nr = action.line_nr;

			if (action.type === 'log') {
				out += '## ' + action.args.join(' ');
			} else {
				var args = [action.type].concat(action.args);
				out += columnize(args, test.columns);
			}

			// Remove trailing whitespace
			out = out.replace(/\s+$/, '');
			log(out);
		});
	});
};


exports.comment = comment;


exports.error = error;


exports.log = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(message, 36);
};


exports.passAction = function(action_data, test_data) {
	if (_cli.parallel > 1) return;

	if (action_data.type === 'log') {
		log(fg.default('\n## ' + action_data.args));
	} else {
		var args = [action_data.type].concat(action_data.args);
		var message = columnize(args, test_data.columns);
		var duration = action_data.end_time - action_data.start_time;
		duration = '[' + duration + 'ms]';

		log(fg.green('  ✓ '), fg.cyan(message), fg.blue(duration));
	}
};


exports.skipAction = function(action_data, test_data) {
	if (_cli.parallel > 1) return;

	var args = [action_data.type].concat(action_data.args);
	var message = columnize(args, test_data.columns);

	log(fg.yellow('  ★ '), fg.cyan(message));
	log(fg.yellow('     ' + action_data.message));
};



exports.failAction = function(action_data, test_data) {
	if (_cli.parallel > 1) return;

	var args = [action_data.type].concat(action_data.args);
	var message = columnize(args, test_data.columns);

	log(fg.red('  ✗ '), fg.cyan(message));
	log(fg.red('     ' + action_data.message));
};



exports.startTest = function(test_data) {
	if (_suite.tests.length < 2) return;

	if (_cli.parallel > 1) {
		comment('# Starting: ' + test_data.path);
		return;
	}

	var title_width = 80;
	var filler = _cli.color ? ' ' : '#';

	log('\n');
	log(inverted(new Array(title_width).join(filler)));
	log(inverted(bold(filler, test_data.path, new Array(title_width - test_data.path.length - 5).join(' '), filler)));
	log(inverted(new Array(title_width).join(filler)));
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
	var exit_message = 'Executed ' + suite.tests.length + ' tests in ' + duration + 'ms';
	var is_passed = suite.failed.length === 0;

	if (is_passed) {
		log(bold(fg.green('\nPASS: ' + exit_message)));
	} else {
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
			var action_path = (fail.path === action_data.path) ? '' : ' of ' + action_data.path;
			var action_line = ' (line ' + action_data.line_nr + action_path + ')';

			log(fg.red('\n  ✗'), fg.blue(fail.path + action_line));
			log(fg.cyan('    ' + message));
			log(fg.red('    ' + action_data.message));
		}

		log(bold(fg.red('\nFAIL: ' + exit_message)));
	}
};


exports.dir = function(obj) {
	log('\n---------');
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			log(' - ', p, ':', obj[p]);
		}
	}
	log('---------\n');

};
