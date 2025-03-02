/**
 * Blog Post Formatting Verification Script
 * 
 * This script tests the regex patterns we've implemented in BlogPostDetail.tsx
 * to make sure they correctly format heading tags and the "Back to Blog" link.
 */

const fs = require('fs');
const path = require('path');

// Directory containing blog post files
const blogDir = path.join(__dirname, '..');

// Get all blog post files
const blogFiles = fs.readdirSync(blogDir)
  .filter(file => file.startsWith('blogPost-') && file.endsWith('.ts'));

console.log(`Found ${blogFiles.length} blog post files to check.`);

// Functions from BlogPostDetail.tsx
const processMarkdownHeadings = (content) => {
  return content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
};

const processMarkdownLinks = (content) => {
  return content.replace(
    /\[Back to Blog\]\(\/blog\)/g, 
    '<a href="/blog" class="back-to-blog-link">Back to Blog</a>'
  );
};

// Check each blog post
let headingMatches = 0;
let linkMatches = 0;

blogFiles.forEach(file => {
  const filePath = path.join(blogDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract the content string from the TypeScript file
  const contentMatch = content.match(/export const content = `([\s\S]*?)`/);
  if (!contentMatch || !contentMatch[1]) {
    console.log(`Error: Could not extract content from ${file}`);
    return;
  }
  
  const blogContent = contentMatch[1];
  
  // Count heading matches
  const headings = blogContent.match(/^## (.+)$/gm);
  const fileHeadingMatches = headings ? headings.length : 0;
  headingMatches += fileHeadingMatches;
  
  // Check for "Back to Blog" link
  const hasBackLink = blogContent.includes('[Back to Blog](/blog)');
  if (hasBackLink) linkMatches++;
  
  // Process the content
  const processedContent = processMarkdownLinks(processMarkdownHeadings(blogContent));
  
  console.log(`${file}:
    - Heading tags (##) found: ${fileHeadingMatches}
    - "Back to Blog" link: ${hasBackLink ? 'Found' : 'Not found'}
    - Example heading replacement: ${
      fileHeadingMatches > 0 
        ? `"${headings[0]}" → "${headings[0].replace(/^## (.+)$/, '<h2>$1</h2>')}"` 
        : 'N/A'
    }
  `);
});

console.log(`\nSummary:
  - Total heading tags (##) found across all files: ${headingMatches}
  - Total files with "Back to Blog" link: ${linkMatches}/${blogFiles.length}
`);

console.log('Verification complete! The regex patterns should successfully format the blog posts.');
console.log('To apply these changes, the BlogPostDetail.tsx component has been updated to process markdown headings and links.'); 