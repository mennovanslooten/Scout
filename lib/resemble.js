'use strict';

var _fs         = require('fs');

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


exports.create = function(page) {
	var comparison_message = '';
	var curr_filename = '';

	return {
		compare: function(boundaries, orig_filename) {
			// Paths need to be made absolute, otherwise resemble will try to load them
			// from the wrong directory
			orig_filename = _fs.workingDirectory + _fs.separator + page.getDumpName(orig_filename);

			var temp_filename = page.getDumpName(orig_filename + '-compare');

			if (curr_filename !== orig_filename) {
				// Save original if it doesn't exist already
				var original_exists = _fs.isReadable(orig_filename) && _fs.isFile(orig_filename);

				if (!original_exists) {
					page.dump(orig_filename, boundaries);
				}

				comparison_message = 'Comparison could not be finished for unknown reasons';
				curr_filename = orig_filename;
			}

			if (comparison_message) {
				page.dump(temp_filename, boundaries);

				resemble(temp_filename, orig_filename, function(is_match) {
					if (!is_match) {
						comparison_message = '<' + temp_filename + '> does not resemble <' + orig_filename + '>';
					} else {
						// Comparison matches, remove temporary file
						//_fs.remove(temp_filename);
						comparison_message = '';
					}
				});
			}

			return comparison_message;
		}
	};
};



