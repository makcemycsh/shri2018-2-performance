const gulp        = require('gulp');
const watch       = require('gulp-watch'); // Более умный вотчер
const batch       = require('gulp-batch'); // Пачки задач
const plumber     = require('gulp-plumber'); // Обработка ошибок
const notify      = require('gulp-notify');
const browserSync = require('browser-sync').create();
const exec        = require('gulp-exec'); // Выполнение команд
const minimist    = require('minimist'); // Работа с аргументами команд

//
const twig = require('gulp-twig');
//
const sass = require('gulp-sass');

const sassGlob     = require('gulp-sass-glob');
const postcss      = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano      = require('cssnano');
const sourcemaps   = require('gulp-sourcemaps');
//
const babel        = require('gulp-babel');
const uglify       = require('gulp-uglify');
//
const imagemin     = require('gulp-imagemin');
const prettify     = require('gulp-html-prettify');


// Обработка ошибок
const handleError = (err) => {
  notify.onError({
    title:   'Gulp error',
    message: err.message,
  })(err);
};

// Обработка аргументов
const knownOptions = {
  string:  'env',
  default: {env: process.env.NODE_ENV || 'production'},
};

const options = minimist(process.argv.slice(2), knownOptions);

// 1. Девсервер на build/
gulp.task('server', () => {
  browserSync.init({
    server: {
      baseDir: 'build/',
    },
    host:   'localhost',
    port:   9000,
    notify: false,
  });
});
gulp.task('server:refresh', () => {
  browserSync.reload();
});
gulp.task('server:inject', () => {
  gulp.src('build/styles/**/*.*')
      .pipe(browserSync.stream());
});

// 2. Билды
gulp.task('build:html', () => {
  gulp.src([
    'src/pages/*.twig',
    'src/pages/*.html',
  ])
      .pipe(twig())
      .pipe(prettify({
        indent_char:           ' ',
        indent_size:           2,
        preserve_newlines:     true,
        max_preserve_newlines: 1,
        end_with_newline:      true,
        wrap_line_length:      80,
      }))
      .pipe(gulp.dest('build/'));
});
gulp.task('build:styles', () => {
  gulp.src('src/styles/*.scss')
  // .pipe(sourcemaps.init())
      .pipe(plumber(handleError))
      .pipe(sassGlob())
      .pipe(sass())
      .pipe(postcss([
        autoprefixer({
          browsers: ['last 2 version'],
          grid:     true,
        }),
        cssnano({
          zindex:       false,
          reduceIdents: false,
        }),
      ]))
  // .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('build/styles/'));
});
gulp.task('build:scripts', () => {
  gulp.src('src/scripts/vendor/*.js')
      // .pipe(uglify())
      .pipe(gulp.dest('build/scripts/vendor/'));

  gulp.src('src/scripts/*.js')
      .pipe(sourcemaps.init())
      .pipe(plumber(handleError))
      .pipe(babel({
        presets: ['env'],
      }))
      .pipe(uglify())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('build/scripts/'));
});
gulp.task('build:assets', () => {
  gulp.src('src/assets/fonts/**/*.*')
      .pipe(gulp.dest('build/assets/fonts/'));

  gulp.src('src/assets/other/**/*.*')
      .pipe(gulp.dest('build/assets/other/'));

  gulp.src('src/assets/img/**/*.*')
      .pipe(imagemin())
      .pipe(gulp.dest('build/assets/img/'));

  gulp.src('src/assets/favicon/**/*.*')
      .pipe(gulp.dest('build/assets/favicon/'));
});

// 3. Вотчеры
gulp.task('watch:build', ['server', 'build:html', 'build:styles', 'build:scripts', 'build:assets'], () => {
  watch([
    'src/pages/**/*.twig',
    'src/pages/**/*.html',
    'src/blocks/**/*.twig',
    'src/blocks/**/*.html',
  ], batch((e, end) => {
    gulp.start('build:html', end);
  }));

  watch([
    'src/styles/**/*.*',
    'src/blocks/**/*.scss',
  ], batch((e, end) => {
    gulp.start('build:styles', end);
  }));


  watch('src/scripts/**/*.*', batch((e, end) => {
    gulp.start('build:scripts', end);
  }));
  watch('src/assets/**/*.*', batch((e, end) => {
    gulp.start('build:assets', end);
  }));
});
gulp.task('watch:update', () => {
  watch([
    'build/*.html',
    'build/scripts/**/*.*',
    'build/assets/**/*.*',
  ], batch((e, end) => {
    gulp.start('server:refresh', end);
  }));

  watch('build/styles/**/*.css', batch((e, end) => {
    gulp.start('server:inject', end);
  }));
});

// 3. Shell-задачи
gulp.task('createBlock', () => {
  gulp.src('')
      .pipe(exec(`sh tasks/createBlock.sh ${options.name}`));
});
gulp.task('clearBuild', () => {
  gulp.src('')
      .pipe(exec('rm -rf build/'));
});

gulp.task('default', ['watch:build', 'watch:update']);
gulp.task('build', ['build:html', 'build:styles', 'build:scripts', 'build:assets']);
