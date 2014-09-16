var _current = '';
var _remaining = '';
var _delay = 10;

exports.type = function(text) {
	if (text !== _current) {
		// new typing assignment
		_current = text;
		_remaining = text;
		sendKeys();
	}

	if (_remaining.length) {
		//sendNextKey();
		return 'Typing could not be finished.';
	}

	return '';
};


function sendKeys() {
	// Check if the next key is a <SpecialKey>
	var special_keys = /^<([^>]+)>/;
	var matches = _remaining.match(special_keys);
	var key;
	if (matches && matches.length) {
		var special_key = matches[1];
		_remaining = _remaining.substr(matches[0].length);
		key = _page.event.key[special_key];
	} else {
		key = _remaining.charAt(0);
		_remaining = _remaining.substr(1);
	}

	_page.sendEvent('keypress', key, null, null, 0);

	if (_remaining) {
		setTimeout(sendKeys, _delay);
	}
};
