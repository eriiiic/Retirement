import React from 'react';
import { cx, typography } from '../../styles/styleGuide';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Handler to prevent clicks inside the modal from closing it
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleModalContentClick}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gradient mb-4 sm:mb-6">Financial Calculation Formulas</h2>
          
          <div className="space-y-8 sm:space-y-12">
            {/* Compound Interest Formula */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 border border-blue-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-blue-800")}>Compound Interest</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">Calculates how your investments grow over time with compounding returns.</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-blue-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">FV</span> <span className="tex-operator">=</span> <span className="tex-variable">P</span><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup> <span className="tex-operator">+</span> <span className="tex-variable">PMT</span> <span className="tex-operator">×</span> <span className="tex-bracket">[</span> <span className="tex-frac"><span className="tex-frac-num"><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup> <span className="tex-operator">−</span> 1</span><span className="tex-frac-denom"><span className="tex-variable">r</span></span></span> <span className="tex-bracket">]</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-blue-800"><span className="tex-variable">FV</span></strong>
                  <span>= Future Value</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-blue-800"><span className="tex-variable">P</span></strong>
                  <span>= Principal (initial investment)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-blue-800"><span className="tex-variable">r</span></strong>
                  <span>= Interest rate per period</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-blue-800"><span className="tex-variable">t</span></strong>
                  <span>= Number of periods</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-blue-800"><span className="tex-variable">PMT</span></strong>
                  <span>= Regular payment amount</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">Example</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p>Starting with €10,000, investing €500 monthly for 20 years at 7% annual return:</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
                    <div className="font-medium">Initial Capital (P):</div>
                    <div>€10,000</div>
                    <div className="font-medium">Monthly Investment (PMT):</div>
                    <div>€500</div>
                    <div className="font-medium">Annual Return Rate (r):</div>
                    <div>7% (0.07)</div>
                    <div className="font-medium">Time Period (t):</div>
                    <div>20 years</div>
                    <div className="font-medium mt-2 text-blue-800">Future Value (FV):</div>
                    <div className="mt-2 font-bold text-blue-800">€246,072</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Future Value with Inflation */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 sm:p-6 border border-orange-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-orange-800")}>Inflation-Adjusted Value</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">Adjusts a current amount for the effects of inflation over time.</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-orange-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">FV</span><sub className="tex-sub">inflation</sub> <span className="tex-operator">=</span> <span className="tex-variable">PV</span> <span className="tex-operator">×</span> <span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">i</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-orange-800"><span className="tex-variable">FV</span><sub>i</sub></strong>
                  <span>= Future Value adjusted for inflation</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-orange-800"><span className="tex-variable">PV</span></strong>
                  <span>= Present Value</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-orange-800"><span className="tex-variable">i</span></strong>
                  <span>= Inflation rate</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-orange-800"><span className="tex-variable">t</span></strong>
                  <span>= Number of years</span>
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-1 sm:mb-2 text-sm sm:text-base">Example</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p>To maintain the same purchasing power as €5,000 today in 25 years with 2.5% annual inflation:</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
                    <div className="font-medium">Present Value (PV):</div>
                    <div>€5,000</div>
                    <div className="font-medium">Inflation Rate (i):</div>
                    <div>2.5% (0.025)</div>
                    <div className="font-medium">Time Period (t):</div>
                    <div>25 years</div>
                    <div className="font-medium mt-2 text-orange-800">Future Value Required (FV<sub>i</sub>):</div>
                    <div className="mt-2 font-bold text-orange-800">€10,427</div>
                  </div>
                  <p className="mt-2 text-xs text-orange-700">This means your €5,000 monthly expenses today will cost €10,427 in 25 years.</p>
                </div>
              </div>
            </div>
            
            {/* Sustainable Withdrawal */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 sm:p-6 border border-green-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-green-800")}>Sustainable Withdrawal</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">Calculates how much you can withdraw without depleting your capital.</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-green-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">PMT</span> <span className="tex-operator">=</span> <span className="tex-variable">P</span> <span className="tex-operator">×</span> <span className="tex-bracket">[</span> <span className="tex-frac"><span className="tex-frac-num"><span className="tex-variable">r</span><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup></span><span className="tex-frac-denom"><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup> <span className="tex-operator">−</span> 1</span></span> <span className="tex-bracket">]</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-green-800"><span className="tex-variable">PMT</span></strong>
                  <span>= Regular withdrawal amount</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-green-800"><span className="tex-variable">P</span></strong>
                  <span>= Principal (starting capital)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-green-800"><span className="tex-variable">r</span></strong>
                  <span>= Real return rate (return - inflation)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-green-800"><span className="tex-variable">t</span></strong>
                  <span>= Withdrawal period in years</span>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                <h4 className="font-medium text-green-800 mb-1 sm:mb-2 text-sm sm:text-base">Example</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p>With €800,000 saved, a 3% real return (after inflation), and wanting funds to last 30 years:</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
                    <div className="font-medium">Principal (P):</div>
                    <div>€800,000</div>
                    <div className="font-medium">Real Return Rate (r):</div>
                    <div>3% (0.03)</div>
                    <div className="font-medium">Withdrawal Period (t):</div>
                    <div>30 years</div>
                    <div className="font-medium mt-2 text-green-800">Safe Monthly Withdrawal (PMT/12):</div>
                    <div className="mt-2 font-bold text-green-800">€2,776</div>
                  </div>
                  <p className="mt-2 text-xs text-green-700">This represents an annual withdrawal of €33,312 or a 4.16% withdrawal rate.</p>
                </div>
              </div>
            </div>
            
            {/* Capital Needed */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 sm:p-6 border border-purple-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-purple-800")}>Capital Needed for Retirement</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">Determines how much capital you need to fund your retirement.</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-purple-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">P</span> <span className="tex-operator">=</span> <span className="tex-variable">PMT</span> <span className="tex-operator">×</span> <span className="tex-bracket">[</span> <span className="tex-frac"><span className="tex-frac-num"><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup> <span className="tex-operator">−</span> 1</span><span className="tex-frac-denom"><span className="tex-variable">r</span><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup></span></span> <span className="tex-bracket">]</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-purple-800"><span className="tex-variable">P</span></strong>
                  <span>= Principal needed (capital required)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-purple-800"><span className="tex-variable">PMT</span></strong>
                  <span>= Desired withdrawal amount</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-purple-800"><span className="tex-variable">r</span></strong>
                  <span>= Real return rate (return - inflation)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-purple-800"><span className="tex-variable">t</span></strong>
                  <span>= Retirement duration in years</span>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-1 sm:mb-2 text-sm sm:text-base">Example</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p>If you need €4,000 monthly in retirement for 25 years, with a 2.5% real return rate:</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
                    <div className="font-medium">Monthly Withdrawal (PMT):</div>
                    <div>€4,000</div>
                    <div className="font-medium">Annual Withdrawal:</div>
                    <div>€48,000</div>
                    <div className="font-medium">Real Return Rate (r):</div>
                    <div>2.5% (0.025)</div>
                    <div className="font-medium">Retirement Duration (t):</div>
                    <div>25 years</div>
                    <div className="font-medium mt-2 text-purple-800">Capital Required (P):</div>
                    <div className="mt-2 font-bold text-purple-800">€922,467</div>
                  </div>
                  <p className="mt-2 text-xs text-purple-700">This means you'll need to save approximately €922,467 to fund your desired retirement lifestyle.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
        .formula-container {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        .formula-container::-webkit-scrollbar {
          height: 6px;
        }
        .formula-container::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 3px;
        }
        .formula-container::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .tex-formula {
          font-family: 'CMU Serif', 'Computer Modern Serif', 'Times New Roman', Times, serif;
          font-size: 1.1rem;
          line-height: 2rem;
          letter-spacing: 0.02em;
          padding: 0.5rem 0;
        }
        @media (min-width: 640px) {
          .tex-formula {
            font-size: 1.4rem;
            line-height: 2.4rem;
          }
        }
        @media (min-width: 768px) {
          .tex-formula {
            font-size: 1.5rem;
            line-height: 2.5rem;
          }
        }
        .tex-variable {
          font-style: italic;
          font-weight: 500;
          font-family: 'CMU Serif', 'Computer Modern Serif', 'Times New Roman', Times, serif;
        }
        .tex-operator {
          padding: 0 0.1em;
          font-family: 'CMU Serif', 'Computer Modern Serif', 'Times New Roman', Times, serif;
        }
        @media (min-width: 640px) {
          .tex-operator {
            padding: 0 0.15em;
          }
        }
        .tex-bracket {
          font-size: 1.2em;
          font-weight: normal;
          padding: 0 0.05em;
        }
        .tex-sup {
          position: relative;
          top: -0.5em;
          font-size: 0.75em;
          margin-left: 0.05em;
          margin-right: 0.1em;
        }
        .tex-sub {
          position: relative;
          bottom: -0.25em;
          font-size: 0.75em;
          margin-left: 0.05em;
        }
        .tex-frac {
          display: inline-block;
          vertical-align: middle;
          text-align: center;
          padding: 0 0.1em;
        }
        @media (min-width: 640px) {
          .tex-frac {
            padding: 0 0.15em;
          }
        }
        .tex-frac-num {
          display: block;
          padding: 0 0.1em 0.1em;
          border-bottom: 1px solid #000;
        }
        .tex-frac-denom {
          display: block;
          padding: 0.1em 0.1em 0;
        }
        `}
      </style>
    </div>
  );
};

export default FormulaModal; 