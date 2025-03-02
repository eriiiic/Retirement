/**
 * Sitemap generator script
 * This script generates a sitemap.xml file for the FIRE Calculator website
 */

const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs');
const path = require('path');

// Configuration
const hostname = 'https://FIRECalculator.ai';

// Define the URLs for your site
const urls = [
  // Homepage
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  
  // Main pages
  { url: '/about', changefreq: 'monthly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.7 },
  { url: '/calculator', changefreq: 'monthly', priority: 0.9 },
  { url: '/resources', changefreq: 'monthly', priority: 0.8 },
  { url: '/blog', changefreq: 'weekly', priority: 0.9 },
  
  // Calculator pages
  { url: '/calculator/fire', changefreq: 'monthly', priority: 0.8 },
  { url: '/calculator/withdrawal', changefreq: 'monthly', priority: 0.8 },
  { url: '/calculator/investment-returns', changefreq: 'monthly', priority: 0.7 },
  { url: '/calculator/retirement-age', changefreq: 'monthly', priority: 0.7 },
  
  // Blog posts
  { url: '/blog/fire-basics-101', changefreq: 'monthly', priority: 0.8 },
  { url: '/blog/investment-strategies', changefreq: 'monthly', priority: 0.8 },
  { url: '/blog/passive-income-fire', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog/real-estate-fire', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog/fire-psychology', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog/tax-optimization', changefreq: 'monthly', priority: 0.7 }
];

// Create a sitemap stream
const smStream = new SitemapStream({ hostname });

// Pipe the stream to a promise
streamToPromise(smStream)
  .then(data => {
    // Write the XML to file
    fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), data.toString());
    console.log('Sitemap generated successfully at public/sitemap.xml');
  })
  .catch(err => {
    console.error('Error generating sitemap:', err);
  });

// Add the URLs to the sitemap
urls.forEach(url => smStream.write(url));

// End the stream
smStream.end(); 