'use strict';

exports.create = function(_page) {
    var _keyboard = {};

    var _current_text = '';
    var _remaining = '';
    var _delay = 2;
    var _timeout = null;

    /**
     * Send individual keyboard events for typing text
     * This function is called both as a trigger for the sequence as well as
     * to check if the typing has finished
     */
    _keyboard.type = function(text) {
        if (text !== _current_text) {
            _current_text = text;
            _remaining = text;

            if (_timeout) clearTimeout(_timeout);

            sendKeys();
        }

        // Typing has not finished yet
        if (_remaining.length) {
            return 'Typing <' + _current_text + '> could not be finished.';
        }

        // Typing has finished
        _timeout = null;
        _current_text = null;
        return '';
    };


    function sendKeys() {
        var next_key;

        // Check if the next key is a <SpecialKey>
        var special_keys = /^<([^>]+)>/;
        var matches = _remaining.match(special_keys);

        if (matches && matches.length) {
            var special_key = matches[1];
            _remaining = _remaining.substr(matches[0].length);
            next_key = _page.event.key[special_key];
        } else {
            next_key = _remaining.charAt(0);
            _remaining = _remaining.substr(1);
        }

        _page.sendEvent('keypress', next_key, null, null, 0);

        if (_remaining) {
            _timeout = setTimeout(sendKeys, _delay);
        }
    }

    return _keyboard;
};
