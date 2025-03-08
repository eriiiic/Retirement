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

// Function to download an image and save it locally
const downloadImage = async (url, localPath) => {
  try {
    // Create a temporary browser to download the image
    const tempBrowser = await puppeteer.launch();
    const tempPage = await tempBrowser.newPage();
    
    console.log(`Downloading image from: ${url}`);
    
    // Navigate to the image URL
    const response = await tempPage.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    if (!response.ok()) {
      throw new Error(`Failed to download image: ${response.status()} ${response.statusText()}`);
    }
    
    // Get the image buffer
    const imageBuffer = await response.buffer();
    
    // Create directory if it doesn't exist
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the image to disk
    fs.writeFileSync(localPath, imageBuffer);
    
    console.log(`Image downloaded and saved to: ${localPath}`);
    
    // Close the temporary browser
    await tempBrowser.close();
    
    return localPath;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
};

// Function to ensure the post image is available locally
const ensureLocalImage = async (post) => {
  if (!post.image) return null;
  
  // Check if the image is an URL
  if (post.image.startsWith('http')) {
    const tempImagePath = path.join(__dirname, `temp-${post.id}-image.jpg`);
    return await downloadImage(post.image, tempImagePath);
  }
  
  return post.image;
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
  
  // Ensure we have a local copy of the post image
  let localImagePath = null;
  if (post.image) {
    localImagePath = await ensureLocalImage(post);
  }
  
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
          ${localImagePath ? `
          <div class="image-container">
              <img src="file://${localImagePath}" alt="${post.title}" />
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
    // Clean up temporary files
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    if (localImagePath && localImagePath.includes('temp-')) {
      fs.unlinkSync(localImagePath);
    }
    await page.close();
  }
}

// Function to generate the blog page OG image
async function generateBlogPageOgImage(browser) {
  console.log('Generating OG image for the blog page');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the blog page card
  const blogPageCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog Page Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              position: relative;
              overflow: hidden;
          }
          
          .pattern {
              position: absolute;
              top: 0;
              right: 0;
              width: 70%;
              height: 100%;
              opacity: 0.1;
              background-image: radial-gradient(#fff 1px, transparent 1px);
              background-size: 20px 20px;
          }
          
          .content {
              position: relative;
              z-index: 3;
              padding: 60px;
              height: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 30px;
              display: flex;
              align-items: center;
          }
          
          .logo span {
              color: #4fd1c5;
              margin-left: 5px;
          }
          
          .title {
              font-size: 64px;
              font-weight: 800;
              margin-bottom: 24px;
              line-height: 1.2;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              max-width: 80%;
          }
          
          .description {
              font-size: 28px;
              opacity: 0.9;
              max-width: 70%;
              line-height: 1.5;
              margin-bottom: 40px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .footer {
              margin-top: 40px;
              font-size: 22px;
              font-weight: 500;
              display: inline-block;
              padding: 12px 24px;
              background-color: rgba(255, 255, 255, 0.15);
              border-radius: 8px;
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div class="pattern"></div>
          <div class="content">
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <h1 class="title">Financial Independence Blog & Resources</h1>
              <p class="description">Explore practical advice, real-world case studies, and data-driven strategies for achieving financial independence.</p>
              <div class="footer">FIRECalculator.ai/blog</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const tempHtmlPath = path.join(__dirname, 'blog-page-card.html');
  fs.writeFileSync(tempHtmlPath, blogPageCardHtml);
  
  try {
    await page.goto(`file:${tempHtmlPath}`);
    
    // Create the blog images directory if it doesn't exist
    const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }
    
    // Take screenshots and save them
    const ogImagePath = path.join(blogImagesDir, 'blog-og-image.png');
    await page.screenshot({ path: ogImagePath });
    
    const twitterImagePath = path.join(blogImagesDir, 'blog-twitter-card.png');
    await page.screenshot({ path: twitterImagePath });
    
    console.log('Generated OG images for the blog page');
  } catch (error) {
    console.error('Error generating OG image for the blog page:', error);
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    await page.close();
  }
}

// Function to generate the home page OG image
async function generateHomePageOgImage(browser) {
  console.log('Generating OG image for the home page');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the home page card
  const homePageCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Home Page Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background: linear-gradient(to right, #1e293b, #334155);
              color: white;
              position: relative;
              overflow: hidden;
          }
          
          .graphics {
              position: absolute;
              top: 0;
              right: 0;
              width: 50%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
          }
          
          .chart {
              width: 80%;
              height: 70%;
              background-color: rgba(79, 70, 229, 0.1);
              border-radius: 12px;
              padding: 20px;
              box-sizing: border-box;
              position: relative;
          }
          
          .chart-line {
              position: absolute;
              bottom: 40px;
              left: 40px;
              right: 40px;
              height: 2px;
              background-color: rgba(255, 255, 255, 0.1);
          }
          
          .chart-curve {
              position: absolute;
              bottom: 40px;
              left: 40px;
              width: calc(100% - 80px);
              height: 60%;
              border-bottom: 3px solid #4fd1c5;
              border-radius: 0 0 50% 0;
          }
          
          .dot {
              position: absolute;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background-color: #4fd1c5;
              bottom: 38px;
              left: 40px;
          }
          
          .dot-end {
              position: absolute;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background-color: #4fd1c5;
              right: 40px;
              bottom: calc(40px + 60%);
          }
          
          .content {
              position: relative;
              z-index: 3;
              padding: 60px;
              width: 55%;
              height: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 30px;
              display: flex;
              align-items: center;
          }
          
          .logo span {
              color: #4fd1c5;
              margin-left: 5px;
          }
          
          .title {
              font-size: 58px;
              font-weight: 800;
              margin-bottom: 24px;
              line-height: 1.2;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .description {
              font-size: 26px;
              opacity: 0.9;
              line-height: 1.5;
              margin-bottom: 40px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .footer {
              margin-top: 20px;
              font-size: 22px;
              font-weight: 500;
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div class="graphics">
              <div class="chart">
                  <div class="chart-line"></div>
                  <div class="chart-curve"></div>
                  <div class="dot"></div>
                  <div class="dot-end"></div>
              </div>
          </div>
          <div class="content">
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <h1 class="title">Visualize Your Path to Financial Independence</h1>
              <p class="description">AI-powered retirement calculator for planning, tracking, and achieving your financial goals.</p>
              <div class="footer">FIRECalculator.ai</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const tempHtmlPath = path.join(__dirname, 'home-page-card.html');
  fs.writeFileSync(tempHtmlPath, homePageCardHtml);
  
  try {
    await page.goto(`file:${tempHtmlPath}`);
    
    // Create the blog images directory if it doesn't exist
    const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }
    
    // Take screenshots and save them
    const ogImagePath = path.join(blogImagesDir, 'home-og-image.png');
    await page.screenshot({ path: ogImagePath });
    
    const twitterImagePath = path.join(blogImagesDir, 'home-twitter-card.png');
    await page.screenshot({ path: twitterImagePath });
    
    console.log('Generated OG images for the home page');
  } catch (error) {
    console.error('Error generating OG image for the home page:', error);
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    await page.close();
  }
}

// Function to generate the FIRE page OG image
async function generateFirePageOgImage(browser) {
  console.log('Generating OG image for the FIRE page');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the FIRE page card
  const firePageCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FIRE Page Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
              color: white;
              position: relative;
              overflow: hidden;
          }
          
          .fire-icon {
              position: absolute;
              top: 60px;
              right: 80px;
              font-size: 180px;
              opacity: 0.15;
          }
          
          .content {
              position: relative;
              z-index: 3;
              padding: 70px;
              height: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 40px;
              display: flex;
              align-items: center;
          }
          
          .logo span {
              color: #4fd1c5;
              margin-left: 5px;
          }
          
          .title {
              font-size: 72px;
              font-weight: 800;
              margin-bottom: 24px;
              line-height: 1.2;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .subtitle {
              font-size: 36px;
              font-weight: 300;
              margin-bottom: 30px;
          }
          
          .description {
              font-size: 24px;
              opacity: 0.9;
              max-width: 70%;
              line-height: 1.5;
              margin-bottom: 40px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .footer {
              margin-top: 30px;
              font-size: 22px;
              font-weight: 500;
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div class="fire-icon">🔥</div>
          <div class="content">
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <h1 class="title">FIRE</h1>
              <div class="subtitle">Financial Independence, Retire Early</div>
              <p class="description">Learn how to achieve financial independence and retire decades earlier with FIRE strategies and step-by-step guidance.</p>
              <div class="footer">FIRECalculator.ai/fire</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const tempHtmlPath = path.join(__dirname, 'fire-page-card.html');
  fs.writeFileSync(tempHtmlPath, firePageCardHtml);
  
  try {
    await page.goto(`file:${tempHtmlPath}`);
    
    // Create the blog images directory if it doesn't exist
    const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }
    
    // Take screenshots and save them
    const ogImagePath = path.join(blogImagesDir, 'fire-og-image.png');
    await page.screenshot({ path: ogImagePath });
    
    const twitterImagePath = path.join(blogImagesDir, 'fire-twitter-card.png');
    await page.screenshot({ path: twitterImagePath });
    
    console.log('Generated OG images for the FIRE page');
  } catch (error) {
    console.error('Error generating OG image for the FIRE page:', error);
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    await page.close();
  }
}

// Function to generate the Compound Interest page OG image
async function generateCompoundInterestPageOgImage(browser) {
  console.log('Generating OG image for the Compound Interest page');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the Compound Interest page card
  const compoundInterestPageCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Compound Interest Page Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
              color: white;
              position: relative;
              overflow: hidden;
          }
          
          .coin-icon {
              position: absolute;
              bottom: 60px;
              right: 80px;
              font-size: 160px;
              opacity: 0.2;
          }
          
          .content {
              position: relative;
              z-index: 3;
              padding: 70px;
              height: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 40px;
              display: flex;
              align-items: center;
          }
          
          .logo span {
              color: #4f46e5;
              margin-left: 5px;
          }
          
          .title {
              font-size: 64px;
              font-weight: 800;
              margin-bottom: 24px;
              line-height: 1.2;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .description {
              font-size: 28px;
              opacity: 0.9;
              max-width: 70%;
              line-height: 1.5;
              margin-bottom: 40px;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .footer {
              margin-top: 30px;
              font-size: 22px;
              font-weight: 500;
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div class="coin-icon">💰</div>
          <div class="content">
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <h1 class="title">Understanding Compound Interest</h1>
              <p class="description">Learn how compound interest can transform your savings into substantial wealth and accelerate your path to financial independence.</p>
              <div class="footer">FIRECalculator.ai/compound-interest</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const tempHtmlPath = path.join(__dirname, 'compound-interest-page-card.html');
  fs.writeFileSync(tempHtmlPath, compoundInterestPageCardHtml);
  
  try {
    await page.goto(`file:${tempHtmlPath}`);
    
    // Create the blog images directory if it doesn't exist
    const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }
    
    // Take screenshots and save them
    const ogImagePath = path.join(blogImagesDir, 'compound-interest-og-image.png');
    await page.screenshot({ path: ogImagePath });
    
    const twitterImagePath = path.join(blogImagesDir, 'compound-interest-twitter-card.png');
    await page.screenshot({ path: twitterImagePath });
    
    console.log('Generated OG images for the Compound Interest page');
  } catch (error) {
    console.error('Error generating OG image for the Compound Interest page:', error);
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    await page.close();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const singlePostArg = args.find(arg => arg.startsWith('--single-post='));
const singlePostId = singlePostArg ? singlePostArg.split('=')[1] : null;

// Main function to generate all OG images
async function generateAllOgImages() {
  console.log('Generating OpenGraph images...');
  
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
    console.error(`Blog post with ID "${singlePostId}" not found.`);
    return;
  }
  
  console.log(`Found ${postsToProcess.length} blog post(s) to process.`);
  
  // Launch a headless browser
  const browser = await puppeteer.launch();
  
  try {
    // Generate special page OG images if not in single post mode
    if (!singlePostId) {
      await generateBlogPageOgImage(browser);
      await generateHomePageOgImage(browser);
      await generateFirePageOgImage(browser);
      await generateCompoundInterestPageOgImage(browser);
    }
    
    // Process each blog post sequentially
    for (const post of postsToProcess) {
      await generateBlogPostOgImage(browser, post);
    }
    
    console.log('OpenGraph images generated successfully!');
  } catch (error) {
    console.error('Error generating OpenGraph images:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the generator
generateAllOgImages().catch(console.error); 