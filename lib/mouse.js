exports.mouse = {
	x: 0,
	y: 0,

	reset: function() {
		var scroll = _page.evaluate(function() {
			return {
				top: window.scrollY,
				left: window.scrollX
			};
		});

		_page.scrollPosition = {
			top: scroll.top,
			left: scroll.left
		};

		this.x = scroll.left;
		this.y = scroll.top;
	},

	dblclick: function(x, y) {
		if (this.isHovering(x, y)) {
			_page.sendEvent('doubleclick', this.x - _page.scrollPosition.left, this.y - _page.scrollPosition.top);
			return true;
		}
		this.moveTo(x, y);
		return false;
	},

	click: function(x, y) {
		if (this.isHovering(x, y)) {
			_page.sendEvent('click', this.x - _page.scrollPosition.left, this.y - _page.scrollPosition.top);
			return true;
		}
		this.moveTo(x, y);
		return false;
	},

	moveTo: function(x, y) {
		var top = _page.scrollPosition.top;
		var left = _page.scrollPosition.left;
		var height = _page.viewportSize.height;
		var width = _page.viewportSize.width;
		var doc = _page.evaluate(function() {
			return {
				width: document.body.scrollWidth,
				height: document.body.scrollHeight
			};
		});

		var is_y_in_viewport = y >= top && y <= top + height;
		var is_x_in_viewport = x >= left && x <= left + width;

		if (!is_y_in_viewport) {
			top = Math.max(0, y - Math.round(height / 2));
			top = Math.min(top, doc.height - height);
		}

		if (!is_x_in_viewport) {
			left = Math.max(0, x - Math.round(width / 2));
			left = Math.min(left, doc.width - width);
		}

		if (!is_y_in_viewport || !is_x_in_viewport) {
			_page.scrollPosition = {
				top: top,
				left: left
			};
		}


		if (this.isHovering(x, y)) {
			return true;
		}

		var mouse_step = (12500 / _cli_args.timeout) * _cli_args.delay;
		var delta_x = x - this.x;
		var delta_y = y - this.y;

		if (delta_x > mouse_step) {
			this.x += mouse_step;
		} else if (delta_x < mouse_step * -1) {
			this.x -= mouse_step;
		} else {
			this.x = x;
		}

		if (delta_y > mouse_step) {
			this.y += mouse_step;
		} else if (delta_y < mouse_step * -1) {
			this.y -= mouse_step;
		} else {
			this.y = y;
		}

		_page.sendEvent('mousemove', this.x - left, this.y - top);
		return false;
	},

	isHovering: function(x, y) {
		var result = x === this.x && y === this.y;
		return result;
	}
};
