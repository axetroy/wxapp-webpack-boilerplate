/**
 * Created by axetroy on 2017/7/2.
 */

const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const fs = require('fs-extra');

const CONFIG = require('./config');

const paths = CONFIG.paths;

module.exports = function(options) {
  glob('src/**/*.xml', {}, function(err, files) {
    if (err) throw err;
    files.forEach(file => {
      const filePath = path.join(paths.root, file);
      const filePathRelativeToDist = path.relative(paths.src, filePath);
      const distFilePath = path.join(paths.dist, filePathRelativeToDist);
      fs
        .copy(filePath, distFilePath.replace(/\.xml$/, '.wxml'))
        .then(function() {
          console.log(`[移动]: ${file}`);
        });
    });
  });
};
