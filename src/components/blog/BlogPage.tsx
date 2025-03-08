import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts, BlogPost, BlogTopic } from './blogData';
import Footer from '../common/Footer'; // Import Footer component
import { Helmet } from 'react-helmet';
import { isSafari } from '../../utils/browserDetection';
import { useTheme } from '../../context/ThemeContext';

const BlogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopics, setSelectedTopics] = useState<BlogTopic[]>([]);
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  const { darkMode } = useTheme();
  
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
    <div className={`max-w-6xl mx-auto px-4 py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
      <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
        <div className={`py-8 px-6 ${
          isSafariBrowser 
            ? darkMode ? 'bg-indigo-800' : 'bg-indigo-600' 
            : darkMode 
              ? 'bg-gradient-to-r from-indigo-800 to-purple-800' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        } relative`}>
          {/* Safari-specific overlay gradient using background-image */}
          {isSafariBrowser && (
            <div className={`absolute inset-0 ${
              darkMode 
                ? 'bg-[linear-gradient(to_right,#3730a3,#6b21a8)]' 
                : 'bg-[linear-gradient(to_right,#4f46e5,#9333ea)]'
            } opacity-90`}></div>
          )}
          <div className="mb-4 sm:mb-5 text-center relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
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
      <div className={`mb-10 p-6 rounded-lg shadow-sm border ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for articles..."
              className={`pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex-shrink-0">
            <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filter by topics:</div>
            <div className="flex flex-wrap gap-2">
              {allTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    selectedTopics.includes(topic)
                      ? 'bg-indigo-600 text-white'
                      : darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {filteredPosts.length} out of {blogPosts.length} articles
          </p>
        </div>
      </div>
      
      {/* Blog posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post: BlogPost) => (
            <Link 
              to={`/blog/${post.id}`} 
              key={post.id}
              className={`rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${
                darkMode 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{post.title}</h3>
                <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(post.date)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    darkMode 
                      ? 'bg-indigo-900 text-indigo-200' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {post.readTime} min read
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {post.topics.slice(0, 3).map((topic, index) => (
                    <span 
                      key={`${post.id}-topic-${index}`} 
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className={`col-span-full text-center py-10 rounded-lg ${
            darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
          }`}>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No articles found</h3>
            <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTopics([]);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
      
      {/* Call to Action */}
      <div className="mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Put Compound Interest to Work?
          </h2>
          <p className="text-indigo-100 max-w-2xl mx-auto mb-8">
            Use our retirement calculator to see how your savings can grow over time and build a personalized 
            plan for your financial future.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
            <a 
              href="/" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Try Our Retirement Calculator
            </a>
            <a 
              href="/fire" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-indigo-200 text-base font-medium rounded-md text-white hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Explore FIRE Movement
            </a>
          </div>
        </div>
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