/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const fs = require('fs-extra');
const co = require('co');

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
        const distFilePath = path.join(paths.dist, file);
        yield fs.ensureFile(distFilePath);
        yield fs.writeFile(
          distFilePath,
          yield fs.readFile(srcFilePath, 'utf8'),
          'utf8'
        );
        console.log(`[FILE]: ${file}`);
      }

      console.log(`[FILE]: Done!`);
    }).catch(err => {
      console.error(err);
    });
  }
}

module.exports = new Builder();
