'use strict';

var _style = require('./logstyle');
// var _suite = require('../data/testsuite');
var _db = require('../data/db');
var _cli = require('../utils/cli');
var _xunit = require('./xunit');
var pad = require('../utils/strings').padRight;
var _hub = require('../core/hub');

var fg = _style.fg;
var bold = _style.bold;
var inverted = _style.inverted;


function log() {
    if (_cli.silent) {
        return;
    }
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
        var arg = args[index] || '';
        result += pad(arg, col_width + 4, ' ');
    });

    return result;
}


function logRuler() {
    log(fg.white('\n----------------------------------------------------------------'));
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


function logAction(action_data, test_data) {
    var args = [action_data.type].concat(action_data.args);
    var message = columnize(args, test_data.columns);

    if (action_data.type === 'log') {
        log(fg.default('\n## ' + action_data.args));
    } else if (action_data.message) {
        if (action_data.optional) {
            log(fg.yellow(' ★ '), fg.cyan(message));
            log(fg.yellow('    ' + action_data.message));
        } else {
            log(fg.red(' ✗ '), fg.cyan(message));
            log(fg.red('    ' + action_data.message));
        }
    } else {
        var duration = action_data.end_time - action_data.start_time;
        duration = '[' + duration + 'ms]';

        log(fg.green(' ✓ '), fg.cyan(message), fg.blue(duration));
    }
}


exports.logAction = logAction;


function logTestStart(test_data) {
    // if (_suite.tests.length < 2) return;

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
}


function logFailedTest(test_data) {
    var action_data = _db.getFailedAction(test_data);

    // If the failed action comes from an included file, print that
    // path as well
    var action_path = (test_data.path === action_data.path) ? '' : ' of ' + action_data.path;
    var action_line = ' (line ' + action_data.line_nr + action_path + ')';

    log('\n' + bold(fg.blue(action_data.path + action_line)));
    logAction(action_data, test_data);
}


function dir(obj) {
    log('\n---------');
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            log(' - ', p, ':', obj[p]);
        }
    }
    log('---------\n');

}


function done(suite) {
    var duration = suite.end_time - suite.start_time;
    var exit_message = 'Executed ' + suite.tests.length + ' Scout tests in ' + duration + 'ms';

    // var skipped_actions = _db.getTestsWithSkippedActions(suite);
    // console.log('result', skipped_actions.length)
    // if (skipped_actions.length) {
    //     log(fg.white('\n----------------------------------------------------------------'));
    //     log(bold(fg.yellow('\n# Skipped', skipped_actions.length, 'actions')));
    // }

    /*
    var total_skipped = 0;
    var tests_with_skipped_actions = [];
    for (var i = 0; i < suite.tests.length; i++) {
        var test_data = suite.tests[i];
        if (test_data.skipped.length) {
            tests_with_skipped_actions.push(test_data);
            total_skipped += test_data.skipped.length;
        }
    }

    if (total_skipped) {
        log(fg.white('\n----------------------------------------------------------------'));
        log(bold(fg.yellow('\n# Skipped', total_skipped, 'actions')));

        for (var i = 0; i < tests_with_skipped_actions.length; i++) {
            var test_data = tests_with_skipped_actions[i];
            // log(bold(fg.yellow('\n# Skipped', test_data.skipped.length, 'of', test_data.path)));
            for (var ii = 0; ii < test_data.skipped.length; ii++) {
                logAction(test_data.skipped[ii], test_data);
            }
        }
    }
    //*/

    if (_db.isPassedSuite(suite)) {
        logRuler();
        log(bold(fg.green('\nPASS: ' + exit_message)));
    } else {
        logRuler();
        log(fg.blue('# Failed ' + _db.getFailedTests(suite).length + ' of ' + suite.tests.length + ' tests:'));
        _db.getFailedTests(suite).forEach(logFailedTest);
        log(bold(fg.red('\nFAIL: ' + exit_message)));
    }

    if (_cli.xunit) {
        _xunit.write(_cli.xunit, suite);
    }
}


exports.dir = dir;


_hub.subscribe('suite.done', done);
_hub.subscribe('test.start', logTestStart);

if (_cli.parallel === 1) {
    _hub.subscribe('action.done', logAction);
}
