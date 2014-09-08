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

		if (result.args.length) {
			/*
				Selectors of this form: 
					"Some text"
				will be transformed to this form:
					:textEquals("Some text")
			*/
			var inside_quotes = /^"([^"]+)"$/;
			if (inside_quotes.test(result.args[0])) {
				result.args[0] = ':textEquals(' + result.args[0] + ')';
			}
		}
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
		passed: []
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

	_test_files.push(data);

	stream.close();
}


exports.readTestFiles = function() {
	var testfiles = _cli_args.files.length ? _cli_args.files : [''];
	//console.log(testfiles);
	testfiles.forEach(function(item) {
		read('.', item);
	});

	return _test_files;
};


