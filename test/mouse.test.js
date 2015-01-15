'use strict';

var assert = require('assert');
var sinon = require('sinon');
var proxyquire =  require('proxyquire').noPreserveCache().noCallThru();

var page_stub = {
	evaluate: sinon.stub(),
	scrollPosition: {
		top: 100,
		left: 100
	},
	sendEvent: sinon.stub(),
	viewportSize: {
		height: 800,
		width: 600
	}
};

var mouse = proxyquire('../lib/mouse', {
	'./arguments': {
		timeout: 1,
		delay: 1
	}
}).create(page_stub);


describe('mouse', function() {

	describe('reset', function() {

		it('should reset page.scrollPosition', function() {
			var base = {
				top: 0,
				left: 0
			};

			page_stub.evaluate.returns(base);
			mouse.reset();

			assert.deepEqual(page_stub.scrollPosition, base);
		});

	});


	describe('sendEvent', function() {
		var base = {
			height: 1200,
			width: 600
		};

		page_stub.evaluate.returns(base);


		var moveTo = sinon.spy(mouse, 'moveTo');
		it('should call mouse.moveTo', function() {
			mouse.sendEvent('click', 1000, 2000);
			assert.equal(moveTo.calledWith(1000, 2000), true);
		});

		it('should return false when not hovering', function() {
			var result = mouse.sendEvent('click', 1000, 2000);
			assert.equal(result, false);
		});

		it('should return true when hovering', function(done) {
			setTimeout(function() {
				var result = mouse.sendEvent('click', 1000, 2000);
				assert.equal(result, true);
				done();
			}, 500);
		});

	});

});


