module.exports = {
    devtool: false,
    debug: false,
    entry: { 'tiny-rivets': './src/rivets.coffee' },
    module: { preLoaders: [ { test: /\.coffee$/, loader: 'coffee' } ] },
    plugins: [ new (require('webpack').optimize.UglifyJsPlugin)() ],
    output: { path: './dist/', filename: 'tiny-rivets.js' }
};
