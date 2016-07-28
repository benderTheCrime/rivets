var webpack = require('webpack');

module.exports = {
    entry: {
        index: './src/rivets.coffee',
        checked: './src/binder/checked.coffee'
    },
    plugins: [ new webpack.optimize.UglifyJsPlugin() ],
    module: { loaders: [ { test: /\.coffee$/, loader: 'coffee' } ] },
    output: { path: './lib', filename: '[name].js' }
};