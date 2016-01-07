'use strict';
var _cli = require('../utils/cli');
var _hub = require('../core/hub');
var _db = require('../data/db');
var _xunit = require('./xunit');
var columnize = require('../utils/strings').columnize;

var _style = require('../utils/logstyle');
var fg = _style.fg;
var bold = _style.bold;
var inverted = _style.inverted;

var log = require('./console').log;
var comment = require('./console').comment;

function logRuler() {
    log(fg.white('\n----------------------------------------------------------------'));
}


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


function logFailedTest(test_data) {
    var action_data = _db.getFailedAction(test_data);

    // If the failed action comes from an included file, print that
    // path as well
    var action_path = (test_data.path === action_data.path) ? '' : ' of ' + action_data.path;
    var action_line = ' (line ' + action_data.line_nr + action_path + ')';

    log('\n' + bold(fg.blue(action_data.path + action_line)));
    logAction(action_data, test_data);
}


function logTestStart(test_data) {
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



function done(suite_data) {
    var duration = suite_data.end_time - suite_data.start_time;
    var exit_message = 'Executed ' + suite_data.tests.length + ' Scout tests in ' + duration + 'ms';

    // var skipped_actions = _db.getTestsWithSkippedActions(suite_data);
    // console.log('result', skipped_actions.length)
    // if (skipped_actions.length) {
    //     log(fg.white('\n----------------------------------------------------------------'));
    //     log(bold(fg.yellow('\n# Skipped', skipped_actions.length, 'actions')));
    // }

    /*
    var total_skipped = 0;
    var tests_with_skipped_actions = [];
    for (var i = 0; i < suite_data.tests.length; i++) {
        var test_data = suite_data.tests[i];
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

    if (_db.isPassedSuite(suite_data)) {
        logRuler();
        log(bold(fg.green('\nPASS: ' + exit_message)));
    } else {
        logRuler();
        var fail_message = '# Failed ';
        fail_message += _db.getFailedTests(suite_data).length;
        fail_message += ' of ' + suite_data.tests.length + ' tests:';
        log(fg.blue(fail_message));
        _db.getFailedTests(suite_data).forEach(logFailedTest);
        log(bold(fg.red('\nFAIL: ' + exit_message)));
    }
    if (_cli.xunit) {
        _xunit.write(_cli.xunit, suite_data);
    }
}

_hub.subscribe('suite.done', done);
_hub.subscribe('test.start', logTestStart);

if (_cli.parallel === 1) {
    _hub.subscribe('action.done', logAction);
}
