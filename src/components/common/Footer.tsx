import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-12 py-8 bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">About This Tool</h3>
            <p className="text-gray-600 mb-4">
              Our retirement simulator provides personalized projections based on your financial inputs.
              All calculations are for informational purposes only and should not be considered financial advice.
            </p>
            <p className="text-gray-600">
              Results are estimates based on historical averages and mathematical models.
              Actual outcomes may vary due to market conditions and other factors.
            </p>
          </div>
          
          {/* Resources section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Retirement Strategies
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Investment Basics
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Us</h3>
            <p className="text-gray-600 mb-4">
              Questions or feedback? We'd love to hear from you.
            </p>
            <a 
              href="mailto:edelattre@gmail.com" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
              edelattre@gmail.com
            </a>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row md:justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
            © {currentYear} Financial Freedom Calculator. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 