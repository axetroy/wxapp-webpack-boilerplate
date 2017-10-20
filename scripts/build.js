/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const chokidar = require('chokidar');
const debounce = require('lodash.debounce');

const JsBuilder = require('./build-js');
const XmlBuilder = require('./build-xml');
const CssBuilder = require('./build-css');
const FileBuilder = require('./build-file');

const { query } = require('./utils');

const watch = process.env.NODE_WATCH;

function loadFile(file) {
  const f = path.parse(file);

  switch (f.ext) {
    case '.js':
    case '.jsx':
    case '.ts':
    case '.tsx':
      JsBuilder.load(file);
      break;
    case '.css':
    case '.scss':
    case '.less':
    case '.sass':
    case '.wxss':
      CssBuilder.load(file);
      break;
    case '.xml':
    case '.wxml':
      XmlBuilder.load(file);
      break;
    case '.json':
      FileBuilder.load(file);
      break;
    case '.yaml':
    case '.yml':
      FileBuilder.load(file);
      break;
    case '.pmg':
    case '.jpg':
    case '.gif':
      FileBuilder.load(file);
      break;
    default:
      FileBuilder.load(file);
  }
}

const build = debounce(async function build() {
  console.log(`Building program...`);

  try {
    const files = await query('src/**/*.*', {});

    // 加载所有文件
    while (files.length) {
      const file = files.shift();
      await loadFile(file);
    }

    // 真正的编译操作
    await Promise.all([
      JsBuilder.compile(),
      XmlBuilder.compile(),
      CssBuilder.compile(),
      FileBuilder.compile()
    ]);
  } catch (err) {
    console.error(err);
  }
}, 1000);

build();

if (watch) {
  // One-liner for current directory, ignores .dotfiles
  chokidar
    .watch('src', { ignored: /((^|[\/\\])\..)|___jb_tmp___/ })
    .on('add', path => {
      console.log(`File ${path} has been added`);
      build();
    })
    .on('change', path => {
      console.log(`File ${path} has been changed`);
      build();
    })
    .on('unlink', path => {
      console.log(`File ${path} has been removed`);
      build();
    });
}
