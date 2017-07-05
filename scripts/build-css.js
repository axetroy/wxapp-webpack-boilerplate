/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const glob = require('glob');

const CONFIG = require('./config');

const paths = CONFIG.paths;

module.exports = function(options) {
  glob('src/pages/**/*.css', {}, function(err, files) {
    if (err) throw err;
    files.forEach(file => {
      const filePath = path.join(paths.root, file);
      const filePathRelativeToDist = path.relative(paths.src, filePath);
      const distFilePath = path.join(paths.dist, filePathRelativeToDist);
      fs.copy(filePath, distFilePath).then(function() {
        console.log(`[移动]: ${file}`);
      });
    });
  });
};
