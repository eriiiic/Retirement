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
                  <p className="mt-2 text-xs text-orange-700">When using inflation-adjusted withdrawals, this calculation is applied to your desired withdrawal amount from today until retirement.</p>
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
            
            {/* Present Value Formula */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 sm:p-6 border border-pink-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-pink-800")}>Present Value</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">Determines what a future sum of money is worth in today's dollars (the discounted value).</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-pink-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">PV</span> <span className="tex-operator">=</span> <span className="tex-frac"><span className="tex-frac-num"><span className="tex-variable">FV</span></span><span className="tex-frac-denom"><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span><sup className="tex-sup"><span className="tex-variable">t</span></sup></span></span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-pink-800"><span className="tex-variable">PV</span></strong>
                  <span>= Present Value</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-pink-800"><span className="tex-variable">FV</span></strong>
                  <span>= Future Value</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-pink-800"><span className="tex-variable">r</span></strong>
                  <span>= Discount rate (annual)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-pink-800"><span className="tex-variable">t</span></strong>
                  <span>= Number of years</span>
                </div>
              </div>
              
              <div className="bg-pink-50 rounded-lg p-3 sm:p-4 border border-pink-200">
                <h4 className="font-medium text-pink-800 mb-1 sm:mb-2 text-sm sm:text-base">Example</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p>If you need €100,000 in 15 years, with an expected annual return of 6%:</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
                    <div className="font-medium">Future Value (FV):</div>
                    <div>€100,000</div>
                    <div className="font-medium">Discount Rate (r):</div>
                    <div>6% (0.06)</div>
                    <div className="font-medium">Time Period (t):</div>
                    <div>15 years</div>
                    <div className="font-medium mt-2 text-pink-800">Present Value (PV):</div>
                    <div className="mt-2 font-bold text-pink-800">€41,727</div>
                  </div>
                  <p className="mt-2 text-xs text-pink-700">This means you need to invest €41,727 today to have €100,000 in 15 years at a 6% return.</p>
                </div>
              </div>
            </div>
            
            {/* Rule of 72 */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 sm:p-6 border border-amber-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-amber-800")}>Rule of 72</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">A simple way to estimate how long it will take to double your money at a given rate of return.</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-amber-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">Years to Double</span> <span className="tex-operator">=</span> <span className="tex-frac"><span className="tex-frac-num">72</span><span className="tex-frac-denom"><span className="tex-variable">r</span></span></span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-amber-800"><span className="tex-variable">Years</span></strong>
                  <span>= Years until investment doubles</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-amber-800"><span className="tex-variable">r</span></strong>
                  <span>= Annual rate of return (%)</span>
                </div>
                <div className="flex col-span-2">
                  <strong className="w-12 sm:w-14 inline-block text-amber-800">Note</strong>
                  <span>The rule becomes less accurate for very high or very low rates</span>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-3 sm:p-4 border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-1 sm:mb-2 text-sm sm:text-base">Examples</h4>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-3 text-xs sm:text-sm text-gray-700">
                    <div className="font-medium">Return Rate</div>
                    <div className="font-medium">Calculation</div>
                    <div className="font-medium">Years to Double</div>
                    <div>4%</div>
                    <div>72 ÷ 4</div>
                    <div className="font-medium">18 years</div>
                    <div>6%</div>
                    <div>72 ÷ 6</div>
                    <div className="font-medium">12 years</div>
                    <div>8%</div>
                    <div>72 ÷ 8</div>
                    <div className="font-medium">9 years</div>
                    <div>10%</div>
                    <div>72 ÷ 10</div>
                    <div className="font-medium">7.2 years</div>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">This rule illustrates how important even small increases in return rate can be to long-term wealth building.</p>
                </div>
              </div>
            </div>

            {/* Internal Rate of Return (IRR) */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 sm:p-6 border border-teal-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-teal-800")}>Internal Rate of Return (IRR)</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">Calculates the effective interest rate earned on an investment with multiple cash flows.</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-teal-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">0</span> <span className="tex-operator">=</span> <span className="tex-variable">CF</span><sub className="tex-sub">0</sub> <span className="tex-operator">+</span> <span className="tex-frac"><span className="tex-frac-num"><span className="tex-variable">CF</span><sub className="tex-sub">1</sub></span><span className="tex-frac-denom"><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">IRR</span><span className="tex-operator">)</span><sup className="tex-sup">1</sup></span></span> <span className="tex-operator">+</span> <span className="tex-frac"><span className="tex-frac-num"><span className="tex-variable">CF</span><sub className="tex-sub">2</sub></span><span className="tex-frac-denom"><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">IRR</span><span className="tex-operator">)</span><sup className="tex-sup">2</sup></span></span> <span className="tex-operator">+</span> <span className="tex-operator">...</span> <span className="tex-operator">+</span> <span className="tex-frac"><span className="tex-frac-num"><span className="tex-variable">CF</span><sub className="tex-sub">n</sub></span><span className="tex-frac-denom"><span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">IRR</span><span className="tex-operator">)</span><sup className="tex-sup">n</sup></span></span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-teal-800"><span className="tex-variable">IRR</span></strong>
                  <span>= Internal Rate of Return</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-teal-800"><span className="tex-variable">CF</span><sub>0</sub></strong>
                  <span>= Initial investment (negative)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-teal-800"><span className="tex-variable">CF</span><sub>n</sub></strong>
                  <span>= Cash flow at period n</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-teal-800"><span className="tex-variable">n</span></strong>
                  <span>= Total number of periods</span>
                </div>
              </div>
              
              <div className="bg-teal-50 rounded-lg p-3 sm:p-4 border border-teal-200">
                <h4 className="font-medium text-teal-800 mb-1 sm:mb-2 text-sm sm:text-base">Example</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p>For a real estate investment with these cash flows over 3 years:</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
                    <div className="font-medium">Initial Investment (CF<sub>0</sub>):</div>
                    <div>-€100,000</div>
                    <div className="font-medium">Year 1 Rental Income (CF<sub>1</sub>):</div>
                    <div>€8,000</div>
                    <div className="font-medium">Year 2 Rental Income (CF<sub>2</sub>):</div>
                    <div>€8,500</div>
                    <div className="font-medium">Year 3 Income + Sale (CF<sub>3</sub>):</div>
                    <div>€110,000</div>
                    <div className="font-medium mt-2 text-teal-800">IRR:</div>
                    <div className="mt-2 font-bold text-teal-800">8.56%</div>
                  </div>
                  <p className="mt-2 text-xs text-teal-700">The IRR of 8.56% represents the annualized rate of return for this investment, accounting for the timing of all cash flows.</p>
                </div>
              </div>
            </div>

            {/* Time to Retirement Formula */}
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-4 sm:p-6 border border-violet-200 shadow-md">
              <h3 className={cx(typography.style.sectionTitle, "text-base sm:text-lg md:text-xl mb-2 sm:mb-3 text-violet-800")}>Financial Independence Timeline</h3>
              <p className="text-sm sm:text-base mb-3 sm:mb-4 text-gray-700">Estimates years to retirement based on savings rate and investment returns.</p>
              
              <div className="bg-white rounded-lg p-3 sm:p-6 border border-violet-200 mb-4 sm:mb-5 shadow-inner overflow-x-auto formula-container">
                <div className="tex-formula text-center whitespace-nowrap min-w-max">
                  <span className="tex-variable">T</span> <span className="tex-operator">=</span> <span className="tex-frac"><span className="tex-frac-num">log<span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">SR</span> <span className="tex-operator">×</span> <span className="tex-frac"><span className="tex-frac-num">25</span><span className="tex-frac-denom">1</span></span><span className="tex-operator">)</span></span><span className="tex-frac-denom">log<span className="tex-operator">(</span>1 <span className="tex-operator">+</span> <span className="tex-variable">r</span><span className="tex-operator">)</span></span></span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 mb-4 sm:mb-5">
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-violet-800"><span className="tex-variable">T</span></strong>
                  <span>= Years to financial independence</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-violet-800"><span className="tex-variable">SR</span></strong>
                  <span>= Savings rate (0-1)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-violet-800"><span className="tex-variable">r</span></strong>
                  <span>= Real return rate (after inflation)</span>
                </div>
                <div className="flex">
                  <strong className="w-12 sm:w-14 inline-block text-violet-800">25</strong>
                  <span>= Inverse of 4% safe withdrawal rate</span>
                </div>
              </div>
              
              <div className="bg-violet-50 rounded-lg p-3 sm:p-4 border border-violet-200">
                <h4 className="font-medium text-violet-800 mb-1 sm:mb-2 text-sm sm:text-base">Example</h4>
                <div className="text-xs sm:text-sm text-gray-700">
                  <p>With a 50% savings rate and 5% real returns:</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
                    <div className="font-medium">Savings Rate (SR):</div>
                    <div>50% (0.5)</div>
                    <div className="font-medium">Real Return Rate (r):</div>
                    <div>5% (0.05)</div>
                    <div className="font-medium mt-2 text-violet-800">Years to FI (T):</div>
                    <div className="mt-2 font-bold text-violet-800">16.6 years</div>
                  </div>
                  <p className="mt-2 text-xs text-violet-700">This formula is based on the 4% safe withdrawal rule and shows that savings rate is the most powerful factor in determining your time to financial independence.</p>
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