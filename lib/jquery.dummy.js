(function($) {


	// Used to detect jQuery/DummyJS readiness from actions.js
	$.is_dummy_ready = true;

	var $win = $(window);
	var $doc = $(document);

	// adds :textEquals("...") pseudo-selector
	$.extend($.expr[':'],{
		textEquals: function(elt, index, meta) {
			return $.trim($(elt).text()) === $.trim(meta[3]);
		},
	});


	$.fn.getVisible = function() {
		return this.filter(function() {
			var $elt = $(this);
			var is_hidden = $elt.is(':hidden');
			var is_0_px = $elt.outerHeight() === 0 || $elt.outerWidth() === 0;
			var is_display_none = $elt.css('display') === 'none';
			var is_visibility_hidden = $elt.css('visibility') === 'hidden';
			var is_opacity_0 = parseInt($elt.css('opacity'), 10) === 0;

			if (is_hidden || is_display_none || is_visibility_hidden || is_opacity_0 || is_0_px) {
				return false;
			}

			return true;
		});
	};


	$.fn.getVisibleInViewport = function() {
		var viewport = {
			width: $win.width(),
			height: $win.height(),
			top: $win.scrollTop(),
			left: $win.scrollLeft(),
			bottom: $win.scrollTop() + $win.height()
		};

		return this.getVisible().filter(function() {
			var $elt = $(this);
			var boundaries = $elt.dummy_getBoundaries();

			var top_is_above = boundaries.top < viewport.top;
			var bottom_is_below = boundaries.bottom > viewport.bottom;
			var top_is_inside = boundaries.top > viewport.top && boundaries.top < viewport.bottom;
			var bottom_is_inside = boundaries.bottom > viewport.top && boundaries.bottom < viewport.bottom;

			// If either the top or the bottom of the element is inside the
			// viewport, it is at least partially visible
			var is_in_viewport = top_is_inside || bottom_is_inside;

			// If the top of the element is above the viewport and the bottom
			// is below, the element covers the viewport and is also visible
			var is_over_viewport = top_is_above && bottom_is_below;

			return is_in_viewport || is_over_viewport;
		});
	};


	$.fn.dummyAssert = function(type, args) {
		var is_animating = this.parents().filter(':animated').length !== 0;

		if (is_animating) {
			return 'No assertions while animating';
		}

		return this['dummy_' + type].apply(this, args);
	};


	$.fn.dummy_assertText = function(text) {
		var is_found = false;

		this.getVisible().each(function(index, item) {
			var item_text = $.trim($(item).text());
			item_text = item_text.replace(/\s+/g, ' ');

			if (item_text.indexOf(text) > -1) {
				is_found = true;
				return false;
			}
		});

		if (is_found) {
			return '';
		}

		return 'No elements matching <' + this.selector + '> found with text <' + text + '>';
	};


	$.fn.dummy_assertExists = function() {
		if (this.length > 0) {
			return '';
		}
		return 'No elements matching <' + this.selector + '> found';
	};


	$.fn.dummy_assertVisible = function() {
		if (this.getVisible().length > 0) {
			return '';
		}
		return 'No visible elements matching <' + this.selector + '> found';
	};


	$.fn.dummy_assertHidden = function() {
		if (this.getVisible().length === 0) {
			return '';
		}
		return 'Visible elements matching <' + this.selector + '> found';
	};


	// Get text content from first direct textNode child
	$.fn.dummy_getText = function() {
		var text = '';
		this.each(function(index, elt) {
			for (var i = 0; i < elt.childNodes.length; i++) {
				var node = elt.childNodes[i];
				if (node.nodeType === 3) {
					text = node.nodeValue;
					return false;
				}
			}
		});

		return $.trim(text);
	}
	

	$.fn.dummy_assertEmpty = function() {
		var text = this.dummy_getText();

		// If the element contains text, it's not empty
		if (text !== '') {
			return 'Element contains text <' + text + '>';
		}

		// Otherwise it should have no visible children
		return this.children().dummy_assertLength(0);
	};


	$.fn.dummy_assertNotEmpty = function() {
		var text = this.dummy_getText();

		// If the element contains text, it's not empty
		if (text !== '') {
			return '';
		}

		// Otherwise it should have at least 1 visible child
		return this.children().dummy_assertMinLength(1);
	};


	$.fn.dummy_assertLength = function(num) {
		num = parseInt(num, 10);
		var actual = this.getVisible().length;
		if (actual === num) {
			return '';
		}
		//return 'Number of visible elements does not match';
		return 'Expected <' + num + '> visible elements but actual number is <' + actual + '>';
	};


	$.fn.dummy_assertMinLength = function(num) {
		num = parseInt(num, 10);
		var actual = this.getVisible().length;
		if (actual >= num) {
			return '';
		}
		return 'Expected at least <' + num + '> visible elements but actual number is <' + actual + '>';
	};


	$.fn.dummy_assertMaxLength = function(num) {
		num = parseInt(num, 10);
		var actual = this.getVisible().length;
		if (actual <= num) {
			return '';
		}
		return 'Expected at most <' + num + '> visible elements but actual number is <' + actual + '>';
	};


	$.fn.dummy_assertValue = function(value) {
		//console.log($.trim(this.val()) ,' === ', $.trim(value));
		value = $.trim(value);
		var actual = $.trim(this.val());
		if (actual === value) {
			return '';
		}
		return 'Expected <' + value + '> but actual value is <' + actual + '>';
	};


	$.fn.dummy_assertHasClass = function(class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		if (this.filter(class_name).length > 0) {
			return '';
		}

		return 'No elements matching <' + this.selector + '> found with className <' + class_name + '>';
	};


	$.fn.dummy_assertNotHasClass = function(class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		if (this.filter(class_name).length === 0) {
			return '';
		}
		return 'Elements with class name found';
	};


	$.fn.dummy_assertDisabled = function() {
		if (this.filter(':disabled').length > 0) {
			return '';
		}
		return 'No disabled elements matching <' + this.selector + '> found';
	};


	$.fn.dummy_assertInViewport = function() {
		var $result = this.getVisibleInViewport();

		// No elements visible, so definitely not in viewport
		if (!$result.length) {
			return 'No elements matching <' + this.selector + '> visible in viewport';
		}

		return '';
	};


	$.fn.dummy_assertNotInViewport = function() {
		var $result = this.getVisibleInViewport();

		// No elements visible, so definitely not in viewport
		if (!$result.length) {
			return '';
		}
		return 'Elements matching <' + this.selector + '> visible in viewport';
	};


	// EXPERIMENTAL:
	$.fn.dummy_assertCSS = function(prop, value) {
		//console.log(prop,':', this.css(prop), ':', value);
		if (this.css(prop) === value) {
			return '';
		}
		return 'Element not css';
	};


	$.fn.dummy_getCenter = function() {
		var $result = this.getVisible().first();
		var offset = $result.offset();

		return {
			left: offset.left + Math.round($result.outerWidth() / 2),
			top:  offset.top + Math.round($result.outerHeight() / 2)
		};
	};


	$.fn.dummy_getBoundaries = function() {
		var $result = this.getVisible().first();
		if (!$result.length) return;

		var offset = $result.offset();
		return {
			left: offset.left,
			top:  offset.top,
			width: $result.outerWidth(true),
			height: $result.outerHeight(true),
			bottom: offset.top + $result.outerHeight(true)
		};
	};


	$.fn.dummy_choose = function() {
		var $select = this.getVisible().first();
		if (!$select.length) return 'Element is not visible';

		var args = [].slice.call(arguments, 0);
		var values = [];
		$.each(args, function(index, arg) {
			var $option = $select.find('option').filter(function() {
				var result = $(this).text() === arg;
				//console.log('"' + $(this).text() + '"', '"' + arg + '"', result);
				return result;
			});

			//console.log(arg, ':::', $option.length ? $option.attr('value') : arg);
			//values.push($option.length ? $option.attr('value') : arg);
			var option_value = $option.attr('value');
			if ($option.length && option_value) {
				values.push(option_value);
			} else {
				values.push(arg);
			}
		});
		//console.log(values);
		$select.val(values);
		return '';
	};




})(jQuery);
