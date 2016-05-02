/* global jQuery */
'use strict';

var _console = require('../output/console');
var _cli = require('../utils/cli');

var STATUS_SUCCESS = 'success';
var STATUS_BUSY = 'busy';

exports.create = function(test_data) {
    var _page = require('webpage').create();
    var _load_status = STATUS_SUCCESS;
    var _base_path = test_data.path.substr(0, test_data.path.lastIndexOf('/'));

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
     * Set load status to busy before going back
     */
    _page.back = function() {
        _load_status = STATUS_BUSY;
        _page.goBack();
    };


    /**
     * Set load status to busy before going forward
     */
    _page.forward = function() {
        _load_status = STATUS_BUSY;
        _page.goForward();
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

        _page.evaluate(function() {
            window.localStorage.clear();
        });
    };


    /**
     * Log in-page errors to the command line
     */
    _page.onError = function pageError(msg, args) {
        if (!_cli.debug || !arguments.length) return;
        _console.error('Error on page: ' + msg);
        for (var i = 0; args && i < args.length; i++) {
            //_console.error(' - ', args[i]);
            _console.dir(args[i]);
        }
    };


    /**
     * Log in-page console calls to the command line
     */
    _page.onConsoleMessage = function pageConsoleMessage(message) {
        if (_cli.debug) {
            _console.comment('  // ', message);
        }
    };


    _page.onUrlChanged = function(targetUrl) {
         if (_cli.debug) {
             _console.comment('  ↳ ', targetUrl);
         }
     };


    _page.getURL = function() {
        return _goto_target || _page.evaluate(function() {
            return location.href;
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
                    _console.error('Unable to locate jQuery. Did you run npm install?');
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
