import gulp from 'gulp';
import coffee from 'gulp-coffee';
import util from 'gulp-util';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';

const SRC = [
    'src/rivets.coffee',
    'src/observer.coffee',
    'src/view.coffee',
    'src/parser/type-parser.coffee',
    'src/parser/text-template-parser.coffee',
    'src/binding/binding.coffee',
    'src/binding/text-binding.coffee',
    'src/binder.coffee',
    'src/export.coffee'
];

gulp.task('build', function() {
    return gulp.src(SRC)
        .pipe(concat('tiny-rivets.js'))
        .pipe(coffee().on('error', util.log))
        .pipe(gulp.dest('dist'));
});
gulp.task('minify', function() {
    return gulp.src('./dist/tiny-rivets.js')
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist'));
});
gulp.task('watch', [ 'build' ], () => gulp.watch('./src/**/*.coffee', [ 'build' ]));