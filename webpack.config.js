const path = require('path');

module.exports = {
  entry: './extension/src/background.js',
  output: {
    path: path.resolve(__dirname, 'extension/build'),
    filename: 'dist.js'
  },
  node: {
    fs: 'empty'
  }
}
