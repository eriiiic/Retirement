/**
 * Blog Post File Generator Script (Standalone Version)
 * 
 * This script creates TypeScript files for all blog posts.
 * It doesn't rely on imports from the TypeScript project.
 * 
 * Usage:
 * From the project root:
 * node src/components/blog/utils/createBlogPostFiles.js
 */

const fs = require('fs');
const path = require('path');

// Blog posts data (copy-pasted from blogData.ts to avoid import issues)
const blogPosts = [
  {
    id: 'fire-basics-101',
    title: 'The Fundamentals of FIRE: Your Path to Financial Independence',
    date: '2024-04-15',
    author: 'Emma Richardson',
    image: '/images/fire-journey.jpg',
    excerpt: 'Discover the core principles of the FIRE movement and how you can start your journey to financial independence and early retirement.',
    readTime: 6,
    topics: ['Financial Independence', 'Early Retirement', 'FIRE Movement', 'Personal Finance'],
  },
  {
    id: 'investment-strategies-2023',
    title: 'Investment Strategies for Building Your FIRE Portfolio',
    date: '2024-04-10',
    author: 'Michael Chen',
    image: '/images/investment-growth.jpg',
    excerpt: 'Learn about the most effective investment approaches to accelerate your path to financial independence in the current market environment.',
    readTime: 8,
    topics: ['Investing', 'Portfolio Management', 'FIRE Movement', 'Stock Market'],
  },
  {
    id: 'tax-optimization-early-retirement',
    title: 'Tax Optimization Strategies for Early Retirees',
    date: '2024-04-05',
    author: 'Sarah Johnson',
    image: '/images/tax-planning.jpg',
    excerpt: 'Discover how to minimize your tax burden during your FIRE journey and throughout early retirement.',
    readTime: 7,
    topics: ['Tax Planning', 'Early Retirement', 'Financial Independence', 'Personal Finance'],
  },
  {
    id: 'real-estate-fire-journey',
    title: 'How Real Estate Can Accelerate Your FIRE Journey',
    date: '2024-03-28',
    author: 'David Williams',
    image: '/images/real-estate-investing.jpg',
    excerpt: 'Explore how strategic real estate investments can provide both cash flow and appreciation on your path to financial independence.',
    readTime: 9,
    topics: ['Real Estate', 'FIRE Movement', 'Passive Income', 'Investing'],
  },
  {
    id: 'budget-optimization-fire',
    title: 'Optimizing Your Budget for a Faster Path to FIRE',
    date: '2024-03-20',
    author: 'Emma Richardson',
    image: '/images/budget-planning.jpg',
    excerpt: 'Learn practical strategies to increase your savings rate while maintaining life satisfaction on your journey to financial independence.',
    readTime: 5,
    topics: ['Budgeting', 'Frugality', 'FIRE Movement', 'Personal Finance'],
  },
  {
    id: 'passive-income-fire',
    title: 'Building Passive Income Streams for Financial Independence',
    date: '2024-03-15',
    author: 'Michael Chen',
    image: '/images/passive-income.jpg',
    excerpt: 'Discover multiple approaches to creating sustainable passive income that will support your lifestyle after achieving FIRE.',
    readTime: 7,
    topics: ['Passive Income', 'Financial Independence', 'Side Hustles', 'Entrepreneurship'],
  },
  {
    id: 'psychology-financial-independence',
    title: 'The Psychology of Money: Mental Frameworks for FIRE Success',
    date: '2024-03-05',
    author: 'Sarah Johnson',
    image: '/images/money-mindset.jpg',
    excerpt: 'Understanding the psychological aspects of saving, investing, and building wealth that are crucial for your FIRE journey.',
    readTime: 6,
    topics: ['Psychology', 'Behavioral Finance', 'FIRE Movement', 'Financial Independence'],
  },
  {
    id: 'international-fire',
    title: 'Geographic Arbitrage: Pursuing FIRE Internationally',
    date: '2024-02-25',
    author: 'David Williams',
    image: '/images/global-living.jpg',
    excerpt: 'How relocating to lower-cost countries can dramatically accelerate your path to financial independence and early retirement.',
    readTime: 8,
    topics: ['Geographic Arbitrage', 'International Living', 'FIRE Movement', 'Travel'],
  },
  {
    id: 'coast-fire-approach',
    title: 'Coast FIRE: A More Balanced Approach to Financial Independence',
    date: '2024-02-15',
    author: 'Emma Richardson',
    image: '/images/balanced-lifestyle.jpg',
    excerpt: 'Learn how Coast FIRE allows you to enjoy the present while still ensuring your financial future.',
    readTime: 5,
    topics: ['Coast FIRE', 'Work-Life Balance', 'Financial Independence', 'Personal Finance'],
  }
];

// Get the path to the blog directory
const blogDir = path.join(__dirname, '..');

// Counter for generated files
let generatedCount = 0;

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

<div class="lead-quote">
  <blockquote>
    "Add an inspiring quote related to ${post.topics[0] || 'this topic'} here."
  </blockquote>
</div>

<div class="article-intro">
  ${post.excerpt}
</div>

## Main Content Section 1

Add your content here...

## Main Content Section 2

Add your content here...

## Main Content Section 3

Add your content here...

## Conclusion

Add a conclusion here...

---

<div class="engagement-section">
  <h4>Join the Conversation</h4>
  <p>What are your thoughts on ${post.topics[0] || 'this topic'}? Share in the comments below!</p>
</div>

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