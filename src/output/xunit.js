'use strict';
var _fs = require('fs');
var _db = require('../data/db');

// http://help.catchsoftware.com/display/ET/JUnit+Format
// https://gist.github.com/n1k0/4332371


function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


function getDuration(obj) {
    var result = (obj.end_time - obj.start_time) / 1000;
    return result || 0;
}


function getActionXML(action_data, test_data) {
    if (typeof action_data.line_nr === 'undefined') return '';
    var type = action_data.type;
    var last_index = action_data.path.lastIndexOf(_fs.separator);
    var name = action_data.path.substr(last_index + 1);
    var duration = getDuration(action_data);
    var xml = '\n    <testcase class="' + name + '" time="' + duration + '" ';
    xml += 'assertions="1" ';
    xml += 'line="' + action_data.line_nr + '" ';
    xml += 'name="' + type + '" ';
    xml += 'file="' + test_data.path + '"';

    var is_failed = _db.isFailedAction(action_data);
    var is_skipped = _db.isSkippedAction(action_data);

    if (is_failed || is_skipped) {
        var failure_type = is_skipped ? 'error' : 'failure';
        xml += '>\n      <' + failure_type + ' type="' + type + '">';
        xml += htmlEntities(action_data.message);
        xml += '</' + failure_type + '>\n    ';
        xml += '</testcase>';
    } else {
        xml += '/>';
    }

    return xml;
}


function getTestXML(test_data) {
    var duration = getDuration(test_data);
    var last_index = test_data.path.lastIndexOf(_fs.separator);
    var name = test_data.path.substr(last_index + 1);
    var actions = test_data.actions.length;
    var passed = _db.getPassedActions(test_data).length;
    var skipped = _db.getSkippedActions(test_data).length;
    var failed = _db.getFailedAction(test_data) ? 1 : 0;
    var total = passed + skipped + failed;

    var xml = '\n  <testsuite errors="' + (failed + skipped) + '" failures="' + failed + '" ';
    xml += 'name="' + name + '" tests="' + total + '" ';
    xml += 'file="' + test_data.path + '" ';
    xml += 'assertions="' + actions + '" ';
    xml += 'time="' + duration + '">';

    for (var ii = 0; ii < total; ii++) {
        var action_data = test_data.actions[ii];
        xml += getActionXML(action_data, test_data);
    }

    xml += '\n  </testsuite>';

    return xml;
}


function getSuiteXML(suite_data) {
    var xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '\n<testsuites>';

    xml += suite_data.tests.map(getTestXML).join('');

    xml += '\n</testsuites>\n';
    return xml;
}


exports.write = function(filename, suite) {
    var xml = getSuiteXML(suite);
    if (filename === true) {
        console.log(xml);
    } else {
        _fs.write(filename, xml, 'w');
    }
};
