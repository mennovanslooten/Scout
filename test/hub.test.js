'use strict';

var assert = require('assert');
var hub = require('../src/core/hub');
var sinon = require('sinon');

describe('hub', function() {
    var sub_1_1 = sinon.stub();
    var sub_1_2 = sinon.stub();
    var sub_2_1 = sinon.stub();
    var sub_2_2 = sinon.stub();

    var id_1_1 = hub.subscribe('topic_1', sub_1_1);
    var id_1_2 = hub.subscribe('topic_1', sub_1_2);

    var id_2_1 = hub.subscribe('topic_2', sub_2_1);
    var id_2_2 = hub.subscribe('topic_2', sub_2_2);

    beforeEach(function reset() {
        sub_1_1.reset();
        sub_1_2.reset();
        sub_2_1.reset();
        sub_2_2.reset();
    });

    it('should return unique subscribe ids', function() {
        assert.notEqual(id_1_1, id_1_2);
        assert.notEqual(id_2_1, id_2_2);
    });


    it('should only call subscribed functions on publish', function() {
        hub.publish('topic_1', 'one', 1, true);
        assert.strictEqual(sub_1_1.callCount, 1);
        assert.strictEqual(sub_1_2.callCount, 1);
        assert.strictEqual(sub_2_1.callCount, 0);
        assert.strictEqual(sub_2_2.callCount, 0);
    });


    it('should call subscribed functions with publish arguments', function() {
        hub.publish('topic_1', 'two', 2, false);
        assert(sub_1_1.calledWith('two', 2, false));
        assert(sub_1_2.calledWith('two', 2, false));
    });


    it('should call subscribed functions when other subscribers trow', function() {
        sub_1_1.throws('Fffffff');
        hub.publish('topic_1', 'three', 3, false);
        assert(sub_1_2.calledWith('three', 3, false));
    });


    it('should not call unsubscribed functions on publish', function() {
        var is_unsubscribed = hub.unsubscribe(id_1_2);
        assert.strictEqual(is_unsubscribed, true);

        hub.publish('topic_1', 'one', 2, true);
        assert.strictEqual(sub_1_1.callCount, 1);
        assert.strictEqual(sub_1_2.callCount, 0);
    });

});
