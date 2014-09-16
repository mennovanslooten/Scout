var _is_muted = false;

function log(message) {
	if (_is_muted) return;
	if (_cli_args.color) {
		var postfix = '\u001b[0m';
		var codes = [].slice.call(arguments, 1);
		console.log(prefix.apply(this, codes) + message + postfix);
	} else {
		console.log(message);
	}
}


function prefix() {
	var codes = Array.prototype.join.call(arguments, ';');
	return '\u001b[' + codes + 'm';
}




exports.mute = function(is_muted) {
	_is_muted = is_muted;
};


exports.title = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	_logger.comment('\n################################################################');
	_logger.comment('# ' + message);
	_logger.comment('################################################################');
};

exports.log = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(message, 32);
};

exports.error = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(message, 31);
};

exports.comment = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(message, 34);
};

exports.info = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(message, 36);
};

exports.pass = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	//log(message, 30, 42);
	log(message, 32, 1);
};

exports.fail = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	//log(message, 30, 41);
	log(message, 31, 1);
};


exports.format = function(args, columns) {
	var result = '';
	args.forEach(function(item, index) {
		result += item;
		var length = columns[index] + 4;
		if (item.length < length) {
			result += new Array(length - item.length).join(' ');
		//} else {
			//result += '    ';
		}
	});
	return result;
};
