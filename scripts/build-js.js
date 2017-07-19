/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const webpack = require('webpack');
const fs = require('fs-extra');
const babel = require('babel-core');
const co = require('co');
const utils = require('./utils');

const CONFIG = require('./config');

const paths = CONFIG.paths;

class Module {
  constructor() {
    this.id = 0;
    this.modules = [];
  }
  addModule(filePath) {
    this.modules.push({ path: filePath, id: this.id });
    this.id++;
  }
  getFileId(filePath) {
    const m = this.modules.find(
      m => utils.unixify(m.path) === utils.unixify(filePath)
    );
    if (!m) return null;
    return m.id;
  }
  generate() {
    let modules = ``;

    this.modules.forEach(file => {
      modules += `
  /**
  Generate By Webpack Module
  FILE: ${file.path}
  ID: ${file.id}
  **/
  WEBPACK_MODULE[${file.id}] = function() {
      return require("../src/${utils.unixify(file.path)}");
  };
        `;
    });

    return `
module.exports = function(moduleId) {
  const WEBPACK_MODULE = {};

  ${modules}

  return WEBPACK_MODULE[moduleId] ? WEBPACK_MODULE[moduleId]() : {};
};
    `;
  }
}

const WEBPACK_MODULE = new Module();

const WEBPACK_BUNDLE_NAME = 'm.js';
const WEBPACK_TEMP_FILE = './.temp/m.js';

const WEBPACK_CONFIG = {
  entry: WEBPACK_TEMP_FILE,
  output: {
    path: paths.dist,
    filename: WEBPACK_BUNDLE_NAME,
    library: 'g',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.coffee', '.js', '.ts']
  },
  module: {
    loaders: [
      {
        test: /\.(jsx|js)?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: [
            'flow',
            [
              'es2015',
              {
                modules: false
              }
            ]
          ],
          plugins: []
        }
      }
    ]
  }
};

// 生成js文件相对于main.js的路径，要require这个main.js
function getRelative(file) {
  const mainPath = path.join(paths.dist, WEBPACK_BUNDLE_NAME);
  const filePath = path.join(paths.dist, file);
  return utils
    .unixify(path.relative(filePath, mainPath))
    .replace(/^\.\.\//, './')
    .replace(/^\/?\.+\/?/, './');
}

class Builer {
  constructor() {
    this.files = [];
  }
  load(filePath) {
    this.files.push(filePath);
  }
  compile() {
    const files = this.files.map(file => {
      file = file.replace(/^(\/+)?src/, '').replace(/^\/+/, '');
      WEBPACK_MODULE.addModule(file);
      return file;
    });

    return co(function*() {
      // 创建缓存文件
      const tempFile = path.join(paths.root, WEBPACK_TEMP_FILE);
      yield fs.ensureFile(tempFile);

      yield fs.writeFile(tempFile, WEBPACK_MODULE.generate(), 'utf8');

      // 打包缓存文件
      yield new Promise((resolve, reject) => {
        webpack(WEBPACK_CONFIG, function(err) {
          if (err) return reject(err);
          resolve();
        });
      });

      const __files__ = [].concat(files);

      while (__files__.length) {
        const file = __files__.shift();
        const id = WEBPACK_MODULE.getFileId(file);

        const distFile = path.join(paths.dist, file);

        yield fs.ensureFile(distFile);

        const requireFile = getRelative(file).replace(/\.js$/, '');

        yield fs.writeFile(
          distFile,
          `require("${requireFile}")(${id});`,
          'utf8'
        );
        console.log(`[JS]: ${file}`);
      }

      console.log(`[JS]: Done!`);
    }).catch(err => {
      console.error(err);
    });
  }
}

module.exports = new Builer();
