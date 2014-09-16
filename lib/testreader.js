var _test_files = [];
var fs = require('fs');

function createAction(line) {
	var result = {
		type: '',
		args: [],
		parts: []
	};

	for (var name in _cli_args) {
		var value = _cli_args[name];
		line = line.replace('{' + name + '}', value);
	}

	if (line.indexOf('## ') === 0) {
		result.type = 'log';
		result.args.push(line.substr(3));
	} else {
		var parts = line.split(/\s{2,}/g);
		result.parts = parts.concat();
		result.type = parts.shift();
		result.args = parts;
	}

	return result;
}


function read(path, item) {
	// Remove trailing slash
	var ends_with_slash = path.lastIndexOf('/') === path.length - 1;
	if (ends_with_slash) path = path.substr(0, path.length - 1);

	var full_path = path + '/' + item;

	if (!fs.isReadable(full_path) || item === '.' || item === '..') return;

	if (fs.isFile(full_path) && /\.dummy$/.test(full_path)) {
		readFile(full_path);
	} else if (fs.isDirectory(full_path)) {
		fs.list(full_path).forEach(function(item) {
			read(full_path, item);
		});
	}
}


function readFile(path) {
	var stream = fs.open(path, 'r');
	var data = {
		path: path.replace(/^\.\//, ''),
		actions: [],
		lines: [],
		passed: [],
		columns: []
	};

	var lines = [];

	while (!stream.atEnd()) {
		var line = stream.readLine();
		data.lines.push(line);
		var empty = /^\s*$|^#[^#]/;

		var is_empty_or_comment = empty.test(line);
		if (is_empty_or_comment) continue;

		data.actions.push(createAction(line));
	}

	addFormatting(data);

	_test_files.push(data);
	stream.close();
}


function addFormatting(test_file) {
	var columns = [];

	// first check the max width of each column
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
	return;

	// then print
	for (var i = 0; i < test_file.lines.length; i++ ) {
		var formatted = '';
		var line = test_file.lines[i];
		var parts = line.split(/\s{2,}/g);

		if (parts.length < 2) {
			formatted += parts.join('');
		} else {
			for (var ii = 0; ii < parts.length; ii++) {
				var w = columns[ii];
				var part = parts[ii];
				formatted += part;

				if (ii < parts.length - 1) {
					var whitespace = new Array(w - part.length + 5).join(' ');
					formatted += whitespace;
				}
			}
		}

		console.log(formatted);
		line.formatted = formatted;
	}
}

exports.readTestFiles = function() {
	var testfiles = _cli_args.files.length ? _cli_args.files : [''];
	//console.log(testfiles);
	testfiles.forEach(function(item) {
		read('.', item);
	});

	return _test_files;
};


