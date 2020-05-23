const glob = require('glob');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const entries = glob.sync(path.join(__dirname, '/src/**/*-entry.ts'));

const config = (entry) => {
  const name = path.basename(entry, '.ts').replace('-entry', '');
  return {
    entry,
    mode: 'development',
    devtool: 'source-map',
    devServer: {
      liveReload: false,
      disableHostCheck: true,
      proxy: {
        '/ws': {
          target: 'http://localhost:4000',
          ws: true,
        },
        '/api': {
          target: 'http://localhost:4000',
        },
      },
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: `${name}.js`,
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    optimization: {
      minimize: false,
    },
    performance: {
      hints: false,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        {
          test: /\.(png|jpg|gif)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: `${name}.html`,
        template: path.join(__dirname, `/src/${name}.html`),
        inject: true,
      }),
    ],
  };
};

module.exports = entries.map(config);
