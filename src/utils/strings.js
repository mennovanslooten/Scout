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
    var filename = prefix ? prefix + '--' : '';
    filename += action_data.path.replace(/\.?\//g, '_');
    filename = filename.replace('.scout', '');
    filename = filename + '--' + padLeft(action_data.line_nr, 4);
    filename = filename + '_' + action_data.type + '.png';

    if (prefix && typeof _cli[prefix] === 'string') {
        filename = _cli[prefix] + _fs.separator + filename;
    }

    return filename;
};


function getColumnWidths(test_data) {
    var columns = [];

    test_data.actions.forEach(function(action_data) {
        var parts = action_data.parts;
        if (parts.length < 2) return;

        parts.forEach(function(part, column_index) {
            if (!columns[column_index]) columns[column_index] = 0;
            var max = Math.max(columns[column_index], part.length);
            columns[column_index] = max;
        });
    });

    return columns;
}


exports.columnize = function(args, test_data) {
    var result = '';
    var columns = getColumnWidths(test_data);

    columns.forEach(function(col_width, index) {
        var arg = args[index] || '';
        result += padRight(arg, col_width + 4, ' ');
    });

    return result;
};
