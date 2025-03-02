const fs = require('fs');
const path = require('path');

const packageDir = path.resolve(__dirname, '../node_modules/react-router-dom');
const indexMjsPath = path.join(packageDir, 'index.mjs');

// Check if the package directory exists
if (fs.existsSync(packageDir)) {
  // Check if index.mjs already exists
  if (!fs.existsSync(indexMjsPath)) {
    console.log('Creating missing index.mjs file for react-router-dom...');
    
    // Create the index.mjs file that re-exports from index.js
    fs.writeFileSync(
      indexMjsPath,
      '// Re-export everything from index.js\nexport * from \'./index.js\';',
      'utf8'
    );
    
    console.log('Successfully created index.mjs file!');
  } else {
    console.log('index.mjs file already exists, no need to create it.');
  }
} else {
  console.log('react-router-dom package not found, skipping fix.');
} 