'use strict';

const gulp = require('gulp');
const coffee = require('gulp-coffee');
const util = require('gulp-util');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

const SRC = [
    'src/rivets.coffee',
    'src/observer.coffee',
    'src/view.coffee',
    'src/parser/type-parser.coffee',
    'src/binding/binding.coffee',
    'src/binding/text-binding.coffee',
    'src/binder/binder.coffee',
    'src/export.coffee'
];

gulp.task('build', function() {
    gulp.src([ './src/binder/**.coffee', '!./src/binder/binder.coffee' ])
        .pipe(rename({ ext: '.js' }))
        .pipe(coffee({ bare: true }).on('error', util.log))
        .pipe(gulp.dest('dist/binder'));

    return gulp.src(SRC)
        .pipe(concat('tiny-rivets.js'))
        .pipe(coffee().on('error', util.log))
        .pipe(gulp.dest('dist'));
});
gulp.task('minify', [ 'build' ], function() {
    return gulp.src([ './dist/**/*.js', '!./dist/**/*.min.js' ])
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', [ 'minify' ]);
gulp.task('watch', [ 'build' ], () => gulp.watch('./src/**/*.coffee', [ 'build' ]));