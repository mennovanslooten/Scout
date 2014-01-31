(function($) {


	$.dummy = true;

	var $win = $(window);
	var $doc = $(document);

	$.extend($.expr[':'],{
		textEquals: function(elt, index, meta) {
			return $.trim($(elt).text()) === $.trim(meta[3]);
		}
	});

	$.fn.dummy_assertText = function(text) {
		return this.filter(':contains("' + text + '")').length > 0;
	};


	$.fn.dummy_assertExists = function() {
		return this.length > 0;
	};


	$.fn.dummy_assertVisible = function() {
		return this.filter(':visible').length > 0;
	};


	$.fn.dummy_assertHidden = function() {
		var is_empty_collection = this.length === 0;
		var is_hidden = this.is(':hidden');
		var is_display_none = this.css('display') === 'none';
		var is_visibility_hidden = this.css('visibility') === 'hidden';
		var is_opacity_0 = parseInt(this.css('opacity'), 10) === 0;
		return is_empty_collection || is_hidden || is_display_none || is_visibility_hidden || is_opacity_0;
	};


	$.fn.dummy_assertEmpty = function() {
		var has_no_text = $.trim(this.text()) === '';
		var has_no_children = this.children().dummy_assertHidden();
		return has_no_text || has_no_children;
	};


	$.fn.dummy_assertNotEmpty = function() {
		var has_text = $.trim(this.text()) !== '';
		var has_children = this.children().dummy_assertVisible();
		return has_text || has_children;
	};


	$.fn.dummy_assertLength = function(num) {
		num = parseInt(num, 10);
		return this.filter(':visible').length === num;
	};


	$.fn.dummy_assertMinLength = function(num) {
		num = parseInt(num, 10);
		return this.filter(':visible').length >= num;
	};


	$.fn.dummy_assertMaxLength = function(num) {
		num = parseInt(num, 10);
		return this.filter(':visible').length <= num;
	};


	$.fn.dummy_assertValue = function(value) {
		//console.log($.trim(this.val()) ,' === ', $.trim(value));
		return $.trim(this.val()) === $.trim(value);
	};


	$.fn.dummy_assertHasClass = function(class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		return this.filter(class_name).length > 0;
	};


	$.fn.dummy_assertNotHasClass = function(class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		return this.filter(class_name).length === 0;
	};


	$.fn.dummy_assertDisabled = function() {
		return this.filter(':visible').filter(':disabled').length > 0;
	};


	// EXPERIMENTAL:
	$.fn.dummy_assertCSS = function(prop, value) {
		//console.log(prop,':', this.css(prop), ':', value);
		return this.css(prop) === value;
	};


	$.fn.dummy_getCenter = function() {
		var $result = this.filter(':visible').first();
		var offset = $result.offset();

		return {
			left: offset.left + Math.round($result.outerWidth() / 2),
			top:  offset.top + Math.round($result.outerHeight() / 2)
		};
	};


	$.fn.dummy_choose = function() {
		var $select = this.filter(':visible').first();
		if (!$select.length) return false;

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
		return true;
	};




})(jQuery);
