'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('logstyle', function() {

    var s = 'Hello, world';


    describe('--color=false', function() {
        var logstyle = proxyquire('../lib/logstyle', {
            './arguments': {
                color: false
            }
        });

        it('should return the same string when color is false', function() {
            var result = logstyle.fg.black(s);
            assert.equal(result, s);

            result = logstyle.bg.red(s);
            assert.equal(result, s);
        });
    });


    describe('--color=true', function() {

        var logstyle = proxyquire('../lib/logstyle', {
            './arguments': {
                color: true
            }
        });

        it('should return a formatted string when color is true', function() {
            var result = logstyle.fg.black(s);
            assert.equal(result, '\u001b[30m' + s + '\u001b[0m');

            result = logstyle.bg.red(s);
            assert.equal(result, '\u001b[41m' + s + '\u001b[0m');
        });

    });

});



