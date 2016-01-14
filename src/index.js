'use strict';

var _cli = require('./utils/cli');

if (_cli.version) {
    // if --version is passed, print version
    var json = require('../package.json');
    console.log('Scout v' + json.version);
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
