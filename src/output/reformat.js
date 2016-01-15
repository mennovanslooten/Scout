'use strict';

var columnize = require('../utils/strings').columnize;

exports.reformat = function(suite_data) {
    suite_data.tests.forEach(function(test_data) {
        var last_line_nr = 0;

        test_data.actions.forEach(function(action) {
            var out = '';

            // Add empty lines
            var newlines = action.line_nr - last_line_nr;
            if (newlines > 1) {
                out += new Array(newlines).join('\n');
            }
            last_line_nr = action.line_nr;

            if (action.type === 'log') {
                out += '## ' + action.args.join(' ');
            } else {
                var args = [action.type].concat(action.args);
                out += columnize(args, test_data);
            }

            // Remove trailing whitespace
            out = out.replace(/\s+$/, '');
            console.log(out);
        });
    });
};
