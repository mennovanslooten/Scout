'use strict';

var _cli = require('./utils/cli');
var _fs = require('fs');

if (_cli.version) {
    // if --version is passed, print version
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
    console.log(json.homepage);
}

if (_cli.files.length) {
    var suite_data = require('./data/testsuite');
    if (_cli.reformat) {
        // if --reformat is passed, reformat and exit
        require('./output/reformat').reformat(suite_data);
        phantom.exit(0);
    } else {
        // otherwise, kick off the tests
        require('./output/reporter');
        require('./core/suite_controller').start(suite_data);
    }
} else {
    phantom.exit(0);
}
