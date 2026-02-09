import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/common/Header';

// Lazy load route components for better initial load performance
const RetirementSimulator = lazy(() => import('./components/RetirementSimulator'));
const BlogPage = lazy(() => import('./components/blog/BlogPage'));
const BlogPostDetail = lazy(() => import('./components/blog/BlogPostDetail'));
const CompoundInterestPage = lazy(() => import('./components/blog/CompoundInterestPage'));
const FIREPage = lazy(() => import('./components/blog/FIREPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Header />
          <main>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<RetirementSimulator />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPostDetail />} />
                <Route path="/compound-interest" element={<CompoundInterestPage />} />
                <Route path="/fire" element={<FIREPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
