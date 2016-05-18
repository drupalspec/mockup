var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var harp = require('harp');
var csso = require('gulp-csso'); // Минификация CSS
var usemin = require('gulp-usemin');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var prettify = require('gulp-jsbeautifier');
var colorguard = require('gulp-colorguard');

var colorguardOptions = {
  // 0 through 100. Lower is more similar. Anything below 3 warns you.
  // 3 is the default threshold, but that's mostly personal opinion
  threshold: 2,
  // These color combinations are ignored (usually use this)
  whitelist: [
    ["#1fc1ad", "#01c2ad"],
    ["#1fc1ad", "#00c1ae"],
    ["#01c2ad", "#00c1ae"],
    ["#6d4d52", "#6c4d52"],
    ["#64ded1", "#6bddd1"],
    ["#64ded1", "#65ded0"],
    ["#d1f5f1", "#ccf3ef"],
    ["#cdcdcd", "#cccccc"],
    ["#6bddd1", "#65ded0"],
    ["#ffddda", "#ffdeda"],
    ["#dcdcdc", "#dddddd"],
    ["#c8c8c8", "#cccccc"],
    ["#fedad5", "#ffdcd6"]
  ]
}

// Handle the error
function errorHandler (error) {
  console.log(error.toString());
  this.emit('end');
}

/**
 * Serve the Harp Site from the src directory
 */
gulp.task('serve', function () {
    harp.server(__dirname, {
        port: 9000
    }, function () {
        browserSync({
            proxy: "localhost:9000",
            open: false,
            /* Hide the notification. It gets annoying */
            notify: {
                styles: ['opacity: 0', 'position: absolute']
            }
        });
        /**
         * Watch for css changes, tell BrowserSync to refresh all css
         */
        gulp.watch("public/assets/css/**/*.*", function () {
            reload("public/assets/css/**/*.*", {stream: true});
        });
        /**
         * Watch for js changes, tell BrowserSync to refresh all page
         */
        gulp.watch("public/**/*.js", function () {
            reload();
        });
        /**
         * Watch for all other changes, reload the whole page
         */
        gulp.watch(["public/**/*.jade"], function () {
            reload();
        });
        gulp.watch(["public/**/*.ejs"], function () {
            reload();
        });
    })
});

gulp.task('build', function () {
    harp.compile(__dirname, function(){
        gulp.start(['concat', 'optimize', 'colorGuard']);
    });
});

gulp.task('concat', function () {
    return gulp.src('./www/*.html')
        .pipe(usemin({
            css: [],
            js: [],
            html: [prettify({html: {unformatted: ["sub", "sup", "b", "i", "u"]}})]
        }))
        .pipe(gulp.dest('./www'));
});

gulp.task('optimize', ['concat'], function () {
    var css = gulp.src(['./www/css/*.css', '!./www/css/*.min.css'])
        .pipe(csso())
        .pipe(prettify())
        .on('error', errorHandler)
        .pipe(gulp.dest('./www/css'));

    var cssmin = gulp.src('./www/css/*.min.css')
        .pipe(csso())
        .pipe(minifyCss())
        .on('error', errorHandler)
        .pipe(gulp.dest('./www/css'));

    var js = gulp.src(['./www/js/*.js', '!./www/js/*.min.js','!./www/js/libs/**/*.js'])
        .pipe(prettify())
        .on('error', errorHandler)
        .pipe(gulp.dest('./www/js'));

    var jsmin = gulp.src('./www/js/*.min.js')
        .pipe(uglify())
        .on('error', errorHandler)
        .pipe(gulp.dest('./www/js'));

    return merge(cssmin, css, jsmin, js);
});

gulp.task('colorGuard', ['optimize'], function () {
    gulp.src(['./www/css/main.css','./www/css/base.min.css'])
      .pipe(colorguard(colorguardOptions))
      .on('error', errorHandler);
});

/**
 * Default task, running `gulp` will fire up the Harp site,
 * launch BrowserSync & watch files.
 */
gulp.task('default', ['serve']);
gulp.task('compile', ['build']);