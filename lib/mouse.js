var _mouse_step = 25;

exports.mouse = {
	x: 0,
	y: 0,

	reset: function() {
		var top = page.evaluate(function() {
			return window.scrollY;
		});

		page.scrollPosition = {
			top: top,
			left: 0
		};
		this.x = 0;
		this.y = top;
		/*
		*/
	},

	dblclick: function(x, y) {
		if (this.isHovering(x, y)) {
			page.sendEvent('doubleclick', this.x, this.y - page.scrollPosition.top);
			return true;
		}
		this.moveTo(x, y);
		return false;
	},

	click: function(x, y) {
		if (this.isHovering(x, y)) {
			page.sendEvent('click', this.x, this.y - page.scrollPosition.top);
			return true;
		}
		this.moveTo(x, y);
		return false;
	},

	moveTo: function(x, y) {
		var is_in_viewport = y >= page.scrollPosition.top && y <= page.scrollPosition.top + page.viewportSize.height;
		if (!is_in_viewport) {
			var top = Math.max(0, y - Math.round(page.viewportSize.height / 2));

			page.scrollPosition = {
				top: top,
				left: 0
			};
		}

		if (this.isHovering(x, y)) {
			return true;
		}

		var delta_x = x - this.x;
		var delta_y = y - this.y;

		if (delta_x > _mouse_step) {
			this.x += _mouse_step;
		} else if (delta_x < _mouse_step * -1) {
			this.x -= _mouse_step;
		} else {
			this.x = x;
		}

		if (delta_y > _mouse_step) {
			this.y += _mouse_step;
		} else if (delta_y < _mouse_step * -1) {
			this.y -= _mouse_step;
		} else {
			this.y = y;
		}

		page.sendEvent('mousemove', this.x, this.y - page.scrollPosition.top);
		return false;
	},

	isHovering: function(x, y) {
		var result = x === this.x && y === this.y;
		return result;
	}
};
