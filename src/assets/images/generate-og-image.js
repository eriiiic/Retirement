const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Function to generate the main app social media card image
async function generateMainOgImage(browser) {
  console.log('Generating main app social media card image...');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Load the HTML template
  const htmlPath = path.join(__dirname, 'social-card-template.html');
  await page.goto(`file:${htmlPath}`);
  
  // Create the public directory if it doesn't exist
  const publicDir = path.join(__dirname, '../../../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Take a screenshot and save it as og-image.png
  const ogImagePath = path.join(publicDir, 'og-image.png');
  await page.screenshot({ path: ogImagePath });
  
  // Take another screenshot for Twitter (same dimensions in this case)
  const twitterImagePath = path.join(publicDir, 'twitter-card.png');
  await page.screenshot({ path: twitterImagePath });
  
  console.log(`Generated main OpenGraph image: ${ogImagePath}`);
  console.log(`Generated main Twitter card image: ${twitterImagePath}`);
  
  await page.close();
}

// Function to generate the blog page social media card
async function generateBlogOgImage(browser) {
  console.log('Generating blog page social media card image...');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the blog card
  const blogCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blog Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
              color: white;
              padding: 40px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
          }
          
          .card::before {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
              border-radius: 50%;
              transform: translate(100px, -200px);
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
          }
          
          .logo span {
              color: #4fd1c5;
          }
          
          .title {
              font-size: 64px;
              font-weight: bold;
              margin-bottom: 16px;
              line-height: 1.2;
          }
          
          .description {
              font-size: 32px;
              opacity: 0.9;
              max-width: 800px;
              line-height: 1.4;
              margin-bottom: 40px;
          }
          
          .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 24px;
              opacity: 0.8;
          }
          
          .icon-grid {
              position: absolute;
              bottom: 80px;
              right: 60px;
              width: 300px;
              height: 300px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              gap: 20px;
          }
          
          .icon {
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 15px;
          }
          
          .icon svg {
              width: 40px;
              height: 40px;
              fill: #4fd1c5;
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div>
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <h1 class="title">FIRE Blog & Resources</h1>
              <p class="description">Expert insights on financial independence, retirement strategies, and wealth building</p>
          </div>
          
          <div class="icon-grid">
              <div class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
              </div>
              <div class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
              </div>
              <div class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M4 10h3v7H4zM10.5 10h3v7h-3zM2 19h20v3H2zM17 10h3v7h-3zM12 1L2 6v2h20V6z"/>
                  </svg>
              </div>
              <div class="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                  </svg>
              </div>
          </div>
          
          <div class="footer">
              <div class="date">March 2023</div>
              <div class="author">By FIRECalculator Team</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const blogHtmlPath = path.join(__dirname, 'blog-card-template.html');
  fs.writeFileSync(blogHtmlPath, blogCardHtml);
  
  await page.goto(`file:${blogHtmlPath}`);
  
  // Create the blog images directory if it doesn't exist
  const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
  if (!fs.existsSync(blogImagesDir)) {
    fs.mkdirSync(blogImagesDir, { recursive: true });
  }
  
  // Take screenshots and save them
  const blogOgImagePath = path.join(blogImagesDir, 'blog-og-image.png');
  await page.screenshot({ path: blogOgImagePath });
  
  const blogTwitterImagePath = path.join(blogImagesDir, 'blog-twitter-card.png');
  await page.screenshot({ path: blogTwitterImagePath });
  
  console.log(`Generated blog OpenGraph image: ${blogOgImagePath}`);
  console.log(`Generated blog Twitter card image: ${blogTwitterImagePath}`);
  
  await page.close();
}

// Function to generate the FIRE page social media card
async function generateFireOgImage(browser) {
  console.log('Generating FIRE page social media card image...');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the FIRE card
  const fireCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FIRE Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
              color: white;
              padding: 40px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
          }
          
          .card::before {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
              border-radius: 50%;
              transform: translate(100px, -200px);
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
          }
          
          .logo span {
              color: #fef3c7;
          }
          
          .title {
              font-size: 64px;
              font-weight: bold;
              margin-bottom: 16px;
              line-height: 1.2;
          }
          
          .description {
              font-size: 32px;
              opacity: 0.9;
              max-width: 800px;
              line-height: 1.4;
              margin-bottom: 40px;
          }
          
          .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 24px;
              opacity: 0.8;
          }
          
          .fire-illustration {
              position: absolute;
              bottom: 60px;
              right: 60px;
              width: 300px;
              height: 300px;
              display: flex;
              justify-content: center;
              align-items: center;
          }
          
          .fire-icon {
              width: 200px;
              height: 200px;
              position: relative;
          }
          
          .fire-icon::before {
              content: '';
              position: absolute;
              width: 100%;
              height: 100%;
              background: radial-gradient(circle, rgba(255, 208, 86, 0.9) 0%, rgba(255, 152, 0, 0.8) 50%, rgba(255, 111, 0, 0) 100%);
              border-radius: 50%;
              animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
              0% { transform: scale(0.8); opacity: 0.8; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(0.8); opacity: 0.8; }
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div>
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <h1 class="title">Financial Independence, Retire Early</h1>
              <p class="description">Learn how to achieve financial freedom and retire on your own terms</p>
          </div>
          
          <div class="fire-illustration">
              <div class="fire-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                  </svg>
              </div>
          </div>
          
          <div class="footer">
              <div class="date">March 2023</div>
              <div class="author">By FIRECalculator Team</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const fireHtmlPath = path.join(__dirname, 'fire-card-template.html');
  fs.writeFileSync(fireHtmlPath, fireCardHtml);
  
  await page.goto(`file:${fireHtmlPath}`);
  
  // Create the blog images directory if it doesn't exist
  const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
  if (!fs.existsSync(blogImagesDir)) {
    fs.mkdirSync(blogImagesDir, { recursive: true });
  }
  
  // Take screenshots and save them
  const fireOgImagePath = path.join(blogImagesDir, 'fire-og-image.png');
  await page.screenshot({ path: fireOgImagePath });
  
  const fireTwitterImagePath = path.join(blogImagesDir, 'fire-twitter-card.png');
  await page.screenshot({ path: fireTwitterImagePath });
  
  console.log(`Generated FIRE OpenGraph image: ${fireOgImagePath}`);
  console.log(`Generated FIRE Twitter card image: ${fireTwitterImagePath}`);
  
  await page.close();
}

// Function to generate the Compound Interest page social media card
async function generateCompoundInterestOgImage(browser) {
  console.log('Generating Compound Interest page social media card image...');
  
  const page = await browser.newPage();
  
  // Set the viewport to the OpenGraph image dimensions
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });
  
  // Create HTML content for the Compound Interest card
  const compoundInterestCardHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Compound Interest Social Card</title>
      <style>
          body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .card {
              width: 1200px;
              height: 630px;
              background: linear-gradient(135deg, #059669 0%, #10b981 100%);
              color: white;
              padding: 40px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
          }
          
          .card::before {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
              border-radius: 50%;
              transform: translate(100px, -200px);
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
          }
          
          .logo span {
              color: #d1fae5;
          }
          
          .title {
              font-size: 64px;
              font-weight: bold;
              margin-bottom: 16px;
              line-height: 1.2;
          }
          
          .description {
              font-size: 32px;
              opacity: 0.9;
              max-width: 800px;
              line-height: 1.4;
              margin-bottom: 40px;
          }
          
          .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 24px;
              opacity: 0.8;
          }
          
          .chart-illustration {
              position: absolute;
              bottom: 60px;
              right: 60px;
              width: 300px;
              height: 250px;
          }
          
          .curve {
              position: absolute;
              bottom: 0;
              right: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
          }
          
          .curve::after {
              content: '';
              position: absolute;
              width: 300px;
              height: 300px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 43% 57% 70% 30% / 30% 43% 57% 70%;
              transform: translate(50px, 100px) scale(0.6);
          }
          
          .curve::before {
              content: '';
              position: absolute;
              width: 300px;
              height: 300px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 43% 57% 70% 30% / 30% 43% 57% 70%;
              transform: translate(0px, 60px) scale(0.8);
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div>
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <h1 class="title">Compound Interest Calculator</h1>
              <p class="description">Discover the power of compound growth and see how your investments can multiply over time</p>
          </div>
          
          <div class="chart-illustration">
              <div class="curve"></div>
          </div>
          
          <div class="footer">
              <div class="date">March 2023</div>
              <div class="author">By FIRECalculator Team</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const compoundInterestHtmlPath = path.join(__dirname, 'compound-interest-card-template.html');
  fs.writeFileSync(compoundInterestHtmlPath, compoundInterestCardHtml);
  
  await page.goto(`file:${compoundInterestHtmlPath}`);
  
  // Create the blog images directory if it doesn't exist
  const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
  if (!fs.existsSync(blogImagesDir)) {
    fs.mkdirSync(blogImagesDir, { recursive: true });
  }
  
  // Take screenshots and save them
  const compoundInterestOgImagePath = path.join(blogImagesDir, 'compound-interest-og-image.png');
  await page.screenshot({ path: compoundInterestOgImagePath });
  
  const compoundInterestTwitterImagePath = path.join(blogImagesDir, 'compound-interest-twitter-card.png');
  await page.screenshot({ path: compoundInterestTwitterImagePath });
  
  console.log(`Generated Compound Interest OpenGraph image: ${compoundInterestOgImagePath}`);
  console.log(`Generated Compound Interest Twitter card image: ${compoundInterestTwitterImagePath}`);
  
  await page.close();
}

// Function to generate a generic blog post social media card
async function generateBlogPostOgImage(browser) {
  console.log('Generating blog post social media card image...');
  
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
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 40px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
          }
          
          .card::before {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
              border-radius: 50%;
              transform: translate(100px, -200px);
          }
          
          .card::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 50%;
              background: linear-gradient(0deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%);
              z-index: 1;
          }
          
          .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
              position: relative;
              z-index: 2;
          }
          
          .logo span {
              color: #93c5fd;
          }
          
          .title-area {
              position: relative;
              z-index: 2;
          }
          
          .category {
              display: inline-block;
              background-color: rgba(255, 255, 255, 0.2);
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 20px;
              margin-bottom: 16px;
          }
          
          .title {
              font-size: 64px;
              font-weight: bold;
              margin-bottom: 16px;
              line-height: 1.2;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .description {
              font-size: 32px;
              opacity: 0.9;
              max-width: 800px;
              line-height: 1.4;
              margin-bottom: 40px;
              text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }
          
          .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 24px;
              opacity: 0.8;
              position: relative;
              z-index: 2;
          }
          
          .pattern {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
              opacity: 0.2;
          }
      </style>
  </head>
  <body>
      <div class="card">
          <div class="pattern"></div>
          <div>
              <div class="logo">FIRE<span>Calculator.ai</span></div>
              <div class="title-area">
                  <div class="category">FIRE Strategy</div>
                  <h1 class="title">Expert Financial Insights</h1>
                  <p class="description">Strategies and tips for achieving financial independence and early retirement</p>
              </div>
          </div>
          
          <div class="footer">
              <div class="date">March 2023</div>
              <div class="author">By FIRECalculator Team</div>
          </div>
      </div>
  </body>
  </html>
  `;
  
  // Write the HTML to a temporary file
  const blogPostHtmlPath = path.join(__dirname, 'blog-post-card-template.html');
  fs.writeFileSync(blogPostHtmlPath, blogPostCardHtml);
  
  await page.goto(`file:${blogPostHtmlPath}`);
  
  // Create the blog images directory if it doesn't exist
  const blogImagesDir = path.join(__dirname, '../../../public/blog-images');
  if (!fs.existsSync(blogImagesDir)) {
    fs.mkdirSync(blogImagesDir, { recursive: true });
  }
  
  // Take screenshots and save them
  const blogPostOgImagePath = path.join(blogImagesDir, 'blog-post-og-image.png');
  await page.screenshot({ path: blogPostOgImagePath });
  
  const blogPostTwitterImagePath = path.join(blogImagesDir, 'blog-post-twitter-card.png');
  await page.screenshot({ path: blogPostTwitterImagePath });
  
  console.log(`Generated blog post OpenGraph image: ${blogPostOgImagePath}`);
  console.log(`Generated blog post Twitter card image: ${blogPostTwitterImagePath}`);
  
  await page.close();
}

// Main function to generate all social media card images
async function generateAllOgImages() {
  console.log('Generating all social media card images...');
  
  // Launch a headless browser
  const browser = await puppeteer.launch();
  
  try {
    // Generate the main app social media card
    await generateMainOgImage(browser);
    
    // Generate the blog page social media card
    await generateBlogOgImage(browser);
    
    // Generate the FIRE page social media card
    await generateFireOgImage(browser);
    
    // Generate the Compound Interest page social media card
    await generateCompoundInterestOgImage(browser);
    
    // Generate the generic blog post social media card
    await generateBlogPostOgImage(browser);
    
    console.log('All social media card images generated successfully!');
  } catch (error) {
    console.error('Error generating social media card images:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the generator
generateAllOgImages().catch(console.error); 