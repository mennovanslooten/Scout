var _test_files = [];
var system = require('system');
var fs = require('fs');

function createAction(line) {
	var result = {
		type: '',
		args: []
	};

	/*
	for (var key in casper.cli.options) {
		line = line.replace(new RegExp('{' + key + '}', 'g'), casper.cli.options[key]);
	}
	*/

	if (line.indexOf('## ') === 0) {
		result.type = 'log';
		result.args.push(line.substr(3));
	} else {
		var parts = line.split(/\s{2,}/g);
		result.type = parts.shift();
		result.args = parts;
	}

	return result;
}


function read(path, item) {
	var full_path = path + '/' + item;

	if (!fs.isReadable(full_path) || item === '.' || item === '..') return;

	if (fs.isFile(full_path)) {
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
		path: path,
		actions: []
	};

	//console.log('# ' + path);
	while (!stream.atEnd()) {
		var line = stream.readLine();
		var empty = /^\s*$|^#[^#]/;

		var is_empty_or_comment = empty.test(line);
		if (is_empty_or_comment) continue;

		data.actions.push(createAction(line));
		//console.log(' - ' + line);
	}

	_test_files.push(data);

	stream.close();
}


exports.readTestFiles = function() {
	var args = system.args.slice(1);
	var testfiles = args.length ? args : ['demo_tests'];

	testfiles.forEach(function(item) {
		read('.', item);
	});

	return _test_files;
};


