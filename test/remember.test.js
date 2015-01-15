'use strict';

var assert = require('assert');
var remember = require('../lib/remember');

describe('remember', function() {

    it('should store values with .set()', function() {

        remember.set('foo', 'bar');
        remember.set('hello', 'world');

    });

    it('should retrieve values with .get()', function() {
        assert.equal(remember.get('foo'), 'bar');
        assert.equal(remember.get('hello'), 'world');
    });

    it('should return undefined with .get() for unknown keys', function() {
        var undef;
        assert.equal(remember.get('baz'), undef);
    });

});

