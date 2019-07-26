const path = require('path')

module.exports = {
  entry: {
    'background': './extension/src/background.js',
    'page-action': './extension/src/page-action/index.js'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'extension/build'),
    filename: '[name].js'
  },
  node: {
    fs: 'empty'
  }
}
