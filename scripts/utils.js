/**
 * Created by axetroy on 2017/7/19.
 */
const glob = require('glob');

function unixify(p) {
  return p
    .replace(/^\/+/g, '')
    .replace(/^[A-Z]/, match => match.toLowerCase())
    .replace(/\:/g, '')
    .replace(/\/\//g, '/')
    .replace(/\\/g, '/');
}

function query(selector, options = {}) {
  return new Promise((resolve, reject) => {
    glob(selector, options, (err, files) => {
      err ? reject(err) : resolve(files);
    });
  });
}

module.exports = {
  unixify,
  query
};
