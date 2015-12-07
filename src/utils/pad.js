'use strict';

function getPadding(value, width, pad_char) {
    pad_char = pad_char || '0';
    return new Array(width - value.length + 1).join(pad_char);
}


exports.padLeft = function(value, width, pad_char) {
    var result = String(value);
    if (result.length >= width) return result;
    return getPadding(result, width, pad_char) + value;
};


exports.padRight = function(value, width, pad_char) {
    var result = String(value);
    if (result.length >= width) return result;
    return value + getPadding(result, width, pad_char);
};
