const { src, dest, parallel, series } = require('gulp');
const unzip = require('gulp-unzip');
const each = require('gulp-each');
const path = require('path');
const cheerio = require('cheerio');
const yaml = require('js-yaml')
const rename = require('gulp-rename');
const dashify = require('dashify');

let nameMap = {};

const SingleParser = {
  _correctMeta(meta) {
    if (meta.identifier == '0a626b71-a222-4f15-9d42-dc814cf4e94d') {
      meta.title = `"Surely You're Joking, Mr. Feynman!": Adventures of a Curious Character`;
    }
  },

  extractMeta($, file) {
    let filepath = path.parse(file.history[0]);
    let filename = filepath.name;
    let meta = { filename };

    $('meta').each((i, tag) => {
      let { name, content } = tag.attribs;
      if (!name) return;
      meta[name.split('.')[1]] = content;
    });

    this._correctMeta(meta);

    return meta;
  },

  extractBody($) {
    this.correctLinks($);
    let html = $('.calibreEbookContent').html();
    html = html.replace(/\n\s*/g, '\n');
    html = html.replace(/\{\{/g, '\\{\\{');
    html = html.replace(/\}\}/g, '\\}\\}');
    return html;
  },

  extractNavigation($) {
    let nextEl = $('.calibreANext');
    nextEl.remove();

    let prevEl = $('.calibreAPrev');
    prevEl.remove();

    debugger;

    return {
      next: (nextEl.attr('href') || '').split('.')[0],
      prev: (prevEl.attr('href') || '').split('.')[0],
    }
  },

  correctPath(filepath) {
    if (!filepath) return;

    return filepath
      .replace(/(.{6})_files/, (_group, name) => `/book/${nameMap[name]}`)
      .replace(/\.html/, '')
      .replace(/^part/, '../part');
  },

  correctLinks($) {
    $('a').attr('href', (_i, filepath) => {
      return this.correctPath(filepath);
    });

    $('img').attr('src', (_i, filepath) => {
      return '../' + this.correctPath(filepath);
    });
  },
}

function unzipBooks() {
  return src('/Users/benhirsch/Calibre\ Library/**/*.zip')
    .pipe(unzip())
    .pipe(dest('gulp-src/tmp/books'));
}

function parsePages() {
  return src('gulp-src/tmp/books/*_files/**/*.{html,xhtml}', { base: 'gulp-src/tmp/books' })
    .pipe(each((content, file, cb) => {
      let $ = cheerio.load(content)

      let output = `---
${yaml.dump(SingleParser.extractNavigation($))}---

<div class="auto-generated">
${SingleParser.extractBody($)}
</div>
`
      cb(null, output);
    }))
    .pipe(rename(path => {
      path.dirname = SingleParser.correctPath(path.dirname);
    }))
    .pipe(dest('content/'));
}

function copyImages() {
  return src('gulp-src/tmp/books/*_files/**/*.jpeg', { base: 'gulp-src/tmp/books' })
    .pipe(rename(path => {
      path.dirname = SingleParser.correctPath(path.dirname);
    }))
    .pipe(dest('content/'));
}

function parseCover() {
  return src('gulp-src/tmp/books/*.html')
    .pipe(each((content, file, cb) => {
      let $ = cheerio.load(content)
      let meta = SingleParser.extractMeta($, file)

      nameMap[meta.filename] = dashify(meta.title).replace(/-+/g, '-');
      meta.book = true;

      let yamlDump = yaml.dump(meta);

      let output = `---
${yamlDump}---

<div class="auto-generated">
${SingleParser.extractBody($)}
</div>
`

      cb(null, output);
    }))
    .pipe(rename(path => {
      path.basename = nameMap[path.basename];
      path.extname = '.md';
    }))
    .pipe(dest('content/book/'));
}

exports.default = series(
  unzipBooks,
  // parallel(
  parseCover,
  parsePages,
  copyImages,
  // )
);
