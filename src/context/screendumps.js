/* global jQuery */
'use strict';

var _cli = require('../utils/cli');
var _hub = require('../core/hub');
var _db = require('../data/db');
var _fs = require('fs');
var resemble = require('../utils/resemble').resemble;

var _ignore_list = ['log', 'set', 'htmldump', 'screendump', 'mockRequest', 'unmockRequest'];
var _comparison_message = '';
var _curr_filename = '';


exports.create = function(page) {

    function failDump(action_data) {
        if (_cli.faildump) {
            var filename = page.createDumpName(action_data, 'faildump');
            dump(filename, null, action_data);
        }
    }


    function passDump(action_data) {
        var ignore = _ignore_list.indexOf(action_data.type) > -1;
        if (_cli.passdump && !ignore) {
            var filename = page.createDumpName(action_data, 'passdump');
            dump(filename, null, action_data);
        }
    }


    function dumpAction(action_data) {
        if (_db.isPassedAction(action_data)) {
            passDump(action_data);
        } else if (_db.isFailedAction(action_data)) {
            failDump(action_data);
        }
    }


    /**
     * Adds .png to a screendump filename if it's not already there
     */
    function addPNG(name) {
        if (!(/\.png$/.test(name))) {
            return name + '.png';
        }

        return name;
    }


    /**
     * Creates a <div> with the action data for use in screendumps
     */
    function displayActionData(action_data) {
        if (!_cli.debug) return;

        page.evaluate(function(action_data) {
            var $action_data = jQuery('<div id="scout_action_data"/>');
            // Needed because https://github.com/ariya/phantomjs/issues/10619
            var top = jQuery(window).scrollTop() + jQuery(window).height() - 16;
            $action_data.css({
                background: 'black',
                color: 'white',
                opacity: 0.75,
                font: '14px/16px monospace',
                position: 'fixed',
                right: 0,
                top: top,
                zIndex: 1000
            });
            // \xa0 is a non-breaking space
            $action_data.text(action_data.parts.join('\xa0\xa0\xa0\xa0'));
            $action_data.prependTo('body');
        }, action_data);
    }


    /**
     * Creates a <div> with the action data for use in screendumps
     */
    function hideActionData() {
        page.evaluate(function() {
            jQuery('#scout_action_data').remove();
        });
    }


    function dump(title, boundaries, action_data) {
        page.clipRect = boundaries ? boundaries : {
            top: page.scrollPosition.top,
            left: page.scrollPosition.left,
            width: page.viewportSize.width,
            height: page.viewportSize.height
        };

        title = addPNG(title);

        if (action_data) {
            displayActionData(action_data);
        }

        page.render(title);
        hideActionData();
    }


    function compare(boundaries, orig_filename, min_perc) {
        var temp_filename = addPNG(orig_filename + '-compare');

        // Paths need to be made absolute, otherwise resemble will try to load them
        // from the wrong directory
        var orig_path = _fs.workingDirectory + _fs.separator + addPNG(orig_filename);
        var temp_path = _fs.workingDirectory + _fs.separator + addPNG(temp_filename);


        if (_curr_filename !== orig_path) {
            // Save original if it doesn't exist already
            var original_exists = _fs.isReadable(orig_path) && _fs.isFile(orig_path);

            // Force new resemble dumps
            if (original_exists && _cli.newdumps) {
                _fs.remove(orig_path);
                original_exists = false;
            }

            if (!original_exists) {
                dump(orig_path, boundaries);
            }

            _comparison_message = 'Comparison could not be finished for unknown reasons';
            _curr_filename = orig_path;
        }

        if (_comparison_message) {
            dump(temp_path, boundaries);

            resemble(temp_path, orig_path, function(match_perc) {
                if (match_perc < min_perc) {
                    _comparison_message = '<' + temp_filename + '> does not resemble <' + orig_filename + '>';
                    _comparison_message += ' (' + match_perc + '% match)';
                } else {
                    // Comparison matches, remove temporary file
                    _fs.remove(temp_path);
                    _comparison_message = '';
                }
            });
        }

        return _comparison_message;
    }


    var id = _hub.subscribe('action.done', dumpAction);

    page.onClosing = function() {
        _hub.unsubscribe(id);
    };


    return {
        dump: dump,
        compare: compare
    };

};
