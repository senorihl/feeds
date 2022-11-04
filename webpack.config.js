const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPrerenderPlugin = require('html-webpack-prerender-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'development',
  entry: "./src/index.tsx",
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
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
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
        template: 'src/index.html',
        title: 'Feeds'
    }),
  ],
};