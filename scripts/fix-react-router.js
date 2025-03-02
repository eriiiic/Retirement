const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../node_modules/react-router-dom/dist');
const targetFile = path.join(targetDir, 'index.mjs');

// Check if the directory exists
if (fs.existsSync(targetDir)) {
  // Check if the file already exists
  if (!fs.existsSync(targetFile)) {
    console.log('Creating missing index.mjs file for react-router-dom...');
    
    // Create the file with the export
    fs.writeFileSync(
      targetFile,
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