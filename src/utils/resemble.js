'use strict';

var _fs  = require('fs');
var _cli = require('./cli');

function resemble(file1, file2, callback) {
    var images_data = [];

    function compare() {
        if (images_data.length < 2) return;

        var match_perc = 0;
        var diff_px = 0;

        var img_0 = images_data[0];
        var img_1 = images_data[1];

        var is_same_width = img_0.width === img_1.width;
        var is_same_height = img_0.height === img_1.height;
        var is_same_dimensions = is_same_width && is_same_height;

        if (is_same_dimensions) {
            // Compare the 2 images pixel by pixel. Must be an exact match for now
            var data_0 = img_0.data;
            var data_1 = img_1.data;

            for (var i = 0; i < data_0.length; i += 4) {
                if (data_0[i] === data_1[i] &&             // red
                        data_0[i + 1] === data_1[i + 1] && // green
                        data_0[i + 2] === data_1[i + 2] && // blue
                        data_0[i + 3] === data_1[i + 3]) { // alpha
                    continue;
                }

                diff_px++;
            }

            var total_px = img_0.width * img_0.height;
            match_perc = (total_px - diff_px) / total_px * 100;
        }

        callback(match_perc);
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

    loadImageData(file1);
    loadImageData(file2);
}


exports.create = function(page) {
    var comparison_message = '';
    var curr_filename = '';

    return {
        compare: function(boundaries, orig_filename, min_perc) {
            var temp_filename = page.getDumpName(orig_filename + '-compare');

            // Paths need to be made absolute, otherwise resemble will try to load them
            // from the wrong directory
            var orig_path = _fs.workingDirectory + _fs.separator + page.getDumpName(orig_filename);
            var temp_path = _fs.workingDirectory + _fs.separator + page.getDumpName(temp_filename);


            if (curr_filename !== orig_path) {
                // Save original if it doesn't exist already
                var original_exists = _fs.isReadable(orig_path) && _fs.isFile(orig_path);

                // Force new resemble dumps
                if (original_exists && _cli.newdumps) {
                    _fs.remove(orig_path);
                    original_exists = false;
                }

                if (!original_exists) {
                    page.dump(orig_path, boundaries);
                }

                comparison_message = 'Comparison could not be finished for unknown reasons';
                curr_filename = orig_path;
            }

            if (comparison_message) {
                page.dump(temp_path, boundaries);

                resemble(temp_path, orig_path, function(match_perc) {
                    if (match_perc < min_perc) {
                        comparison_message = '<' + temp_filename + '> does not resemble <' + orig_filename + '>';
                        comparison_message += ' (' + match_perc + '% match)';
                    } else {
                        // Comparison matches, remove temporary file
                        _fs.remove(temp_path);
                        comparison_message = '';
                    }
                });
            }

            return comparison_message;
        }
    };
};
