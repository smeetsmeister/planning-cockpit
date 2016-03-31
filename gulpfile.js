var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var ts = require('gulp-typescript');
var del = require('del');
var tslint = require('gulp-tslint');
var browserify = require('browserify');
var tsify = require('tsify');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var postcss = require('gulp-postcss');
var path = require('path');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');

var configTypescript = require('./tsconfig.json').compilerOptions;
configTypescript.typescript = require('typescript');

var externals = ['maquette', 'whatwg-fetch'];

var handleError = undefined;

var setWatching = function (notify) {
  var gulp_src = gulp.src;
  handleError = function(error) {
    if (error) {
      console.error('Error: ' + error.message);
      if (notify) {
        notify(error.message);
      }
    } else {
      console.error('Error');
      if (notify) {
        notify('Error');
      }
    }
  };
  gulp.src = function() {
    return gulp_src.apply(gulp, arguments)
      .pipe(plumber(handleError));
  };
};

gulp.task('clean-tests', function (callback) {
  return del(['build/js/test/*'], callback);
});

gulp.task('clean', function (callback) {
  return del(['build/*'], callback);
});

var build = exports.build = function () {
  var tsProject = ts.createProject(configTypescript);
  var filesGlob = ['typings/**/*.d.ts', 'src/**/*.ts', 'test/**/*.ts'];
  var files = gulp.src(filesGlob, { base: '.' })
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject));
  return files
    .pipe(sourcemaps.write('.', {
      includeContent: false,
      sourceRoot: function (file) {
        return file.relative.split(path.sep).map(function () {
            return '..'
          }).join('/') + '/../';
      }
    }))
    .pipe(gulp.dest('build/js'));
};

gulp.task('build', build);

gulp.task('clean-tests-and-build', ['clean-tests'], build);



var postCss = function () {
  return gulp.src('./src/client/**/*.css')
    .pipe(sourcemaps.init())
    .pipe(concat('styles.css'))
    .pipe(postcss([
      require('autoprefixer'),
      require('postcss-custom-properties')
    ]))
    .pipe(sourcemaps.write('.', {sourceRoot: './src/client'}))
    .pipe(gulp.dest('./build/web'))
};
gulp.task('postcss', postCss);


gulp.task('test', ['clean-tests-and-build'], function () {
  gulp
    .src('build/js/test/**/*.js', { read: false })
    .pipe(mocha());
});


var bundleTypescript = function () {
  var bundler = browserify({
    basedir: '.',
    debug: true,
    standalone: 'main'
  })
    .add('src/client/main.ts')
    .plugin(tsify, configTypescript);

  externals.forEach(function (external) {
    bundler.exclude(external);
  });

  return (handleError ? bundler.bundle().on('error', handleError) : bundler.bundle())
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(sourcemaps.write('./', { sourceRoot: '.' }))
    .pipe(gulp.dest('build/web'));
};

gulp.task('bundle-typescript', bundleTypescript);


var lint = function () {
  var globs = ['src/**/*.ts', 'test/**/*.ts'];
  return gulp.src(globs, {base: '.'})
    .pipe(tslint())
    .pipe(tslint.report('prose', {
      emitError: true
    }));
};
gulp.task('lint', lint);


gulp.task('format', [], function (cb) {
  var tsfmt = require('typescript-formatter/lib/index');
  var globs = ['src/**/*.ts', 'test/**/*.ts'];
  var files = [];
  gulp.src(globs)
    .on('data', function (file) {
      files.push(file.path);
    })
    .on('end', function () {
      tsfmt.processFiles(files, { replace: true, verbose: false, baseDir: process.cwd(), editorconfig: true, tslint: true, tsfmt: true })
        .then(function (resultList) {
          Object.keys(resultList).forEach(function (key) {
            var result = resultList[key];
            if (result.message) {
              console.log(result.message);
            }
          });
          cb();
        }, cb);
    })
});

gulp.task('verify-format', [], function (cb) {
  var tsfmt = require('typescript-formatter/lib/index');
  var globs = ['src/**/*.ts', 'test/**/*.ts'];
  var files = [];
  gulp.src(globs)
    .on('data', function (file) {
      files.push(file.path);
    })
    .on('end', function () {
      tsfmt.processFiles(files, { verify: true, verbose: false, baseDir: process.cwd(), editorconfig: true, tslint: true, tsfmt: true })
        .then(function (resultList) {
          var unformattedFiles = [];
          Object.keys(resultList).forEach(function (key) {
            var result = resultList[key];
            if (result.error) {
              unformattedFiles.push(result.fileName);
            }
          });
          if (unformattedFiles.length === 0) {
            cb();
          } else {
            cb('The following files were not formatted:\r\n  ' + unformattedFiles.join('\r\n  '));
          }
        }, cb);
    })
});

gulp.task('bundle-external', false, function () {
  var b = browserify({debug: false});
  externals.forEach(function (external) {
    b.require(external, {expose: external});
  });

  return b.bundle()
    .pipe(source('vendor.js'))
    .pipe(buffer())
    .pipe(gulp.dest('build/web'));
});

gulp.task('web', ['bundle-typescript', 'postcss', 'bundle-external']);

gulp.task('serve', ['web'], function() {
  var browserSync = require('browser-sync');
  var bs = null; // Browsersync instance
  bs = browserSync.create();
  bs.init({
    port: 11011,
    ui: { port: 3011 },
    ghostMode: false,
    server: {
      baseDir: ['build/web', 'src/client', 'src/fake-server']
    }
  });
  setWatching(function(notifyMessage) {
    bs.notify(notifyMessage, 9999999999);
  });
  gulp.watch(['src/client/**/*.css'], function () {
    bs.notify('Post processing css...');
    return postCss().pipe(bs.stream());
  });
  gulp.watch(['src/**/*.ts'], function () {
    bs.notify('Compiling typescript...');
    bundleTypescript().pipe(bs.stream());
  });
});

gulp.task('default', ['test', 'verify-format', 'lint', 'web']);