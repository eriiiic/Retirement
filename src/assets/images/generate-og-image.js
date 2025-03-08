const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Function to generate the social media card image
async function generateOgImage() {
  console.log('Generating social media card images...');
  
  // Launch a headless browser
  const browser = await puppeteer.launch();
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
  
  // Close the browser
  await browser.close();
  
  console.log(`Generated OpenGraph image: ${ogImagePath}`);
  console.log(`Generated Twitter card image: ${twitterImagePath}`);
}

// Run the generator
generateOgImage().catch(console.error); 