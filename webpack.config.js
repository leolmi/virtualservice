'use strict';
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');


var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: './server/app.js',
  target: 'node',
  node: {
    __dirname: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'virtualservice.js'
  },
  plugins: [
    new webpack.DefinePlugin({$dirname: '__dirname'})
  ],
  externals: nodeModules
};
