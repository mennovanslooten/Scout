'use strict';
var _fs = require('fs');

// http://help.catchsoftware.com/display/ET/JUnit+Format
// https://gist.github.com/n1k0/4332371


function getDuration(obj) {
    var result = (obj.end_time - obj.start_time) / 1000;
    return result || 0;
}


function getTestCaseXML(action, test) {
    var type = action.type;
    var duration = getDuration(action);
    var xml = '\n    <testcase classname="' + type + '" time="' + duration + '">';

    if (action.message) {
        var failure_type = test.skipped.indexOf(action) > -1 ? 'error' : 'failure';
        xml += '\n      <' + failure_type + ' type="' + type + '">';
        xml += '<![CDATA[' + action.message + ']]>';
        xml += '</' + failure_type + '>\n    ';
    }

    xml += '</testcase>';
    return xml;
}


function getTestSuiteXML(test) {
    var timestamp = test.start_time.toISOString();
    var duration = getDuration(test);
    var last_index = test.path.lastIndexOf(_fs.separator);
    var pkg = test.path.substr(0, last_index);
    var name = test.path.substr(last_index + 1);
    var actions = test.actions.length;
    var passed = test.passed.length;
    var skipped = test.skipped.length;
    var failed = passed + skipped === actions ? 0 : 1;
    var total = passed + skipped + failed;

    var xml = '\n  <testsuite errors="' + (failed + skipped) + '" failures="' + failed + '" ';
    xml += 'name="' + name + '" package="' + pkg + '" tests="' + total + '" ';
    xml += 'time="' + duration + '" timestamp="' + timestamp + '">';

    for (var ii = 0; ii < total; ii++) {
        var action = test.actions[ii];
        xml += getTestCaseXML(action, test);
    }

    xml += '\n    <system-out/>';
    xml += '\n    <system-err/>';
    xml += '\n  </testsuite>';

    return xml;
}


function getXML(suite) {
    var xml = '<?xml version="1.0" encoding="UTF-8"?>';
    var duration = getDuration(suite);
    xml += '\n<testsuites time="' + duration + '">';

    for (var i = 0; i < suite.tests.length; i++) {
        var test = suite.tests[i];
        xml += getTestSuiteXML(test);
    }

    xml += '\n</testsuites>\n';
    return xml;
}


exports.write = function(filename, suite) {
    var xml = getXML(suite);
    _fs.write(filename, xml, 'w');
};

