import { useState, type FC } from 'react';
import Modal from './Modal';
import PrivacyPolicy from '../policies/PrivacyPolicy';
import TermsOfService from '../policies/TermsOfService';
import CookiePolicy from '../policies/CookiePolicy';

const Footer: FC = () => {
  const currentYear = new Date().getFullYear();
  
  // Modal control state
  const [openModal, setOpenModal] = useState<string | null>(null);
  
  const openPolicyModal = (modalId: string) => {
    setOpenModal(modalId);
  };
  
  const closeModal = () => {
    setOpenModal(null);
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
    </footer>
  );
};

export default Footer; 