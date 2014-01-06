var postfix = '\u001b[0m';


function log() {
	console.log.apply(console, arguments);
}


function prefix() {
	var codes = Array.prototype.join.call(arguments, ';');
	return '\u001b[' + codes + 'm';
}




exports.log = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(32) + message + postfix);
};

exports.error = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(31) + message + postfix);
};

exports.comment = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(34) + message + postfix);
};

exports.info = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(36) + message + postfix);
};

exports.pass = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(30, 42) + message + postfix);
};

exports.fail = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(30, 41) + message + postfix);
};
