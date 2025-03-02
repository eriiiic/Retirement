const fs = require('fs');
const path = require('path');

const packageDir = path.resolve(__dirname, '../node_modules/react-router-dom');
const indexMjsPath = path.join(packageDir, 'index.mjs');
const distDir = path.join(packageDir, 'dist');
const distIndexMjsPath = path.join(distDir, 'index.mjs');

// Check if the package directory exists
if (fs.existsSync(packageDir)) {
  // Create root level index.mjs if it doesn't exist
  if (!fs.existsSync(indexMjsPath)) {
    console.log('Creating missing index.mjs file in react-router-dom root...');
    
    fs.writeFileSync(
      indexMjsPath,
      '// Re-export everything from index.js\nexport * from \'./index.js\';',
      'utf8'
    );
    
    console.log('Successfully created root index.mjs file!');
  } else {
    console.log('Root index.mjs file already exists.');
  }
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distDir)) {
    console.log('Creating dist directory in react-router-dom...');
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create dist/index.mjs if it doesn't exist
  if (!fs.existsSync(distIndexMjsPath)) {
    console.log('Creating missing index.mjs file in react-router-dom/dist...');
    
    fs.writeFileSync(
      distIndexMjsPath,
      '// Re-export everything from the parent directory\'s index.js\nexport * from \'../index.js\';',
      'utf8'
    );
    
    console.log('Successfully created dist/index.mjs file!');
  } else {
    console.log('dist/index.mjs file already exists.');
  }
} else {
  console.log('react-router-dom package not found, skipping fix.');
} 