/* eslint-disable no-undef */
const path = require('path');

const serverConfig = {
  entry: './src/index.js',
  mode: 'production',
  target: 'node',
  // mode: 'development',
  // devtool: 'inline-source-map',
  output: {
    filename: 'lib.node.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-class-properties']
        }
      }
    ]
  }
};

const clientConfig = Object.assign(
  {}, serverConfig,
  {output: Object.assign({}, serverConfig.output)}
);
clientConfig.target = 'web';
clientConfig.output.filename = 'lib.web.js';
clientConfig.output.libraryTarget = "window";

module.exports = [serverConfig,clientConfig ];