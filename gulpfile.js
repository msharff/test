var gulp = require('gulp');
var sass = require('gulp-sass');
var del = require('del');
var runSequence = require('run-sequence');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var nunjucksRender = require('gulp-nunjucks-render');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var data = require('gulp-data');
var spritesmith = require('gulp.spritesmith');
var gulpIf = require('gulp-if');
var scssLint = require('gulp-scss-lint');
var sassLint = require('gulp-sass-lint');
var fs = require('fs');
var Server = require('karma').Server;
var gutil = require('gulp-util');

//function errorHandler(err) {
//logs out error in the command line
//console.log(err,toString());
//Ends the current pipe, so Gulp watch doesnt stop
//this.emit('end');
//}

// Custom Plumber function for catching errors
function customPlumber(errTitle) {
  'use strict';
if (process.env.CI) {
return plumber({
errorHandler: function(err) {
  // Changes first line of error into red
throw Error(gutil.colors.red(err.message));
}
});
} else {
return plumber({
errorHandler: notify.onError({
// Customizing error title
title: errTitle || 'Error running Gulp',
message: 'Error: <%= error.message %>',
})
});
}
}

// function customPlumber(errTitle) {
//   'use strict';
//   return plumber({
//     errorHandler: notify.onError({
//       // Customing error title
//       title: errTitle || 'Error running Gulp',
//       message: 'Error: <%= error.message %>',
//       sound: 'Glass'
//     })
//   });
// }

gulp.task('watch-js', ['lint:js'], browserSync.reload);

gulp.task('watch', function() {
  'use strict';
  gulp.watch('app/js/**/*.js', ['watch-js']);
  gulp.watch('app/scss/**/*.scss', ['sass', 'lint:sass']);
  gulp.watch([
    'app/pages/**/*.+(html|nunjucks)',
    'app/templates/**/*',
    'app/data.json'
  ], ['nunjucks']);
});

gulp.task('sass', function() {
  'use strict';
  return gulp.src('app/scss/**/*.scss')
  .pipe(customPlumber('Error Running Sass'))
  .pipe(sourcemaps.init())
  .pipe(sass({
    precision: 2,
    includePaths: ['app/bower_components']
  }))
  //Runs prefixer
  .pipe(autoprefixer({browsers:
  ['ie 8', 'last 2 versions', 'Firefox ESR', 'Opera 12.1']}))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('app/css'))
  //Tells Browser Sync to reload files task is done
  .pipe(browserSync.reload({
    stream: true
  }));
});

gulp.task('lint:scss', function() {
  'use strict';
  return gulp.src('app/scss/**/*.scss')
  .pipe(scssLint({
    config: '.scss-lint.yml'
  }));
});

gulp.task('lint:sass', function() {
    'use strict';
    return gulp.src('app/scss/**/*.scss')
        .pipe(sassLint({
            config: '.sass-lint.yml'
          }))
        .pipe(sassLint.format())
        .pipe(sassLint.failOnError());
  });


gulp.task('browserSync', function() {
  'use strict';
  browserSync({
    server: {
      baseDir: 'app'
    },
    //proxy: "mamphost:80",
    browser: ['google chrome', 'firefox', 'safari']
  });
});

//Gulp watch syntax

gulp.task('sprites', function() {
  'use strict';
  gulp.src('app/images/sprites/**/*')
  .pipe(spritesmith({
    cssName: '_sprites.scss', //CSS file
    imgName: 'sprites.png', // Imagefile
    imgPath: '../images/sprites.png',
    retinaSrcFilter: 'app/images/sprites/*@2x.png',
    retinaImgName: 'sprites@2x.png',
    retinaImgPath: '../images/sprites@2x.png'
  }))
  .pipe(gulpIf('*.png', gulp.dest('app/images')))
  .pipe(gulpIf('*.scss', gulp.dest('app/scss')));
});

gulp.task('nunjucks', function() {
  'use strict';
  return gulp.src('app/pages/**/*.+(html|nunjucks)')
    .pipe(customPlumber('Error Running Nunjucks'))
    .pipe(data(function() {
      return JSON.parse(fs.readFileSync('./app/data.json'));
    }))
    .pipe(nunjucksRender({
      path: ['app/templates']
    }))
    .pipe(gulp.dest('app'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('clean:dev', function() {
  'use strict';
  return del.sync([
'app/css',
//'app/*.html'
  ]);
});

gulp.task('default', function(callback) {
  'use strict';
  runSequence('clean:dev',
  ['sprites', 'lint:js', 'lint:scss'],
  ['sass', 'nunjucks'],
  ['browserSync', 'watch'],
  callback
  );
});

gulp.task('lint:js', function() {
  'use strict';
  return gulp.src('app/js/**/*.js')
  .pipe(customPlumber('JSHint Error'))
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail', {
    ignoreWarning: true,
    ignoreInfo: true
  }))
  .pipe(jscs({
    fix: true,
    configPath: '.jscsrc'
  }))
  .pipe(gulp.dest('app/js'));
});

gulp.task('test', function(done) {
  'use strict';
  new Server({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('dev-ci', function(callback){
  'use strict';
  runSequence(
    'clean:dev',
    ['sprites', 'lint:js', 'lint:scss'],
    ['sass', 'nunjucks'],
    callback
        );
});
