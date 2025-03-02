import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and site title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                <span className="text-indigo-600 text-xl">🔥</span>
              </div>
              <div className="ml-2">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  FIRE Calculator
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/"
              className={`text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-md ${
                isActive('/') 
                  ? 'text-indigo-700 bg-indigo-50' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Calculator
            </Link>
            
            <Link 
              to="/blog"
              className={`text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-md flex items-center ${
                isActive('/blog') 
                  ? 'text-indigo-700 bg-indigo-50' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <span className="mr-1">📚</span> Blog & Insights
            </Link>
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <span className="block h-6 w-6">✕</span>
              ) : (
                <span className="block h-6 w-6">≡</span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg rounded-b-lg">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') 
                  ? 'text-indigo-700 bg-indigo-50' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Calculator
            </Link>
            
            <Link
              to="/blog"
              className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                isActive('/blog') 
                  ? 'text-indigo-700 bg-indigo-50' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="mr-1">📚</span> Blog & Insights
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 