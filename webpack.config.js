'use strict';
const path = require('path')
const webpack = require('webpack');

function version (vNumber) {
    switch (vNumber) {
        case 'v2':
            return {
                js: '/src/Livenessv2.js',
                path: 'dist/v2'
            }
        case 'v3':
            return {
                js: '/src/Livenessv3.js',
                path: 'dist/v3'
            }
        case 'v4':
            return {
                js: '/src/Livenessv4.js',
                path: 'dist/v4'
            }
        case 'v5':
            return {
                js: '/src/Livenessv5.js',
                path: 'dist/v5'
            }

        case 'v5.1':
            return {
                js: '/src/Livenessv5.1.js',
                path: 'dist/v5.1'
            }

        case 'v5.2':
            return {
                js: '/src/Livenessv5.2.js',
                path: 'dist/v5.2'
            }
        case 'v5.3':
            return {
                js: '/src/Livenessv5.3.js',
                path: 'dist/v5.3'
            }
        
        default:
            return {
                js: '/src/Liveness.js',
                path: 'dist'
            }
    }
}

module.exports = (env) => {
    const response = version(env.version)

    const entryVersion = response.js
    const pathVersion = response.path
    
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