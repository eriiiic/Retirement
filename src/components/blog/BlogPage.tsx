import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts, BlogPost, BlogTopic } from './blogData';
import Footer from '../common/Footer'; // Import Footer component
import SEO from '../common/SEO';
import { isSafari } from '../../utils/browserDetection';
import { useTheme } from '../../context/ThemeContext';
import { cx } from '../../styles/styleGuide';

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
      <SEO
        title="Blog & Resources | FIRE Retirement Planning"
        description="Explore practical advice, real-world case studies, and data-driven strategies from people who achieved financial independence."
        canonicalUrl="/blog"
        ogType="website"
        ogImage="/blog-images/blog-og-image.png"
      />

      {/* Page Header with Gradient Background */}
      <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
        <div className={`py-8 px-6 ${isSafariBrowser
            ? darkMode ? 'bg-indigo-800' : 'bg-indigo-600'
            : darkMode
              ? 'bg-gradient-to-r from-indigo-800 to-purple-800'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600'
          } relative`}>
          {/* Safari-specific overlay gradient using background-image */}
          {isSafariBrowser && (
            <div className={`absolute inset-0 ${darkMode
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

      {/* Search and filter section - Compact version */}
      <div className={cx(
        "mb-8 rounded-xl shadow-sm",
        darkMode
          ? "bg-gray-900/70"
          : "bg-white"
      )}>
        {/* Card content */}
        <div className="p-5">
          {/* Search input with compact styling */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                  "h-4 w-4",
                  darkMode ? "text-gray-500" : "text-gray-400"
                )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search-input"
                type="text"
                placeholder="Search for articles..."
                className={cx(
                  "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2",
                  darkMode
                    ? "bg-gray-800 border-transparent text-gray-200 placeholder-gray-400 focus:ring-indigo-600"
                    : "bg-gray-50 border-transparent text-gray-900 placeholder-gray-500 focus:ring-indigo-500"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Topic filters with compact styling */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={cx(
              "text-xs font-medium",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Topics:
            </span>

            {allTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => toggleTopic(topic)}
                className={cx(
                  "px-2.5 py-1 rounded-md text-xs transition-all",
                  selectedTopics.includes(topic)
                    ? darkMode
                      ? "bg-indigo-700 text-white"
                      : "bg-indigo-600 text-white"
                    : darkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {topic}
              </button>
            ))}

            {/* Clear button when filters are applied */}
            {(searchQuery || selectedTopics.length > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTopics([]);
                }}
                className={cx(
                  "flex items-center text-xs px-2.5 py-1 rounded-md transition-colors ml-1",
                  darkMode
                    ? "bg-gray-800 text-gray-400 hover:text-gray-300"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>

          {/* Results count */}
          <p className={cx(
            "text-xs",
            darkMode ? "text-gray-500" : "text-gray-500"
          )}>

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
              className={cx(
                "rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border",
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              )}
            >
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className={cx(
                  "text-xl font-semibold mb-2",
                  darkMode ? "text-white" : "text-gray-900"
                )}>{post.title}</h3>
                <p className={cx(
                  "text-sm mb-3",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className={cx(
                    "text-xs",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>{formatDate(post.date)}</span>
                  <span className={cx(
                    "text-xs px-2 py-1 rounded-full",
                    darkMode
                      ? "bg-indigo-900/50 text-indigo-200"
                      : "bg-indigo-100 text-indigo-800"
                  )}>
                    {post.readTime} min read
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {post.topics.slice(0, 3).map((topic, index) => (
                    <span
                      key={`${post.id}-topic-${index}`}
                      className={cx(
                        "text-xs px-2 py-0.5 rounded-full",
                        darkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className={cx(
            "col-span-full p-10 rounded-xl shadow-md text-center",
            darkMode ? "bg-gray-800/70 border border-gray-700" : "bg-gray-50 border border-gray-200"
          )}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cx(
                "h-16 w-16 mx-auto mb-4",
                darkMode ? "text-gray-600" : "text-gray-400"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className={cx(
              "text-xl font-semibold mb-3",
              darkMode ? "text-white" : "text-gray-900"
            )}>No articles found</h3>
            <p className={cx(
              "text-sm mb-6 max-w-md mx-auto",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              We couldn't find any articles matching your search criteria. Try adjusting your search terms or removing some filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTopics([]);
              }}
              className={cx(
                "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                darkMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className={cx(
        "mb-10 rounded-xl overflow-hidden shadow-lg",
        darkMode
          ? "bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-800/50"
          : "bg-gradient-to-r from-indigo-600 to-purple-600"
      )}>
        <div className={cx(
          "px-6 py-12 text-center",
          darkMode ? "backdrop-blur-sm" : ""
        )}>
          <h2 className={cx(
            "text-2xl sm:text-3xl font-bold mb-4",
            darkMode ? "text-indigo-100" : "text-white"
          )}>
            Ready to Put Compound Interest to Work?
          </h2>
          <p className={cx(
            "max-w-2xl mx-auto mb-8",
            darkMode ? "text-indigo-200/90" : "text-indigo-100"
          )}>
            Use our retirement calculator to see how your savings can grow over time and build a personalized
            plan for your financial future.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
            <a
              href="/"
              className={cx(
                "w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                darkMode
                  ? "bg-indigo-100 text-indigo-900 border-transparent hover:bg-white"
                  : "bg-white text-indigo-700 border-transparent hover:bg-indigo-50"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Try Our Retirement Calculator
            </a>
            <a
              href="/fire"
              className={cx(
                "w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                darkMode
                  ? "border-indigo-400/50 text-indigo-100 hover:bg-indigo-800/50"
                  : "border-indigo-200 text-white hover:bg-white/10"
              )}
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