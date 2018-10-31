const gulp = require('gulp');
const watch = require('gulp-watch'); // Более умный вотчер
const batch = require('gulp-batch'); // Пачки задач
const plumber = require('gulp-plumber'); // Обработка ошибок
const notify = require('gulp-notify');
const browserSync = require('browser-sync').create();
const minimist = require('minimist'); // Работа с аргументами команд

//

const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');
//
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
//
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const prettify = require('gulp-html-prettify');
const svgSprite = require('gulp-svg-sprite');


// Обработка ошибок
const handleError = (err) => {
  notify.onError({
    title: 'Gulp error',
    message: err.message,
  })(err);
};

// Обработка аргументов
const knownOptions = {
  string: 'env',
  default: {env: process.env.NODE_ENV || 'production'},
};

const options = minimist(process.argv.slice(2), knownOptions);

// 1. Девсервер на docs/
gulp.task('server', () => {
  browserSync.init({
    server: {
      baseDir: 'docs/',
    },
    host: 'localhost',
    port: 9000,
    notify: false,
  });
});
gulp.task('server:refresh', () => {
  browserSync.reload();
});
gulp.task('server:inject', () => {
  gulp.src('docs/styles/**/*.*').pipe(browserSync.stream());
});

// 2. Билды
gulp.task('docs:html', () => {
  gulp.src([
    'src/pages/*.html',
  ]).pipe(prettify({
    indent_char: ' ',
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 1,
    end_with_newline: true,
    wrap_line_length: 80,
  })).pipe(gulp.dest('docs/'));
});
gulp.task('docs:styles', () => {
  gulp.src('src/styles/*.css').pipe(plumber(handleError)).pipe(postcss([
    cssnano({
      zindex: false,
      reduceIdents: false,
      discardUnused: false,
    }),
  ])).pipe(gulp.dest('docs/styles/'));
});
gulp.task('docs:scripts', () => {

  gulp.src('src/scripts/*.js').pipe(plumber(handleError)).pipe(babel({
    presets: ['env'],
  })).pipe(uglify()).pipe(gulp.dest('docs/scripts/'));
});
gulp.task('docs:assets', () => {
  gulp.src('src/fonts/**/*.*').pipe(gulp.dest('docs/fonts/'));

  // gulp.src('src/assets/img/**/*.*')
  // .pipe(imagemin())
  // .pipe(gulp.dest('docs/assets/img/'));

  // gulp.src('src/assets/img/**/*.jpg')
  // .pipe(imagemin())
  // .pipe(webp({quality: 50, method:6}))
  // .pipe(gulp.dest('docs/assets/img/'));
  //
  // gulp.src('src/assets/img/**/*.png')
  // .pipe(imagemin())
  // .pipe(webp({quality: 50, method:6}))
  // .pipe(gulp.dest('docs/assets/img/'));
  //
  // gulp.src('src/assets/img/**/*.svg')
  // .pipe(imagemin())
  // .pipe(gulp.dest('docs/assets/img/'));
});

// 3. Вотчеры
gulp.task('watch:docs', ['server', 'docs:html', 'docs:styles', 'docs:scripts', 'docs:assets'], () => {
  watch([
    'src/pages/**/*.html',
    'src/blocks/**/*.html',
  ], batch((e, end) => {
    gulp.start('docs:html', end);
  }));

  watch([
    'src/styles/**/*.*',
  ], batch((e, end) => {
    gulp.start('docs:styles', end);
  }));


  watch('src/scripts/**/*.*', batch((e, end) => {
    gulp.start('docs:scripts', end);
  }));
  watch('src/assets/**/*.*', batch((e, end) => {
    gulp.start('docs:assets', end);
  }));
});
gulp.task('watch:update', () => {
  watch([
    'docs/*.html',
    'docs/scripts/**/*.*',
    'docs/assets/**/*.*',
  ], batch((e, end) => {
    gulp.start('server:refresh', end);
  }));

  watch('docs/styles/**/*.css', batch((e, end) => {
    gulp.start('server:inject', end);
  }));
});

gulp.task('default', ['watch:docs', 'watch:update']);
gulp.task('docs', ['docs:html', 'docs:styles', 'docs:scripts', 'docs:assets']);
