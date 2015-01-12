'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var jsfiles = ['./scout.js', './lib/**/*.js', '!./lib/jquery*.js'];


/* ################################################################
 * META TASKS
 * ################################################################ */

gulp.task('default', ['mocha']);


gulp.task('watch', ['default'], function() {
	gulp.watch(jsfiles, ['test']);
	gulp.watch('./test/**/*.js', ['mocha']);
});


gulp.task('test', ['jshint', 'jscs', 'mocha']);


gulp.task('mocha', function(cb) {
	return gulp.src('./test/*.js', {read: false})
		.pipe(mocha({reporter: 'spec'}));
});


gulp.task('jshint', function() {
	return gulp.src(jsfiles)
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('default'));
});


gulp.task('jscs', function() {
    return gulp.src(jsfiles)
        .pipe(jscs());
});



