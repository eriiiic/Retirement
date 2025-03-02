const webpackConfig = require('./config/webpack.config');

module.exports = function override(config, env) {
  return webpackConfig(config, env);
}; 