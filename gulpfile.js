'use strict';

var pkg = require('./package.json');
var gulp = require('gulp');
var del = require('del');
var eslint = require('gulp-eslint');
var babel = require('gulp-babel');
var sass = require('gulp-sass');
var filter = require('gulp-filter');
var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');
var runSequence = require('run-sequence');
var webpackStatsHelper = require('./example/helper/webpack-stats-helper');
var path = require('path');
var frep = require('gulp-frep');
var minifyHtml = require('gulp-minify-html');
var webpackStream = require('webpack-stream');
var webpackConfig = require('./webpack.config');
var exampleWebpackConfig = require('./example/webpack.build.config');
var webpack = require('webpack');
var concat = require('gulp-concat');

gulp.task('clean', function () {
  del.sync(['lib', 'dist']);
});

gulp.task('lint', function () {
  return gulp
    .src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('babel', function () {
  return gulp
    .src(['src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

gulp.task('umd', function () {
  return gulp
    .src(['src/index.js'])
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest('dist'));
});

gulp.task('sass', function () {
  var cssFilter = filter('**/*.css');
  return gulp
    .src(['src/*.scss', '!src/_*.scss'])
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(cssFilter)
    .pipe(autoprefixer({
      browsers: [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
      ]
    }))
    .pipe(gulp.dest('lib'))
    .pipe(minifyCss())
    .pipe(gulp.dest('dist'));
});

gulp.task('photoswipe', function () {
  return gulp
    .src([
      'node_modules/photoswipe/dist/photoswipe.css',
      'node_modules/photoswipe/dist/default-skin/default-skin.css'
    ])
    .pipe(concat('photoswipe.css'))
    .pipe(autoprefixer({
      browsers: [
        'ie >= 10',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 4.4',
        'bb >= 10'
      ]
    }))
    .pipe(gulp.dest('lib'))
    .pipe(minifyCss())
    .pipe(gulp.dest('dist'));
});

gulp.task('photoswipe:copy', function () {
  return gulp
    .src(['node_modules/photoswipe/dist/default-skin/**/*', '!node_modules/photoswipe/dist/**/*.{scss,css,js}'])
    .pipe(gulp.dest('lib'))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy', function () {
  return gulp
    .src(['src/**/*', '!src/**/*.{scss,js}'])
    .pipe(gulp.dest('lib'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build:lib', function (callback) {
  runSequence('clean', 'lint', 'babel', 'umd', 'sass', 'photoswipe', 'photoswipe:copy', 'copy', callback);
});


gulp.task('example:clean', function () {
  del.sync(['example/dist']);
});

gulp.task('example:webpack', function () {
  return gulp
    .src(['example/app/app.js'])
    .pipe(webpackStream(exampleWebpackConfig, webpack))
    .pipe(gulp.dest('example/dist'));
});

gulp.task('example:html', function () {
  var patterns = webpackStatsHelper.getReplacePatterns(path.join(__dirname, './example/dist/webpack.stats.json'));
  return gulp.src(['example/app/*.html'])
    .pipe(frep(patterns))
    .pipe(minifyHtml())
    .pipe(gulp.dest('example/dist'));
});

gulp.task('example:copy', function () {
  return gulp
    .src(['example/app/*', '!example/app/*.{html,js}'], {nodir: true})
    .pipe(gulp.dest('example/dist'));
});

gulp.task('build:example', function (callback) {
  runSequence('example:clean', 'example:webpack', 'example:html', 'example:copy', callback);
});

gulp.task('build', function (callback) {
  runSequence('build:lib', 'build:example', callback);
});
