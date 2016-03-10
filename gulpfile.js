gulp   = require('gulp')
util   = require('gulp-util')
coffee = require('gulp-coffee')
concat = require('gulp-concat')
uglify = require('gulp-uglify')

source = [
  'src/rivets.coffee',
  'src/parsers.coffee',
  'src/observer.coffee',
  'src/view.coffee',
  'src/bindings.coffee',
  'src/binders.coffee',
  'src/formatters.coffee',
  'src/adapter.coffee'
]

gulp.task('build', function() {
  rivets = gulp.src(source)
    .pipe(concat('rivets.js'))
    .pipe(coffee().on('error', util.log))
    .pipe(gulp.dest('dist'))
})

gulp.task('watch', [ 'build' ], function() {
    gulp.watch(source, [ 'build' ]);
})