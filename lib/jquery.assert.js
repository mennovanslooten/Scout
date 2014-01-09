(function($) {
	$.dummy = true;

	var $win = $(window);
	var $doc = $(document);

	/*
		Selectors of this form: 
			"Some text"
		will be transformed to this form:
			:contains("Some text")
	*/
	$.parseSelector = function(selector) {
		var inside_quotes = /^"(.+)"$/;
		if (inside_quotes.test(selector)) {
			//var text = selector.match(inside_quotes)[1];
			return ':contains(' + selector + ')';
		}
		return selector;
	};



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
		return this.val() === value;
	};


	$.fn.dummy_assertHasClass = function(class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		return this.filter(class_name).length > 0;
	};


	$.fn.dummy_assertDisabled = function() {
		return this.filter(':visible').filter(':disabled').length > 0;
	};
})(jQuery);
