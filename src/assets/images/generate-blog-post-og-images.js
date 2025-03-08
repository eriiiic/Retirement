const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Import the blogPosts data
const getBlogPostsData = () => {
  try {
    // Since we can't directly import ES modules in Node.js, we'll read and parse the content
    const blogDataPath = path.join(__dirname, '../../components/blog/blogData.ts');
    const fileContent = fs.readFileSync(blogDataPath, 'utf8');
    
    // Extract the blog posts array using regex
    const blogPostsMatch = fileContent.match(/export const blogPosts: BlogPost\[\] = \[([\s\S]*?)\];/);
    if (!blogPostsMatch) {
      throw new Error('Could not find blogPosts array in blogData.ts');
    }
    
    // Manually parse the array to extract each post's data
    const blogPostsContent = blogPostsMatch[1];
    const blogPosts = [];
    
    // Split by blog post entries (each starts with an opening curly brace preceded by whitespace)
    const postEntries = blogPostsContent.split(/\s+\{/);
    
    for (let i = 1; i < postEntries.length; i++) { // Start at 1 to skip the first empty element
      const entry = '{' + postEntries[i];
      
      // Extract fields using regex
      const idMatch = entry.match(/id: ['"]([^'"]+)['"]/);
      const titleMatch = entry.match(/title: ['"]([^'"]+)['"]/);
      const excerptMatch = entry.match(/excerpt: ['"]([^'"]+)['"]/);
      const imageMatch = entry.match(/image: ['"]([^'"]+)['"]/);
      const topicsMatch = entry.match(/topics: \[(.*?)\]/);
      
      if (idMatch && titleMatch && excerptMatch) {
        const post = {
          id: idMatch[1],
          title: titleMatch[1],
          excerpt: excerptMatch[1],
          image: imageMatch ? imageMatch[1] : null,
          topics: topicsMatch ? 
            topicsMatch[1].split(',')
              .map(topic => topic.trim().replace(/['"]/g, '')) 
              .filter(topic => topic.length > 0) : []
        };
        blogPosts.push(post);
      }
    }
    
    return blogPosts;
  } catch (error) {
    console.error('Error getting blog posts data:', error);
    return [];
  }
};

// Function to generate OpenGraph image for a specific blog post
async function generateBlogPostOgImage(browser, post) {
  console.log(`Generating OG image for blog post: ${post.id}`);
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the blog post card
  const blogPostCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog Post Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background-color: #161e2e;
              color: white;
              position: relative;
              overflow: hidden;
          }
          
          .image-container {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 1;
              opacity: 0.7;
          }
          
          .image-container img {
              width: 100%;
              height: 100%;
              object-fit: cover;
          }
          
          .overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(0deg, rgba(22,30,46,0.95) 0%, rgba(22,30,46,0.7) 50%, rgba(22,30,46,0.4) 100%);
              z-index: 2;
          }
          
          .content {
              position: relative;
              z-index: 3;
              padding: 40px;
              height: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
          }
          
          .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
              display: flex;
              align-items: center;
          }
          
          .logo span {
              color: #4fd1c5;
              margin-left: 5px;
          }
          
          .title-area {
              margin-top: 80px;
              max-width: 90%;
          }
          
          .category-container {
              margin-bottom: 16px;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
          }
          
          .category {
              display: inline-block;
              background-color: rgba(79, 209, 197, 0.2);
              color: #4fd1c5;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 16px;
              font-weight: 500;
          }
          
          .title {
              font-size: 56px;
              font-weight: 800;
              margin-bottom: 16px;
              line-height: 1.2;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .description {
              font-size: 24px;
              opacity: 0.9;
              max-width: 800px;
              line-height: 1.4;
              margin-bottom: 40px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }
          
          .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 18px;
              opacity: 0.8;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
              padding-top: 20px;
          }
      </style>
  </head>
  <body>
      <div class="card">
          ${post.image ? `
          <div class="image-container">
              <img src="${post.image}" alt="${post.title}" />
          </div>
          ` : ''}
          <div class="overlay"></div>
          <div class="content">
              <div>
                  <div class="logo">FIRE<span>Calculator.ai</span></div>
                  <div class="title-area">
                      <div class="category-container">
                          ${post.topics.map(topic => `<div class="category">${topic}</div>`).join('')}
                      </div>
                      <h1 class="title">${post.title}</h1>
                      <p class="description">${post.excerpt}</p>
                  </div>
              </div>
              
              <div class="footer">
                  <div>FIRECalculator.ai Blog</div>
                  <div>Read the full article →</div>
              </div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const tempHtmlPath = path.join(__dirname, `blog-post-${post.id}-card.html`);
  fs.writeFileSync(tempHtmlPath, blogPostCardHtml);
  
  try {
    await page.goto(`file:${tempHtmlPath}`);
    
    // Create the blog images directory if it doesn't exist
    const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }
    
    // Take screenshots and save them
    const ogImagePath = path.join(blogImagesDir, `${post.id}-og-image.png`);
    await page.screenshot({ path: ogImagePath });
    
    const twitterImagePath = path.join(blogImagesDir, `${post.id}-twitter-card.png`);
    await page.screenshot({ path: twitterImagePath });
    
    console.log(`Generated OG images for blog post "${post.id}"`);
  } catch (error) {
    console.error(`Error generating OG image for blog post "${post.id}":`, error);
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    await page.close();
  }
}

// Main function to generate all blog post OG images
async function generateAllBlogPostOgImages() {
  console.log('Generating OpenGraph images for all blog posts...');
  
  // Get blog posts data
  const blogPosts = getBlogPostsData();
  if (blogPosts.length === 0) {
    console.error('No blog posts found, exiting.');
    return;
  }
  
  console.log(`Found ${blogPosts.length} blog posts.`);
  
  // Launch a headless browser
  const browser = await puppeteer.launch();
  
  try {
    // Process each blog post sequentially
    for (const post of blogPosts) {
      await generateBlogPostOgImage(browser, post);
    }
    
    console.log('All blog post OpenGraph images generated successfully!');
  } catch (error) {
    console.error('Error generating blog post OpenGraph images:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the generator
generateAllBlogPostOgImages().catch(console.error); 