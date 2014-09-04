var _screendump = require('./screendump');
var _fs = require('fs');

//phantom.injectJs('node_modules/resemblejs/resemble.js');


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
	var images = [];

	function compare() {
		if (images.length < 2) return;

		var result = true;
		if (images[0].width === images[1].width && images[0].height === images[1].height) {
			for (var i = 0; i < images[0].data.length; i++) {
				if (images[0].data[i] !== images[1].data[i]) {
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
		var hiddenImage = new Image();

		hiddenImage.onload = function() {
			var hiddenCanvas =  document.createElement('canvas');
			var imageData;
			var width = hiddenImage.width;
			var height = hiddenImage.height;

			hiddenCanvas.width = width;
			hiddenCanvas.height = height;
			hiddenCanvas.getContext('2d').drawImage(hiddenImage, 0, 0, width, height);
			imageData = hiddenCanvas.getContext('2d').getImageData(0, 0, width, height);

			images.push(imageData);
			compare();
		};

		hiddenImage.src = filename;
	}

	// Experimental: use FileSystem.read() and compare
	//var data1 = _fs.read(file1);
	//var data2 = _fs.read(file2);
	//console.log('fs compare:', data1 === data2);

	loadImageData(file1);
	loadImageData(file2);
}
