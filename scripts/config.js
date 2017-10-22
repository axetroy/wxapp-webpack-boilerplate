/**
 * Created by axetroy on 2017/7/2.
 */

const path = require('path');

const root = path.join(__dirname, '../');

module.exports = {
  isProduction: process.env.NODE_ENV === 'production',
  paths: {
    cwd: process.cwd(),
    root,
    src: path.join(root, 'src'),
    dist: path.join(root, 'build'),
    temp: path.join(root, '.temp')
  }
};
