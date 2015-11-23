'use strict';

var assert = require('assert');
var sinon = require('sinon');
var proxyquire =  require('proxyquire').noPreserveCache().noCallThru();

var page_stub = {
    open: sinon.stub(),
    evaluate: sinon.stub(),
    goBack: sinon.stub(),
    goForward: sinon.stub(),
    getURL: sinon.stub(),
    dump: sinon.stub(),
    viewportSize: {
        width: 800,
        height: 600
    }
};

var mouse_stub = {
    reset: sinon.stub(),
    sendEvent: sinon.stub()
};

var resemble_stub = {
    compare: sinon.stub()
};

var remember_stub = {
    set: sinon.stub()
};

var remote_stub = {
    getBoundaries: sinon.stub(),
    getCoordinate: sinon.stub(),
    assertVisible: sinon.stub(),
    getValueOrText: sinon.stub()
};

var handlers = proxyquire('../src/context/handlers', {
    './mouse': {
        create: function() {
            return mouse_stub;
        }
    },
    './keyboard': {
        create: sinon.stub()
    },
    './request': {
        create: sinon.stub()
    },
    '../utils/resemble': {
        create: function() {
            return resemble_stub;
        }
    },
    './remote': {
        create: function() {
            return remote_stub;
        }
    },
    '../utils/remember': remember_stub
}).create(page_stub, '');
var selector = '.some > .selector';


describe('handlers', function() {

    describe('open', function() {
        var open = handlers.getHandler('open');

        it('should return a non-empty string', function() {
            var result = open('./path/to/index.html');
            assert.notEqual(result, '');
        });

        it('should open the page', function() {
            assert.equal(page_stub.open.calledWith('/path/to/index.html'), true);
        });

        it('should set default viewportSize', function() {
            assert.deepEqual(page_stub.viewportSize, {
                width: 1280,
                height: 1280
            });
        });

        it('should set loading status', function() {
            assert.equal(page_stub.is_loaded, false);
            assert.equal(page_stub.is_loading, true);
        });

        it('should return empty string when loaded', function() {
            page_stub.is_loaded = true;
            page_stub.is_loading = false;
            var result = open('./path/to/index.html');
            assert.equal(result, '');
        });

        it('should set custom viewportSize', function() {
            page_stub.is_loaded = false;
            page_stub.is_loading = false;
            open('./path/to/index.html', '800x600');
            assert.deepEqual(page_stub.viewportSize, {
                width: 800,
                height: 600
            });

            //console.dir(page_stub.viewportSize);
        });

    });


    describe('back', function() {
        var back = handlers.getHandler('back');

        it('should return an empty string', function() {
            var result = back();
            assert.equal(result, '');
        });

        it('should go back on the page', function() {
            assert.equal(page_stub.goBack.calledOnce, true);
        });
    });


    describe('forward', function() {
        var forward = handlers.getHandler('forward');

        it('should return an empty string', function() {
            var result = forward();
            assert.equal(result, '');
        });

        it('should go forward on the page', function() {
            assert.equal(page_stub.goForward.calledOnce, true);
        });
    });


    describe('assertTitle', function() {
        page_stub.evaluate.returns('Lorem ipsum dolor sit amet');
        var assertTitle = handlers.getHandler('assertTitle');

        it('should return an empty string when title matches', function() {
            var result = assertTitle('Lorem ipsum');
            assert.equal(result, '');
        });

        it('should return a non-empty string when title does not match', function() {
            var result = assertTitle('XXX');
            assert.notEqual(result, '');
        });
    });


    describe('assertPage', function() {
        page_stub.getURL.returns('http://url.of.page/path/to/1234');
        var assertPage = handlers.getHandler('assertPage');

        it('should return an empty string when page matches', function() {
            var result = assertPage('/path/to/');
            assert.equal(result, '');
        });

        it('should return a non-empty string when page does not match', function() {
            var result = assertPage('XXX');
            assert.notEqual(result, '');
        });

        it('should return an empty string when url matches as RegExp', function() {
            var result = assertPage('\\/path\\/to\\/\\d+');
            assert.equal(result, '');
        });
    });


    describe('assertResembles', function() {
        var assertResembles = handlers.getHandler('assertResembles');
        var boundaries = {
            left: 10,
            top: 20,
            width: 30,
            height: 40
        };
        var filename = 'original.filename.png';

        resemble_stub.compare.returns('ABCD');
        remote_stub.getBoundaries.returns(boundaries);

        it('should call resemble.compare() and remote.getBoundaries()', function() {
            var result = assertResembles(filename, selector);
            assert.equal(result, 'ABCD');
            assert.equal(remote_stub.getBoundaries.calledWith(selector), true);
            assert.equal(resemble_stub.compare.calledWith(boundaries, filename), true);
        });
    });


    describe('log', function() {
        var log = handlers.getHandler('log');
        it('should always return an empty string', function() {
            var result = log();
            assert.equal(result, '');
        });
    });


    describe('type', function() {
        var type = handlers.getHandler('type');

        it('should return a non-empty string if the target is invisible', function() {
            remote_stub.assertVisible.returns('Not an empty string');
            var result = type(selector, 'Lorem ipsum');
            assert.notEqual(result, '');
        });

        //it('should return the return value of keyboard.type()', function() {
        //remote_stub.assertVisible.returns('');
        //remote_stub.getCoordinate.returns({left: 10, top: 100});

        //// The first time sets the focus
        //mouse_stub.sendEvent.returns('');
        //var result = type(selector, 'Lorem ipsum');
        //console.log('xxx' + result);
        //assert.notEqual(result, '');

        //// The first time sets the focus
        //result = type(selector, 'Lorem ipsum');
        //console.log('yyy' + result);
        //assert.notEqual(result, '');
        //});
    });


    ['click', 'moveMouseTo', 'dblclick'].forEach(function(action) {
        describe(action, function() {
            var handler = handlers.getHandler(action);

            it('should return a non-empty string if the target is invisible', function() {
                remote_stub.assertVisible.returns('Not an empty string');
                var result = handler(selector);
                assert.notEqual(result, '');
            });

            it('should return an empty string if the target is visible', function() {
                // element is visible
                remote_stub.assertVisible.returns('');
                // element has coordinates
                remote_stub.getCoordinate.returns({left: 10, top: 100});
                // mouse is over element
                mouse_stub.sendEvent.returns(true);
                var result = handler(selector);
                assert.equal(result, '');
            });
        });
    });


    describe('resize', function() {
        var resize = handlers.getHandler('resize');
        //var results;

        it('should return a non-empty string if no of wrong dimensions are passed', function() {
            //console.log('RESIZE:', resize());
            assert.notEqual(resize(), '');
            assert.notEqual(resize('xxx'), '');
            assert.notEqual(resize('100x'), '');
            assert.notEqual(resize(true), '');
        });

        it('should return an empty string when correct dimensions are passed', function() {
            assert.equal(resize('320x240'), '');
        });

        it('should set viewportSize', function() {
            assert.equal(resize('320x240'), '');
            assert.deepEqual(page_stub.viewportSize, {
                width: 320,
                height: 240
            });
        });
    });


    describe('screendump', function() {
        var screendump = handlers.getHandler('screendump');

        it('should return a non-empty string if no boundaries are found for selector', function() {
            var undef;
            remote_stub.getBoundaries.returns(undef);
            assert.notEqual(screendump('filename.png', selector), '');
        });

        it('should return an empty string if boundaries are found for selector', function() {
            var boundaries = {
                left: 10,
                top: 20,
                width: 30,
                height: 40
            };
            var filename = 'original.filename.png';
            remote_stub.getBoundaries.returns(boundaries);
            screendump(filename, selector);
            assert.equal(page_stub.dump.calledWith(filename, boundaries), true);
        });
    });


    describe('remember', function() {
        var remember = handlers.getHandler('remember');
        var target_value = 'target element value';
        var variable_name = 'variable_name';

        it('should return a non-empty string if the target is invisible', function() {
            remote_stub.assertVisible.returns('Not an empty string');
            var result = remember(selector, 'variable_name');
            assert.notEqual(result, '');
        });

        it('should return an empty string if the target is visible', function() {
            remote_stub.assertVisible.returns('');
            remote_stub.getValueOrText.returns(target_value);
            var result = remember(selector, variable_name);
            assert.equal(result, '');
        });

        it('should call remember.set() with the target value', function() {
            assert.equal(remember_stub.set.calledWith(variable_name, target_value), true);
        });
    });
});



