/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const webpack = require('webpack');
const fs = require('fs-extra');
const babel = require('babel-core');
const utils = require('./utils');

const CONFIG = require('./config');

const paths = CONFIG.paths;

class Module {
  constructor() {
    this.id = 0;
    this.modules = [];
  }
  addModule(filePath) {
    // 避免重复添加模块
    if (this.modules.findIndex(module => module.path === filePath) >= 0) {
      return;
    }
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
  file: ${file.path}
  id: ${file.id}
  **/
  WEBPACK_MODULE[${file.id}] = function() {
      return require("../src/${utils.unixify(file.path)}");
  };
        `;
    });

    return `// Generate By Webpack Module
module.exports = function(moduleId) {
  const WEBPACK_MODULE = {};

  ${modules}

  return WEBPACK_MODULE[moduleId] ? WEBPACK_MODULE[moduleId]() : {};
};`;
  }
}

const WEBPACK_MODULE = new Module();

const WEBPACK_BUNDLE_NAME = 'm.js';
const WEBPACK_TEMP_FILE = './.temp/m.js';

/**
 * 打包Javascript
 * @param inputFile
 * @param outputFile
 * @returns {Promise}
 */
function packJs(inputFile, outputFile) {
  const outputPathInfo = path.parse(outputFile);
  const WEBPACK_CONFIG = {
    entry: inputFile,
    output: {
      path: outputPathInfo.dir,
      filename: outputPathInfo.name + outputPathInfo.ext,
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
  };
  // 使用webpack打包缓存文件
  return new Promise((resolve, reject) => {
    webpack(WEBPACK_CONFIG, function(err, stdout) {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * 转换Javascript
 * @param inputFile
 * @param outputFile
 * @returns {Promise.<void>}
 */
async function transformJs(inputFile, outputFile) {
  const result = await new Promise((resolve, reject) => {
    babel.transformFile(
      inputFile,
      {
        env: process.env,
        presets: ['env'],
        plugins: []
      },
      function(err, result) {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
  await fs.ensureFile(outputFile);
  await fs.writeFile(
    outputFile,
    `// wrapper start
;(function(){


${result.code}


// wrapper end
})();`
  );
}

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
  clear() {
    this.files = [];
  }
  load(filePath) {
    if (this.files.findIndex(v => v === filePath) >= 0) {
      return;
    }
    this.files.push(filePath);
  }
  async compile() {
    // 最终输出的js包文件
    const MAIN_FILE_PATH = path.join(CONFIG.paths.dist, WEBPACK_BUNDLE_NAME);

    try {
      const files = this.files.map(file => {
        file = path.relative(CONFIG.paths.src, file);
        WEBPACK_MODULE.addModule(file);
        return file;
      });

      // 创建缓存文件
      const tempFile = path.join(paths.root, WEBPACK_TEMP_FILE);
      await fs.ensureFile(tempFile);
      await fs.writeFile(tempFile, WEBPACK_MODULE.generate(), 'utf8');

      await packJs(tempFile, MAIN_FILE_PATH);

      await transformJs(MAIN_FILE_PATH, MAIN_FILE_PATH);

      // 把各文件移动到build目录下
      const __files__ = [].concat(files);

      while (__files__.length) {
        const file = __files__.shift();
        // 获取该文件对应的id
        const id = WEBPACK_MODULE.getFileId(file);

        // 最终输出文件路径
        const distFile = path.join(paths.dist, file);

        await fs.ensureFile(distFile);

        // 引用主体包
        const requireFile = path.normalize(
          getRelative(file).replace(/\.js$/, '')
        );

        // 写入文件
        await fs.writeFile(
          distFile,
          `require("${requireFile}")(${id});`,
          'utf8'
        );
        console.info(`[JS]: ${file}`);
      }

      console.info(`[JS]: Done!`);
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = new Builer();
