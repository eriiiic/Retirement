import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RetirementSimulator from './components/RetirementSimulator';
import BlogPage from './components/blog/BlogPage';
import BlogPostDetail from './components/blog/BlogPostDetail';
import CompoundInterestPage from './components/blog/CompoundInterestPage';
import FIREPage from './components/blog/FIREPage';
import Header from './components/common/Header';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<RetirementSimulator />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogPostDetail />} />
            <Route path="/compound-interest" element={<CompoundInterestPage />} />
            <Route path="/fire" element={<FIREPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
