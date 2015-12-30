'use strict';

var _cli = require('./utils/cli');
var _fs = require('fs');

phantom.onError = function(msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> '
                + (t.file || t.sourceURL)
                + ': '
                + t.line
                + (t.function ? ' (in function ' + t.function + ')' : ''));
        });
    }
    console.error(msgStack.join('\n'));
    phantom.exit(1);
};

if (_cli.version) {
    // if --version is passed, print version and exit
    var json = require('../package.json');
    var scout_version = json.version;
    var phantom_version = [
        phantom.version.major,
        phantom.version.minor,
        phantom.version.patch
    ].join('.');
    var path = _fs.absolute(_cli.phantompath);

    console.log('Scout: v' + scout_version);
    console.log('PhantomJS: v' + phantom_version + ' (' + path + ')');
    console.log('http://mennovanslooten.github.io/Scout/');

    phantom.exit(0);
} else if (_cli.reformat) {
    // if --reformat is passed, reformat and exit
    require('./logger/logger').reformat();
    phantom.exit(0);
} else {
    // otherwise, kick off the tests
    require('./core/suite_controller').start();
}
