import React, { useState, useMemo } from 'react';
import { FormatAmountFunction, Currency, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';
import { calculateRecommendedInvestment, calculateYearsUntilExhaustion } from '../../../utils/financialCalculations';

interface InvestmentIncreaseCardProps {
  risk: 'High' | 'Medium' | 'Low';
  monthlyInvestment: number;
  investmentIncrease: {
    monthlyIncrease: number;
    additionalContributions: number;
    estimatedReturns: number;
    totalBenefit: number;
  };
  safetyMargin: number;
  totalNeededCapital: number;
  capitalAtRetirement: number;
  monthlyRetirementWithdrawal: number;
  currency: Currency;
  formatDisplayValue: (value: number) => string;
  inflationAdjustedWithdrawal?: boolean;
  withdrawalMode?: WithdrawalMode;
  inflation?: number;
  currentAge?: number;
  retirementStartAge?: number;
  yearsUntilRetirement?: number;
  annualReturnRate?: number;
}

// Helper function for consistent percentage formatting with 1 decimal place
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const InvestmentIncreaseCard: React.FC<InvestmentIncreaseCardProps> = ({
  risk,
  monthlyInvestment,
  investmentIncrease,
  safetyMargin,
  totalNeededCapital,
  capitalAtRetirement,
  monthlyRetirementWithdrawal,
  currency,
  formatDisplayValue,
  inflationAdjustedWithdrawal,
  withdrawalMode,
  inflation = 2,
  currentAge = 40,
  retirementStartAge = 65,
  yearsUntilRetirement = 25,
  annualReturnRate = 7
}) => {
  // Get effective withdrawal amount considering inflation adjustment
  const getEffectiveWithdrawalAmount = () => {
    if (inflationAdjustedWithdrawal && withdrawalMode === "amount" && inflation !== undefined) {
      // Calculate inflation-adjusted withdrawal using current years until retirement
      return monthlyRetirementWithdrawal * Math.pow(1 + inflation / 100, yearsUntilRetirement);
    }
    return monthlyRetirementWithdrawal;
  };

  const effectiveMonthlyWithdrawal = getEffectiveWithdrawalAmount();

  const [showRange, setShowRange] = useState(false);
  const [rangeValue, setRangeValue] = useState(investmentIncrease.monthlyIncrease);

  // Calculate optimal investment amounts
  const optimizedInvestments = useMemo(() => {
    return calculateRecommendedInvestment(
      monthlyInvestment,
      capitalAtRetirement,
      totalNeededCapital,
      yearsUntilRetirement,
      annualReturnRate,
      effectiveMonthlyWithdrawal,
      95, // Target age
      currentAge,
      retirementStartAge
    );
  }, [
    monthlyInvestment,
    capitalAtRetirement,
    totalNeededCapital,
    yearsUntilRetirement,
    annualReturnRate,
    effectiveMonthlyWithdrawal,
    currentAge,
    retirementStartAge
  ]);

  // Access realistic and ideal values
  const { realistic, ideal } = optimizedInvestments;

  // Helper function to calculate additional years based on capital
  const calculateAdditionalYears = (capital: number, additionalCapital: number) => {
    // Simple estimation - how many additional years the extra capital would last
    const annualWithdrawal = effectiveMonthlyWithdrawal * 12;
    if (annualWithdrawal <= 0) return 0;
    return Math.round(additionalCapital / annualWithdrawal);
  };

  // Calculate additional years of retirement funding this increase provides
  const additionalYears = calculateAdditionalYears(capitalAtRetirement, investmentIncrease.totalBenefit);
  
  // Define target age
  const targetAge = 95; // Default target age

  // Improved exhaustion age calculation with inflation consideration
  const calculateExhaustionAge = (startingCapital: number): number => {
    const conservativeMultiplier = 0.7; // Use consistent conservative multiplier
    const inflationRate = inflation / 100;
    const realReturnRate = ((1 + annualReturnRate / 100) / (1 + inflationRate) - 1) * 100;
    
    // Use conservative real return rate (adjusted for inflation)
    const conservativeRealReturnRate = realReturnRate * conservativeMultiplier;
    
    // Simulate year-by-year capital depletion
    let remainingCapital = startingCapital;
    let years = 0;
    const annualWithdrawal = effectiveMonthlyWithdrawal * 12;
    
    if (annualWithdrawal <= 0) return retirementStartAge + 100; // Effectively infinite
    
    while (remainingCapital > 0 && years < 100) {
      // Calculate real return adjusting for inflation
      const annualReturn = remainingCapital * (conservativeRealReturnRate / 100);
      remainingCapital = remainingCapital + annualReturn - annualWithdrawal;
      
      if (remainingCapital > 0) years++;
    }
    
    return retirementStartAge + years;
  };
  
  // Calculate exhaustion ages for different scenarios
  const estimatedExhaustionAge = calculateExhaustionAge(capitalAtRetirement);
  const realisticExhaustionAge = calculateExhaustionAge(realistic.newCapitalAtRetirement);
  const idealExhaustionAge = calculateExhaustionAge(ideal.newCapitalAtRetirement);
  
  // Years gained with different strategies
  const realisticYearsGained = realisticExhaustionAge - estimatedExhaustionAge;
  const idealYearsGained = idealExhaustionAge - estimatedExhaustionAge;
  
  // Estimate the yearly capital increase from delaying retirement by one year
  const yearlyCapitalIncrease = monthlyInvestment * 12 * (1 + annualReturnRate / 100);
  
  // Format the additional years for display
  const formatAdditionalYears = (years: number) => {
    return `+${years} years`;
  };

  return (
    <Card className="overflow-hidden lg:col-span-3">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-blue-200 flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <SectionTitle className="text-blue-800 mb-0 text-sm sm:text-base">Investment Increase Strategy</SectionTitle>
        </div>
        <div className={cx(
          "text-xs font-medium px-1.5 py-0.5 rounded-full",
          risk === 'High' ? "bg-red-100 text-red-700" : 
          risk === 'Medium' ? "bg-yellow-100 text-yellow-700" : 
          "bg-green-100 text-green-700"
        )}>
          {risk === 'High' ? 'Critical' : risk === 'Medium' ? 'Recommended' : 'Optional'}
        </div>
      </div>
      <div className="p-2 sm:p-3">
        <div className="flex items-start mb-2.5 p-2 bg-green-50/70 rounded-lg border border-green-100">
          <div className="w-9 h-9 bg-green-100 rounded-full flex-shrink-0 flex items-center justify-center mr-2.5 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-700 flex items-center gap-1.5">
              <span><span className="font-bold">Recommended</span> monthly investment</span>
            </div>
            <div className="flex items-baseline mt-1">
              <PositiveMetric className="text-base">
                {formatDisplayValue(realistic.monthlyAmount)}/month
              </PositiveMetric>
              <span className="text-xs text-green-700 ml-1">
                (+{formatPercentage(realistic.percentageIncrease)})
              </span>
            </div>
            <div className="flex items-baseline text-[10px] text-green-700">
              <span>+{realisticYearsGained} years of retirement coverage</span>
              <span className="text-gray-500 ml-1">(until age {realisticExhaustionAge})</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
              <span className="font-bold">Current</span>&nbsp;investment
            </div>
            <div className="text-sm font-semibold text-gray-700 mt-1">
              {formatDisplayValue(monthlyInvestment)}/month
            </div>
            <div className="text-[10px] text-gray-500">
              {formatDisplayValue(monthlyInvestment * 12)}/year
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Funds last until age <span className={estimatedExhaustionAge < targetAge ? "text-red-500" : "text-green-500"}>{estimatedExhaustionAge}</span>
            </div>
          </div>
          <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-purple-500 mr-1.5"></span>
              <span className="font-bold">Ideal</span>&nbsp;investment
            </div>
            <div className="text-sm font-semibold text-purple-700 mt-1">
              {formatDisplayValue(ideal.monthlyAmount)}/month
            </div>
            <div className="text-[10px] text-purple-700">
              +{formatPercentage(ideal.percentageIncrease)} increase
            </div>
            <div className="text-[10px] text-purple-700 mt-1">
              Funds last until age <span className="font-semibold">{idealExhaustionAge}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-lg p-2.5 border border-green-100 mb-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-xs font-medium text-green-800">Impact Comparison</div>
            </div>
            <div className="text-[10px] font-medium text-gray-500">
              Target age: <span className="font-semibold">{targetAge}</span>
            </div>
          </div>
          
          <div className="relative mt-1 mb-4 h-6 bg-gray-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center">
              {/* Gray background for the entire timeline */}
              <div className="h-full w-full bg-gray-200"></div>
              
              {/* Red section for capital depletion gap (if there is one) */}
              {Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge) < targetAge && (
                <div 
                  className="absolute h-full right-0 bg-red-200" 
                  style={{ 
                    width: `${Math.min(100, ((targetAge - Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge)) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Blue section for current plan */}
              <div 
                className="absolute h-full left-0 bg-blue-400" 
                style={{ width: `${Math.min(100, (estimatedExhaustionAge / targetAge) * 100)}%` }}
              ></div>
              
              {/* Green section for recommended plan (additional years) */}
              {realisticExhaustionAge > estimatedExhaustionAge && (
                <div 
                  className="absolute h-full bg-green-500 opacity-80" 
                  style={{ 
                    left: `${Math.min(100, (estimatedExhaustionAge / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((realisticExhaustionAge - estimatedExhaustionAge) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Purple section for ideal plan (additional years beyond recommended) */}
              {idealExhaustionAge > realisticExhaustionAge && (
                <div 
                  className="absolute h-full bg-purple-500 opacity-80" 
                  style={{ 
                    left: `${Math.min(100, (realisticExhaustionAge / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((idealExhaustionAge - realisticExhaustionAge) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Red section for period after all capital depletion */}
              {Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge) < targetAge && (
                <div 
                  className="absolute h-full bg-red-400 opacity-80"
                  style={{ 
                    left: `${Math.min(100, (Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge) / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((targetAge - Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge)) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Target age line */}
              <div 
                className="absolute h-full w-0.5 bg-red-500 border-l border-dashed border-red-500 z-10" 
                style={{ left: `${Math.min(100, (targetAge / targetAge) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-[10px]">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                <span className="text-gray-600">Current</span>
              </div>
              <span className="font-semibold text-gray-700">{estimatedExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-gray-600">Recommended</span>
              </div>
              <span className="font-semibold text-green-700">{realisticExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                <span className="text-gray-600">Ideal</span>
              </div>
              <span className="font-semibold text-purple-700">{idealExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                <span className="text-gray-600">Target</span>
              </div>
              <span className="font-semibold text-red-700">{targetAge}</span>
            </div>
          </div>
        </div>
        
        {/* Risk assessment and recommendations */}
        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-lg p-2.5 border border-green-100">
          <div className="text-xs space-y-2">
            <div>
              <div className="text-xs font-medium text-green-800 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Key Recommendations
              </div>
              <div className="text-gray-600">
                {risk === 'High' ? (
                  <>
                    <span className="font-semibold text-red-600 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Critical: Capital will deplete {Math.max(0, targetAge - estimatedExhaustionAge)} years before target age
                    </span>
                    <div className="bg-red-50 border-l-4 border-red-500 pl-3 py-2 mt-2 rounded-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-800 font-medium">Recommended Action:</span>
                      <ul className="list-disc pl-4 text-xs space-y-1.5 mt-1">
                        <li><span className="font-medium">Immediate:</span> Increase to <span className="font-semibold text-green-600">{formatDisplayValue(realistic.monthlyAmount)}</span> (+{Math.round(realistic.additionalCapital / 1000)}k at retirement)</li>
                        <li><span className="font-medium">Secondary:</span> Consider <span className="font-medium">{formatDisplayValue(ideal.monthlyAmount)}</span> if feasible</li>
                        <li><span className="font-medium">Optional:</span> Delay retirement by {Math.max(1, Math.ceil((targetAge - realisticExhaustionAge) / 3))} years</li>
                      </ul>
                    </div>
                  </>
                ) : risk === 'Medium' ? (
                  <>
                    <span className="font-semibold text-amber-600 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Improvements needed: Funds last until age {estimatedExhaustionAge}
                    </span>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 pl-3 py-2 mt-2 rounded-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-yellow-800 font-medium">Recommended Action:</span>
                      <ul className="list-disc pl-4 text-xs space-y-1.5 mt-1">
                        <li><span className="font-medium">Best option:</span> Increase to <span className="font-semibold text-green-600">{formatDisplayValue(realistic.monthlyAmount)}</span>/month</li>
                        <li><span className="font-medium">Portfolio:</span> Target {formatPercentage(annualReturnRate+1)}-{formatPercentage(annualReturnRate+2)} annual returns</li>
                        <li><span className="font-medium">Impact:</span> +{realisticYearsGained} years of retirement funding</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-green-600 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Well-positioned: Funds last until age {estimatedExhaustionAge}
                    </span>
                    <div className="bg-green-50 border-l-4 border-green-500 pl-3 py-2 mt-2 rounded-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-800 font-medium">Optional Enhancements:</span>
                      <ul className="list-disc pl-4 text-xs space-y-1.5 mt-1">
                        <li><span className="font-medium">Quality of life:</span> Consider <span className="font-semibold text-green-600">{formatDisplayValue(realistic.monthlyAmount)}</span>/month</li>
                        <li><span className="font-medium">Impact:</span> +{realisticYearsGained} years of coverage</li>
                        <li><span className="font-medium">Legacy planning:</span> {formatDisplayValue(capitalAtRetirement * 0.15)} potential inheritance</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t border-green-200 pt-2">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="text-xs font-medium text-green-800">Impact Summary</div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="text-xs text-gray-600">Investment</div>
                <div className="text-xs font-semibold text-green-700">
                  {formatDisplayValue(realistic.monthlyAmount)}/month
                </div>
                
                <div className="text-xs text-gray-600">Monthly increase</div>
                <div className="text-xs font-semibold text-green-700">
                  +{formatDisplayValue(realistic.monthlyAmount - monthlyInvestment)}
                </div>
                
                <div className="text-xs text-gray-600">Additional capital</div>
                <div className="text-xs font-semibold text-green-700">
                  {formatDisplayValue(realistic.additionalCapital)}
                </div>
                
                <div className="text-xs text-gray-600">Years extended</div>
                <div className="text-xs font-semibold text-green-700">
                  +{realisticYearsGained} years (until age {realisticExhaustionAge})
                </div>
              </div>
            </div>
          </div>
        </div>
        

      </div>
    </Card>
  );
};

export default InvestmentIncreaseCard; 