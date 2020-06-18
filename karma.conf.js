const webpackCfg = require('./webpack.config');
webpackCfg.devtool = 'inline-source-map';
webpackCfg.mode = 'development';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      'src/index.ts',
      './tests/CSS.spec.js',
      './tests/Debugger.spec.js',
      './tests/DOM.spec.js',
      './tests/DOMDebugger.spec.js',
      './tests/DOMStorage.spec.js',
      './tests/Network.spec.js',
      './tests/Overlay.spec.js',
      './tests/Page.spec.js',
      './tests/Runtime.spec.js',
      './tests/Storage.spec.js',
    ],
    plugins: [
      'karma-mocha',
      'karma-chai-plugins',
      'karma-chrome-launcher',
      'karma-webpack',
    ],
    webpackServer: {
      noInfo: true,
    },
    webpack: webpackCfg,
    reporters: ['progress'],
    preprocessors: {
      'src/index.ts': ['webpack'],
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity,
  });
};
