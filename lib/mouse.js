var mouse_x = 0;
var mouse_y = 0;

exports.reset = function() {
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

	mouse_x = scroll.left;
	mouse_y = scroll.top;
};


exports.sendEvent = function(type, x, y) {
	if (isHovering(x, y)) {
		var real_x = mouse_x - _page.scrollPosition.left;
		var real_y = mouse_y - _page.scrollPosition.top;
		_page.sendEvent(type, real_x, real_y);
		return true;
	}
	this.moveTo(x, y);
	return false;
};


exports.moveTo = function(x, y) {
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


	if (isHovering(x, y)) {
		return true;
	}

	var mouse_step = (12500 / _cli_args.timeout) * _cli_args.delay;
	var delta_x = x - mouse_x;
	var delta_y = y - mouse_y;

	if (delta_x > mouse_step) {
		mouse_x += mouse_step;
	} else if (delta_x < mouse_step * -1) {
		mouse_x -= mouse_step;
	} else {
		mouse_x = x;
	}

	if (delta_y > mouse_step) {
		mouse_y += mouse_step;
	} else if (delta_y < mouse_step * -1) {
		mouse_y -= mouse_step;
	} else {
		mouse_y = y;
	}

	_page.sendEvent('mousemove', mouse_x - left, mouse_y - top);
	return false;
};


function isHovering(x, y) {
	var result = x === mouse_x && y === mouse_y;
	return result;
}
