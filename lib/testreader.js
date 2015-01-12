var _test_files = [];
var _fs          = require('fs');
var _parser      = require('./testparser');
var _cli = require('./arguments').parseArguments();

/*
 * Read and parse test files specified on the command line
 */
exports.readTestFiles = function() {
	var files = _cli.files.length ? _cli.files : [''];

	files.forEach(function(file_or_directory) {
		readFileOrDirectory('.', file_or_directory);
	});

	return _test_files;
};


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
		addFormatting(data);
		_test_files.push(data);
	} else if (_fs.isDirectory(full_path)) {
		// If it's a directory read its contents
		_fs.list(full_path).forEach(function(item) {
			readFileOrDirectory(full_path, item);
		});
	}
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

		var actions = _parser.parseLine(line, line_nr, data.path, item);

		if (!actions) {
			continue;
		} else if (!_cli.reformat && actions.type === 'include') {
			var file = actions.args[0];
			var include_path = full_path.substr(0, full_path.lastIndexOf('/'));
			var actions = parseTestFile(include_path, file).actions;
		}

		data.actions = data.actions.concat(actions);
	}

	stream.close();
	return data;
}


/*
 * Store the max width of each column for later formatting use
 */
function addFormatting(test_file) {
	var columns = [];

	for (var i = 0; i < test_file.lines.length; i++ ) {
		var line = test_file.lines[i];
		var parts = line.split(/\s{2,}/g);
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

