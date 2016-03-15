import gulp from 'gulp';
import webpack from 'webpack';

import webpackConfig from './webpack.config';

gulp.task('webpack', cb => webpack(webpackConfig, cb));
gulp.task('watch', [ 'webpack' ], () => gulp.watch('./src/**/*.coffee', [ 'webpack' ]));