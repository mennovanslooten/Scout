'use strict';

var _cli = require('./utils/cli');
var _fs = require('fs');

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
    require('./scout/scout').start();
}
