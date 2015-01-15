'use strict';

var assert = require('assert');
var sinon = require('sinon');
var timeout = 250;

var page_stub = {
    sendEvent: sinon.spy(),
    event: {
        key: {
            Enter: 1000,
            Up: 1001
        }
    }
};

var keyboard = require('../lib/keyboard').create(page_stub);


function getTyped() {
    return page_stub.sendEvent.args.reduce(function(prev, curr) {
        return prev + curr[1];
    }, '');
}

describe('keyboard', function() {

    describe('#type', function() {
        var chars = 'hello world';
        var special = '<Enter><Up>';

        it('should return not finished', function() {
            var result = keyboard.type(chars);
            assert.equal(result, 'Typing <' + chars + '> could not be finished.');
        });


        it('should have called sendEvent', function() {
            assert.equal(page_stub.sendEvent.called, true);
        });


        it('should have typed all characters', function(done) {
            setTimeout(function() {
                var result = keyboard.type(chars);
                var typed = getTyped();
                page_stub.sendEvent.reset();
                assert.equal(typed, chars);
                assert.equal(result, '');
                done();
            }, timeout);
        });


        it('should have typed special characters', function(done) {
            keyboard.type(special);

            setTimeout(function() {
                var result = keyboard.type(special);
                var typed = getTyped();
                page_stub.sendEvent.reset();
                assert.equal(typed, '10001001');
                assert.equal(result, '');
                done();
            }, timeout);
        });
    });


});


