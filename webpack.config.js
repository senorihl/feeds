const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const WorkboxPlugin = require('workbox-webpack-plugin');

const mode = process.env.BUILD_TYPE || 'development';

module.exports = {
  mode,
  entry: "./src/index.tsx",
  devtool: mode === 'production' ? false : 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              sourceMap: mode !== 'production'
            }
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
      {
        test: /\.s?[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          {
            loader: "sass-loader",
            options: {
              warnRuleAsWarning: false,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'build'),
    },
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js", ".css", ".scss"]
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "build"),
  },
  plugins: [
    new webpack.DefinePlugin({
      __MODE__: JSON.stringify(mode),
      __DEV__: JSON.stringify(mode === 'development'),
      __PROXY__: JSON.stringify('https://us-central1-lobs-159411.cloudfunctions.net/cors-anywhere/?u=')
    }),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      title: 'Feeds',
      hash: true,
    }),
  ].concat(mode !== 'production' ? [] : [
    new CompressionPlugin({
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
    }),
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
    }),
  ]),
};
