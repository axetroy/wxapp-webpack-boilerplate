/**
 * Created by axetroy on 2017/7/2.
 */
const path = require('path');
const webpack = require('webpack');
const glob = require('glob');

const CONFIG = require('./config');

const paths = CONFIG.paths;

module.exports = function(options) {
  glob('src/pages/**/*.js', {}, function(err, files) {
    if (err) throw err;

    webpack(
      {
        entry: () => {
          const entry = {};
          files.forEach(file => {
            const relative2dist = path.relative(
              paths.src,
              path.join(paths.root, file)
            );
            entry[relative2dist] = path.join(paths.root, file);
          });
          return entry;
        },
        output: {
          path: paths.dist,
          filename: '[name]'
        },
        resolve: {
          modules: ['node_modules'],
          extensions: ['.coffee', '.js', '.ts']
        },
        module: {
          loaders: [
            {
              test: /\.(jsx|js)?$/,
              exclude: /(node_modules|bower_components)/,
              loader: 'babel-loader'
            }
          ]
        }
      },
      function(err) {
        if (err) throw err;
        files.forEach(file => {
          console.log(`[编译]: ${file}`);
        });
      }
    );
  });
};
