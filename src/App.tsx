import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RetirementSimulator from './components/RetirementSimulator';
import BlogPage from './components/blog/BlogPage';
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
