'use strict';
const path = require('path')
const webpack = require('webpack');

module.exports = (env) => {
    const entryVersion = env.version === 'v2'
        ? '/src/Livenessv2.js'
        : '/src/Liveness.js'
    const pathVersion = env.version === 'v2'
        ? 'dist/v2'
        : 'dist'
    return {
    mode: 'production',
    devtool: 'source-map',
    entry: entryVersion,
    output: {
        path: path.resolve(__dirname, pathVersion),
        filename: "liveness.js",
        library: 'Liveness'
    },
    module: {
      rules: [
          {
              test: /\.js$/,
              exclude: /node_modules/,
              use: ['babel-loader'],
          }
      ]
    }
    }
};