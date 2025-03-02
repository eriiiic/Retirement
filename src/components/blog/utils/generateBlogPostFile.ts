/**
 * Blog Post File Generator Utility
 * 
 * This utility helps generate template files for blog posts.
 * Run this script whenever you add a new blog post to blogData.ts
 * 
 * Usage:
 * 1. Import this file: import { generateBlogPostFile } from './utils/generateBlogPostFile';
 * 2. Call the function with a blog post ID: generateBlogPostFile('your-post-id');
 */

import { blogPosts } from '../blogData';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate a template file for a blog post
 * @param id - The ID of the blog post to generate a file for
 */
export function generateBlogPostFile(id: string): void {
  const post = blogPosts.find(post => post.id === id);
  
  if (!post) {
    console.error(`No blog post found with ID: ${id}`);
    return;
  }
  
  const filePath = path.join(__dirname, '..', `blogPost-${id}.ts`);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.warn(`File already exists for blog post: ${id}`);
    return;
  }
  
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
  console.log(`Created template file for blog post: ${id}`);
  
  // Reminder to update the content loader
  console.log(`
Don't forget to update blogContentLoader.ts:
1. Import the content: import { content as ${id.replace(/-/g, '')}Content } from './blogPost-${id}';
2. Add to blogContentMap: '${id}': ${id.replace(/-/g, '')}Content,
`);
}

/**
 * Generate template files for all blog posts that don't have files yet
 */
export function generateAllMissingBlogPostFiles(): void {
  let count = 0;
  
  blogPosts.forEach(post => {
    const filePath = path.join(__dirname, '..', `blogPost-${post.id}.ts`);
    
    if (!fs.existsSync(filePath)) {
      generateBlogPostFile(post.id);
      count++;
    }
  });
  
  console.log(`Generated ${count} missing blog post files.`);
}

// Uncomment to run directly
// generateAllMissingBlogPostFiles(); 