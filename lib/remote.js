exports.create = function(_page) {

	/**
	 * Generic wrapper for in-page assertions and actions
	 */
	function getRemoteHandler(type) {
		return function() {
			// args = ['.selector', 'Some text']
			var args = [].slice.call(arguments, 0);

			// args = ['assertText', '.selector', 'Some text']
			args.unshift(type);

			var remoteAssert = function() {
				var type = arguments[0];
				var selector = arguments[1];
				var args = [].slice.call(arguments, 2);

				return DummyClient.run(type, selector, args);
			};

			// args = [remoteAssert, 'assertText', '.selector', 'Some text']
			args.unshift(remoteAssert);

			var result = _page.evaluate.apply(_page, args);

			return result;
		};
	}

	var handlers = {};

	// All these asserts and actions are defined in jquery.dummy.js and executed
	// in the context of the webpage
	[
		'assertText',
		'assertExists',
		'assertVisible',
		'assertHidden',
		'assertEmpty',
		'assertNotEmpty',
		'assertLength',
		'assertMinLength',
		'assertMaxLength',
		'assertValue',
		'assertHasClass',
		'assertNotHasClass',
		'assertDisabled',
		'choose',
		'getCenter',
		'getCoordinate',
		'getBoundaries',
		'assertInViewport',
		'assertNotInViewport',
		'getValueOrText'
		//'getViewPort'
	].forEach(function(type) {
		handlers[type] = getRemoteHandler(type);
	});

	return handlers;
};

