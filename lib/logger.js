/*
for (var i = 0; i < 53; i++) {
	var postfix = '\u001b[0m';
	console.log(prefix(i) + 'this is FG' + i + ' ' + postfix);
}
*/

function log(message) {
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
