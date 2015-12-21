'use strict';

var pad = require('./pad').padLeft;
var _cli = require('./cli');
var _fs = require('fs');


exports.createDumpName = function(action_data, prefix) {
    var filename = prefix ? prefix + '--' : '';
    filename += action_data.path.replace(/\.?\//g, '_');
    filename = filename.replace('.scout', '');
    filename = filename + '--' + pad(action_data.line_nr, 4);
    filename = filename + '_' + action_data.type + '.png';
    if (prefix && typeof _cli[prefix] === 'string') {
        filename = _cli[prefix] + _fs.separator + filename;
    }
    return filename;
};
