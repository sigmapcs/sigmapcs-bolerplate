import gulp from 'gulp'
import plumber from 'gulp-plumber'
import pug from 'gulp-pug'
import browserSync from 'browser-sync'
import sass from 'gulp-sass'
import postcss from 'gulp-postcss'
import cssnano from 'cssnano'
import watch from 'gulp-watch'
import browserify from 'browserify'
import babelify from 'babelify'
import source from 'vinyl-source-stream'
import sourcemaps from 'gulp-sourcemaps'
import buffer from 'vinyl-buffer'
import minify from 'gulp-minify'
import imagemin from 'gulp-imagemin'
import webp from 'gulp-webp'
import sitemap from 'gulp-sitemap'

const server = browserSync.create()

const production = false
const env = production ? 'prod' : 'dev'
const srcJs = production ? '.js' : '-min.js'
const minJs = production ? '-min.js' : '.js'

const postcssPlugins = [
  cssnano({
    core: true,
    zindex: false,
    autoprefixer: {
      add: true,
      browsers: '> 1%, last 2 versions, Firefox ESR, Opera 12.1'
    }
  })
]

const sassOptions = env === 'dev' ? {
  includePaths: ['node_modules'],
  sourceComments: true,
  outputStyle: 'expanded'
} : {
  includePaths: ['node_modules']
}

gulp.task('styles', () => {
  return env === 'dev'
    ? gulp.src('./dev/scss/styles.scss')
      .pipe(plumber())
      .pipe(sass(sassOptions))
      .pipe(gulp.dest('./public/css/'))
      .pipe(server.stream({match: '**/*.css'}))
    : gulp.src('./dev/scss/styles.scss')
      .pipe(plumber())
      .pipe(sass(sassOptions))
      .pipe(postcss(postcssPlugins))
      .pipe(gulp.dest('./public/css/'))
      .pipe(server.stream({match: '**/*.css'}))
})

gulp.task('pug', () =>
  gulp.src('./dev/pug/pages/**/*.pug')
    .pipe(plumber())
    .pipe(pug({
      pretty: !production,
      basedir: './dev/pug'
    }))
    .pipe(gulp.dest('./public'))
)

gulp.task('scripts', () =>
  browserify('./dev/js/index.js')
    .transform(babelify, {
      global: true // permite importar desde afuera (como node_modules)
    })
    .bundle()
    .on('error', function (err) {
      console.error(err)
      this.emit('end')
    })
    .pipe(source('scripts.js'))
    .pipe(buffer())
    .pipe(minify({
      ext: {
        src: srcJs,
        min: minJs
      }
    }))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
)

gulp.task('images', () => {
  gulp.src('./dev/img/**/**')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest('./public/img'))
})

gulp.task('webp', ()=> {
  gulp.src('./dev/images/**/*.{png,jpg,jpeg,PNG}')
    .pipe(webp())
    .pipe(gulp.dest('./public/img/webp'))
})

gulp.task('sitemap', () => {
  gulp.src('./public/**/*.html', {
    read: false
  })
    .pipe(sitemap({
      siteUrl: 'https://example.com' // remplazar por tu dominio
    }))
    .pipe(gulp.dest('./public'))
})

gulp.task('copy', function() {
  gulp.src('./dev/images/**/*.svg')
    .pipe(gulp.dest('./public/images'))
});

gulp.task('copyJS', function(){
  gulp.src('./dev/assets/js/**/*.js')
    .pipe(gulp.dest('./public/js'))
});

gulp.task('copyCSS', function(){
  gulp.src('./dev/assets/css/**/*.css')
    .pipe(gulp.dest('./public/css'))
});

gulp.task('copy-font', function() {
  gulp.src('./dev/fonts/**/*.*')
    .pipe(gulp.dest('./public/fonts'))
});

gulp.task('default', ['styles', 'pug', 'images', 'scripts', 'webp', 'copy-font', 'copyJS', 'copyCSS'], () => {
  server.init({
    server: {
      baseDir: './public'
    }
  })

  gulp.watch('./dev/images/**/*', ['images']);
  gulp.watch('./dev/images/**/*.svg', ['copy']);
  gulp.watch('./dev/fonts/**/*.*', ['copy-font']);
  gulp.watch('./dev/images/**/*', ['webp']);
  gulp.watch('./dev/assets/js/**/*.js', ['copyJS']);
  gulp.watch('./dev/assets/css/**/*.css', ['copyCss']);
  watch('./dev/pug/**/*.pug', ()=> gulp.start('pug',server.reload));
  watch('./dev/scss/**/*.scss', () => gulp.start('styles'));
  watch('./dev/js/**/*.js', () => gulp.start('scripts',server.reload) );
  watch('./dev/data/**/*.json','./dev/pug/**/*.pug', () => gulp.start('pug', server.reload) );
  watch('./dev/md/docs/**/*.md', () => gulp.start('pug', server.reload) );
  watch('./dev/images/**/*.{png,jpg,jpeg,gif}', () => gulp.start('images') );
  watch('./dev/images/**/*.{png,jpg,jpeg}', () => gulp.start('webp') );
  watch('./dev/assets/js/**/*.js', () => gulp.start('copyJS'));
  watch('./dev/assets/css/**/*.css', () => gulp.start('copyCSS'));
  watch('./dev/fonts/**/*.*', () => gulp.start('copy-font'));
})
