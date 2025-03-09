import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import RetirementRiskPanel from '../analyses/RetirementRiskPanel';

const RiskAssessmentExample: React.FC = () => {
  const { darkMode } = useTheme();
  const [scenario, setScenario] = useState<'low' | 'moderate' | 'significant' | 'high' | 'critical'>('moderate');
  
  // Format amount function for the examples
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Different risk scenarios 
  const scenarios = {
    low: {
      capitalAtRetirement: 1500000,
      totalNeededCapital: 1200000,
      monthlyRetirementWithdrawal: 4000,
      annualReturnRate: 5,
      inflation: 2,
      retirementStartAge: 65,
      currentAge: 40,
      lifeExpectancy: 90,
      monthlyInvestment: 2000,
      targetAge: 95,
      title: "Strong Financial Position",
      description: "A well-funded retirement plan with adequate savings and conservative withdrawal."
    },
    moderate: {
      capitalAtRetirement: 1000000,
      totalNeededCapital: 1100000,
      monthlyRetirementWithdrawal: 3800,
      annualReturnRate: 5,
      inflation: 2.5,
      retirementStartAge: 65,
      currentAge: 45,
      lifeExpectancy: 88,
      monthlyInvestment: 1500,
      targetAge: 95,
      title: "Solid Plan with Room for Improvement",
      description: "A reasonably funded retirement plan with minor risks that can be easily addressed."
    },
    significant: {
      capitalAtRetirement: 800000,
      totalNeededCapital: 1200000,
      monthlyRetirementWithdrawal: 3800,
      annualReturnRate: 4.5,
      inflation: 2.8,
      retirementStartAge: 62,
      currentAge: 50,
      lifeExpectancy: 85,
      monthlyInvestment: 1000,
      targetAge: 95,
      title: "Notable Retirement Gap",
      description: "A retirement plan with significant risks that require attention to ensure long-term security."
    },
    high: {
      capitalAtRetirement: 600000,
      totalNeededCapital: 1300000,
      monthlyRetirementWithdrawal: 4000,
      annualReturnRate: 4,
      inflation: 3,
      retirementStartAge: 62,
      currentAge: 55,
      lifeExpectancy: 88,
      monthlyInvestment: 800,
      targetAge: 95,
      title: "Substantial Retirement Shortfall",
      description: "A retirement plan with high risks requiring immediate action to prevent inadequate retirement funding."
    },
    critical: {
      capitalAtRetirement: 400000,
      totalNeededCapital: 1200000,
      monthlyRetirementWithdrawal: 4200,
      annualReturnRate: 3.5,
      inflation: 3.2,
      retirementStartAge: 63,
      currentAge: 58,
      lifeExpectancy: 87,
      monthlyInvestment: 500,
      targetAge: 95,
      title: "Critical Funding Gap",
      description: "A retirement plan with severe risks requiring significant changes to avoid major shortfalls."
    }
  };
  
  const currentScenario = scenarios[scenario];
  
  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Retirement Risk Assessment Examples
          </h1>
          <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            View different risk scenarios to understand how the risk assessment evaluates retirement plans.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {(Object.keys(scenarios) as Array<keyof typeof scenarios>).map((key) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scenario === key
                    ? darkMode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : darkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} Risk
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className={`p-4 rounded-xl mb-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentScenario.title}
              </h2>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentScenario.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Current Age:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentScenario.currentAge}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Retirement Age:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentScenario.retirementStartAge}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Investment:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAmount(currentScenario.monthlyInvestment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Projected Capital:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAmount(currentScenario.capitalAtRetirement)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Needed Capital:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAmount(currentScenario.totalNeededCapital)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Withdrawal:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatAmount(currentScenario.monthlyRetirementWithdrawal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Return Rate:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentScenario.annualReturnRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inflation:</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentScenario.inflation}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <RetirementRiskPanel
              capitalAtRetirement={currentScenario.capitalAtRetirement}
              totalNeededCapital={currentScenario.totalNeededCapital}
              monthlyRetirementWithdrawal={currentScenario.monthlyRetirementWithdrawal}
              annualReturnRate={currentScenario.annualReturnRate}
              inflation={currentScenario.inflation}
              retirementStartAge={currentScenario.retirementStartAge}
              currentAge={currentScenario.currentAge}
              lifeExpectancy={currentScenario.lifeExpectancy}
              monthlyInvestment={currentScenario.monthlyInvestment}
              formatAmount={formatAmount}
              targetAge={currentScenario.targetAge}
              showFactors={true}
              currency="USD"
            />
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Understanding Risk Assessment
          </h2>
          
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className="space-y-4">
              <div>
                <h3 className={`text-md font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Risk Calculation Methodology
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  The retirement risk assessment analyzes multiple factors including capital adequacy, withdrawal safety, longevity risk, 
                  investment gaps, and market volatility exposure. The calculation uses advanced statistical modeling with weighted factors 
                  to provide a comprehensive risk evaluation.
                </p>
              </div>
              
              <div>
                <h3 className={`text-md font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Risk Level Descriptions
                </h3>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Low Risk:</span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Minimal potential for negative consequences. Routine situations with established controls and minimal impact if issues occur.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Moderate Risk:</span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Some potential for adverse outcomes, but generally manageable with standard precautions. Limited impact on objectives if realized.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Significant Risk:</span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Notable potential for negative consequences requiring active management and monitoring. Could substantially impact objectives or operations.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>High Risk:</span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Substantial potential for serious negative outcomes. Requires comprehensive mitigation strategies, close monitoring, and contingency planning.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                    <div>
                      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Critical Risk:</span>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Extreme potential for severe or catastrophic consequences. Demands immediate attention, extensive controls, and possibly reconsideration of activities.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentExample; 