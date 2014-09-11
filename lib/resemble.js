var _screendump = require('./screendump');
var _fs = require('fs');

var last_comparison_index = -1;
var comparison_message = null;
var is_comparing = false;

exports.compare = function(boundaries, orig_filename) {
	// Paths need to be made absolute, otherwise resemble will try to load them
	// from the wrong directory
	orig_filename = _fs.workingDirectory + _fs.separator + orig_filename;

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

		resemble(temp_filename + '.png', orig_filename + '.png', function(is_match) {
			is_comparing = false;
			if (!is_match) {
				comparison_message = '<' + temp_filename + '.png> does not resemble <' + orig_filename + '.png>';
			} else {
				// Comparison matches, remove temporary file
				_fs.remove(temp_filename + '.png');
				comparison_message = '';
			}
		});
	}

	return comparison_message;
};


function resemble(file1, file2, callback) {
	var images_data = [];

	function compare() {
		if (images_data.length < 2) return;

		var result = true;
		var is_same_dimensions = images_data[0].width === images_data[1].width && images_data[0].height === images_data[1].height;

		if (is_same_dimensions) {
			// Compare the 2 images pixel by pixel. Must be an exact match for now
			for (var i = 0; i < images_data[0].data.length; i++) {
				if (images_data[0].data[i] !== images_data[1].data[i]) {
					result = false;
					break;
				}
			}
		} else {
			result = false;
		}

		callback(result);
	}


	function loadImageData(filename) {
		var image = new Image();

		image.onload = function() {
			var canvas =  document.createElement('canvas');
			var imageData;
			var width = image.width;
			var height = image.height;

			canvas.width = width;
			canvas.height = height;
			canvas.getContext('2d').drawImage(image, 0, 0, width, height);
			imageData = canvas.getContext('2d').getImageData(0, 0, width, height);

			images_data.push(imageData);
			compare();
		};

		// TODO: handle image loading error

		image.src = filename;
	}

	// Experimental: use FileSystem.read() and compare
	//var data1 = _fs.read(file1);
	//var data2 = _fs.read(file2);
	//console.log('fs compare:', data1 === data2);

	loadImageData(file1);
	loadImageData(file2);
}
