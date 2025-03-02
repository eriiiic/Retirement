import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts, BlogPost } from './blogData';
import ReactMarkdown from 'react-markdown';

const BlogPostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find((post) => post.id === id);
  
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Blog Post Not Found</h1>
          <p className="mb-6">The article you're looking for doesn't seem to exist.</p>
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
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link 
        to="/blog" 
        className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
        
        <div className="flex flex-wrap items-center text-sm text-gray-600 mb-4">
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
              className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded"
            >
              <span className="mr-1">🏷️</span> {topic}
            </span>
          ))}
        </div>
      </div>
      
      <div className="prose prose-lg max-w-none">
        {post.content ? (
          <ReactMarkdown>{post.content}</ReactMarkdown>
        ) : (
          <p className="text-gray-700">{post.excerpt}</p>
        )}
      </div>
      
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Share this article</h3>
        <div className="flex gap-4">
          <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
            <span>📱</span>
          </button>
          <button className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500">
            <span>💬</span>
          </button>
          <button className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700">
            <span>📧</span>
          </button>
          <button className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700">
            <span>📎</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail; 