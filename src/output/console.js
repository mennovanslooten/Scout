'use strict';

var _style = require('../utils/logstyle');
var _cli = require('../utils/cli');
var fg = _style.fg;


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


function dir(obj) {
    log('\n---------');
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            log(' - ', p, ':', obj[p]);
        }
    }
    log('---------\n');

}


exports.comment = comment;
exports.error = error;
exports.log = log;
exports.dir = dir;
