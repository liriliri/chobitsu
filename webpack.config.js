const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

const banner = pkg.name + ' v' + pkg.version + ' ' + pkg.homepage;

module.exports = {
  entry: './src/index.ts',
  devtool: 'source-map',
  output: {
    filename: 'chobitsu.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'chobitsu',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
      },
    ],
  },
  plugins: [new webpack.BannerPlugin(banner)],
};
