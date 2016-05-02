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
    log(fg.magenta('\n----------------------------------------------------------------'));
}


function logAction(action_data, test_data) {
    var args = [action_data.type].concat(action_data.args);
    // var column_widths = getColumnWidths(test_data);
    var message = columnize(args, test_data);

    if (action_data.type === 'log') {
        log(fg.cyan('\n' + action_data.args));
    } else if (action_data.message) {
        if (action_data.optional) {
            log(fg.yellow(' ★ ', message));
            log(fg.yellow('   ', action_data.message));
        } else {
            log(fg.red(' ✗ ', message));
            log(fg.red('   ', action_data.message));
        }
    } else {
        var duration = action_data.end_time - action_data.start_time;
        duration = '[' + duration + 'ms]';
        log(fg.green(' ✓ ', message), fg.blue(duration));
    }
}


function logActionSource(action_data, test_data) {
    var action_path = (test_data.path === action_data.path) ? '' : ' of ' + action_data.path;
    var action_line = ' (line ' + action_data.line_nr + action_path + ')';
    log('\n' + bold(fg.blue(action_data.path + action_line)));
}


function logFailedTest(test_data) {
    var action_data = _db.getFailedAction(test_data);
    logActionSource(action_data, test_data);
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

    var tests_with_skipped_actions = _db.getTestsWithSkippedActions(suite_data);
    if (tests_with_skipped_actions.length) {
        logRuler();
        log(bold(fg.yellow('\nSome actions failed but were optional:')));
        tests_with_skipped_actions.forEach(function(test_data) {
            var skipped_actions = _db.getSkippedActions(test_data);
            skipped_actions.forEach(function(action_data) {
                logActionSource(action_data, test_data);
                logAction(action_data, test_data);
            });
        });
    }

    if (_db.isPassedSuite(suite_data)) {
        logRuler();
        log(bold(fg.green('\nPASS: ' + exit_message)));
    } else {
        logRuler();
        var fail_message = '\nFailed ';
        fail_message += _db.getFailedTests(suite_data).length;
        fail_message += ' of ' + suite_data.tests.length + ' tests:';
        log(fg.red(fail_message));
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
