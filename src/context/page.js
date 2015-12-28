/* global jQuery */
'use strict';

var _logger = require('../logger/logger');
var _cli = require('../utils/cli');
var pad = require('../utils/pad').padLeft;
var _fs = require('fs');

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

    _page.createDumpName = function(action_data, prefix) {
        var filename = prefix ? prefix + '--' : '';
        filename += action_data.path.replace(/\.?\//g, '_');
        filename = filename.replace('.scout', '');
        filename = filename + '--' + pad(action_data.line_nr, 4);
        filename = filename + '_' + action_data.type + '.png';

        if (prefix && typeof _cli[prefix] === 'string') {
            filename = _cli[prefix] + _fs.separator + filename;
        }

        return filename;
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
