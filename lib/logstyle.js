'use strict';

// http://misc.flogisoft.com/bash/tip_colors_and_formatting
var _cli = require('./arguments');

var postfix = '\u001b[0m';
var prefix = '\u001b[';

var fg_codes = {
    default: 39,
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    lightgray: 37,
    darkgray: 90,
    lightred: 91,
    lightgreen: 92,
    lightyellow: 93,
    lightblue: 94,
    lightmagenta: 95,
    lightcyan: 96,
    white: 97
};


var bg_codes = {
    default: 49,
    black: 40,
    red: 41,
    green: 42,
    yellow: 43,
    blue: 44,
    magenta: 45,
    cyan: 46,
    lightgray: 47,
    darkgray: 100,
    lightred: 101,
    lightgreen: 102,
    lightyellow: 103,
    lightblue: 104,
    lightmagenta: 105,
    lightcyan: 106,
    white: 107
};

var format_codes = {
    inverted: 7,
    bold: 1
};


function getFormatter(codes, code) {
    return function() {
        var args = arguments;
        if (arguments.length === 1 && typeof arguments[0] === 'object') {
            args = arguments[0];
        }
        var text = [].join.call(args, ' ');

        return (_cli.color) ? (prefix + codes[code] + 'm' + text + postfix) : text;
    };
}


exports.fg = {};
exports.bg = {};

for (var fg in fg_codes) {
    if (fg_codes.hasOwnProperty(fg)) {
        exports.fg[fg] = getFormatter(fg_codes, fg);
    }
}

for (var bg in bg_codes) {
    if (bg_codes.hasOwnProperty(bg)) {
        exports.bg[bg] = getFormatter(bg_codes, bg);
    }
}

for (var format in format_codes) {
    if (format_codes.hasOwnProperty(format)) {
        exports[format] = getFormatter(format_codes, format);
    }
}
