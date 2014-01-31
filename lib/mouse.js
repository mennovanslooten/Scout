var _mouse_step = 25;

exports.mouse = {
	x: 0,
	y: 0,
	reset: function() {
		this.x = 0;
		this.y = 0;

		page.scrollPosition = {
			top: 0,
			left: 0
		};
	},

	dblclick: function(x, y) {
		if (this.moveTo(x, y)) {
			page.sendEvent('doubleclick', this.x, this.y - page.scrollPosition.top);
			return true;
		}
		return false;
	},

	click: function(x, y) {
		if (this.moveTo(x, y)) {
			page.sendEvent('click', this.x, this.y - page.scrollPosition.top);
			return true;
		}
		return false;
	},

	isInViewport: function(y) {
		return y >= page.scrollPosition.top && y <= page.scrollPosition.top + page.viewportSize.height;
	},

	moveTo: function(x, y) {
		if (!this.isInViewport(y)) {
			page.scrollPosition = {
				top: y - Math.round(page.viewportSize.height / 2),
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
		return x === this.x && y === this.y;
	}
};
