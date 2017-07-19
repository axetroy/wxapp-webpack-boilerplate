/**
 * Created by axetroy on 2017/7/2.
 */
const glob = require('glob');
const path = require('path');
const co = require('co');

const JsBuilder = require('./build-js');
const XmlBuilder = require('./build-xml');
const CssBuilder = require('./build-css');
const FileBuilder = require('./build-file');

glob('src/**/*.*', {}, function(err, files) {
  if (err) throw err;
  files.forEach(file => {
    const f = path.parse(file);

    switch (f.ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        JsBuilder.load(file);
        break;
      case '.css':
      case '.scss':
      case '.less':
      case '.sass':
      case '.wxss':
        CssBuilder.load(file);
        break;
      case '.xml':
      case '.wxml':
        XmlBuilder.load(file);
        break;
      case '.json':
        FileBuilder.load(file);
        break;
      case '.yaml':
      case '.yml':
        console.log('yml:', file);
        FileBuilder.load(file);
        break;
      case '.pmg':
      case '.jpg':
      case '.gif':
        console.log('Image: ', file);
        FileBuilder.load(file);
        break;
      default:
        FileBuilder.load(file);
    }
  });

  co(function*() {
    JsBuilder.compile();
    XmlBuilder.compile();
    CssBuilder.compile();
    FileBuilder.compile();
  }).catch(err => {
    console.error(err);
  });
});
