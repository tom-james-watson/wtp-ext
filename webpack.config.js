const path = require('path')

module.exports = {
  entry: {
    'background': './extension/src/background.js',
    'browser-action': './extension/src/browser-action/index.js',
    'manager': './extension/src/manager/index.js'
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
