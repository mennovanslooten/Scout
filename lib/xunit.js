exports.log = function() {
	var total_time = ((new Date() - _start_time) / 1000).toFixed(3);
	var total_tests = _passed.length + _failed.length;

	var xml = '<?xml version="1.0" encoding="UTF-8"?>';

	xml += '\n<testsuites duration="' + total_time + '">';


	for (var i = 0; i < _failed.length; i ++) {
		var test = _failed[i];
		var last_slash = test.path.lastIndexOf('/');
		var test_path = test.path.substr(0, last_slash);
		var test_name = test.path.substr(last_slash + 1);
		_logger.dir(test);

		//xml += '\n  <testsuite errors="1" failures="0" name="' + test_name + '" package="' + test_path + '" tests="' + (test.actions.length + test.passed.length) + '" time="1.249" timestamp="2012-12-30T21:27:26.320Z">';

		//for (var ii = 0; ii < test.actions.length; ii ++) {
			//var action = test.actions[ii];
			//console.dir(action)
			//xml += '\n    <testcase classname="googletesting" name="' + ii + '" time="0.001"/>';
		//}

		// xml += '\n    <system-out/>';
		xml += '\n  </testsuite>';
	}

	for (var i = 0; i < _passed.length; i++) {
		var test = _passed[i];
	}

	xml += '\n</testsuites>';

	console.log(xml);
};
