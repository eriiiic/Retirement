# Blog Content Management

## Overview

This directory contains the blog components and content for the Retraite application. The blog posts use a modular architecture where:

- Metadata about blog posts is stored in `blogData.ts`
- Individual blog post content is stored in dedicated TypeScript files (`blogPost-[id].ts`)
- A content loader utility (`blogContentLoader.ts`) manages loading content on demand

## Performance Benefits

This approach provides several performance benefits:

1. **Reduced Initial Load Time**: By separating content from metadata, the initial page load only fetches the necessary metadata.
2. **On-Demand Content Loading**: Blog post content is only loaded when needed (when a user views the specific post).
3. **Improved Maintainability**: Easier to manage and edit individual blog posts without affecting the entire collection.
4. **Better Caching**: Individual blog post files can be cached separately, improving load times for returning visitors.

## File Structure

```
blog/
├── BlogPage.tsx               # Blog listing page component
├── BlogPostDetail.tsx         # Individual blog post display component
├── README.md                  # This documentation file
├── blogContentLoader.ts       # Utility to load blog content on demand
├── blogData.ts                # Blog post metadata (no content)
├── blogPost-[id].ts           # Content files (used by the app)
└── utils/
    ├── generateBlogPostFile.ts  # TypeScript utility for generating files
    ├── generateBlogFiles.js     # Node script for generating all missing files
    └── createBlogPostFiles.js   # Standalone script to create all blog post files
```

## How It Works

1. `BlogPage.tsx` displays a list of blog posts using metadata from `blogData.ts`
2. When a user clicks on a blog post, they navigate to `/blog/:id`
3. `BlogPostDetail.tsx` loads the post metadata from `blogData.ts`
4. The component then uses `blogContentLoader.ts` to dynamically load the content from the appropriate `blogPost-[id].ts` file
5. This ensures content is only loaded when needed, improving initial page load performance
6. Content from the TypeScript files is rendered as HTML, allowing for advanced styling and components

## Adding a New Blog Post

### Manual Method

1. Add the blog post metadata to the `blogPosts` array in `blogData.ts`
2. Create a new TypeScript file `blogPost-[id].ts` with the content
3. Import and add the content to the `blogContentMap` in `blogContentLoader.ts`

### Using the Utility Scripts

#### Node.js Script (Recommended)

1. Add the blog post metadata to the `blogPosts` array in `blogData.ts`
2. Run the utility script to generate template files for all missing blog posts:

```bash
node src/components/blog/utils/createBlogPostFiles.js
```

3. Edit the generated template files with your content
4. Update `blogContentLoader.ts` as instructed by the script output

#### TypeScript Utility

```typescript
// In a Node.js script or development tool
import { generateBlogPostFile } from './utils/generateBlogPostFile';
generateBlogPostFile('your-post-id');
```

### Example

```typescript
// 1. Add to blogData.ts (in the blogPosts array)
{
  id: 'new-post',
  title: 'Your Blog Post Title',
  excerpt: 'Short excerpt about the post',
  date: '2024-05-01',
  author: 'Author Name',
  topics: ['Topic1', 'Topic2'],
  image: '/path/to/image.jpg',
  readTime: 5
}

// 2. Create blogPost-new-post.ts
export const content = `# Your Blog Post Title

![Alt text](/path/to/image.jpg)

<div class="lead-quote">
  <blockquote>
    "An inspiring quote about your topic."
  </blockquote>
</div>

<div class="article-intro">
  Your introduction goes here.
</div>

## Main Section

Content with **bold** and *italic* text.

## Conclusion

Final thoughts and call to action.

---

<div class="engagement-section">
  <h4>Join the Conversation</h4>
  <p>What are your thoughts? Share in the comments below!</p>
</div>

[Back to Blog](/blog)`;

// 3. Update blogContentLoader.ts
// Import the content
import { content as newPostContent } from './blogPost-new-post';

// Add to blogContentMap
const blogContentMap: Record<string, string> = {
  'fire-basics-101': fireBasicsContent,
  'new-post': newPostContent,
  // etc.
};
```

## Content Formatting

Blog content supports HTML and Markdown-style formatting with some custom components:

- Images: `![alt text](/path/to/image.jpg)`
- Custom containers: `<div class="lead-quote">...</div>`
- Headers: `# H1`, `## H2`, etc.
- Lists: Numbered and bullet points
- Tables: HTML table syntax with custom classes
- Emphasis: `**bold**`, `*italic*`
- Links: `[text](url)`
- Advanced styling: Custom CSS classes for callouts, cards, etc.

Emoji support: 💡 ⚙️ 🧮 etc.

## Utilities

The `utils` directory contains helper scripts:

### generateBlogPostFile.ts

TypeScript utility that generates template files for blog posts based on their metadata in `blogData.ts`.

**Functions:**
- `generateBlogPostFile(id: string)`: Creates a template file for a specific blog post ID
- `generateAllMissingBlogPostFiles()`: Creates template files for all blog posts that don't have files yet

### generateBlogFiles.js

Node.js script that generates all missing blog post files. Requires ts-node to be installed.

**Usage:**
```bash
npm install --save-dev ts-node
node src/components/blog/utils/generateBlogFiles.js
```

### createBlogPostFiles.js

Standalone Node.js script that creates TypeScript files for all blog posts. Does not require imports from the TypeScript project.

**Usage:**
```bash
node src/components/blog/utils/createBlogPostFiles.js
``` 