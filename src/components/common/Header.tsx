import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMenuAnimation, setShowMenuAnimation] = useState(false);
  const location = useLocation();
  
  // Detect scrolling to add a background effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Add initial animation to hamburger menu
  useEffect(() => {
    // Slight delay to ensure it happens after initial render
    const timer = setTimeout(() => {
      setShowMenuAnimation(true);
      
      // Remove animation class after it completes
      const cleanupTimer = setTimeout(() => {
        setShowMenuAnimation(false);
      }, 2000); // Animation duration
      
      return () => clearTimeout(cleanupTimer);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and site title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                <span className="text-indigo-600 text-xl">🔥</span>
              </div>
              <div className="ml-2">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI FIRE Retirement Planner
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              to="/"
              className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-md ${
                isActive('/') 
                  ? 'text-indigo-700 bg-indigo-50 shadow-sm' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Calculator
              </span>
            </Link>
            
            <Link 
              to="/blog"
              className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-md flex items-center relative ${
                isActive('/blog') 
                  ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md transform scale-105' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 hover:scale-105'
              }`}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Blog & Insights
              </span>
              {!isActive('/blog') && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full animate-pulse">
                  New
                </span>
              )}
            </Link>
          </nav>
          
          {/* Mobile menu button with initial attention animation */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition-all ${
                showMenuAnimation ? 'animate-attention-pulse' : ''
              }`}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 ${showMenuAnimation ? 'animate-bounce-subtle' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
              
              {/* Visual indicator dot that appears on first load */}
              {!isMenuOpen && showMenuAnimation && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping-slow"></span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu with slide-down animation */}
      <div 
        className={`md:hidden transform origin-top transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0'
        }`}
      >
        <div className="px-4 py-3 space-y-2 bg-white shadow-lg border-t border-gray-100">
          <Link
            to="/"
            className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
              isActive('/') 
                ? 'text-indigo-700 bg-indigo-50' 
                : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculator
            </div>
          </Link>
          
          <Link
            to="/blog"
            className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors relative ${
              isActive('/blog') 
                ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600' 
                : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                Blog & Insights
              </div>
              {!isActive('/blog') && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  New
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

// Add the new animation keyframes and utilities to the global styles
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 1; }
    75%, 100% { transform: scale(2); opacity: 0; }
  }
  
  @keyframes attention-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
    50% { box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.3); }
  }
  
  .animate-bounce-subtle {
    animation: bounce-subtle 1s ease-in-out 3;
  }
  
  .animate-ping-slow {
    animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  
  .animate-attention-pulse {
    animation: attention-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 2;
  }
`;
document.head.appendChild(styleElement);

export default Header; 