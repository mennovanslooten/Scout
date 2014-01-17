var _screendump_index = 0;


function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}



exports.dump = function(title) {
	_screendump_index++;
	page.render('/Users/mennovanslooten/Desktop/' + pad(_screendump_index, 3) + '.' + title + '.png');
	//page.render('screenshots/' + pad(_screendump_index, 3) + '.' + title + '.png');
};



