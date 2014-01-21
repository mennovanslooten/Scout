var system = require('system');
var fs = require('fs');

var rx_value = /^--(\w+)=(\w+)$/;
var rx_bool = /^--(\w+)$/;
var options = {
	debug: false,
	faildump: false,
	files: []
};


var args = system.args.slice(1);
args.forEach(function(arg) {
	var bool_matches = arg.match(rx_bool);
	var value_matches = arg.match(rx_value);

	if (value_matches && value_matches.length === 3) {
		// Translate --optionName=value args to options.optionName = value;
		options[value_matches[1]] = value_matches[2];
	} else if (bool_matches && bool_matches.length) {
		// Translate --optionName args to options.optionName = true;
		options[bool_matches[1]] = true;
	} else {
		options.files.push(arg);
		// console.log('FILE/DIR:', arg);
	}
});

exports.parseArguments = function() {
	return options;
};

