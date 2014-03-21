(function($) {
	var $win = $(window);
	var $doc = $(document);
	var $viewport_size = $('#viewport_size');
	var $scroll_position = $('#scroll_position');

	//console.log('window initial:', $win.width(), $win.height());


	$('.mouse_target').on('mousedown mouseup click mouseenter mouseleave dblclick', function(e) {
		// console.log(this.className, ' - ' , e.type);
		$(this).addClass(e.type);
	});


	$doc.on('mousemove', function(e) {
		var $crumb = $('<div class="mouse_trail"/>');
		$crumb.appendTo('body');
		$crumb.css({
			left: e.pageX + 1,
			top: e.pageY + 1
		});
	});


	$doc.on('mousemove click mouseenter mouseleave dblclick', function(e) {
		// console.log(e.type, e.pageX, e.pageY);
	});


	$doc.on('scroll', function(e) {
		console.log('scrolling', $doc.scrollTop(), $doc.scrollLeft());
	});


	function logViewportSize(e) {
		$viewport_size.text($win.width() + 'x' + $win.height());
		console.log('window resize:', $win.width(), $win.height());
	}

	$win.on('resize', logViewportSize);

	logViewportSize();

})(jQuery, undefined);
