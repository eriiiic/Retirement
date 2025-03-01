import { useState, type FC } from 'react';

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const handleTooltipShow = (tooltipId: string) => {
    setActiveTooltip(tooltipId);
  };
  
  const handleTooltipHide = () => {
    setActiveTooltip(null);
  };
  
  return (
    <footer className="mt-12 py-8 bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
            <div className="relative">
              <a 
                href="#" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                onMouseEnter={() => handleTooltipShow('privacy')}
                onMouseLeave={handleTooltipHide}
              >
                Privacy Policy
              </a>
              {activeTooltip === 'privacy' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10">
                  <div className="relative">
                    <p>This calculator respects your privacy. We don't store any of your data. All calculations are performed locally in your browser.</p>
                    <div className="absolute w-3 h-3 bg-gray-800 transform rotate-45 left-1/2 -ml-1.5 -bottom-1.5"></div>
                  </div>
                </div>
              )}
            </div>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Terms of Service
            </a>
            <div className="relative">
              <a 
                href="#" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                onMouseEnter={() => handleTooltipShow('cookie')}
                onMouseLeave={handleTooltipHide}
              >
                Cookie Policy
              </a>
              {activeTooltip === 'cookie' && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10">
                  <div className="relative">
                    <p>We use only essential cookies required for the application to function. We do not track anything personal or use analytics cookies.</p>
                    <div className="absolute w-3 h-3 bg-gray-800 transform rotate-45 left-1/2 -ml-1.5 -bottom-1.5"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 