var _mouse_step = 25;
var _viewport = require('./viewport').viewport;


exports.mouse = {
	x: 0,
	y: 0,

	dblclick: function(x, y) {
		if (this.moveTo(x, y)) {
			page.sendEvent('doubleclick', this.x, this.y - _viewport.top);
			return true;
		}
		return false;
	},

	click: function(x, y) {
		if (this.moveTo(x, y)) {
			page.sendEvent('click', this.x, this.y - _viewport.top);
			return true;
		}
		return false;
	},

	moveTo: function(x, y) {
		if (!_viewport.isInViewPort(y)) {
			_viewport.scrollTo(y);
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

		page.sendEvent('mousemove', this.x, this.y - _viewport.top);
		return false;
	},

	isHovering: function(x, y) {
		return x === this.x && y === this.y;
	}
};
