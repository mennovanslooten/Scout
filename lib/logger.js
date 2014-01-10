

function log(message) {
	//var postfix = '\u001b[0m';
	var postfix = '';
	console.log(message + postfix);
	//console.log.apply(console, arguments);
}


function prefix() {
	return '';
	//var codes = Array.prototype.join.call(arguments, ';');
	//return '\u001b[' + codes + 'm';
}




exports.log = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(32) + message);
};

exports.error = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(31) + message);
};

exports.comment = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(34) + message);
};

exports.info = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(36) + message);
};

exports.pass = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(30, 42) + message);
};

exports.fail = function() {
	var message = Array.prototype.join.call(arguments, ' ');
	log(prefix(30, 41) + message);
};
