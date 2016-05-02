'use strict';

var _cli = require('./cli');
var _remember = require('./remember');


function generateRandomString(length, chars) {
    chars = chars || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.0123456789'.split('');
    length = parseInt(length, 10);
    var generated = '';
    for (var i = 0; i < length; i++) {
        generated += chars[Math.floor(Math.random() * chars.length)];
    }
    return generated;
}


exports.parseArgument = function(arg) {
    var result;
    var variable = /{([a-z_]+)}/g;
    var generator = /{{([^}]+)}}/g;

    if (generator.test(arg)) {
        result = arg.replace(generator, function(whatever, match) {
            var props = match.split(':');
            var variable_name = '';
            var length = 0;
            var chars = '';

            props.forEach(function(prop) {
                if (/^[a-z_]+$/.test(prop)) {
                    variable_name = prop;
                } else if (/^\d+$/.test(prop)) {
                    length = parseInt(prop, 10);
                } else if (/^".+"$/.test(prop)) {
                    chars = prop.substring(1, prop.length - 1);
                }
            });

            if (!length) {
                return match;
            }

            var random = generateRandomString(length, chars);
            if (variable_name) {
                _remember.set(variable_name, random);
            }
            return random;
        });

        return result;
    }

    if (variable.test(arg)) {
        // Strings of this form:
        // {variable_name}
        // will be replaced with the value of _remember.get(variable_name)
        // if it exists
        result = arg.replace(variable, function(match, variable_name) {
            return _remember.get(variable_name) || _cli[variable_name] || variable_name;
        });
        return result;
    }

    return arg;
};
