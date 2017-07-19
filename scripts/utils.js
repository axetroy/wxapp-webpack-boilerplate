/**
 * Created by axetroy on 2017/7/19.
 */

function unixify(p) {
  return p
    .replace(/^\/+/g, '')
    .replace(/^[A-Z]/, match => match.toLowerCase())
    .replace(/\:/g, '')
    .replace(/\/\//g, '/')
    .replace(/\\/g, '/');
}

module.exports = {
  unixify
};
