exports.mouse = {
	x: 0,
	y: 0,

	reset: function() {
		var top = _page.evaluate(function() {
			return window.scrollY;
		});

		_page.scrollPosition = {
			top: top,
			left: 0
		};

		this.x = 0;
		this.y = top;
	},

	dblclick: function(x, y) {
		if (this.isHovering(x, y)) {
			_page.sendEvent('doubleclick', this.x, this.y - _page.scrollPosition.top);
			return true;
		}
		this.moveTo(x, y);
		return false;
	},

	click: function(x, y) {
		if (this.isHovering(x, y)) {
			_page.sendEvent('click', this.x, this.y - _page.scrollPosition.top);
			return true;
		}
		this.moveTo(x, y);
		return false;
	},

	moveTo: function(x, y) {
		var is_in_viewport = y >= _page.scrollPosition.top && y <= _page.scrollPosition.top + _page.viewportSize.height;
		if (!is_in_viewport) {
			var top = Math.max(0, y - Math.round(_page.viewportSize.height / 2));

			_page.scrollPosition = {
				top: top,
				left: 0
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

		_page.sendEvent('mousemove', this.x, this.y - _page.scrollPosition.top);
		return false;
	},

	isHovering: function(x, y) {
		var result = x === this.x && y === this.y;
		return result;
	}
};
