const path = require('path');

module.exports = (env, argv) => {
  const config = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    output: {
      filename: 'chobitsu.js',
      path: path.resolve(__dirname, 'dist'),
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
  };

  if (argv.mode === 'production') {
    config.devtool = 'none';
  }

  return config;
};
