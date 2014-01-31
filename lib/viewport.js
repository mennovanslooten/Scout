var last_scroll_top = 0;
var viewport = {
	top: null,
	bottom: null,
	reset: function() {
		//console.log('reset viewport');
		this.top = null;
		this.bottom = null;
		page.scrollPosition = {
			top: 0,
			left: 0
		};
	},

	isInViewPort: function(y) {
		if (this.top === null || this.bottom !== null) {
			this.calculateViewport();
		}
		return y >= this.top && y <= this.bottom;
	},

	calculateViewport: function() {
		/*
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

		if (last_scroll_top !== page.scrollPosition.top) {
			console.log('TOP', last_scroll_top, page.scrollPosition.top);
		}
		//console.log('BOT', this.bottom, this.top + page.viewportSize.height);
		//*/

		//*
		this.top = page.scrollPosition.top;
		this.bottom = this.top + page.viewportSize.height;
		//*/
	},

	scrollTo: function(y) {
		//var viewport_h = this.bottom - this.top;
		var viewport_h = page.viewportSize.height;
		var new_scroll_top = y - Math.round(viewport_h / 2);

		page.scrollPosition = {
			top: new_scroll_top,
			left: 0
		};

		//console.log('scrollTo', new_scroll_top);
		last_scroll_top = new_scroll_top;

	},

	resizeTo: function(w, h) {
	}

};

exports.viewport = viewport;

