var _screendump_index = 0;


function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}



exports.dump = function(title) {
	page.clipRect = {
		top: page.scrollPosition.top,
		left: page.scrollPosition.left,
		width: page.viewportSize.width,
		height: page.viewportSize.height
	};

	//console.dir('clipRect:', page.clipRect.top, page.clipRect.left, page.clipRect.width, page.clipRect.height);

	page.render(title + '.png');
};



