import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts, BlogPost } from './blogData';
import { getBlogPostContent, hasBlogPostContent } from './blogContentLoader';
import { Helmet } from 'react-helmet';
import Footer from '../common/Footer';

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
    color: #1a202c;
    line-height: 1.2;
  }
  .blog-content h2 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-top: 1.75rem;
    margin-bottom: 0.75rem;
    color: #1a202c;
    line-height: 1.3;
  }
  .blog-content h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: #1a202c;
  }
  .blog-content p {
    margin-bottom: 1.25rem;
    line-height: 1.7;
  }
  .blog-content ul, .blog-content ol {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  .blog-content li {
    margin-bottom: 0.5rem;
  }
  .blog-content blockquote {
    border-left: 4px solid #a0aec0;
    padding-left: 1rem;
    font-style: italic;
    margin: 1.5rem 0;
    color: #4a5568;
  }
  .blog-content pre {
    background-color: #f7fafc;
    border-radius: 0.375rem;
    padding: 1rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }
  .blog-content code {
    background-color: #edf2f7;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: monospace;
  }
  .blog-content a {
    color: #4f46e5;
    text-decoration: underline;
  }
  .blog-content a:hover {
    color: #3730a3;
  }
  .blog-content img {
    max-width: 100%;
    height: auto;
    border-radius: 0.375rem;
    margin: 1.5rem 0;
  }
  .blog-content .table-container {
    overflow-x: auto;
    margin: 1.5rem 0;
  }
  .blog-content table {
    width: 100%;
    border-collapse: collapse;
  }
  .blog-content th {
    background-color: #f7fafc;
    padding: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
    text-align: left;
    font-weight: 600;
  }
  .blog-content td {
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .blog-content tr:hover {
    background-color: #f7fafc;
  }
`;

// Process markdown headings to add IDs for anchor links
const processMarkdownHeadings = (content: string): string => {
  // Add ids to headings for anchor links: ## Heading -> <h2 id="heading">Heading</h2>
  return content.replace(/<h([2-6])>(.*?)<\/h\1>/g, (match, level, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
};

// Process markdown links to open in new tab and add security attributes
const processMarkdownLinks = (content: string): string => {
  // Make external links open in new tab with security attributes
  return content.replace(
    /<a\s+href="(https?:\/\/[^"]+)">/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">'
  );
};

// Apply all content processing functions
const processContent = (content: string): string => {
  let processedContent = content;
  processedContent = processMarkdownHeadings(processedContent);
  processedContent = processMarkdownLinks(processedContent);
  return processedContent;
};

const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Find the blog post by ID
    const foundPost = blogPosts.find(p => p.id === id);
    setPost(foundPost || null);

    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      if (!foundPost) {
        setError("Blog post not found");
        setIsLoading(false);
        return;
      }

      try {
        if (hasBlogPostContent(id || '')) {
          const postContent = await getBlogPostContent(id || '');
          setContent(processContent(postContent ?? ''));
        } else {
          setError("Content not available");
        }
      } catch (err) {
        setError("Failed to load blog post content");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <Link to="/blog" className="block mt-4 text-indigo-600 hover:text-indigo-800">
            ← Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {post && (
        <Helmet>
          <title>{post.title} | FIRECalculator.ai Blog</title>
          <meta name="description" content={post.excerpt} />
          
          {/* OpenGraph / Facebook */}
          <meta property="og:type" content="article" />
          <meta property="og:url" content={`https://FIRECalculator.ai/blog/${post.id}`} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={post.excerpt} />
          <meta property="og:image" content={post.image || `/blog-images/${post.id}-og-image.png`} />
          <meta property="article:published_time" content={post.date} />
          <meta property="article:author" content={post.author || "FIRECalculator Team"} />
          {post.topics.map((topic, index) => (
            <meta key={index} property="article:tag" content={topic} />
          ))}
          
          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={`https://FIRECalculator.ai/blog/${post.id}`} />
          <meta name="twitter:title" content={post.title} />
          <meta name="twitter:description" content={post.excerpt} />
          <meta name="twitter:image" content={post.image || `/blog-images/${post.id}-twitter-card.png`} />
          <meta name="twitter:label1" content="Reading time" />
          <meta name="twitter:data1" content={`${post.readTime} min read`} />
        </Helmet>
      )}
      
      <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50">
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/blog" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all articles
          </Link>
        </div>

        {isLoading ? (
          <LoadingPlaceholder />
        ) : post ? (
          <article className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Post Header */}
            <div className="relative">
              {post.image && (
                <div className="h-64 sm:h-80 md:h-96 w-full">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className={`p-6 sm:p-8 ${post.image ? 'bg-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}`}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.topics.map(topic => (
                    <span
                      key={topic}
                      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        post.image ? 'bg-indigo-100 text-indigo-800' : 'bg-white/20 text-white'
                      }`}
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${post.image ? 'text-gray-900' : 'text-white'}`}>
                  {post.title}
                </h1>

                <div className={`flex items-center text-sm ${post.image ? 'text-gray-600' : 'text-indigo-100'}`}>
                  <span className="mr-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(post.date)}
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {post.readTime} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-6 sm:p-8">
              <div 
                className="prose prose-lg prose-indigo max-w-none blog-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* Author Section */}
            <div className="border-t border-gray-200 p-6 sm:p-8 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 sm:mb-0 sm:mr-6">
                  {post.author ? post.author.charAt(0) : 'FC'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{post.author || "FIRECalculator Team"}</h3>
                  <p className="text-gray-600">Financial independence expert and retirement planning specialist with a passion for helping others achieve their FIRE goals.</p>
                </div>
              </div>
            </div>

            {/* Related Posts - Coming Soon */}
            {/* <div className="border-t border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <RelatedPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div> */}

            {/* Call to Action */}
            <div className="border-t border-gray-200 p-6 sm:p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">Ready to plan your financial future?</h3>
                <p className="mb-6">Use our retirement calculator to see how different scenarios affect your path to financial independence.</p>
                <Link 
                  to="/"
                  className="inline-block bg-white text-indigo-600 font-medium px-6 py-3 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Try Our FIRE Calculator
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">Blog post not found</span>
            <Link to="/blog" className="block mt-4 text-indigo-600 hover:text-indigo-800">
              ← Back to blog
            </Link>
          </div>
        )}
        
        {/* Add Footer Component */}
        <Footer />
      </div>
    </>
  );
};

export default BlogPostDetail; 