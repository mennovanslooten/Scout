function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}



exports.dump = function(title) {
	_page.clipRect = {
		top: _page.scrollPosition.top,
		left: _page.scrollPosition.left,
		width: _page.viewportSize.width,
		height: _page.viewportSize.height
	};

	//console.dir('clipRect:', _page.clipRect.top, _page.clipRect.left, _page.clipRect.width, _page.clipRect.height);

	_page.render(title + '.png');
};



