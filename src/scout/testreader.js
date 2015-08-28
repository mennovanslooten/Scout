'use strict';

var _test_files = [];
var _fs = require('fs');
var _cli = require('../utils/cli');


// This regular expression is used to separate arguments on a line.
// Current match: at least 2 spaces or at least 1 tab (surrounded by any number
// of spaces).
var separator_rx = / {2,}| *\t+ */g;

function parseLine(line, line_nr, path) {
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
        var parts = line.split(separator_rx);
        result.parts = parts.concat();
        result.type = parts.shift();

        // An action starting with "?" is optional
        var optional = /^\?\s*(.+)/;

        if (result.type.indexOf('@') === 0) {
            var setting = result.type.substr(1);
            parts.unshift(setting);
            result.type = 'set';
        } else if (optional.test(result.type)) {
            result.type = result.type.match(optional)[1];
            result.optional = true;
        }

        result.args = parts;
    }

    return result;
}


function parseTestFile(path, item) {
    var full_path = path + '/' + item;
    var stream = _fs.open(full_path, 'r');
    var data = {
        path: full_path.replace(/^\.\//, ''),
        actions: [],
        lines: [],
        passed: [],
        skipped: [],
        columns: []
    };

    var line_nr = -1;
    while (!stream.atEnd()) {
        line_nr++;
        var line = stream.readLine();
        data.lines.push(line);

        var actions = parseLine(line, line_nr, data.path, item);

        if (!actions) {
            continue;
        } else if (!_cli.reformat && actions.type === 'include') {
            var file = actions.args[0];
            var include_path = full_path.substr(0, full_path.lastIndexOf('/'));
            actions = parseTestFile(include_path, file).actions;
        }

        data.actions = data.actions.concat(actions);
    }

    stream.close();
    return data;
}


/*
 * Store the max width of each column for later formatting use
 */
function calculateColumns(test_file) {
    var columns = [];

    for (var i = 0; i < test_file.actions.length; i++) {
        var parts = test_file.actions[i].parts;
        if (parts.length < 2) continue;

        for (var ii = 0; ii < parts.length; ii++) {
            if (!columns[ii]) columns[ii] = 0;
            var part = parts[ii];
            var max = Math.max(columns[ii], part.length);
            columns[ii] = max;
        }
    }

    test_file.columns = columns;
}


/*
 * Read file/directory item in path
 */
function readFileOrDirectory(path, item) {
    // Remove trailing slash
    var ends_with_slash = path.lastIndexOf('/') === path.length - 1;
    if (ends_with_slash) path = path.substr(0, path.length - 1);

    var full_path = path + '/' + item;
    var is_unreadable = !_fs.isReadable(full_path);
    var is_current_dir = item === '.';
    var is_parent_dir = item === '..';

    if (is_unreadable || is_current_dir || is_parent_dir) return;

    // Tests are files that end on .scout and don't start with an _
    var is_test = _fs.isFile(full_path) && /\.scout$/.test(item) && item.indexOf('_') !== 0;

    if (is_test) {
        // If it's a test read and parse it
        var data = parseTestFile(path, item);
        calculateColumns(data);
        _test_files.push(data);
    } else if (_fs.isDirectory(full_path)) {
        // If it's a directory read its contents
        _fs.list(full_path).forEach(function(item) {
            readFileOrDirectory(full_path, item);
        });
    }
}


/*
 * Read and parse test files specified on the command line
 */
exports.readTestFiles = function() {
    if (_cli.version) return;

    var files = _cli.files.length ? _cli.files : [''];

    files.forEach(function(file_or_directory) {
        readFileOrDirectory('.', file_or_directory);
    });

    return _test_files;
};
