'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');

var lib_js_files = ['./scout.js', './lib/**/*.js'];
var test_js_files = ['./test/**/*.js'];
var all_js_files = lib_js_files.concat(test_js_files);


/* ################################################################
 * META TASKS
 * ################################################################ */

gulp.task('default', ['test']);


gulp.task('watch', ['default'], function() {
	gulp.watch('./.jscsrc', ['jscs']);
	gulp.watch(all_js_files, ['test']);
	gulp.watch(test_js_files, ['mocha']);
});


gulp.task('test', ['jshint', 'jscs', 'mocha']);


gulp.task('mocha', function(cb) {
	return gulp.src(test_js_files, {read: false})
		.pipe(mocha({reporter: 'spec'}));
});


gulp.task('jshint', function() {
	return gulp.src(all_js_files)
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'));
});


gulp.task('jscs', function() {
    return gulp.src(all_js_files)
        .pipe(jscs());
});



