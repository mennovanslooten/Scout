'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var spawn = require('child_process').spawn;

var scout_files = ['./self_tests/**/*.scout'];
var src_js_files = ['./index.js', './src/**/*.js'];
var test_js_files = ['./test/**/*.js'];
var all_js_files = src_js_files.concat(test_js_files);


/* ################################################################
 * META TASKS
 * ################################################################ */

gulp.task('default', ['test']);


gulp.task('watch', ['default'], function() {
    gulp.watch('./.jscsrc', ['jscs']);
    gulp.watch(scout_files, ['self_test']);
    gulp.watch(all_js_files, ['test']);
    gulp.watch(test_js_files, ['mocha']);
});


gulp.task('test', ['jshint', 'jscs', 'mocha', 'self_test']);


gulp.task('mocha', function() {
    return gulp.src(test_js_files, {read: false})
        .pipe(mocha({reporter: 'mocha-silent-reporter'}));
});


gulp.task('jshint', function() {
    return gulp.src(all_js_files)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});


gulp.task('jscs', function() {
    return gulp.src(all_js_files)
        .pipe(jscs());
});


gulp.task('self_test', function(done) {
    var scout = spawn('./bin/scout', ['self_tests', '--parallel=3', '--timeout=1000']);
    scout.stdout.setEncoding('utf8');

    var log = '';
    scout.stdout.on('data', function(data) {
        var str = data.toString();
        log += str;
    });

    //scout.stdout.on('end', function(data) {
        //done();
    //});


    scout.on('close', function (code) {
        if (code) {
            console.log(log);
            done(new Error());
        } else {
            done();
        }
    });
});
