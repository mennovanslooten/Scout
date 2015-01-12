'use strict';

var _cli = require('./arguments');
var _remember = require('./remember');

exports.parseLine = function(line, line_nr, path) {
	var result = {
		type: '',
		args: [],
		parts: [],
		// We store the line_nr and path for each action for logging purposes
		line_nr: line_nr,
		path: path,
		optional: false
	};

	for (var name in _cli) {
		if (_cli.hasOwnProperty(name)) {
			var value = _cli[name];
			line = line.replace('{' + name + '}', value);
		}
	}

	// Empty lines and lines starting with # are ignored
	var ignore = /^\s*$|^#[^#]/;

	// A line starting with "##" is logged
	var log = /^##\s*(.+)/;

	if (ignore.test(line)) {
		return null;
	} else if (log.test(line)) {
		result.type = 'log';
		result.args.push(line.match(log)[1]);
	} else {
		var parts = line.split(/\s{2,}/g);
		result.parts = parts.concat();
		result.type = parts.shift();

		// An action starting with "?" is optional
		var optional = /^\?\s*(.+)/;
		if (optional.test(result.type)) {
			result.type = result.type.match(optional)[1];
			result.optional = true;
		}

		result.args = parts;
	}

	return result;
};


exports.parseArguments = function(args) {
	return args.map(function(arg) {
		var random        = /{{(\d+)}}/g;
		var variable      = /{([a-z_]+)}/g;
		var result;

		if (random.test(arg)) {
			// Strings of this form:
			// {{number}}
			// will be replaced with a random string of length number
			var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.0123456789'.split('');
			result = arg.replace(random, function(match, length) {
				length = parseInt(length, 10);
				var generated = '';
				for (var i = 0; i < length; i++) {
					generated += chars[Math.floor(Math.random() * chars.length)];
				}
				return generated;
			});
			return result;

		} else if (variable.test(arg)) {
			// Strings of this form:
			// {variable_name}
			// will be replaced with the value of _remember.get(variable_name)
			// if it exists
			result = arg.replace(variable, function(match, variable_name) {
				return _remember.get(variable_name) || variable_name;
			});
			return result;
		}

		return arg;
	});
};
