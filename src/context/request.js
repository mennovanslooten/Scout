'use strict';

var _logger = require('../logger/logger');
var _cli = require('../utils/cli');
var _fs = require('fs');

exports.create = function(_page, test_data) {
    var base_path = test_data.path.substr(0, test_data.path.lastIndexOf('/'));
    var mocks = [];

    _page.onResourceRequested = function(requestData, networkRequest) {
        var url = requestData.url;
        mocks.forEach(function(mock) {
            if (mock.matches(url)) {
                var path = _fs.absolute(base_path + _fs.separator + mock.path);
                networkRequest.changeUrl('file://' + path);
                if (_cli.debug) {
                    _logger.comment('Network request to <' + url + '> mocked with <' + path + '>');
                }
                return false;
            }
        });
    };


    return {
        getMocks: function() {
            return mocks;
        },

        addMock: function(pattern, path) {
            try {
                var parsed = new RegExp(pattern);
                mocks.push({
                    pattern: pattern,
                    path: path,
                    matches: function(url) {
                        return parsed.test(url);
                    }
                });
                return '';
            } catch (ex) {
                return '<' + pattern + '> is not a valid regular expression';
            }
        },

        removeMock: function(pattern, path) {
            switch (arguments.length) {
                case 0:
                    mocks.length = 0;
                    break;
                case 1:
                    mocks = mocks.filter(function(mock) {
                        var match = mock.pattern === pattern;
                        return !match;
                    });
                    break;
                case 2:
                    mocks = mocks.filter(function(mock) {
                        var match = mock.pattern === pattern && mock.path === path;
                        return !match;
                    });
                    break;
            }
            return '';
        }
    };
};
