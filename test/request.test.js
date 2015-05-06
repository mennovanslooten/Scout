'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');
var mock_path = 'mock/me.html';
var base_path = '/path/to/mocked';
var page = {};

var networkRequest = {
    changeUrl: sinon.spy()
};

var request = proxyquire('../src/context/request', {
    '../logger/logger': {
        comment: sinon.spy()
    },
    '../utils/arguments': {
        debug: false
    },
    fs: {
        separator: '/'
    }
}).create(page, base_path);


describe('request', function() {

    it('should return an empty string', function() {
        var result = request.addMock('/mock/me', mock_path);
        assert.equal(result, '');
    });

    it('should mock matching requests', function() {
        var requestData = {
            url: '/mock/me/yes'
        };

        page.onResourceRequested(requestData, networkRequest);
        assert.equal(networkRequest.changeUrl.calledOnce, true);
        assert.equal(networkRequest.changeUrl.calledWith(base_path + '/' + mock_path), true);
    });

    it('should not mock not matching requests', function() {
        var requestData = {
            url: '/dontmock/me/bro'
        };

        networkRequest.changeUrl.reset();
        page.onResourceRequested(requestData, networkRequest);
        assert.equal(networkRequest.changeUrl.called, false);
    });

    it('should remove mocks', function() {
        request.addMock('/mock/me/2', mock_path);
        request.addMock('/mock/me/3', mock_path + '1');
        request.addMock('/mock/me/3', mock_path + '2');
        request.addMock('/mock/me/3', mock_path + '2');
        assert.equal(request.getMocks().length, 5);

        request.removeMock('/mock/me/3', mock_path + '1');
        assert.equal(request.getMocks().length, 4);

        request.removeMock('/mock/me/3');
        assert.equal(request.getMocks().length, 2);

        request.removeMock();
        assert.equal(request.getMocks().length, 0);
    });

    it('should not return an empty string for invalid RegExps', function() {
        var result = request.addMock('(', mock_path);
        assert.notEqual(result, '');
    });

});


