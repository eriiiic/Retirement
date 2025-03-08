import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { blogPosts, BlogPost } from './blogData';
import { getBlogPostContent, hasBlogPostContent } from './blogContentLoader';
import { useTheme } from '../../context/ThemeContext';
import { cx } from '../../styles/styleGuide';

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
  </div>
);

// Define CSS styles for blog content
const blogStyles = `
  .blog-content h1 {
    font-size: 2.25rem;
    font-weight: 800;
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: var(--heading-color);
    line-height: 1.2;
  }
  .blog-content h2 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-top: 1.75rem;
    margin-bottom: 0.75rem;
    color: var(--heading-color);
    line-height: 1.3;
  }
  .blog-content h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--heading-color);
    line-height: 1.4;
  }
  .blog-content p {
    margin-top: 1rem;
    margin-bottom: 1rem;
    line-height: 1.7;
    color: var(--text-color);
  }
  .blog-content ul, .blog-content ol {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding-left: 2rem;
  }
  .blog-content ul {
    list-style-type: disc;
  }
  .blog-content ol {
    list-style-type: decimal;
  }
  .blog-content li {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    color: var(--text-color);
  }
  .blog-content a {
    color: var(--link-color);
    text-decoration: underline;
  }
  .blog-content blockquote {
    padding-left: 1.25rem;
    border-left: 4px solid var(--blockquote-border);
    font-style: italic;
    color: var(--blockquote-text);
    margin: 1.5rem 0;
  }
  .blog-content img {
    margin: 2rem auto;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-width: 100%;
    height: auto;
    display: block;
  }
  .blog-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }
  .blog-content table th {
    background-color: var(--table-header-bg);
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    border: 1px solid var(--table-border);
  }
  .blog-content table td {
    padding: 0.75rem 1rem;
    border: 1px solid var(--table-border);
  }
  .blog-content table tr:nth-child(even) {
    background-color: var(--table-alternate-bg);
  }
  /* Custom components */
  .blog-content .lead-quote {
    margin: 2rem 0;
    padding: 1.5rem;
    background-color: var(--lead-quote-bg);
    border-radius: 0.5rem;
    border-left: 4px solid var(--lead-quote-border);
  }
  .blog-content .article-intro {
    font-size: 1.125rem;
    font-weight: 500;
    color: var(--text-color);
    margin: 1.5rem 0 2rem;
    line-height: 1.7;
    padding: 0 0.5rem;
  }
  .blog-content .calculator-widget,
  .blog-content .callout,
  .blog-content .table-container,
  .blog-content .strategy-box,
  .blog-content .implementation-tip,
  .blog-content .progress-tracker,
  .blog-content .real-estate-strategies,
  .blog-content .post-fire-planning,
  .blog-content .reflection-prompts,
  .blog-content .conclusion-banner,
  .blog-content .engagement-section {
    margin: 2rem 0;
    padding: 1.5rem;
    border-radius: 0.5rem;
    background-color: var(--widget-bg);
    border: 1px solid var(--widget-border);
  }
  .blog-content .styles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
  }
  .blog-content .formula-highlight {
    font-weight: bold;
    font-size: 1.25rem;
    text-align: center;
    padding: 1rem;
    margin: 1rem 0;
    background-color: var(--formula-bg);
    border-radius: 0.375rem;
  }
  .blog-content .concept-box {
    border: 1px solid var(--concept-border);
    border-radius: 0.5rem;
    padding: 1.25rem;
    margin: 1.5rem 0;
    background-color: var(--concept-bg);
  }
  .blog-content .style-card {
    border: 1px solid var(--card-border);
    border-radius: 0.5rem;
    padding: 1.25rem;
    margin: 1rem 0;
    background-color: var(--card-bg);
    transition: all 0.2s ease-in-out;
  }
  .blog-content .style-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }
  .blog-content .style-card h3 {
    margin-top: 0;
    color: var(--card-heading-color);
  }
  .blog-content .implementation-tip {
    background-color: var(--tip-bg);
    border-left: 4px solid var(--tip-border);
  }
  .blog-content .info {
    background-color: var(--info-bg);
    border-left: 4px solid var(--info-border);
  }
  .blog-content .back-to-blog-link {
    display: inline-block;
    color: var(--link-color);
    text-decoration: underline;
    font-weight: 500;
    margin-top: 2rem;
  }
  
  :root {
    --heading-color: #1a202c;
    --text-color: #4a5568;
    --link-color: #4c51bf;
    --blockquote-border: #e2e8f0;
    --blockquote-text: #718096;
    --table-header-bg: #f7fafc;
    --table-border: #e2e8f0;
    --table-alternate-bg: #f7fafc;
    --lead-quote-bg: #f0f4f8;
    --lead-quote-border: #4c51bf;
    --widget-bg: #f7fafc;
    --widget-border: #e2e8f0;
    --formula-bg: #ebf4ff;
    --concept-bg: #f9fafb;
    --concept-border: #d1d5db;
    --card-bg: #f9fafb;
    --card-border: #d1d5db;
    --card-heading-color: #4c51bf;
    --tip-bg: #e6fffa;
    --tip-border: #38b2ac;
    --info-bg: #ebf8ff;
    --info-border: #4299e1;
  }
  
  [data-theme="dark"] {
    --heading-color: #f7fafc;
    --text-color: #cbd5e0;
    --link-color: #818cf8;
    --blockquote-border: #4a5568;
    --blockquote-text: #a0aec0;
    --table-header-bg: #2d3748;
    --table-border: #4a5568;
    --table-alternate-bg: #2d3748;
    --lead-quote-bg: #2d3748;
    --lead-quote-border: #6366f1;
    --widget-bg: #2d3748;
    --widget-border: #4a5568;
    --formula-bg: #3730a3;
    --concept-bg: #2d3748;
    --concept-border: #4a5568;
    --card-bg: #1e293b;
    --card-border: #4a5568;
    --card-heading-color: #818cf8;
    --tip-bg: #065f46;
    --tip-border: #0f766e;
    --info-bg: #1e3a8a;
    --info-border: #2563eb;
  }
`;

/**
 * Converts markdown headings (## Heading) to HTML headings
 * @param content - The blog post content
 * @returns The content with markdown headings converted to HTML
 */
const processMarkdownHeadings = (content: string): string => {
  // Replace ## headings with <h2> tags
  // Regex matches ## with optional spaces followed by text until end of line
  return content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
};

/**
 * Converts markdown links [Text](URL) to HTML links
 * @param content - The blog post content
 * @returns The content with markdown links converted to HTML
 */
const processMarkdownLinks = (content: string): string => {
  // Handle specific "Back to Blog" link at the end
  return content.replace(
    /\[Back to Blog\]\(\/blog\)/g, 
    '<a href="/blog" class="back-to-blog-link">Back to Blog</a>'
  );
};

/**
 * Process all markdown syntax in content
 * @param content - The raw blog post content
 * @returns Processed content with markdown converted to HTML
 */
const processContent = (content: string): string => {
  if (!content) return '';
  
  let processedContent = content;
  processedContent = processMarkdownHeadings(processedContent);
  processedContent = processMarkdownLinks(processedContent);
  
  return processedContent;
};

const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find((post) => post.id === id);
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { darkMode } = useTheme();
  
  useEffect(() => {
    const loadContent = async () => {
      if (id) {
        setIsLoading(true);
        try {
          // Check if blog post has content available
          if (hasBlogPostContent(id)) {
            // Get content from the dedicated file
            const postContent = getBlogPostContent(id);
            setContent(postContent);
          } else {
            // If no content is available, fallback to excerpt
            setContent(null);
            console.warn(`No dedicated content file found for blog post: ${id}`);
          }
        } catch (error) {
          console.error('Error loading blog content:', error);
          setContent(null);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadContent();
  }, [id]);
  
  useEffect(() => {
    // Set dark mode class on document for CSS variables
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [darkMode]);
  
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className={cx("text-2xl font-bold mb-4", darkMode ? "text-gray-100" : "text-gray-800")}>Blog Post Not Found</h1>
          <p className={cx("mb-6", darkMode ? "text-gray-300" : "text-gray-600")}>The article you're looking for doesn't seem to exist.</p>
          <Link 
            to="/blog" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            &larr; Back to Blog
          </Link>
        </div>
      </div>
    );
  }
  
  // Format date to readable string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Create the website URL from the blog post ID
  const siteUrl = "https://FIRECalculator.ai";
  const postUrl = `${siteUrl}/blog/${post.id}`;
  
  // Get the paths for the OG and Twitter card images
  const ogImagePath = `/blog-images/${post.id}-og-image.png`;
  const twitterImagePath = `/blog-images/${post.id}-twitter-card.png`;
  
  return (
    <div className={cx("max-w-4xl mx-auto px-4 py-8", darkMode ? "bg-gray-900" : "bg-gray-50")}>
      <Helmet>
        <title>{post.title} | FIRECalculator.ai</title>
        <meta name="description" content={post.excerpt} />
        
        {/* Open Graph meta tags */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={`${siteUrl}${ogImagePath}`} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:site_name" content="FIRECalculator.ai" />
        <meta property="article:published_time" content={post.date} />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={`${siteUrl}${twitterImagePath}`} />
        <meta name="twitter:url" content={postUrl} />
        
        {/* LinkedIn meta tags */}
        <meta property="linkedin:title" content={post.title} />
        <meta property="linkedin:description" content={post.excerpt} />
        <meta property="linkedin:image" content={`${siteUrl}${ogImagePath}`} />
      </Helmet>
      
      {/* Add custom styles for blog content */}
      <style dangerouslySetInnerHTML={{ __html: blogStyles }} />

      <Link 
        to="/blog" 
        className={cx("inline-flex items-center hover:text-indigo-700 mb-6", darkMode ? "text-indigo-400" : "text-indigo-600")}
      >
        &larr; Back to Blog
      </Link>
      
      {post.image && (
        <div className="relative h-72 md:h-96 mb-8 rounded-lg overflow-hidden shadow-md">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="mb-6">
        <h1 className={cx("text-3xl md:text-4xl font-bold mb-4", darkMode ? "text-gray-100" : "text-gray-900")}>{post.title}</h1>
        
        <div className={cx("flex flex-wrap items-center text-sm mb-4", darkMode ? "text-gray-400" : "text-gray-600")}>
          <div className="flex items-center mr-6 mb-2">
            <span className="mr-1">📅</span>
            <span>{formatDate(post.date)}</span>
          </div>
          <div className="flex items-center mr-6 mb-2">
            <span className="mr-1">⏱️</span>
            <span>{post.readTime} min read</span>
          </div>
          <div className="flex items-center mb-2">
            <span>By {post.author}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {post.topics.map(topic => (
            <span 
              key={topic} 
              className={cx(
                "inline-flex items-center text-xs font-medium px-2 py-1 rounded",
                darkMode 
                  ? "bg-indigo-900/50 text-indigo-300"
                  : "bg-indigo-50 text-indigo-700"
              )}
            >
              <span className="mr-1">🏷️</span> {topic}
            </span>
          ))}
        </div>
      </div>
      
      <div className={cx("prose prose-lg max-w-none blog-content", darkMode ? "prose-invert" : "")}>
        {isLoading ? (
          <LoadingPlaceholder />
        ) : content ? (
          <div dangerouslySetInnerHTML={{ __html: processContent(content) }} />
        ) : (
          <div>
            <p className={cx("mb-4", darkMode ? "text-gray-300" : "text-gray-700")}>{post.excerpt}</p>
            <div className={cx(
              "border-l-4 p-4 mb-6",
              darkMode 
                ? "bg-yellow-900/30 border-yellow-700 text-yellow-200" 
                : "bg-yellow-50 border-yellow-400 text-yellow-700"
            )}>
              <p>
                Full content for this blog post is coming soon. Check back later for the complete article!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostDetail; 