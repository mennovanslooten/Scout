'use strict';

var assert = require('assert');
var proxyquire =  require('proxyquire').noCallThru();
var system_stub = {
	args: []
};

// Require arguments but proxy system inside of it
var parser = proxyquire('../lib/arguments', {
    'system': system_stub
});

describe('arguments', function(){

    it('should parse --bool params', function(){
		system_stub.args = ['', '--version', '--color', '--reformat', '--faildump'];
		var args = parser.parseArguments();

        assert.equal(args.version, true);
        assert.equal(args.color, true);
        assert.equal(args.reformat, true);
        assert.equal(args.faildump, true);
    });


    it('should parse --name=value params', function(){
		system_stub.args = ['', '--timeout=1000', '--step=5'];
		var args = parser.parseArguments();

        assert.equal(args.timeout, 1000);
        assert.equal(args.step, 5);
    });


    it('should parse other params as filenames', function(){
		system_stub.args = ['', '--color', '--timeout=1000', 'filename1', 'filename2', '--step=5', 'dirname/filename'];
		var args = parser.parseArguments();

        assert.deepEqual(args.files, ['filename1', 'filename2', 'dirname/filename']);
    });

});

