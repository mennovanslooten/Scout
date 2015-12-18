var _cli = require('../utils/cli');


// This regular expression is used to separate arguments on a line.
// Current match: at least 2 spaces or at least 1 tab (surrounded by any number
// of spaces).
var separator_rx = / *\t+ *| {2,}/g;
var user_action_types = ['include', 'click', 'moveMouseTo', 'type', 'open', 'uploadFile', 'back', 'forward'];


function replaceCLIArguments(line) {
    for (var name in _cli) {
        if (_cli.hasOwnProperty(name)) {
            var value = _cli[name];
            line = line.replace('{' + name + '}', value);
        }
    }

    return line;
}


exports.create = function(line, line_nr, path) {
    var action_data = {
        type: '',
        args: [],
        parts: [],
        // We store the line_nr and path for each action for logging purposes
        line_nr: line_nr,
        path: path,
        optional: false
    };

    line = replaceCLIArguments(line);

    // Empty lines and lines starting with # are ignored
    var ignore = /^\s*$|^#[^#]/;

    // A line starting with "##" is logged
    var log = /^##\s*(.+)/;

    if (ignore.test(line)) {
        return null;
    } else if (log.test(line)) {
        action_data.type = 'log';
        action_data.args.push(line.match(log)[1]);
    } else {
        var parts = line.split(separator_rx);
        action_data.parts = parts.concat();
        action_data.type = parts.shift();

        // An action starting with "?" is optional
        var optional = /^\?\s*(.+)/;

        if (action_data.type.indexOf('@') === 0) {
            var setting = action_data.type.substr(1);
            parts.unshift(setting);
            action_data.type = 'set';
        } else if (optional.test(action_data.type)) {
            action_data.type = action_data.type.match(optional)[1];
            action_data.optional = true;
        }

        action_data.args = parts;
    }

    var is_user_action = user_action_types.indexOf(action_data.type) > -1;
    action_data.user_action = is_user_action;

    return action_data;

};
