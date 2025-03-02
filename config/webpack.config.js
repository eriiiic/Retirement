const path = require('path');
const fs = require('fs');

// Make sure any symlinks in the project folder are resolved:
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

module.exports = function override(config) {
  // Add aliases for the missing files
  config.resolve.alias = {
    ...config.resolve.alias,
    // Add aliases for both the root and dist versions
    './node_modules/react-router-dom/index.mjs': resolveApp('node_modules/react-router-dom/index.js'),
    './node_modules/react-router-dom/dist/index.mjs': resolveApp('node_modules/react-router-dom/index.js')
  };

  // Find and modify the source-map-loader rule
  const oneOfRule = config.module.rules.find(rule => rule.oneOf);
  if (oneOfRule) {
    const sourceMapRule = oneOfRule.oneOf.find(rule => 
      rule.loader && rule.loader.includes('source-map-loader')
    );
    
    if (sourceMapRule) {
      // Add react-router-dom to the exclude pattern
      sourceMapRule.exclude = [
        /node_modules[\\\/]react-router-dom/,
        ...(Array.isArray(sourceMapRule.exclude) 
          ? sourceMapRule.exclude 
          : sourceMapRule.exclude ? [sourceMapRule.exclude] : [])
      ];
    }
  }

  return config;
}; 