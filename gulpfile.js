const config = require("./config.json");

const gulp = require("gulp");
const del = require("del");
const concat = require("gulp-concat");

const browserSync = require("browser-sync");

// STYLES
// MESSAGE TO FUTURE ME. DON'T USE A PREPROCESSOR, THEY WILL STOP BEING
// MAINTAINED AND IT WILL BREAK YOUR HEART. Press F to pay your respects to
// stylus

const cleancss = require("gulp-cleancss");
const postcss = require("gulp-postcss");
const cssnext = require("postcss-cssnext");
const tailwindcss = require("tailwindcss");
const postcssImport = require("postcss-import");

gulp.task("clean:styles", () => del(config.styles.dist));

gulp.task(
  "styles",
  gulp.series("clean:styles", () => {
    return gulp
      .src(["./src/styles/**/*.css", "!./src/styles/**/_*.css"])
      .pipe(concat("app.min.css"))
      .pipe(postcss([postcssImport(), tailwindcss("./tailwind.js"), cssnext()]))
      .pipe(cleancss())
      .pipe(gulp.dest(config.styles.dist));
  })
);

// IMAGES

gulp.task("clean:images", () => del(config.images.dist));

gulp.task(
  "images",
  gulp.series("clean:images", () => {
    return gulp
      .src(config.images.src, {
        since: gulp.lastRun(images)
      })
      .pipe(
        imagemin({
          progressive: true
        })
      )
      .pipe(gulp.dest(config.images.dist));
  })
);

// SCRIPTS

gulp.task("clean:scripts", () => del(config.scripts.dist));

gulp.task(
  "scripts",
  gulp.series("clean:scripts", () => {
    return gulp
      .src(config.scripts.src)
      .pipe(concat("app.min.js"))
      .pipe(gulp.dest(config.scripts.dist));
  })
);

// CONTENT

const Metalsmith = require("metalsmith");
const markdown = require("metalsmith-markdown");
const layouts = require("metalsmith-layouts");
const permalinks = require("metalsmith-permalinks");

gulp.task("metalsmith", cb => {
  Metalsmith(__dirname)
    .source("./src/content")
    .clean(false)
    .use(markdown())
    .use(
      layouts({
        directory: "templates"
      })
    )
    .use(
      permalinks({
        pattern: ":title"
      })
    )
    .destination(config.content.dist)
    .build(err => {
      if (err) console.error(err);
      console.log("finished");
      cb();
    });
});

gulp.task("clean:dist", cb => {
  return del(config.content.dist, cb);
});

// NETLIFYMCS

const yamlinc = require("gulp-yaml-include");

gulp.task("clean:netlifycms", cb => {
  return del("./dist/admin", cb);
});

const moveNetlifyIndex = () => {
  return gulp.src("./src/admin/index.html").pipe(gulp.dest("./dist/admin"));
};

gulp.task("netlify-config", () => {
  return gulp
    .src("./src/admin/config.yml")
    .pipe(yamlinc())
    .pipe(gulp.dest("./dist/admin"));
});

gulp.task("netlifycms", gulp.series(moveNetlifyIndex, "netlify-config"));

// BUILD

gulp.task(
  "build",
  gulp.series("clean:dist", "styles", "metalsmith", "netlifycms")
);

// DEV SERVER

const reload = cb => {
  browserSync.reload();
  cb();
};
gulp.task("watch", cb => {
  gulp.watch(
    ["gulpfile.js", "config.json"],
    gulp.series(gulp.parallel("styles"), "metalsmith", reload)
  );
  gulp.watch(config.styles.src, gulp.series("styles", "metalsmith", reload));

  gulp.watch(config.content.src, gulp.series("metalsmith", reload));

  gulp.watch("./src/admin/**/*.yml", gulp.series("netlify-config", reload));

  cb();
});

gulp.task("server", () => {
  browserSync.init({
    server: {
      baseDir: "./dist"
    },
    ui: {
      port: 8080
    }
  });
});

gulp.task("serve", gulp.series("build", "watch", "server"));
