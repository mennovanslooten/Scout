var _screendump = require('./screendump');
var _fs = require('fs');

phantom.injectJs('node_modules/resemblejs/resemble.js');


var last_comparison_index = -1;
var comparison_message = null;
var is_comparing = false;

exports.compare = function(boundaries, orig_filename) {
	var temp_filename = orig_filename + '-test';
	var is_first_call = last_comparison_index !== _current_test_file.passed.length;

	if (is_first_call) {
		last_comparison_index = _current_test_file.passed.length;

		// Save original if it doesn't exist already
		var original_exists = _fs.isReadable(orig_filename + '.png') && _fs.isFile(orig_filename + '.png');
		if (!original_exists) {
			_screendump.dump(orig_filename, boundaries);
		}

		comparison_message = 'Comparison could not be finished for unknown reasons';
	}

	if (comparison_message && !is_comparing) {
		_screendump.dump(temp_filename, boundaries);
		is_comparing = true;
		resemble(temp_filename + '.png').compareTo(orig_filename + '.png').ignoreColors().onComplete(function(data){
			is_comparing = false;
			var is_mismatch = data.misMatchPercentage > 0 || !data.isSameDimensions;

			if (is_mismatch) {
				comparison_message = '<' + temp_filename + '.png> does not resemble <' + orig_filename + '.png>';
			} else {
				_fs.remove(temp_filename + '.png');
				comparison_message = '';
			}
		});
	}

	return comparison_message;
};
