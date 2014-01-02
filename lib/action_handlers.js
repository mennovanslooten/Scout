var _focused = '';

exports.action_handlers = {
	open: function(url) {
		if (page.is_loaded) {
			return true;
		}

		if (page.is_loading) {
			return false;
		}

		page.is_loaded = false;
		page.is_loading = true;


		console.log('################################################################');
		console.log('# Opening:', url);
		console.log('################################################################');

		page.open(url);
		return false;
	},

	assertTitle: function(title) {
		return page.evaluate(function() {
			return document.title;
		});
	},

	assertPage: function(sub_url) {
		var url = page.evaluate(function() {
			return location.href;
		});
		return url.indexOf(sub_url) !== -1;
	},

	assertUrl: function(expression) {
		var url = page.evaluate(function() {
			return location.href;
		});
		return new RegExp(expression).test(url);
	},

	log: function(message) {
		console.log('\n# ' + message);
		return true;
	},

	assertText: function(selector, text) {
		return page.evaluate(function(selector, text) {
			return jQuery(selector).is(':contains(' + text + ')');
		}, selector, text);
	},

	assertExists: function(selector) {
		var length = page.evaluate(function(selector) {
			return jQuery(selector).length;
		}, selector);
		console.log('assertExists', selector, length);
		return length > 0;
	},

	assertVisible: function(selector) {
		return page.evaluate(function(selector) {
			return jQuery(selector).is(':visible');
		}, selector);
	},

	assertHidden: function(selector) {
		return page.evaluate(function(selector) {
			var $result = jQuery(selector);
			return !$result.length || $result.is(':hidden');
		}, selector);
	},

	assertEmpty: function(selector) {
		return this.assertElementCount(selector + ' > *', 0);
	},

	getLength: function(selector) {
		return page.evaluate(function(selector) {
			return jQuery(selector).filter(':visible').length;
		}, selector);
	},

	assertLength: function(selector, num) {
		return this.assertElementCount(selector, num);
	},

	assertMinLength: function(selector, num) {
		num = parseInt(num, 10);
		var num_visible = this.getLength(selector);
		return num_visible >= num;
	},

	assertElementCount: function(selector, num) {
		num = parseInt(num, 10);

		var num_visible = page.evaluate(function(selector) {
			return jQuery(selector).filter(':visible').length;
		}, selector);

		return num_visible === num;
	},

	choose: function() {
		var args = [].slice.call(arguments, 0);
		var selector = args.shift();

		if (!this.assertVisible(selector)) {
			return false;
		}

		args.forEach(function(option_text) {
			page.evaluate(function(selector, option_text) {
				var $select = jQuery(selector);
				var $option = $select.find('option').filter(':contains(' + option_text + ')');
				$select.val($option.attr('value') || option_text);
			}, selector, option_text);
		});

		return true;
	},

	submit: function(selector, text) {
		if (!this.assertVisible(selector)) {
			return false;
		}

		page.evaluate(function(selector) {
			jQuery(selector).trigger('submit');
		}, selector);

		return true;
	},

	type: function(selector, text) {
		if (!this.assertVisible(selector)) {
			return false;
		}

		if (!text.length) {
			return true;
		}

		if (_focused !== selector) {
			this.click(selector);
			_focused = selector;
		}

		/*
			TODO: Use all possible keys from
			https://github.com/ariya/phantomjs/commit/cab2635e66d74b7e665c44400b8b20a8f225153a
		*/
		if (text.length === 1) {
			page.sendEvent('keypress', text, null, null, 0);
		} else {
			while (text) {
				if (text.indexOf('<enter>') === 0) {
					text = text.substr('<enter>'.length);
					page.sendEvent('keypress', page.event.key.Enter, null, null, 0);
				} else {
					var character = text.charAt(0);
					this.type(selector, character);
					text = text.substr(1);
				}
			}
		}

		return true;
	},

	click: function(selector) {
		if (!this.assertVisible(selector)) {
			return false;
		}

		var center = page.evaluate(function(selector) {
			var $result = jQuery(selector).first();
			var offset = $result.offset();
			return {
				left: offset.left + $result.outerWidth() / 2,
				top:  offset.top + $result.outerHeight() / 2
			};
		}, selector);


		var element = page.evaluate(function(left, top) {
			return document.elementFromPoint(left, top);
		}, center.left, center.top);

		// console.log('center', center.left, center.top, element);

		page.sendEvent('click', center.left, center.top);
		return true;
	},

	dblclick: function(selector) {
		if (!this.assertVisible(selector)) {
			return false;
		}

		var offset = page.evaluate(function(selector) {
			var $result = jQuery(selector);
			return $result.offset();
		}, selector);

		page.sendEvent('doubleclick', offset.left, offset.top);
		return true;
	},

	assertHasClass: function(selector, class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		return this.assertVisible(selector + class_name);
	},

	assertDisabled: function(selector) {
		if (!this.assertVisible(selector)) {
			return false;
		}

		return page.evaluate(function(selector) {
			return jQuery(selector).is(':disabled');
		}, selector);
	}
};


