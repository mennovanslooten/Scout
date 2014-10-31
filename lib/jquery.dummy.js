(function($) {


	// Used to detect jQuery/DummyJS readiness from actions.js
	$.is_dummy_ready = true;

	var $win = $(window);
	var $doc = $(document);

	var old_find = $.fn.find;
	$.fn.find = function(selector) {
		// Intercept jQuery.fn.find for selectors matching text in double
		// quotes
		var inside_quotes = /^"([^"]+)"$/;
		if (inside_quotes.test(selector)) {
			var text = selector.substr(1, selector.length - 2);
			var nodes = findNodesWithText(text);
			return $(nodes);
		}

		return old_find.apply(this, arguments);
	};


	function findNodesWithText(text, node, results) {
		node = node || document.body;
		results = results || [];

		if (node.textContent && node.textContent.trim() === text) {
			results.push(node);
			return results;
		} 

		var child = node.firstChild;
		while (child) {
			findNodesWithText(text, child, results);
			child = child.nextSibling;
		}

		return results;

	}


	function isHidden($elt) {
		return $elt.is(':hidden');
	}


	function is0Px($elt) {
		return $elt.outerHeight() === 0 || $elt.outerWidth() === 0;
	}


	function isDisplayNone($elt) {
		return $elt.css('display') === 'none';
	}


	function isVisibilityHidden($elt) {
		return $elt.css('visibility') === 'hidden';
	}


	function isOpacity0($elt) {
		return parseFloat($elt.css('opacity')) === 0;
	}


	function isInViewport($elt) {
		var elt = $elt[0];
		var rect = elt.getBoundingClientRect();

		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= $win.height() &&
			rect.right <= $win.width()
		);
	}


	function getCoordinate($elt) {
		// Don't return coordinates for disabled inputs/buttons/etc -- they
		// can't be clicked
		if ($elt.is(':input') && $elt.prop('disabled')) {
			return null;
		}

		var offset = $elt.offset();

		var scroll = {
			left: $doc.scrollLeft(),
			top: $doc.scrollTop()
		};

		// Calculate element dimensions relative to the viewport
		var left = offset.left - scroll.left;
		var top = offset.top - scroll.top;
		var right = left + $elt.outerWidth();
		var bottom = top + $elt.outerHeight();

		// If the elment is outside of the viewport,
		// document.elementFromPoint() returns null, so we return the top left
		// coordinate
		if (!isInViewport($elt)) {
			return offset;
		}

		var elt = $elt[0];

		// Check the element pixel by pixel until we find one that bubbles to
		// the element
		// Yes, really
		
		for (var x = left; x <= right && x >= 0; x += 1) {
			for (var y = top; y <= bottom && y >= 0; y += 1) {
				var elt_at_point = document.elementFromPoint(x, y) || elt;
				while (elt_at_point) {
					if (elt_at_point === elt) {
						var result = {
							left: x + scroll.left, 
							top: y + scroll.top
						};
						return result;
					}
					elt_at_point = elt_at_point.parentNode;
				}
			}
		}

		return null;
	}
	
	
	$.fn.getVisible = function() {
		return this.filter(function() {
			var $elt = $(this);
			if (isHidden($elt)
					|| isDisplayNone($elt)
					|| isVisibilityHidden($elt)
					|| isOpacity0($elt)
					|| is0Px($elt)
				) {
				return false;
			}

			return true;
		});
	};


	$.fn.getVisibleInViewport = function() {
		return this.getVisible().filter(function() {
			var $elt = $(this);
			return isInViewport($elt);
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
			var item_text = $(item).text().trim();
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

		return text.trim();
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
		value = value.trim();
		var actual = this.val().trim();
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


	// Find a pixel on the element that is not covered by other elements.
	// Needed to make sure we send click events, etc. to the right place
	$.fn.dummy_getCoordinate = function() {
		var result = null;

		// Find the first visible matching element that is not completely
		// covered by other elements

		this.getVisible().each(function() {
			var $elt = $(this);
			var coordinate = getCoordinate($elt);
			if (coordinate) {
				result = coordinate;
				return false;
			}
		});

		return result;
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
				return result;
			});

			var option_value = $option.attr('value');
			if ($option.length && option_value) {
				values.push(option_value);
			} else {
				values.push(arg);
			}
		});

		$select.val(values);
		return '';
	};


	$.fn.dummy_getValueOrText = function() {
		var $elt = this.getVisible().first();
		if ($elt.is(':input') || $elt.is('select')) {
			return $elt.val();
		}

		return $elt.text();
	};




})(jQuery);
