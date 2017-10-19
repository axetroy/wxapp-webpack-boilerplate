/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const fs = require('fs-extra');

const CONFIG = require('./config');

const paths = CONFIG.paths;

class Builder {
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
    const files = this.files;

    try {
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
        await fs.ensureFile(distFilePath);
        await fs.writeFile(
          distFilePath,
          await fs.readFile(srcFilePath, 'utf8'),
          'utf8'
        );
        console.log(`[WXSS]: ${file}`);
      }
      console.log(`[WXSS]: Done!`);
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = new Builder();
