'use strict';

var _cli = require('./utils/cli');

if (_cli.version) {
    // if --version is passed, print version and exit
    var json = require('../package.json');
    var version = json.version;

    console.log('Scout v' + version);
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
