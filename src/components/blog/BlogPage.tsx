import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts, BlogPost, BlogTopic } from './blogData';
import Footer from '../common/Footer'; // Import Footer component
import { Helmet } from 'react-helmet';
import { isSafari } from '../../utils/browserDetection';

const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<BlogTopic[]>([]);
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  
  // Detect Safari browser on component mount
  useEffect(() => {
    setIsSafariBrowser(isSafari());
  }, []);
  
  // Extract all unique topics from blog posts
  const allTopics = useMemo(() => {
    const topics = new Set<BlogTopic>();
    blogPosts.forEach((post: BlogPost) => {
      post.topics.forEach((topic: BlogTopic) => topics.add(topic));
    });
    return Array.from(topics).sort();
  }, []);
  
  // Filter posts based on search query and selected topics
  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post: BlogPost) => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by selected topics
      const matchesTopics = selectedTopics.length === 0 || 
        selectedTopics.some(topic => post.topics.includes(topic));
      
      return matchesSearch && matchesTopics;
    }).sort((a: BlogPost, b: BlogPost) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchQuery, selectedTopics]);
  
  const toggleTopic = (topic: BlogTopic) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic) 
        : [...prev, topic]
    );
  };
  
  // Format date to readable string
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50">
      <Helmet>
        <title>Blog & Resources | FIRE Retirement Planning</title>
        <meta name="description" content="Explore practical advice, real-world case studies, and data-driven strategies from people who achieved financial independence." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog & Resources | FIRE Retirement Planning" />
        <meta property="og:description" content="Explore financial independence strategies, investment approaches, and retirement planning insights from those who've achieved FIRE." />
        <meta property="og:image" content="https://FIRECalculator.ai/blog-images/blog-og-image.png" />
        <meta property="og:url" content="https://FIRECalculator.ai/blog" />
        <meta property="og:site_name" content="FIRECalculator.ai" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog & Resources | FIRE Retirement Planning" />
        <meta name="twitter:description" content="Explore financial independence strategies, investment approaches, and retirement planning insights from those who've achieved FIRE." />
        <meta name="twitter:image" content="https://FIRECalculator.ai/blog-images/blog-twitter-card.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://FIRECalculator.ai/blog" />
      </Helmet>

      {/* Page Header with Gradient Background */}
      <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
        <div className={`py-12 px-6 ${isSafariBrowser ? 'bg-indigo-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Blog & Resources
            </h1>
            <p className="text-gray-100 text-sm sm:text-base max-w-2xl mx-auto font-medium">
              Practical advice, real-world case studies, and data-driven strategies from people who achieved financial independence.
              Explore success stories, investment insights, and retirement planning approaches that work.
            </p>
          </div>
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="mb-10 bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Topic:</h3>
          <div className="flex flex-wrap gap-2">
            {allTopics.map(topic => (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTopics.includes(topic)
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                } border`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Blog posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: BlogPost) => (
            <Link 
              key={post.id}
              to={`/blog/${post.id}`}
              className="flex flex-col h-full"
            >
              <article className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden h-full border border-gray-200 transition-transform hover:-translate-y-1 hover:shadow-lg">
                {post.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.topics.map((topic: BlogTopic) => (
                      <span 
                        key={topic} 
                        className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded"
                      >
                        <span className="mr-1">🏷️</span> {topic}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-indigo-600">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 flex-grow">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-1">📅</span>
                        <span>{formatDate(post.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">⏱️</span>
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No articles found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
          </div>
        )}
      </div>
      
            {/* Add Footer Component */}
            <Footer />

      {/* Newsletter subscription - temporarily disabled */}
      {/*
      <div className="bg-indigo-50 rounded-lg p-8 border border-indigo-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-indigo-900 mb-2">Subscribe to Our Newsletter</h3>
          <p className="text-indigo-700">
            Get the latest articles, tips, and strategies delivered straight to your inbox.
          </p>
        </div>
        <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-grow px-4 py-3 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
      */}
      
      
    </div>
  );
};

export default BlogPage; 