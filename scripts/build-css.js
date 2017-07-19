/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const fs = require('fs-extra');
const webpack = require('webpack');
const glob = require('glob');
const co = require('co');
const Promise = require('bluebird');

const CONFIG = require('./config');

const paths = CONFIG.paths;

class Builder {
  constructor() {
    this.files = [];
  }
  load(filePath) {
    this.files.push(filePath);
  }
  compile() {
    const files = this.files;

    return co(function*() {
      while (files.length) {
        let file = files.shift();
        file = file.replace(/^(\/+)?src/, '');
        const srcFilePath = path.join(paths.src, file);
        const distFilePath = path
          .join(paths.dist, file)
          .replace(/\.scss$/, '.wxss')
          .replace(/\.less$/, '.wxss')
          .replace(/\.sass$/, '.wxss')
          .replace(/\.css$/, '.wxss');
        yield fs.ensureFile(distFilePath);
        yield fs.writeFile(
          distFilePath,
          yield fs.readFile(srcFilePath, 'utf8'),
          'utf8'
        );
        console.log(`[WXSS]: ${file}`);
      }
      console.log(`[WXSS]: Done!`);
    }).catch(err => {
      console.error(err);
    });
  }
}

module.exports = new Builder();
