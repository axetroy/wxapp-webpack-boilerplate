/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const fs = require('fs-extra');
const Builder = require('./Builder');
const CONFIG = require('./config');

class CssBuilder extends Builder {
  constructor() {
    super();
  }
  async compile() {
    const files = Object.keys(this.files);

    try {
      while (files.length) {
        let file = files.shift();
        const relativeFilePath = path.relative(CONFIG.paths.src, file);
        const distFilePath = path
          .join(CONFIG.paths.dist, relativeFilePath)
          .replace(/\.scss$/, '.wxss')
          .replace(/\.less$/, '.wxss')
          .replace(/\.sass$/, '.wxss')
          .replace(/\.css$/, '.wxss');
        await fs.ensureFile(distFilePath);
        await fs.writeFile(
          distFilePath,
          await fs.readFile(file, 'utf8'),
          'utf8'
        );
      }
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = new CssBuilder();
