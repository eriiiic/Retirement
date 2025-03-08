import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import PrivacyPolicy from '../policies/PrivacyPolicy';
import TermsOfService from '../policies/TermsOfService';
import CookiePolicy from '../policies/CookiePolicy';
import FormulaModal from '../retirement/FormulaModal';

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();
  
  // Modal control state
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  
  const openPolicyModal = (modalId: string) => {
    setOpenModal(modalId);
  };
  
  const closeModal = () => {
    setOpenModal(null);
  };
  
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
          
          {/* Site Links section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Retirement Calculator
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Blog & Insights
                </Link>
              </li>
              <li>
                <Link to="/compound-interest" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Compound Interest Guide
                </Link>
              </li>
              <li>
                <Link to="/fire" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  FIRE Movement
                </Link>
              </li>
              <li>
                <Link to="/#formulas" onClick={(e) => { e.preventDefault(); setIsFormulaModalOpen(true); }} className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.871 4A17.926 17.926 0 003 12c0 2.874.673 5.59 1.871 8m14.13 0a17.926 17.926 0 001.87-8c0-2.874-.673-5.59-1.87-8M9 9h1.246a1 1 0 01.961.725l1.586 5.55a1 1 0 00.961.725H15m1-7h-1m-1 1h-2m-1 1h-1m-7 6h7" />
                  </svg>
                  Financial Formulas
                </Link>
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
              contact@FIRECalculator.ai
            </a>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row md:justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
            © {currentYear} Financial Freedom Calculator. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
            <button 
              onClick={() => openPolicyModal('privacy')}
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => openPolicyModal('terms')}
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => openPolicyModal('cookies')}
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
      
      {/* Modals for policy pages */}
      <Modal
        isOpen={openModal === 'privacy'}
        onClose={closeModal}
        title="Privacy Policy"
      >
        <PrivacyPolicy />
      </Modal>
      
      <Modal
        isOpen={openModal === 'terms'}
        onClose={closeModal}
        title="Terms of Service"
      >
        <TermsOfService />
      </Modal>
      
      <Modal
        isOpen={openModal === 'cookies'}
        onClose={closeModal}
        title="Cookie Policy"
      >
        <CookiePolicy />
      </Modal>
      
      {/* Financial Formulas Modal */}
      <FormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />
    </footer>
  );
};

export default Footer; 