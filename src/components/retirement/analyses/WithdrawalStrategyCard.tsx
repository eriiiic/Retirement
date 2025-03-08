import React from 'react';
import { FormatAmountFunction, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';
import { calculateYearsUntilExhaustion } from '../../../utils/financialCalculations';
import { useTheme } from '../../../context/ThemeContext';

interface WithdrawalStrategyCardProps {
  risk: 'High' | 'Medium' | 'Low';
  monthlyRetirementWithdrawal: number;
  capitalAtRetirement: number;
  retirementStartAge: number;
  annualReturnRate: number;
  formatAmount: FormatAmountFunction;
  formatDisplayValue: (value: number) => string;
  inflationAdjustedWithdrawal?: boolean;
  withdrawalMode?: WithdrawalMode;
  inflation?: number;
  currentAge: number;
}

// Utility function for consistent percentage formatting with 1 decimal place
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const WithdrawalStrategyCard: React.FC<WithdrawalStrategyCardProps> = ({
  risk,
  monthlyRetirementWithdrawal,
  capitalAtRetirement,
  retirementStartAge,
  annualReturnRate,
  formatAmount,
  formatDisplayValue,
  inflationAdjustedWithdrawal,
  withdrawalMode,
  inflation,
  currentAge
}) => {
  const { darkMode } = useTheme();
  
  // Set target age
  const targetAge = 95;
  
  // Get effective withdrawal amount considering inflation adjustment
  const getEffectiveWithdrawalAmount = () => {
    if (inflationAdjustedWithdrawal && withdrawalMode === "amount" && inflation !== undefined) {
      // Calculate years until retirement
      const yearsUntilRetirement = retirementStartAge - currentAge;
      
      // Calculate inflation-adjusted withdrawal using compound interest formula
      return monthlyRetirementWithdrawal * Math.pow(1 + inflation / 100, yearsUntilRetirement);
    }
    return monthlyRetirementWithdrawal;
  };

  const effectiveMonthlyWithdrawal = getEffectiveWithdrawalAmount();
  
  // Calculate current withdrawal rate using the effective amount
  const currentAnnualWithdrawal = effectiveMonthlyWithdrawal * 12;
  const currentWithdrawalRate = (currentAnnualWithdrawal / capitalAtRetirement) * 100;
  
  // Reference 4% rule for safety comparison
  const safeWithdrawalRate = 0.04;
  const isSafeRate = currentWithdrawalRate <= safeWithdrawalRate * 100;
  
  // Calculate ideal withdrawal based on the 4% rule
  const idealAnnualWithdrawal = capitalAtRetirement * safeWithdrawalRate;
  const idealMonthlyWithdrawal = idealAnnualWithdrawal / 12;
  
  // Calculate the optimal withdrawal rate to last exactly until target age
  const calculateOptimalWithdrawalRate = (): number => {
    // Start with a reasonable range
    let low = 0.01; // 1% withdrawal rate
    let high = 0.08; // 8% withdrawal rate
    
    // Binary search to find optimal rate
    for (let i = 0; i < 10; i++) { // 10 iterations should be enough for precision
      const mid = (low + high) / 2;
      const optimalAnnualWithdrawal = capitalAtRetirement * mid;
      
      const yearsUntilExhaustion = calculateYearsUntilExhaustion(
        capitalAtRetirement,
        optimalAnnualWithdrawal,
        annualReturnRate * 0.7, // Conservative return estimate
        1,
        100
      );
      
      const exhaustionAge = retirementStartAge + yearsUntilExhaustion;
      
      if (Math.abs(exhaustionAge - targetAge) < 1) {
        // Close enough to target
        return mid;
      }
      
      if (exhaustionAge < targetAge) {
        // Exhaustion too early, need lower withdrawal rate
        high = mid;
      } else {
        // Exhaustion too late, can increase withdrawal rate
        low = mid;
      }
    }
    
    return (low + high) / 2; // Return the best approximation
  };
  
  // Get optimal rate and calculate withdrawal amounts
  const optimalRate = calculateOptimalWithdrawalRate();
  const optimalAnnualWithdrawal = capitalAtRetirement * optimalRate;
  const optimizedMonthlyWithdrawal = optimalAnnualWithdrawal / 12;
  
  // Calculate reduction percentage (only if reduction is needed)
  const reductionNeeded = effectiveMonthlyWithdrawal > optimizedMonthlyWithdrawal;
  const reductionPercent = reductionNeeded ? 
    Math.round(((effectiveMonthlyWithdrawal - optimizedMonthlyWithdrawal) / effectiveMonthlyWithdrawal) * 100) : 0;
  
  // Calculate new exhaustion age with optimal withdrawal
  const calculateNewExhaustionAge = (): number => {
    const years = calculateYearsUntilExhaustion(
      capitalAtRetirement,
      optimalAnnualWithdrawal,
      annualReturnRate * 0.7, // Conservative return estimate
      1,
      100
    );
    
    return retirementStartAge + years;
  };
  
  const newExhaustionAge = calculateNewExhaustionAge();
  
  // Calculate the years gained from current withdrawal to optimal
  const currentExhaustionYears = calculateYearsUntilExhaustion(
    capitalAtRetirement,
    currentAnnualWithdrawal,
    annualReturnRate * 0.7,
    1,
    100
  );
  const currentExhaustionAge = retirementStartAge + currentExhaustionYears;
  const yearsGained = newExhaustionAge - currentExhaustionAge;
  
  // Calculate ideal withdrawal exhaustion age
  const calculateIdealExhaustionAge = (): number => {
    const years = calculateYearsUntilExhaustion(
      capitalAtRetirement,
      idealAnnualWithdrawal,
      annualReturnRate * 0.7, // Conservative return estimate
      1,
      100
    );
    
    return retirementStartAge + years;
  };
  
  const idealExhaustionAge = calculateIdealExhaustionAge();
  
  return (
    <Card className="overflow-hidden lg:col-span-3">
      <div className={cx(
        "px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between",
        darkMode 
          ? "bg-purple-900/50 border-purple-700" 
          : "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200"
      )}>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className={cx(
            "h-4 w-4 mr-2",
            darkMode ? "text-purple-400" : "text-purple-600"
          )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className={cx(
            "mb-0 text-sm sm:text-base font-semibold",
            darkMode ? "text-purple-300" : "text-purple-800"
          )}>Withdraw Strategy</h3>
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
          "flex items-start mb-2.5 p-2 rounded-lg border",
          darkMode 
            ? "bg-purple-900/40 border-purple-700" 
            : "bg-purple-100/70 border-purple-200"
        )}>
          <div className={cx(
            "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mr-2.5 mt-0.5",
            darkMode ? "bg-purple-800" : "bg-purple-200"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className={cx(
              "h-4.5 w-4.5",
              darkMode ? "text-purple-300" : "text-purple-600"
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className={cx(
              "text-sm flex items-center gap-1.5",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              <span><span className="font-bold">Recommended</span> monthly withdrawal</span>
            </div>
            <div className="flex items-baseline mt-1">
              <PositiveMetric className="text-base">
                {formatDisplayValue(optimizedMonthlyWithdrawal)}
              </PositiveMetric>
              <span className={cx(
                "text-xs ml-1",
                darkMode ? "text-purple-400" : "text-purple-700"
              )}>
                {reductionNeeded ? `(${formatPercentage(reductionPercent)} reduction)` : '(optimal rate)'}
              </span>
            </div>
            <div className={cx(
              "flex items-baseline text-[10px]",
              darkMode ? "text-purple-400" : "text-purple-700"
            )}>
              <span>+{yearsGained > 0 ? Math.round(yearsGained) : 0} years of retirement coverage</span>
              <span className={cx(
                "ml-1",
                darkMode ? "text-gray-500" : "text-gray-500"
              )}>(until age {newExhaustionAge})</span>
            </div>
            {inflationAdjustedWithdrawal && withdrawalMode === "amount" && (
              <div className={cx(
                "text-[10px] mt-0.5",
                darkMode ? "text-purple-400" : "text-purple-600"
              )}>
                Values shown include inflation adjustment
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className={cx(
            "p-2 rounded-lg border",
            darkMode 
              ? "bg-purple-900/30 border-purple-700" 
              : "bg-purple-50/90 border-purple-200"
          )}>
            <div className={cx(
              "text-xs font-medium flex items-center",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              <span className={cx(
                "h-2 w-2 rounded-full mr-1.5",
                darkMode ? "bg-purple-600" : "bg-purple-400"
              )}></span>
              <span className="font-bold">Current</span>&nbsp;withdrawal {inflationAdjustedWithdrawal ? '(inflation-adjusted)' : ''}
            </div>
            <div className={cx(
              "text-sm font-semibold mt-1",
              darkMode ? "text-gray-300" : "text-gray-800"
            )}>
              {formatDisplayValue(effectiveMonthlyWithdrawal)}/month
            </div>
            <div className={cx(
              "text-[10px]",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              {formatDisplayValue(effectiveMonthlyWithdrawal * 12)}/year
            </div>
            <div className={cx(
              "text-[10px] mt-1",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              Rate: {formatPercentage(currentWithdrawalRate)} 
              <span className={currentWithdrawalRate <= 4 
                ? darkMode ? "text-green-400" : "text-green-600" 
                : darkMode ? "text-red-400" : "text-red-600"
              }>
                ({currentWithdrawalRate <= 4 ? "within safe 4%" : "exceeds 4%"})
              </span>
            </div>
          </div>
          <div className={cx(
            "p-2 rounded-lg border",
            darkMode 
              ? "bg-purple-900/50 border-purple-700" 
              : "bg-purple-100/80 border-purple-200"
          )}>
            <div className={cx(
              "text-xs font-medium flex items-center",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              <span className={cx(
                "h-2 w-2 rounded-full mr-1.5",
                darkMode ? "bg-purple-400" : "bg-purple-600"
              )}></span>
              <span className="font-bold">Ideal</span>&nbsp;withdrawal {inflationAdjustedWithdrawal ? '(inflation-adjusted)' : ''}
            </div>
            <div className={cx(
              "text-sm font-semibold mt-1",
              darkMode ? "text-purple-300" : "text-purple-800"
            )}>
              {formatDisplayValue(idealMonthlyWithdrawal)}/month
            </div>
            <div className={cx(
              "text-[10px]",
              darkMode ? "text-purple-300" : "text-purple-800"
            )}>
              {formatDisplayValue(idealAnnualWithdrawal)}/year
            </div>
            <div className={cx(
              "text-[10px] mt-1",
              darkMode ? "text-purple-300" : "text-purple-800"
            )}>
              Rate: {formatPercentage(safeWithdrawalRate * 100)} (standard safe rate)
            </div>
          </div>
        </div>
        
        <div className={cx(
          "rounded-lg p-2.5 border mb-2.5",
          darkMode ? "bg-purple-900/40 border-purple-700" : "bg-purple-100/70 border-purple-200"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                "h-3.5 w-3.5 mr-1.5",
                darkMode ? "text-purple-400" : "text-purple-600"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className={cx(
                "text-xs font-medium",
                darkMode ? "text-purple-300" : "text-purple-800"
              )}>Withdrawal Strategy Impact</div>
            </div>
            <div className={cx(
              "text-[10px] font-medium",
              darkMode ? "text-gray-400" : "text-gray-500"
            )}>
              Target age: <span className="font-semibold">{targetAge}</span>
            </div>
          </div>
          
          <div className="relative mt-1 mb-4 h-6 bg-gray-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center">
              {/* Gray background for the entire timeline */}
              <div className={cx(
                "h-full w-full",
                darkMode ? "bg-gray-700" : "bg-gray-200"
              )}></div>
              
              {/* Red section for capital depletion gap (if there is one) */}
              {Math.max(currentExhaustionAge, newExhaustionAge, idealExhaustionAge) < targetAge && (
                <div 
                  className={cx(
                    "absolute h-full right-0 opacity-80",
                    darkMode ? "bg-red-600" : "bg-red-400"
                  )}
                  style={{ 
                    width: `${Math.min(100, ((targetAge - Math.max(currentExhaustionAge, newExhaustionAge, idealExhaustionAge)) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Blue section for current plan */}
              <div 
                className={cx(
                  "absolute h-full left-0",
                  darkMode ? "bg-blue-600" : "bg-blue-400"
                )}
                style={{ width: `${Math.min(100, (currentExhaustionAge / targetAge) * 100)}%` }}
              ></div>
              
              {/* Purple section for recommended plan (additional years) */}
              {newExhaustionAge > currentExhaustionAge && (
                <div 
                  className={cx(
                    "absolute h-full opacity-80",
                    darkMode ? "bg-purple-600" : "bg-purple-500"
                  )}
                  style={{ 
                    left: `${Math.min(100, (currentExhaustionAge / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((newExhaustionAge - currentExhaustionAge) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Green section for ideal plan (additional years beyond recommended) */}
              {idealExhaustionAge > newExhaustionAge && (
                <div 
                  className={cx(
                    "absolute h-full opacity-80",
                    darkMode ? "bg-green-600" : "bg-green-500"
                  )}
                  style={{ 
                    left: `${Math.min(100, (newExhaustionAge / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((idealExhaustionAge - newExhaustionAge) / targetAge) * 100)}%` 
                  }}
                ></div>
              )}
              
              {/* Target age line */}
              <div 
                className={cx(
                  "absolute h-full w-0.5 border-l border-dashed z-10",
                  darkMode ? "bg-red-600 border-red-600" : "bg-red-500 border-red-500"
                )} 
                style={{ left: `${Math.min(100, (targetAge / targetAge) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-[10px]">
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
              )}>{currentExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-purple-600" : "bg-purple-500"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Recommended</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-purple-300" : "text-purple-700"
              )}>{newExhaustionAge}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-green-600" : "bg-green-500"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Ideal (4% rule)</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-green-300" : "text-green-700"
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

        {/* Risk assessment and recommendations */}
        <div className={cx(
          "rounded-lg p-2.5 border",
          darkMode 
            ? risk === 'High' ? "bg-red-900/30 border-red-700" 
              : risk === 'Medium' ? "bg-purple-900/30 border-purple-700" 
              : "bg-green-900/30 border-green-700"
            : risk === 'High' ? "bg-gradient-to-r from-purple-500/10 to-red-500/10 border-red-200" 
              : risk === 'Medium' ? "bg-gradient-to-r from-purple-500/10 to-yellow-500/10 border-purple-200" 
              : "bg-gradient-to-r from-purple-500/10 to-green-500/10 border-green-200"
        )}>
          <div className="text-xs space-y-2">
            <div>
              <div className={cx(
                "text-xs font-medium mb-1 flex items-center",
                darkMode 
                  ? risk === 'High' ? "text-red-300" : risk === 'Medium' ? "text-purple-300" : "text-green-300" 
                  : risk === 'High' ? "text-red-700" : risk === 'Medium' ? "text-purple-700" : "text-green-700"
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Optimal Withdrawal Strategy
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
                      Critical: Your current withdrawal rate of {formatPercentage(currentWithdrawalRate)} is significantly higher than sustainable
                    </span>
                    <ul className={cx(
                      "mt-2 list-disc pl-4 text-xs space-y-1.5",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      <li>Reduce to <span className={cx(
                        "font-semibold",
                        darkMode ? "text-green-400" : "text-green-600"
                      )}>{formatDisplayValue(optimizedMonthlyWithdrawal)}/month</span> (<span className="font-medium">{formatPercentage(optimalRate * 100)} rate</span>)</li>
                      <li><span className="font-medium">Use a dynamic withdrawal approach:</span> reduce in down markets, increase in strong markets</li>
                      <li><span className="font-medium">Consider a "floor and ceiling" strategy</span> with essential vs. discretionary spending</li>
                    </ul>
                    <div className={cx(
                      "pl-3 py-1 mt-2 rounded-sm border-l-4",
                      darkMode ? "bg-purple-900/30 border-purple-500" : "bg-purple-50 border-purple-500"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-3.5 w-3.5 inline mr-1", 
                        darkMode ? "text-purple-400" : "text-purple-700"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-purple-300" : "text-purple-800"
                      )}>Recommended Action:</span> Adjust withdrawal rate immediately to preserve capital
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
                      Adjustment Needed: A withdrawal rate of {formatPercentage(optimalRate * 100)} balances spending with longevity
                    </span>
                    <ul className={cx(
                      "mt-2 list-disc pl-4 text-xs space-y-1.5",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      <li>Adjust to <span className={cx(
                        "font-semibold",
                        darkMode ? "text-green-400" : "text-green-600"
                      )}>{formatDisplayValue(optimizedMonthlyWithdrawal)}/month</span> for optimal sustainability</li>
                      <li><span className="font-medium">Implement a "bucket strategy"</span> with 2-3 years of expenses in cash/bonds</li>
                      <li><span className="font-medium">Consider part-time work</span> in early retirement to reduce withdrawal pressure</li>
                    </ul>
                    <div className={cx(
                      "pl-3 py-1 mt-2 rounded-sm border-l-4",
                      darkMode ? "bg-purple-900/30 border-purple-500" : "bg-purple-50 border-purple-500"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-3.5 w-3.5 inline mr-1", 
                        darkMode ? "text-purple-400" : "text-purple-700"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-purple-300" : "text-purple-800"
                      )}>Recommended Action:</span> Implement a flexible withdrawal strategy
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
                      Your withdrawal approach is {currentWithdrawalRate < optimalRate * 100 ? "more conservative than needed" : "well-balanced"}
                    </span>
                    <ul className={cx(
                      "mt-2 list-disc pl-4 text-xs space-y-1.5",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      <li>{currentWithdrawalRate < optimalRate * 100 ? 
                        <span>You could safely increase to <span className={cx(
                          "font-semibold",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{formatDisplayValue(optimizedMonthlyWithdrawal)}/month</span></span> : 
                        <span>Your current withdrawal of <span className={cx(
                          "font-semibold",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{formatDisplayValue(effectiveMonthlyWithdrawal)}</span> is sustainable long-term</span>}
                      </li>
                      <li><span className="font-medium">Focus on tax-efficient withdrawal sequencing</span> (taxable → tax-deferred → tax-free)</li>
                      <li><span className="font-medium">Consider Roth conversions</span> in lower income years to optimize future flexibility</li>
                    </ul>
                    {currentWithdrawalRate < optimalRate * 100 && (
                      <div className={cx(
                        "pl-3 py-1 mt-2 rounded-sm border-l-4",
                        darkMode ? "bg-purple-900/30 border-purple-500" : "bg-purple-50 border-purple-500"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                          "h-3.5 w-3.5 inline mr-1", 
                          darkMode ? "text-purple-400" : "text-purple-700"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={cx(
                          "font-medium",
                          darkMode ? "text-purple-300" : "text-purple-800"
                        )}>Optional Enhancement:</span> You could increase your monthly withdrawal by up to <span className={cx(
                          "font-medium",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{formatDisplayValue(optimizedMonthlyWithdrawal - effectiveMonthlyWithdrawal)}</span>
                      </div>
                    )}
                  </>
                )}
                
                {inflationAdjustedWithdrawal && withdrawalMode === "amount" && (
                  <div className={cx(
                    "mt-2 text-xs",
                    darkMode ? "text-blue-400" : "text-blue-600"
                  )}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Note: Values shown include estimated inflation adjustment, which increases future purchasing power.
                  </div>
                )}
              </div>
            </div>
            
            <div className={cx(
              "border-t pt-2",
              darkMode 
                ? risk === 'High' ? "border-red-700" : risk === 'Medium' ? "border-purple-700" : "border-green-700"
                : risk === 'High' ? "border-red-200" : risk === 'Medium' ? "border-purple-200" : "border-green-200"
            )}>
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                  "h-3.5 w-3.5 mr-1.5",
                  darkMode ? "text-purple-400" : "text-purple-700"
                )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className={cx(
                  "text-xs font-medium",
                  darkMode ? "text-purple-300" : "text-purple-800"
                )}>Impact Summary</div>
              </div>
              
              <div className={cx(
                "grid grid-cols-2 gap-x-4 gap-y-1.5",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>Recommended withdrawal</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  {formatDisplayValue(optimizedMonthlyWithdrawal)}/month
                </div>
                
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>{reductionNeeded ? "Monthly reduction" : "Potential increase"}</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  {reductionNeeded ? 
                    `-${formatDisplayValue(effectiveMonthlyWithdrawal - optimizedMonthlyWithdrawal)}` :
                    `+${formatDisplayValue(optimizedMonthlyWithdrawal - effectiveMonthlyWithdrawal)}`
                  }
                </div>
                
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>Withdrawal rate</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  {formatPercentage(optimalRate * 100)} vs. {formatPercentage(currentWithdrawalRate)}
                </div>
                
                <div className={cx("text-xs", darkMode ? "text-gray-400" : "text-gray-600")}>Years extended</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  +{Math.max(0, Math.round(yearsGained))} years (until age {newExhaustionAge})
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </Card>
  );
};

export default WithdrawalStrategyCard; 