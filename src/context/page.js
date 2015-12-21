/* global jQuery */
'use strict';

var _logger = require('../logger/logger');
var _cli = require('../utils/cli');

var STATUS_SUCCESS = 'success';
var STATUS_BUSY = 'busy';

exports.create = function(test_path) {
    var _page = require('webpage').create();
    var _load_status = STATUS_SUCCESS;
    var _base_path = test_path.substr(0, test_path.lastIndexOf('/'));

    _page.customHeaders = {
        'Accept-Language': 'en-US'
    };

    var _goto_target = '';


    _page.isReady = function() {
        return _load_status === STATUS_SUCCESS;
    };

    _page.goto = function(url) {
        if (_goto_target !== url) {
            _load_status = STATUS_BUSY;
            _goto_target = url;

            if (url.indexOf('./') === 0) {
                url = _base_path + url.substr(1);
            }

            _page.open(url);
            return 'Error opening <' + url + '>';
        } else if (_load_status === 'success') {
            _goto_target = '';
            return '';
        }
        return 'Could not complete opening <' + url + '>';
    };


    /**
     * PhantomJS page settings.
     * See: http://phantomjs.org/api/webpage/property/settings.html
     */
    _page.set = function(name, value) {
        _page.settings[name] = value;
    };


    /**
     * Page load finished
     */
    _page.onLoadFinished = function pageLoadFinished(status) {
        _load_status = status;
        if (status === STATUS_SUCCESS) setupPage();
    };


    /**
     * Page load started
     */
    _page.onLoadStarted = function pageLoadStarted() {
        _load_status = STATUS_BUSY;
        _page.scrollPosition = {
            top: 0,
            left: 0
        };
    };


    /**
     * Clear localStorage before pages are loaded
     */
    _page.onInitialized = function initialized() {
        if (!_page.isReady() || _page.url === 'about:blank') return;

        console.log('onInitialized', _page.url, 'XXX', _load_status, _goto_target);
        _page.evaluate(function() {
            window.localStorage.clear();
        });
    };


    /**
     * Log in-page errors to the command line
     */
    _page.onError = function pageError(msg, args) {
        if (!_cli.debug || !arguments.length) return;
        _logger.error('Error on page: ' + msg);
        for (var i = 0; args && i < args.length; i++) {
            //_logger.error(' - ', args[i]);
            _logger.dir(args[i]);
        }
    };


    /**
     * Log in-page console calls to the command line
     */
    _page.onConsoleMessage = function pageConsoleMessage(message) {
        if (_cli.debug) {
            _logger.comment('  // ', message);
        }
    };


    _page.onUrlChanged = function(targetUrl) {
         if (_cli.debug) {
             _logger.comment('  ↳ ', targetUrl);
         }
     };


    _page.getURL = function() {
        return _page.evaluate(function() {
            return location.href;
        });
    };


    /**
     * Adds .png to a screendump filename if it's not already there
     */
    _page.getDumpName = function(name) {
        if (!(/\.png$/.test(name))) {
            return name + '.png';
        }

        return name;
    };


    /**
     * Dumps the current viewport to .png
     */
    _page.dump = function(title, boundaries, action_data) {
        _page.clipRect = boundaries ? boundaries : {
            top: _page.scrollPosition.top,
            left: _page.scrollPosition.left,
            width: _page.viewportSize.width,
            height: _page.viewportSize.height
        };

        title = _page.getDumpName(title);

        if (action_data) {
            _page.displayActionData(action_data);
        }

        _page.render(title);
        _page.hideActionData();
    };


    /**
     * Creates a <div> with the action data for use in screendumps
     */
    _page.displayActionData = function(action_data) {
        if (!_cli.debug) return;

        _page.evaluate(function(action_data) {
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
    };


    /**
     * Creates a <div> with the action data for use in screendumps
     */
    _page.hideActionData = function() {
        _page.evaluate(function() {
            jQuery('#scout_action_data').remove();
        });
    };


    /**
     * Check if jQuery is loaded on the page, if not: load it
     * Then load the Scout jQuery assertions and utilities
     */
    function setupPage() {
        var has_jquery = _page.evaluate(function() {
            try {
                jQuery.isFunction(jQuery);
                return true;
            } catch (ex) {
                return false;
            }
        });

        if (!has_jquery) {
            if (!_page.injectJs('../node_modules/jquery/dist/jquery.js')) {
                if (!_page.injectJs('../../../node_modules/jquery/dist/jquery.js')) {
                    _logger.error('Unable to locate jQuery. Did you run npm install?');
                    phantom.exit(1);
                }
            }

            _page.evaluate(function() {
                jQuery.noConflict();
            });
        }

        _page.injectJs('./context/client.js');

        // PhantomJS default bg color is transparent
        // This makes for strange screenshots
        _page.evaluate(function() {
            document.body.bgColor = 'white';
        });
    }

    return _page;
};
