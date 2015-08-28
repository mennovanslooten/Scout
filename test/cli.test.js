'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();


function proxy(args) {
    return proxyquire('../src/utils/cli', {
        system: {
            args: args
        }
    });
}


describe('cli', function() {

    it('should parse --bool params', function() {
        var args = proxy(['', '--version', '--color', '--reformat', '--faildump']);

        assert.equal(args.version, true);
        assert.equal(args.color, true);
        assert.equal(args.reformat, true);
        assert.equal(args.faildump, true);
    });


    it('should parse --name=value params', function() {
        var args = proxy(['', '--timeout=1000', '--step=5']);

        assert.equal(args.timeout, 1000);
        assert.equal(args.step, 5);
    });


    it('should parse other params as filenames', function() {
        var args = proxy(['', '--color', '--timeout=1000', 'filename1', 'filename2', '--step=5', 'dirname/filename']);

        assert.deepEqual(args.files, ['filename1', 'filename2', 'dirname/filename']);
    });

});
