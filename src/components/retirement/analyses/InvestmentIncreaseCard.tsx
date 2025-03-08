import React, { useState, useMemo } from 'react';
import { FormatAmountFunction, Currency, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';
import { calculateRecommendedInvestment, calculateYearsUntilExhaustion } from '../../../utils/financialCalculations';
import { useTheme } from '../../../context/ThemeContext';

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
  inflationAdjustedWithdrawal = false,
  withdrawalMode = 'percentage',
  inflation = 2,
  currentAge = 30,
  retirementStartAge = 65,
  yearsUntilRetirement = 35,
  annualReturnRate = 7
}) => {
  const { darkMode } = useTheme();
  const [showRange, setShowRange] = useState(false);
  const [rangeValue, setRangeValue] = useState(investmentIncrease.monthlyIncrease);
  
  // Get effective withdrawal amount considering inflation adjustment
  const getEffectiveWithdrawalAmount = () => {
    if (inflationAdjustedWithdrawal && withdrawalMode === "amount" && inflation !== undefined) {
      // Calculate inflation-adjusted withdrawal using current years until retirement
      return monthlyRetirementWithdrawal * Math.pow(1 + inflation / 100, yearsUntilRetirement);
    }
    return monthlyRetirementWithdrawal;
  };

  const effectiveMonthlyWithdrawal = getEffectiveWithdrawalAmount();

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
  
  // Calculate percentage increase
  const percentageIncrease = (investmentIncrease.monthlyIncrease / monthlyInvestment) * 100;
  
  // Calculate capital gap
  const capitalGap = totalNeededCapital - capitalAtRetirement;
  const gapPercentage = (capitalGap / totalNeededCapital) * 100;
  
  // Calculate years gained from increased investment
  const yearsGained = useMemo(() => {
    if (!annualReturnRate || !monthlyRetirementWithdrawal || capitalGap <= 0) return 0;
    
    // Calculate exhaustion with current investment
    const currentExhaustion = calculateYearsUntilExhaustion(
      capitalAtRetirement,
      monthlyRetirementWithdrawal * 12, // convert to annual withdrawal
      annualReturnRate / 100,
      0.7, // conservative multiplier
      50 // max years
    );
    
    // Calculate exhaustion with increased investment
    const improvedCapital = capitalAtRetirement + investmentIncrease.totalBenefit;
    const improvedExhaustion = calculateYearsUntilExhaustion(
      improvedCapital,
      monthlyRetirementWithdrawal * 12, // convert to annual withdrawal
      annualReturnRate / 100,
      0.7, // conservative multiplier
      50 // max years
    );
    
    // Return the difference
    return Math.max(0, improvedExhaustion - currentExhaustion);
  }, [
    capitalAtRetirement,
    monthlyRetirementWithdrawal,
    annualReturnRate,
    investmentIncrease.totalBenefit,
    capitalGap
  ]);

  return (
    <Card className="overflow-hidden lg:col-span-3">
      <div className={cx(
        "px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between",
        darkMode 
          ? "bg-yellow-900/50 border-yellow-700" 
          : "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200"
      )}>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className={cx(
            "h-4 w-4 mr-2",
            darkMode ? "text-yellow-400" : "text-yellow-600"
          )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className={cx(
            "mb-0 text-sm sm:text-base font-semibold",
            darkMode ? "text-yellow-300" : "text-yellow-800"
          )}>Investment Strategy</h3>
        </div>
        <div className={cx(
          "text-xs font-medium px-1.5 py-0.5 rounded-full",
          darkMode ? (
            risk === 'High' ? "bg-red-900/70 text-red-300" : 
            risk === 'Medium' ? "bg-yellow-900/70 text-yellow-300" : 
            "bg-green-900/70 text-green-300"
          ) : (
            risk === 'High' ? "bg-red-100 text-red-700" : 
            risk === 'Medium' ? "bg-yellow-100 text-yellow-700" : 
            "bg-green-100 text-green-700"
          )
        )}>
          {risk === 'High' ? 'Critical' : risk === 'Medium' ? 'Recommended' : 'Optional'}
        </div>
      </div>
      <div className="p-2 sm:p-3">
        <div className={cx(
          "flex items-start p-2 rounded-lg border mb-2.5",
          darkMode ? "bg-yellow-900/40 border-yellow-700" : "bg-yellow-100/70 border-yellow-200"
        )}>
          <div className={cx(
            "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mr-2.5 mt-0.5",
            darkMode ? "bg-yellow-800" : "bg-yellow-200"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className={cx(
              "h-4.5 w-4.5",
              darkMode ? "text-yellow-300" : "text-yellow-600"
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <div>
            <div className={cx(
              "text-sm flex items-center gap-1.5",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              <span><span className="font-bold">Recommended</span> monthly investment</span>
            </div>
            <div className="flex items-baseline mt-1">
              <PositiveMetric className="text-base">
                {formatDisplayValue(realistic.monthlyAmount)}/month
              </PositiveMetric>
              <span className={cx(
                "text-xs ml-1",
                darkMode ? "text-yellow-400" : "text-yellow-700"
              )}>
                (+{formatPercentage(realistic.percentageIncrease)})
              </span>
            </div>
            <div className={cx(
              "flex items-baseline text-[10px]",
              darkMode ? "text-yellow-400" : "text-yellow-700"
            )}>
              <span>+{realisticYearsGained} years of retirement coverage</span>
              <span className={cx(
                "ml-2",
                darkMode ? "text-yellow-300" : "text-yellow-800"
              )}>
                (until age {realisticExhaustionAge})
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <div className={cx(
            "p-2 rounded-lg border",
            darkMode ? "bg-yellow-900/30 border-yellow-700" : "bg-yellow-50/90 border-yellow-200"
          )}>
            <div className={cx(
              "text-xs font-medium flex items-center",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              <span className={cx(
                "h-2 w-2 rounded-full mr-1.5",
                darkMode ? "bg-yellow-600" : "bg-yellow-400"
              )}></span>
              <span className="font-bold">Current</span>&nbsp;investment
            </div>
            <div className={cx(
              "text-sm font-semibold mt-1",
              darkMode ? "text-gray-300" : "text-gray-800"
            )}>
              {formatDisplayValue(monthlyInvestment)}/month
            </div>
            <div className={cx(
              "text-[10px]",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              {formatDisplayValue(monthlyInvestment * 12)}/year
            </div>
            <div className={cx(
              "text-[10px]",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              {formatPercentage(safetyMargin < 0 ? 0 : safetyMargin)} safety margin
            </div>
          </div>
          
          <div className={cx(
            "p-2 rounded-lg border",
            darkMode ? "bg-yellow-900/50 border-yellow-700" : "bg-yellow-100/80 border-yellow-200"
          )}>
            <div className={cx(
              "text-xs font-medium flex items-center",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              <span className={cx(
                "h-2 w-2 rounded-full mr-1.5",
                darkMode ? "bg-yellow-400" : "bg-yellow-600"
              )}></span>
              <span className="font-bold">Optimal</span>&nbsp;investment
            </div>
            <div className={cx(
              "text-sm font-semibold mt-1",
              darkMode ? "text-yellow-300" : "text-yellow-800"
            )}>
              {formatDisplayValue(ideal.monthlyAmount)}/month
            </div>
            <div className={cx(
              "text-[10px]",
              darkMode ? "text-yellow-300" : "text-yellow-800"
            )}>
              {formatDisplayValue(ideal.monthlyAmount * 12)}/year
            </div>
            <div className={cx(
              "text-[10px]",
              darkMode ? "text-yellow-300" : "text-yellow-800"
            )}>
              Target: {formatPercentage(100)} safety coverage
            </div>
          </div>
        </div>
        
        <div className={cx(
          "rounded-lg p-2.5 border mb-2.5",
          darkMode 
            ? "bg-gray-800 border-gray-700" 
            : "bg-blue-100/70 border-blue-200"
        )}>
          <div className={cx(
            "flex items-center justify-between mb-2",
            darkMode ? "text-gray-300" : "text-gray-700"
          )}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                "h-3.5 w-3.5 mr-1.5", 
                darkMode ? "text-blue-400" : "text-blue-600"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className={cx(
                "text-xs font-medium",
                darkMode ? "text-blue-300" : "text-blue-800"
              )}>Investment Impact Projections</div>
            </div>
            <div className={cx(
              "text-[10px] font-medium",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Target age: <span className="font-semibold">{targetAge}</span>
            </div>
          </div>
          
          <div className={cx(
            "relative mt-1 mb-4 h-6 overflow-hidden rounded-lg",
            darkMode ? "bg-gray-700" : "bg-gray-100"
          )}>
            <div className="absolute inset-0 flex items-center">
              {/* Gray background for the entire timeline */}
              <div className={cx(
                "h-full w-full",
                darkMode ? "bg-gray-600" : "bg-gray-200"
              )}></div>
              
              {/* Red section for capital depletion gap (if there is one) */}
              {Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge) < targetAge && (
                <div 
                  className={cx(
                    "absolute h-full right-0",
                    darkMode ? "bg-red-900/60" : "bg-red-200"
                  )}
                  style={{ 
                    width: `${Math.min(100, ((targetAge - Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge)) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Blue section for current plan */}
              <div 
                className={cx(
                  "absolute h-full left-0",
                  darkMode ? "bg-blue-800" : "bg-blue-400"
                )}
                style={{ width: `${Math.min(100, (estimatedExhaustionAge / targetAge) * 100)}%` }}
              ></div>
              
              {/* Green section for recommended plan (additional years) */}
              {realisticExhaustionAge > estimatedExhaustionAge && (
                <div 
                  className={cx(
                    "absolute h-full opacity-80",
                    darkMode ? "bg-green-700" : "bg-green-500"
                  )}
                  style={{ 
                    left: `${Math.min(100, (estimatedExhaustionAge / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((realisticExhaustionAge - estimatedExhaustionAge) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Purple section for ideal plan (additional years beyond recommended) */}
              {idealExhaustionAge > realisticExhaustionAge && (
                <div 
                  className={cx(
                    "absolute h-full opacity-80",
                    darkMode ? "bg-purple-700" : "bg-purple-500"
                  )}
                  style={{ 
                    left: `${Math.min(100, (realisticExhaustionAge / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((idealExhaustionAge - realisticExhaustionAge) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Red section for period after all capital depletion */}
              {Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge) < targetAge && (
                <div 
                  className={cx(
                    "absolute h-full opacity-80",
                    darkMode ? "bg-red-700" : "bg-red-400"
                  )}
                  style={{ 
                    left: `${Math.min(100, (Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge) / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((targetAge - Math.max(estimatedExhaustionAge, realisticExhaustionAge, idealExhaustionAge)) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Target age line */}
              <div 
                className={cx(
                  "absolute h-full w-0.5 border-l border-dashed z-10",
                  darkMode ? "bg-red-500 border-red-500" : "bg-red-500 border-red-500"
                )}
                style={{ left: `${Math.min(100, (targetAge / targetAge) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className={cx(
            "grid grid-cols-4 gap-2 text-[10px]",
            darkMode ? "text-gray-300" : ""
          )}>
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-blue-600" : "bg-blue-400"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Current</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>{estimatedExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-yellow-600" : "bg-yellow-400"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Realistic</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>{realisticExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-purple-600" : "bg-purple-400"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Ideal</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>{idealExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-red-600" : "bg-red-500"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Target</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-red-400" : "text-red-700"
              )}>{targetAge}</span>
            </div>
          </div>
        </div>
        
        <div className={cx(
          "rounded-lg p-2.5 border",
          darkMode 
            ? risk === 'High' ? "bg-red-900/30 border-red-700" 
              : risk === 'Medium' ? "bg-yellow-900/30 border-yellow-700" 
              : "bg-green-900/30 border-green-700"
            : risk === 'High' ? "bg-gradient-to-r from-blue-500/10 to-red-500/10 border-red-200" 
              : risk === 'Medium' ? "bg-gradient-to-r from-blue-500/10 to-yellow-500/10 border-yellow-200" 
              : "bg-gradient-to-r from-blue-500/10 to-green-500/10 border-green-200"
        )}>
          <div className="text-xs space-y-2">
            <div>
              <div className={cx(
                "text-xs font-medium mb-1 flex items-center",
                darkMode 
                  ? risk === 'High' ? "text-red-300" : risk === 'Medium' ? "text-yellow-300" : "text-green-300" 
                  : risk === 'High' ? "text-red-700" : risk === 'Medium' ? "text-yellow-700" : "text-green-700"
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Key Recommendations
              </div>
              <div className={cx("text-gray-600", darkMode && "text-gray-400")}>
                {risk === 'High' ? (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-red-400" : "text-red-600"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Critical: Capital will deplete {Math.max(0, targetAge - estimatedExhaustionAge)} years before target age
                    </span>
                    <div className={cx(
                      "pl-3 py-2 mt-2 rounded-sm border-l-4",
                      darkMode ? "bg-red-900/30 border-red-500" : "bg-red-50 border-red-500"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-3.5 w-3.5 inline mr-1", 
                        darkMode ? "text-red-400" : "text-red-700"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-red-300" : "text-red-800"
                      )}>
                        Recommended Action:
                      </span>
                      <ul className={cx(
                        "list-disc pl-4 text-xs space-y-1.5 mt-1",
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        <li><span className="font-medium">Immediate:</span> Increase to <span className={cx(
                          "font-semibold",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{formatDisplayValue(monthlyInvestment + investmentIncrease.monthlyIncrease)}</span> (+{Math.round(investmentIncrease.totalBenefit / 1000)}k at retirement)</li>
                        <li><span className="font-medium">Impact:</span> +{Math.round(yearsGained)} years of retirement funding</li>
                        <li><span className="font-medium">Optional:</span> Consider additional income sources during retirement</li>
                      </ul>
                    </div>
                  </>
                ) : risk === 'Medium' ? (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-amber-400" : "text-amber-600"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Improvements needed: Fund growth could be optimized
                    </span>
                    <div className={cx(
                      "pl-3 py-2 mt-2 rounded-sm border-l-4",
                      darkMode ? "bg-yellow-900/30 border-yellow-500" : "bg-yellow-50 border-yellow-500"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-3.5 w-3.5 inline mr-1", 
                        darkMode ? "text-yellow-400" : "text-yellow-700"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-yellow-300" : "text-yellow-800"
                      )}>Recommended Action:</span>
                      <ul className={cx(
                        "list-disc pl-4 text-xs space-y-1.5 mt-1",
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        <li><span className="font-medium">Best option:</span> Increase to <span className={cx(
                          "font-semibold",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{formatDisplayValue(monthlyInvestment + investmentIncrease.monthlyIncrease)}</span>/month</li>
                        <li><span className="font-medium">Portfolio:</span> Target {formatPercentage(annualReturnRate+1)}-{formatPercentage(annualReturnRate+2)} annual returns</li>
                        <li><span className="font-medium">Impact:</span> +{Math.round(yearsGained)} years of retirement funding</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-green-400" : "text-green-600"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Well-positioned: Your investment strategy is on track
                    </span>
                    <div className={cx(
                      "pl-3 py-2 mt-2 rounded-sm border-l-4",
                      darkMode ? "bg-green-900/30 border-green-500" : "bg-green-50 border-green-500"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-3.5 w-3.5 inline mr-1", 
                        darkMode ? "text-green-400" : "text-green-700"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-green-300" : "text-green-800"
                      )}>Optional Enhancements:</span>
                      <ul className={cx(
                        "list-disc pl-4 text-xs space-y-1.5 mt-1",
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        <li><span className="font-medium">Quality of life:</span> Consider <span className={cx(
                          "font-semibold",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{formatDisplayValue(monthlyInvestment + investmentIncrease.monthlyIncrease)}</span>/month</li>
                        <li><span className="font-medium">Impact:</span> +{Math.round(yearsGained)} years of coverage</li>
                        <li><span className="font-medium">Legacy planning:</span> {formatDisplayValue(capitalAtRetirement * 0.15)} potential inheritance</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className={cx(
              "border-t pt-2", 
              darkMode 
                ? risk === 'High' ? "border-red-700" : risk === 'Medium' ? "border-yellow-700" : "border-green-700"
                : risk === 'High' ? "border-red-200" : risk === 'Medium' ? "border-yellow-200" : "border-green-200"
            )}>
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                  "h-3.5 w-3.5 mr-1.5",
                  darkMode ? "text-yellow-400" : "text-yellow-700"
                )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className={cx(
                  "text-xs font-medium",
                  darkMode ? "text-yellow-300" : "text-yellow-800"
                )}>Impact Summary</div>
              </div>
              
              <div className={cx(
                "grid grid-cols-2 gap-x-4 gap-y-1.5",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>Investment</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-yellow-300" : "text-yellow-700"
                )}>
                  {formatDisplayValue(monthlyInvestment + investmentIncrease.monthlyIncrease)}/month
                </div>
                
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>Monthly increase</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-yellow-300" : "text-yellow-700"
                )}>
                  +{formatDisplayValue(investmentIncrease.monthlyIncrease)}
                </div>
                
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>Total benefit</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-yellow-300" : "text-yellow-700"
                )}>
                  {formatDisplayValue(investmentIncrease.totalBenefit)}
                </div>
                
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>Years extended</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-yellow-300" : "text-yellow-700"
                )}>
                  +{Math.round(yearsGained)} years
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