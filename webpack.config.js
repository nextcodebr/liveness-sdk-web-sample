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
        case 'v5.4':
            return {
                js: '/src/Livenessv5.4.js',
                path: 'dist/v5.4'
            }
        case 'v5.5':
            return {
                js: '/src/Livenessv5.5.js',
                path: 'dist/v5.5'
            }
        case 'v5.6':
            return {
                js: '/src/Livenessv5.6.js',
                path: 'dist/v5.6'
            }
        case 'v5.7':
            return {
                js: '/src/Livenessv5.7.js',
                path: 'dist/v5.7'
            }
        case 'v5.8':
            return {
                js: '/src/Livenessv5.8.js',
                path: 'dist/v5.8'
            }      
        case 'v5.9':
            return {
                js: '/src/Livenessv5.9.js',
                path: 'dist/v5.9'
            }  
        case 'v6.0':
            return {
                js: '/src/Livenessv6.0.js',
                path: 'dist/v6.0'
            }  
        case 'v6.1':
            return {
                js: '/src/Livenessv6.1.js',
                path: 'dist/v6.1'
            }
        case 'v6.2':
            return {
                js: '/src/Livenessv6.2.js',
                path: 'dist/v6.2'
        }
        case 'v6.3':
            return {
                js: '/src/Livenessv6.3.js',
                path: 'dist/v6.3'
            }
        case 'v6.4':
            return {
                js: '/src/Livenessv6.4.js',
                path: 'dist/v6.4'
            }
        case 'v6.5':
            return {
                js: '/src/Livenessv6.5.js',
                path: 'dist/v6.5'
            }
        case 'v6.5.1':
            return {
                js: '/src/Livenessv6.5.1.js',
                path: 'dist/v6.5.1'
            }
        case 'v6.5.2':
            return {
                js: '/src/Livenessv6.5.2.js',
                path: 'dist/v6.5.2'
            }
        case 'v6.5.3':
            return {
                js: '/src/Livenessv6.5.3.js',
                path: 'dist/v6.5.3'
            }
        case 'v6.5.4':
            return {
                js: '/src/Livenessv6.5.4.js',
                path: 'dist/v6.5.4'
            }
        case 'v6.5.5':
            return {
                js: '/src/Livenessv6.5.5.js',
                path: 'dist/v6.5.5'
            }
        case 'v6.6':
            return {
                js: '/src/Livenessv6.6.js',
                path: 'dist/v6.6'
            }
        case 'v6.7':
            return {
                js: '/src/Livenessv6.7.js',
                path: 'dist/v6.7'
            }
        case 'v6.8':
            return {
                js: '/src/Livenessv6.8.js',
                path: 'dist/v6.8'
            }
        case 'v6.8.1':
            return {
                js: '/src/Livenessv6.8.1.js',
                path: 'dist/v6.8.1'
            }
        case 'v6.8.2':
            return {
                js: '/src/Livenessv6.8.2.js',
                path: 'dist/v6.8.2'
            }
        case 'v6.8.3':
            return {
                js: '/src/Livenessv6.8.3.js',
                path: 'dist/v6.8.3'
            }
        case 'v6.8.4':
            return {
                js: '/src/Livenessv6.8.4.js',
                path: 'dist/v6.8.4'
            }
        case 'v6.8.5':
            return {
                js: '/src/Livenessv6.8.5.js',
                path: 'dist/v6.8.5'
            }
        case 'v6.8.6':
            return {
                js: '/src/Livenessv6.8.6.js',
                path: 'dist/v6.8.6'
            }
        case 'v6.8.7':
            return {
                js: '/src/Livenessv6.8.7.js',
                path: 'dist/v6.8.7'
            }
        case 'v6.8.8':
            return {
                js: '/src/Livenessv6.8.8.js',
                path: 'dist/v6.8.8'
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