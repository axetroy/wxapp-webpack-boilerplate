/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const fs = require('fs');
const babel = require('babel-core');
const utils = require('./utils');

const CONFIG = require('./config');

const PATHS = {
  build: 'build',
  src: 'src'
};

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

    this.modules.forEach((file, i) => {
      modules += `
  WEBPACK_MODULE[${file.id}] = function() {
      return require(".${utils.unixify(path.join(PATHS.src, file.path))}");
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

module.exports = function(options) {
  glob('src/**/*.js', {}, function(err, files) {
    if (err) throw err;

    files = files.map(f => {
      const file = f.replace(/^(\/+)?src/, '');
      WEBPACK_MODULE.addModule(file);
      return file;
    });

    const app = fs.readFileSync('./src/app.js', 'utf8');

    fs.writeFileSync('./temp.js', WEBPACK_MODULE.generate(), {
      encoding: 'utf8'
    });

    webpack(
      {
        entry: './temp.js',
        output: {
          path: paths.dist,
          filename: 'main.js',
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
              loader: 'babel-loader'
            }
          ]
        }
      },
      function(err) {
        if (err) throw err;

        // 把其他js文件移动到build目录下

        files.forEach(file => {
          const id = WEBPACK_MODULE.getFileId(file);

          const distFile = path.join(PATHS.build, file);

          function getRelative(file) {
            const mainPath = path.join(PATHS.build, 'main.js');
            const filePath = path.join(PATHS.build, file);
            return utils
              .unixify(path.relative(filePath, mainPath))
              .replace(/^\.\.\//, './')
              .replace(/^\/?\.+\/?/, './');
          }
          fs.writeFileSync(
            distFile,
            `require("${getRelative(file).replace(/\.js$/, '')}")(${id});`,
            'utf8'
          );
          console.log(`[编译]: ${file}`);
        });
      }
    );
  });
};
