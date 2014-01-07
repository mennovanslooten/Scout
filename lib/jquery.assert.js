(function($) {
	$.dummy = true;

	$.fn.assertText = function(text) {
		return this.filter(':contains("' + text + '")').length > 0;
	};


	$.fn.assertExists = function() {
		return this.length > 0;
	};


	$.fn.assertVisible = function() {
		return this.filter(':visible').length > 0;
	};


	$.fn.assertHidden = function() {
		var is_empty_collection = !this.length;
		var is_hidden = this.is(':hidden');
		var is_display_none = this.css('display') === 'none';
		var is_visibility_hidden = this.css('visibility') === 'hidden';
		var is_opacity_0 = parseInt(this.css('opacity'), 10) === 0;
		return is_empty_collection || is_hidden || is_display_none || is_visibility_hidden || is_opacity_0;
	};


	$.fn.assertEmpty = function() {
		var has_no_text = $.trim(this.text()) === '';
		var has_no_children = this.children().assertHidden();
		return has_no_text && has_no_children;
	};


	$.fn.assertNotEmpty = function() {
		var has_text = $.trim(this.text()) !== '';
		var has_children = this.children().assertVisible();
		return has_text || has_children;
	};


	$.fn.assertLength = function(num) {
		num = parseInt(num, 10);
		return this.filter(':visible').length === num;
	};


	$.fn.assertMinLength = function(num) {
		num = parseInt(num, 10);
		return this.filter(':visible').length >= num;
	};


	$.fn.assertMaxLength = function(num) {
		num = parseInt(num, 10);
		return this.filter(':visible').length <= num;
	};


	$.fn.assertValue = function(value) {
		return this.val() === value;
	};


	$.fn.assertHasClass = function(class_name) {
		if (class_name.indexOf('.') !== 0) {
			class_name = '.' + class_name;
		}

		return this.filter(class_name).length > 0;
	};


	$.fn.assertDisabled = function() {
		return this.filter(':visible').filter(':disabled').length > 0;
	};
})(jQuery);
