exports.viewport = {
	top: null,
	bottom: null,
	isInViewPort: function(y) {
		if (this.top === null || this.bottom !== null) {
			this.calculateViewport();
		}
		return y >= this.top && y <= this.bottom;
	},

	calculateViewport: function() {
		var viewport = page.evaluate(function() {
			var $win = jQuery(window);
			var $doc = jQuery(document);

			var win_h = $win.height();
			var scroll_top = $doc.scrollTop();

			return {
				top: scroll_top,
				bottom: scroll_top + win_h
			};
		});

		this.top = viewport.top;
		this.bottom = viewport.bottom;
	},

	scrollTo: function(y) {
		var viewport_h = this.bottom - this.top;
		var new_scroll_top = y - Math.round(viewport_h / 2);

		page.evaluate(function(new_scroll_top) {
			var $doc = jQuery(document);
			$doc.scrollTop(new_scroll_top);
		}, new_scroll_top);
	}
};


