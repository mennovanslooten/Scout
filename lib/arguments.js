var _system = require('system');


/**
 * parse the command line for --flags, --params=values and files/directories
 */
exports.parseArguments = function() {

	// Default options
	var options = {
		version: false,
		color: false,
		reformat: false,
		debug: false,
		faildump: false,
		passdump: false,
		timeout: 5000,
		step: 10,
		parallel: 1,
		quiet: 0,
		muted: false,
		files: []
	};


	// The first arg is the path to scout.js
	var args = _system.args.slice(1);
	args.forEach(function(arg) {
		var rx_value = /^--(\w+)=(\w+)$/;
		var rx_bool = /^--(\w+)$/;

		var bool_matches = arg.match(rx_bool);
		var value_matches = arg.match(rx_value);

		if (value_matches && value_matches.length === 3) {
			// Translate --optionName=value args to options.optionName = value;
			// Convert to int if possible
			var num_val = parseInt(value_matches[2], 10);
			options[value_matches[1]] = isNaN(num_val) ? value_matches[2] : num_val;
		} else if (bool_matches && bool_matches.length) {
			// Translate --optionName args to options.optionName = true;
			options[bool_matches[1]] = true;
		} else {
			// Anything else is a file/directory
			options.files.push(arg);
		}
	});

	return options;
};

