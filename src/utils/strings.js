'use strict';
var _fs = require('fs');
var _cli = require('./cli');

function getPadding(value, width, pad_char) {
    pad_char = pad_char || '0';
    return new Array(width - value.length + 1).join(pad_char);
}


function padLeft(value, width, pad_char) {
    var result = String(value);
    if (result.length >= width) return result;
    return getPadding(result, width, pad_char) + value;
}


function padRight(value, width, pad_char) {
    var result = String(value);
    if (result.length >= width) return result;
    return value + getPadding(result, width, pad_char);
}


exports.padLeft = padLeft;
exports.padRight = padRight;


exports.createDumpName = function(action_data, prefix) {
    console.log('!!!createDumpName');
    console.log('type', action_data.type);
    console.log('path', action_data.path);

    var filename = prefix ? prefix + '--' : '';
    filename += action_data.path.replace(/\.?\//g, '_');
    filename = filename.replace('.scout', '');
    filename = filename + '--' + padLeft(action_data.line_nr, 4);
    filename = filename + '_' + action_data.type + '.png';

    if (prefix && typeof _cli[prefix] === 'string') {
        filename = _cli[prefix] + _fs.separator + filename;
    }
    console.log('result --->', filename);

    return filename;
};
