/**
 * Blog Post File Generator Script
 * 
 * This is a standalone script that can be run with Node.js to generate all missing blog post files.
 * 
 * Usage:
 * From the project root:
 * node src/components/blog/utils/generateBlogFiles.js
 * 
 * Or with npm script in package.json:
 * "scripts": {
 *   "generate-blog-files": "node src/components/blog/utils/generateBlogFiles.js"
 * }
 */

// We need to use CommonJS require here since this is a standalone Node.js script
const fs = require('fs');
const path = require('path');

// Get the path to the blog directory
const blogDir = path.join(__dirname, '..');

// Try to import blogData.ts using require
try {
  // This is a hacky way to load TypeScript in Node.js without compilation
  // For production use, you would want to compile the TS files first
  require('ts-node').register();
  
  const { blogPosts } = require('../blogData');
  let generatedCount = 0;
  
  // Create utils directory if it doesn't exist
  if (!fs.existsSync(__dirname)) {
    fs.mkdirSync(__dirname, { recursive: true });
  }
  
  // Generate a file for each blog post that doesn't have one
  blogPosts.forEach(post => {
    const filePath = path.join(blogDir, `blogPost-${post.id}.ts`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Generating file for blog post: ${post.id}`);
      
      // Create template content
      const content = `/**
 * Content for the "${post.title}" blog post
 * This file contains the fully formatted content as it would be rendered on the blog
 * The metadata is stored in blogData.ts, while the content lives here for better performance
 */

export const content = \`# ${post.title}

![${post.title}](${post.image || '/images/placeholder.jpg'})

> "Add an inspiring quote related to ${post.topics[0] || 'this topic'} here."

## Introduction

${post.excerpt}

## Main Content Section 1

Add your content here...

## Main Content Section 2

Add your content here...

## Main Content Section 3

Add your content here...

## Conclusion

Add a conclusion here...

---

*What are your thoughts on ${post.topics[0] || 'this topic'}? Share in the comments below!*

[Back to Blog](/blog)\`;
`;

      // Write file
      fs.writeFileSync(filePath, content);
      generatedCount++;
    }
  });
  
  if (generatedCount > 0) {
    console.log(`\nGenerated ${generatedCount} blog post files.\n`);
    
    // Generate the imports for blogContentLoader.ts
    let imports = 'import { blogPosts } from \'./blogData\';\n\n// Import blog content\n';
    let mapEntries = '';
    
    blogPosts.forEach(post => {
      const varName = post.id.replace(/-/g, '') + 'Content';
      imports += `import { content as ${varName} } from './blogPost-${post.id}';\n`;
      mapEntries += `  '${post.id}': ${varName},\n`;
    });
    
    console.log('Now update blogContentLoader.ts with the following imports:');
    console.log('\n' + imports);
    console.log('And update the blogContentMap:');
    console.log(`
const blogContentMap: Record<string, string> = {
${mapEntries}};
`);
  } else {
    console.log('All blog posts already have files.');
  }
  
} catch (error) {
  console.error('Error generating blog post files:');
  console.error(error);
  console.log('\nMake sure you have ts-node installed:');
  console.log('npm install -g ts-node');
} 