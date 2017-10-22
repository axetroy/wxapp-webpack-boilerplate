/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const webpack = require('webpack');
const fs = require('fs-extra');
const babel = require('babel-core');
const utils = require('./utils');
const Builder = require('./Builder');

const CONFIG = require('./config');

const paths = CONFIG.paths;

// 打包的文件
const BUNDLE_PATH = path.join(paths.dist, 'm.js');
// 创建缓存文件
const TEMP_JS_FILE = path.join(paths.temp, 'temp.js');

class Module {
  constructor() {
    this.id = 0;
    this.modules = [];
  }
  load(filePath) {
    filePath = path.normalize(filePath);
    // 避免重复添加模块
    if (this.modules.findIndex(module => module.path === filePath) >= 0) {
      return;
    }
    this.modules.push({ path: filePath, id: this.id });
    this.id++;
  }
  unload(filePath) {
    const index = this.modules.findIndex(v => v.path === filePath);
    if (index >= 0) {
      this.modules.splice(index, 1);
    }
  }
  getFileId(filePath) {
    const m = this.modules.find(
      m => utils.unixify(m.path) === utils.unixify(filePath)
    );
    if (!m) return null;
    return m.id;
  }
  get content() {
    const templates = this.modules.map(file => {
      return `
  /**
  Generate By Webpack Module
  file: ${file.path}
  id: ${file.id}
  **/
  webpackModule[${file.id}] = () => require("${utils.unixify(
        path.relative(paths.temp, file.path)
      )}");`;
    });

    return `// Generate By Webpack Module
module.exports = function(moduleId) {
  const webpackModule = {};
  ${templates.join('\n')}

  return webpackModule[moduleId] ? webpackModule[moduleId]() : {};
};`;
  }
}

const webpackModule = new Module();

/**
 * 打包Javascript
 * @param inputFile
 * @param outputFile
 * @param plugins
 * @returns {Promise}
 */
function packJs(inputFile, outputFile, plugins = []) {
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
    },
    plugins: plugins.filter(v => v)
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
        plugins: [
          [
            'transform-runtime',
            {
              helpers: false,
              polyfill: false,
              regenerator: true,
              moduleName: 'babel-runtime'
            }
          ]
        ]
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
  return utils
    .unixify(path.relative(file, BUNDLE_PATH))
    .replace(/^\.\.\//, './')
    .replace(/^\/?\.+\/?/, './');
}

class JsBuilder extends Builder {
  constructor() {
    super();
  }
  load(filePath) {
    super.load(filePath);
    webpackModule.load(filePath);
  }
  unload(filePath) {
    super.load(filePath);
    webpackModule.unload(filePath);
  }
  async compile() {
    try {
      // 把各文件移动到build目录下
      const files = [].concat(Object.keys(this.files));

      // write temp js file
      await fs.ensureFile(TEMP_JS_FILE);
      await fs.writeFile(TEMP_JS_FILE, webpackModule.content, 'utf8');

      await packJs(TEMP_JS_FILE, BUNDLE_PATH);

      await transformJs(BUNDLE_PATH, BUNDLE_PATH);

      await packJs(BUNDLE_PATH, BUNDLE_PATH, [
        CONFIG.isProduction
          ? new webpack.optimize.UglifyJsPlugin({
              compress: {
                warnings: false,
                drop_console: false
              }
            })
          : void 0,
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`
        })
      ]);

      while (files.length) {
        const absSourceFilePath = files.shift();
        const relativeSourceFilePath = path.relative(
          CONFIG.paths.src,
          absSourceFilePath
        );
        const absDistFilePath = path.join(
          CONFIG.paths.dist,
          relativeSourceFilePath
        );

        // 获取该文件对应的id
        const id = webpackModule.getFileId(absSourceFilePath);

        // 确保输出文件存在
        await fs.ensureFile(absDistFilePath);

        // 引用主体包
        const requireFile = path.normalize(
          getRelative(absDistFilePath).replace(/\.js$/, '')
        );

        // 写入文件
        await fs.writeFile(
          absDistFilePath,
          `require("${utils.unixify(requireFile)}")(${id});`,
          'utf8'
        );
      }
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = new JsBuilder();
