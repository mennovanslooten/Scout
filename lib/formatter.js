'use strict';

//var fs = require('fs');

exports.reformat = function(test_file) {
	var formatted = '';
	for (var i = 0; i < test_file.lines.length; i++) {
		var line = test_file.lines[i];
		var parts = line.split(/\s{2,}/g);

		if (parts.length < 2) {
			formatted += parts.join('');
		} else {
			for (var ii = 0; ii < parts.length; ii++) {
				var w = test_file.columns[ii];
				var part = parts[ii];
				formatted += part;

				if (ii < parts.length - 1) {
					var whitespace = new Array(w - part.length + 5).join(' ');
					formatted += whitespace;
				}
			}
		}

		formatted += '\n';
	}

	console.log(formatted);


	// First, make a backup of the file being formatted
	//var backup_path = '.' + test_file.path;
	//fs.remove(backup_path);
	//fs.copy(test_file.path, backup_path);

	// Then remove the old file and save the formatted text with the same name
	//fs.remove(test_file.path);
	//fs.touch(test_file.path);
	//fs.write(test_file.path, formatted, 'r');
};
