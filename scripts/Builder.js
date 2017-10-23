const path = require('path');
const fs = require('fs-extra');
const pd = require('pretty-data').pd;
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
      let fileContent = await fs.readFile(file, 'utf8');

      // 生产环境下，会对一些文件进行压缩
      if (CONFIG.isProduction) {
        const pathInfo = path.parse(file);
        switch (pathInfo.ext) {
          case '.json':
            fileContent = pd.jsonmin(fileContent);
            break;
        }
      }

      const relativeFilePath = path.relative(CONFIG.paths.src, file);
      const distFilePath = path.join(CONFIG.paths.dist, relativeFilePath);
      await fs.ensureFile(distFilePath);
      await fs.writeFile(distFilePath, fileContent, 'utf8');
    }
  }
}

module.exports = Builder;
