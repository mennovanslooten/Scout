var _test_files = [];
var fs = require('fs');

// Read and parse test files specified on the command line
exports.readTestFiles = function() {
	var files = _cli_args.files.length ? _cli_args.files : [''];

	files.forEach(function(file_or_directory) {
		readFileOrDirectory('.', file_or_directory);
	});

	return _test_files;
};


function readFileOrDirectory(path, item) {
	// Remove trailing slash
	var ends_with_slash = path.lastIndexOf('/') === path.length - 1;
	if (ends_with_slash) path = path.substr(0, path.length - 1);

	var full_path = path + '/' + item;
	var is_unreadable = !fs.isReadable(full_path);
	var is_current_dir = item === '.';
	var is_parent_dir = item === '..';

	if (is_unreadable || is_current_dir || is_parent_dir) return;

	var is_test = fs.isFile(full_path) && /\.dummy$/.test(item) && item.indexOf('_') !== 0;

	if (is_test) {
		var data = readTestFile(path, item);
		addFormatting(data);
		_test_files.push(data);
	} else if (fs.isDirectory(full_path)) {
		fs.list(full_path).forEach(function(item) {
			readFileOrDirectory(full_path, item);
		});
	}
}


function readTestFile(path, item) {
	var full_path = path + '/' + item;
	var stream = fs.open(full_path, 'r');
	var data = {
		path: full_path.replace(/^\.\//, ''),
		actions: [],
		lines: [],
		passed: [],
		columns: []
	};

	while (!stream.atEnd()) {
		var line = stream.readLine();
		data.lines.push(line);

		var ignore = /^\s*$|^#[^#]/;
		var is_empty_or_comment = ignore.test(line);

		if (is_empty_or_comment) continue;

		var actions = parseLine(line, path, item);

		data.actions = data.actions.concat(actions);
	}

	stream.close();
	return data;
}


function parseLine(line, path, item) {
	var result = {
		type: '',
		args: [],
		parts: [],
		optional: false
	};

	for (var name in _cli_args) {
		var value = _cli_args[name];
		line = line.replace('{' + name + '}', value);
	}

	// A line starting with "##" is logged
	var log = /^##\s*(.+)/;
	var include = /^include\s*(.+)/;
	if (log.test(line)) {
		result.type = 'log';
		result.args.push(line.match(log)[1]);
	} else if (include.test(line)) {
		var file = line.match(include)[1];
		var data = readTestFile(path, file);
		return data.actions;
	} else {
		var parts = line.split(/\s{2,}/g);
		result.parts = parts.concat();
		result.type = parts.shift();

		// An action starting with "?" is optional
		var optional = /^\?\s*(.+)/;
		if (optional.test(result.type)) {
			result.type = result.type.match(optional)[1];
			result.optional = true;
		}

		result.args = parts;
	}

	return [result];
}


// For each test file the max width of columns is remembered
// which is used for formatting the output
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

