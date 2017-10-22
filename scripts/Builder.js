const path = require('path');
const fs = require('fs-extra');
const CONFIG = require('./config');

class Builder {
  constructor() {
    this.files = {};
  }
  clear() {
    this.files = {};
  }
  load(filePath) {
    this.files[filePath] = 1;
  }
  unload(filePath) {
    this.files[filePath] = null;
    delete this.files[filePath];
  }
  async compile() {
    const files = Object.keys(this.files);
    while (files.length) {
      let file = files.shift();
      const relativeFilePath = path.relative(CONFIG.paths.src, file);
      const distFilePath = path.join(CONFIG.paths.dist, relativeFilePath);
      await fs.ensureFile(distFilePath);
      await fs.writeFile(distFilePath, await fs.readFile(file, 'utf8'), 'utf8');
    }
  }
}

module.exports = Builder;
