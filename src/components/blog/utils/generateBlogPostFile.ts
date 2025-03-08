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

import { blogPosts, BlogPost } from '../blogData';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Function to generate OpenGraph images for a specific blog post
export async function generateOgImagesForPost(postId: string): Promise<void> {
  try {
    // Get the post data
    const post = blogPosts.find(p => p.id === postId);
    if (!post) {
      console.error(`No blog post found with ID: ${postId}`);
      return;
    }

    // Path to the OpenGraph image generator script
    const ogGeneratorPath = path.join(__dirname, '../../../assets/images/generate-blog-post-og-images.js');
    
    // Create the script if it doesn't exist
    if (!fs.existsSync(ogGeneratorPath)) {
      console.warn(`OpenGraph image generator script not found at: ${ogGeneratorPath}`);
      console.warn('Skipping OpenGraph image generation.');
      return;
    }

    console.log(`Generating OpenGraph images for blog post: ${postId}`);
    
    // Execute the script and pass the post ID
    execSync(`node ${ogGeneratorPath} --single-post=${postId}`, {
      stdio: 'inherit'
    });
    
    console.log(`OpenGraph images generated successfully for blog post: ${postId}`);
  } catch (error) {
    console.error('Error generating OpenGraph images:', error);
  }
}

/**
 * Generate a template file for a blog post
 * @param id - The ID of the blog post to generate a file for
 * @param generateOgImages - Whether to generate OpenGraph images for the post (default: true)
 */
export function generateBlogPostFile(id: string, generateOgImages: boolean = true): void {
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

export const content = \`<div class="lead-quote">
  <blockquote>
    "Add an inspiring quote related to ${post.topics[0] || 'this topic'} here."
    <cite>— Notable Person</cite>
  </blockquote>
</div>

<div class="article-intro">
  ${post.excerpt}
</div>

## Introduction

Add your introduction here...

## Main Content Section 1

Add your content here...

## Main Content Section 2

Add your content here...

## Main Content Section 3

Add your content here...

## Conclusion

Add a conclusion here...

<div class="author-section">
  <div class="author-image">
    <img src="/images/authors/${post.author ? post.author.toLowerCase().replace(/\s+/g, '-') : 'default'}.jpg" alt="${post.author || 'Author'}" />
  </div>
  <div class="author-bio">
    <h3>About the Author</h3>
    <p>${post.author || 'The Author'} is a financial independence expert with extensive experience in retirement planning, investment strategies, and wealth building. With a passion for helping others achieve their FIRE goals, ${post.author ? post.author.split(' ')[0] : 'they'} shares practical insights based on both research and personal experience.</p>
  </div>
</div>

<div class="related-posts">
  <h3>You might also enjoy</h3>
  <div class="related-posts-grid">
    <!-- Related posts will be dynamically inserted here -->
  </div>
</div>

<div class="cta-section">
  <h3>Ready to accelerate your journey to financial independence?</h3>
  <p>Use our interactive retirement calculator to visualize your path to FIRE and optimize your strategy.</p>
  <a href="/" class="cta-button">Try Our FIRE Calculator</a>
</div>

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

  // Generate OpenGraph images if requested
  if (generateOgImages) {
    // Update the OpenGraph image generator script to support single post generation
    updateOgGeneratorScript();
    
    // Generate OpenGraph images for the new post
    generateOgImagesForPost(id);
  }
}

/**
 * Generate template files for all blog posts that don't have files yet
 * @param generateOgImages - Whether to generate OpenGraph images for new posts (default: true)
 */
export function generateAllMissingBlogPostFiles(generateOgImages: boolean = true): void {
  let count = 0;
  
  blogPosts.forEach(post => {
    const filePath = path.join(__dirname, '..', `blogPost-${post.id}.ts`);
    
    if (!fs.existsSync(filePath)) {
      generateBlogPostFile(post.id, generateOgImages);
      count++;
    }
  });
  
  console.log(`Generated ${count} missing blog post files.`);
}

/**
 * Update the OpenGraph image generator script to support single post generation
 */
function updateOgGeneratorScript(): void {
  const ogGeneratorPath = path.join(__dirname, '../../../assets/images/generate-blog-post-og-images.js');
  
  // Check if the file exists
  if (!fs.existsSync(ogGeneratorPath)) {
    console.warn('OpenGraph image generator script not found, skipping update.');
    return;
  }
  
  let content = fs.readFileSync(ogGeneratorPath, 'utf8');
  
  // Check if the script already supports single post generation
  if (content.includes('--single-post=')) {
    // Already updated
    return;
  }
  
  // Add support for single post generation
  const updateCode = `
// Parse command line arguments
const args = process.argv.slice(2);
const singlePostArg = args.find(arg => arg.startsWith('--single-post='));
const singlePostId = singlePostArg ? singlePostArg.split('=')[1] : null;

// Main function to generate all blog post OG images
async function generateAllBlogPostOgImages() {
  console.log('Generating OpenGraph images for blog posts...');
  
  // Get blog posts data
  const blogPosts = getBlogPostsData();
  if (blogPosts.length === 0) {
    console.error('No blog posts found, exiting.');
    return;
  }
  
  // Filter posts if a specific post ID is provided
  const postsToProcess = singlePostId 
    ? blogPosts.filter(post => post.id === singlePostId)
    : blogPosts;
  
  if (singlePostId && postsToProcess.length === 0) {
    console.error(\`Blog post with ID "\${singlePostId}" not found.\`);
    return;
  }
  
  console.log(\`Found \${postsToProcess.length} blog post(s) to process.\`);
  
  // Launch a headless browser
  const browser = await puppeteer.launch();
  
  try {
    // Process each blog post sequentially
    for (const post of postsToProcess) {
      await generateBlogPostOgImage(browser, post);
    }
    
    console.log('Blog post OpenGraph images generated successfully!');
  } catch (error) {
    console.error('Error generating blog post OpenGraph images:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}`;
  
  // Replace the existing generateAllBlogPostOgImages function with the updated one
  content = content.replace(
    /\/\/ Main function to generate all blog post OG images[\s\S]*?await browser\.close\(\);\s*\}/,
    updateCode
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(ogGeneratorPath, content);
  console.log('Updated OpenGraph image generator script to support single post generation.');
}

// Uncomment to run directly
// generateAllMissingBlogPostFiles(); 