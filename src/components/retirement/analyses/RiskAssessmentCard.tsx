import React, { useState } from 'react';
import { FormatAmountFunction, Currency, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card } from '../../common/StyledComponents';
import { Metric } from '../../common/Metric';
import { validateNumber, validatePercentage, formatPercentage as baseFormatPercentage } from '../../../utils/formatters';
import { calculateYearsUntilExhaustion } from '../../../utils/financialCalculations';
import { useTheme } from '../../../context/ThemeContext';

interface RiskAssessmentCardProps {
  risk: 'High' | 'Medium' | 'Low';
  safetyMargin: number;
  withdrawalRate: {
    current: number;
    safe: number;
    isSafe: boolean;
  };
  statistics: {
    isCapitalExhausted: boolean;
    exhaustionAge: number;
    capitalAtRetirement: number;
    totalNeededCapital: number;
  };
  params: {
    monthlyInvestment: number;
    monthlyRetirementWithdrawal: number;
    currency: Currency;
    inflationAdjustedWithdrawal?: boolean;
    withdrawalMode?: WithdrawalMode;
    inflation?: number;
  };
  formatDisplayValue: (value: number) => string;
}

// Use a consistent percentage formatter with 1 decimal place
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  risk,
  safetyMargin,
  withdrawalRate,
  statistics,
  params,
  formatDisplayValue
}) => {
  const { darkMode } = useTheme();
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showDetails, setShowDetails] = useState(false);

  // Handle mouse enter with position
  const handleMouseEnter = (metricType: string, e: React.MouseEvent) => {
    setHoveredMetric(metricType);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Validate inputs
  const validSafetyMargin = validateNumber(safetyMargin);
  const validWithdrawalRate = validatePercentage(withdrawalRate.current);
  const validSafeRate = validatePercentage(withdrawalRate.safe);
  const validCapitalRatio = validatePercentage((statistics.capitalAtRetirement / statistics.totalNeededCapital) * 100);

  // Get effective withdrawal amount considering inflation adjustment
  const getEffectiveWithdrawalAmount = () => {
    if (params.inflationAdjustedWithdrawal && params.withdrawalMode === "amount" && params.inflation !== undefined) {
      // Calculate years until retirement based on safety margin
      const retirementStartAge = statistics.exhaustionAge - validSafetyMargin;
      const currentAge = retirementStartAge - 25; // Estimate current age
      const yearsUntilRetirement = Math.max(0, retirementStartAge - currentAge);
      
      // Calculate inflation-adjusted withdrawal
      return params.monthlyRetirementWithdrawal * Math.pow(1 + params.inflation / 100, yearsUntilRetirement);
    }
    return params.monthlyRetirementWithdrawal;
  };

  const effectiveMonthlyWithdrawal = getEffectiveWithdrawalAmount();

  // Calculate the recommended monthly withdrawal (4% rule as reference)
  const annualSafeWithdrawal = statistics.capitalAtRetirement * 0.04;
  const recommendedMonthlyWithdrawal = annualSafeWithdrawal / 12;
  
  // Calculate the adjustment needed based on 4% rule
  const currentAnnualWithdrawal = effectiveMonthlyWithdrawal * 12;
  const adjustmentNeeded = currentAnnualWithdrawal - annualSafeWithdrawal;
  const adjustmentPercentage = (adjustmentNeeded / currentAnnualWithdrawal) * 100;
  
  // Calculate target age and current trajectory
  const targetAge = 95;
  const retirementStartAge = statistics.exhaustionAge - validSafetyMargin;
  
  // Calculate the optimal withdrawal rate to last exactly until target age
  const calculateOptimalWithdrawalRate = () => {
    // Start with a reasonable range
    let low = 0.01; // 1% withdrawal rate
    let high = 0.08; // 8% withdrawal rate
    
    // Binary search to find optimal rate
    for (let i = 0; i < 10; i++) { // 10 iterations should be enough for precision
      const mid = (low + high) / 2;
      const optimalAnnualWithdrawal = statistics.capitalAtRetirement * mid;
      
      const yearsUntilExhaustion = calculateYearsUntilExhaustion(
        statistics.capitalAtRetirement,
        optimalAnnualWithdrawal,
        0.07, // Assuming 7% return
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
  const optimalWithdrawalRate = calculateOptimalWithdrawalRate();
  const optimalAnnualWithdrawal = statistics.capitalAtRetirement * optimalWithdrawalRate;
  const optimalMonthlyWithdrawal = optimalAnnualWithdrawal / 12;
  
  // Compare with 4% rule
  const isSaferThan4Percent = optimalWithdrawalRate <= 0.04;
  const finalRecommendedWithdrawal = isSaferThan4Percent ? recommendedMonthlyWithdrawal : optimalMonthlyWithdrawal;
  
  // Calculate years with optimal withdrawal
  const yearsWithOptimalWithdrawal = calculateYearsUntilExhaustion(
    statistics.capitalAtRetirement,
    optimalAnnualWithdrawal,
    0.07, // Assuming 7% return
    1,
    100
  );
  const newExhaustionAge = retirementStartAge + yearsWithOptimalWithdrawal;

  // Calculate capital gap
  const capitalGap = statistics.totalNeededCapital - statistics.capitalAtRetirement;
  const gapPercentage = (capitalGap / statistics.totalNeededCapital) * 100;
  
  // Calculate years until exhaustion
  const yearsUntilExhaustion = calculateYearsUntilExhaustion(
    statistics.capitalAtRetirement,
    params.monthlyRetirementWithdrawal * 12,
    7 * 0.7, // Conservative return estimate
    1,
    100
  );

  // Tooltip content for each metric
  const getTooltipContent = (metricType: string) => {
    switch (metricType) {
      case 'capitalRatio':
        return (
          <div className={cx(
            "p-3 rounded-lg shadow-lg border w-64",
            darkMode 
              ? "bg-gray-800 border-indigo-700 text-gray-200" 
              : "bg-white border-indigo-200"
          )}>
            <h3 className={cx(
              "font-semibold mb-1",
              darkMode ? "text-gray-100" : "text-gray-800"
            )}>Capital Adequacy Ratio</h3>
            <p className={cx(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>Represents how your current retirement capital compares to the estimated required amount. Target is 100% or higher.</p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Formula: <span className="font-semibold">Capital / Required Capital × 100%</span></p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Value: <span className="font-semibold">{formatPercentage(validCapitalRatio)}</span></p>
          </div>
        );
      case 'safetyMargin':
        return (
          <div className={cx(
            "p-3 rounded-lg shadow-lg border w-64",
            darkMode 
              ? "bg-gray-800 border-indigo-700 text-gray-200" 
              : "bg-white border-indigo-200"
          )}>
            <h3 className={cx(
              "font-semibold mb-1",
              darkMode ? "text-gray-100" : "text-gray-800"
            )}>Safety Margin</h3>
            <p className={cx(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>The difference between your projected capital exhaustion age and your target age. A positive value indicates a safety buffer.</p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Formula: <span className="font-semibold">Exhaustion Age - Target Age</span></p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Value: <span className="font-semibold">{validSafetyMargin} years</span></p>
          </div>
        );
      case 'currentRate':
        return (
          <div className={cx(
            "p-3 rounded-lg shadow-lg border w-64",
            darkMode 
              ? "bg-gray-800 border-indigo-700 text-gray-200" 
              : "bg-white border-indigo-200"
          )}>
            <h3 className={cx(
              "font-semibold mb-1",
              darkMode ? "text-gray-100" : "text-gray-800"
            )}>Current Withdrawal Rate</h3>
            <p className={cx(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>The percentage of your retirement capital withdrawn annually. The 4% rule suggests this should ideally be 4% or less for sustainability.</p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Formula: <span className="font-semibold">Annual Withdrawal / Total Capital × 100%</span></p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Value: <span className="font-semibold">{formatPercentage(withdrawalRate.current)}</span></p>
          </div>
        );
      case 'exhaustionAge':
        return (
          <div className={cx(
            "p-3 rounded-lg shadow-lg border w-64",
            darkMode 
              ? "bg-gray-800 border-indigo-700 text-gray-200" 
              : "bg-white border-indigo-200"
          )}>
            <h3 className={cx(
              "font-semibold mb-1",
              darkMode ? "text-gray-100" : "text-gray-800"
            )}>Capital Exhaustion Age</h3>
            <p className={cx(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>The estimated age at which your retirement capital will be depleted based on your current withdrawal rate and investment returns.</p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>"N/A" means your capital is projected to last your entire lifetime.</p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Value: <span className="font-semibold">{statistics.isCapitalExhausted ? `Age ${statistics.exhaustionAge}` : "Capital not exhausted"}</span></p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="overflow-hidden lg:col-span-2">
        <div className={cx(
          "px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between",
          darkMode 
            ? risk === 'Low' ? "bg-green-900/50 border-green-700" : "bg-red-900/50 border-red-700" 
            : risk === 'Low' ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200" : "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
        )}>
          <div className="flex items-center">
            {risk === 'Low' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                "h-4 w-4 mr-2",
                darkMode ? "text-green-400" : "text-green-600"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                "h-4 w-4 mr-2",
                darkMode ? "text-red-400" : "text-red-600"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <h3 className={cx(
              "mb-0 text-sm sm:text-base font-semibold",
              darkMode 
                ? risk === 'Low' ? "text-green-300" : "text-red-300" 
                : risk === 'Low' ? "text-green-800" : "text-red-800"
            )}>Risk Assessment</h3>
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
            {risk === 'High' ? 'High Risk' : risk === 'Medium' ? 'Medium Risk' : 'Low Risk'}
          </div>
        </div>
        <div className="p-2 sm:p-3">
          <div className={cx(
            "p-2.5 rounded-lg border mb-2.5 text-sm",
            darkMode 
              ? risk === 'Low' ? "bg-green-900/40 border-green-700" : "bg-red-900/40 border-red-700" 
              : risk === 'Low' ? "bg-green-100/70 border-green-200" : "bg-red-100/70 border-red-200"
          )}>
            {risk === 'High' ? (
              <>
                <span className="font-semibold">High Risk:</span> Your capital is projected to be depleted by age {statistics.exhaustionAge}. With a withdrawal rate of {formatPercentage(validWithdrawalRate)}, your retirement plan has significant sustainability concerns that require attention to ensure long-term financial security.
              </>
            ) : risk === 'Medium' ? (
              <>
                <span className="font-semibold">Action Needed:</span> Your withdrawal rate of {formatPercentage(validWithdrawalRate)} requires attention. While your plan is viable, strategic adjustments now can significantly improve your long-term security.
              </>
            ) : (
              <>
                <span className={cx(
                  "font-semibold",
                  darkMode ? "text-green-400" : "text-green-700"
                )}>Low Risk:</span> Your plan is well-balanced with a sustainable withdrawal rate of {formatPercentage(validWithdrawalRate)}. Capital projected to last until age {newExhaustionAge}, providing a significant buffer for longevity and market fluctuations.
              </>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div 
              className="relative" 
              onMouseEnter={(e) => handleMouseEnter('capitalRatio', e)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <Metric
                label="Capital Ratio"
                value={`${formatPercentage(validCapitalRatio)}`}
                trend={validCapitalRatio >= 100 ? 'up' : 'down'}
                className={cx(
                  "p-2 rounded-lg border cursor-help",
                  darkMode ? (
                    validCapitalRatio >= 100 ? "bg-green-900/30 border-green-700" : "bg-red-900/30 border-red-700"
                  ) : (
                    validCapitalRatio >= 100 ? "bg-green-100/70 border-green-200" : "bg-red-100/70 border-red-200"
                  )
                )}
              />
            </div>
            
            <div 
              className="relative"
              onMouseEnter={(e) => handleMouseEnter('safetyMargin', e)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <Metric
                label="Safety Margin"
                value={`${validSafetyMargin < 0 ? '-' : '+'} ${Math.abs(validSafetyMargin)} yrs`}
                trend={validSafetyMargin >= 5 ? 'up' : validSafetyMargin >= 0 ? 'neutral' : 'down'}
                className={cx(
                  "p-2 rounded-lg border cursor-help",
                  darkMode ? (
                    validSafetyMargin >= 5 ? "bg-green-900/30 border-green-700" : 
                    validSafetyMargin >= 0 ? "bg-blue-900/30 border-blue-700" : 
                    "bg-red-900/30 border-red-700"
                  ) : (
                    validSafetyMargin >= 5 ? "bg-green-100/70 border-green-200" : 
                    validSafetyMargin >= 0 ? "bg-blue-100/70 border-blue-200" : 
                    "bg-red-100/70 border-red-200"
                  )
                )}
              />
            </div>
            
            <div 
              className="relative"
              onMouseEnter={(e) => handleMouseEnter('currentRate', e)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <Metric
                label="Current Rate"
                value={`${formatPercentage(withdrawalRate.current)}`}
                trend={withdrawalRate.current <= 4 ? 'up' : 'down'}
                className={cx(
                  "p-2 rounded-lg border cursor-help",
                  darkMode ? (
                    withdrawalRate.current <= 4 ? "bg-green-900/30 border-green-700" : "bg-red-900/30 border-red-700"
                  ) : (
                    withdrawalRate.current <= 4 ? "bg-green-100/70 border-green-200" : "bg-red-100/70 border-red-200"
                  )
                )}
              />
            </div>
            
            <div 
              className="relative"
              onMouseEnter={(e) => handleMouseEnter('exhaustionAge', e)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <Metric
                label="Exhaustion Age"
                value={statistics.isCapitalExhausted ? `${statistics.exhaustionAge}` : "N/A"}
                trend={statistics.isCapitalExhausted ? 'down' : 'up'}
                className={cx(
                  "p-2 rounded-lg border cursor-help",
                  darkMode ? (
                    statistics.isCapitalExhausted ? "bg-red-900/30 border-red-700" : "bg-green-900/30 border-green-700"
                  ) : (
                    statistics.isCapitalExhausted ? "bg-red-100/70 border-red-200" : "bg-green-100/70 border-green-200"
                  )
                )}
              />
            </div>
          </div>
          
          <div className={cx(
            "mt-4 p-3 rounded-lg border",
            darkMode 
              ? risk === 'Low' ? "bg-green-900/40 border-green-700" : "bg-red-900/40 border-red-700" 
              : risk === 'Low' ? "bg-green-100/70 border-green-200" : "bg-red-100/70 border-red-200"
          )}>
            <div className="text-xs space-y-2">
              <div>
                <div className={cx(
                  "text-xs font-medium mb-1 flex items-center",
                  darkMode ? (
                    risk === 'Low' ? "text-green-300" : risk === 'Medium' ? "text-yellow-300" : "text-red-300" 
                  ) : (
                    risk === 'Low' ? "text-green-700" : risk === 'Medium' ? "text-yellow-700" : "text-red-700"
                  )
                )}>
                  {risk === 'Low' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  Risk Factors Analysis
                </div>
                
                <div className={cx(
                  "text-xs",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  {risk === 'High' ? (
                    <>
                      <span className={cx(
                        "font-semibold flex items-center",
                        darkMode ? "text-red-400" : "text-red-600"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Critical Risk Factors Detected
                      </span>
                      <ul className={cx(
                        "mt-2 list-disc pl-4 text-xs space-y-1.5",
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        {withdrawalRate.current > 5 && (
                          <li>Withdrawal rate of <span className={cx(
                            "font-medium",
                            darkMode ? "text-red-400" : "text-red-600"
                          )}>{formatPercentage(withdrawalRate.current)}</span> exceeds safe thresholds</li>
                        )}
                        {validCapitalRatio < 0.8 && (
                          <li>Capital adequacy ratio: <span className={cx(
                            "font-medium",
                            darkMode ? "text-red-400" : "text-red-600"
                          )}>{Math.round(validCapitalRatio * 100)}%</span> (below minimum target of 100%)</li>
                        )}
                        {targetAge - retirementStartAge > 80 - retirementStartAge + 5 && (
                          <li>Longevity risk: Your target age exceeds average life expectancy by <span className={cx(
                            "font-medium",
                            darkMode ? "text-red-400" : "text-red-600"
                          )}>{targetAge - 80}</span> years</li>
                        )}
                      </ul>
                      <div className={cx(
                        "pl-3 py-1.5 mt-2 rounded-sm border-l-4",
                        darkMode ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-500"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                          "h-3.5 w-3.5 inline mr-1", 
                          darkMode ? "text-blue-400" : "text-blue-700"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={cx(
                          "font-medium",
                          darkMode ? "text-blue-300" : "text-blue-800"
                        )}>Critical Action:</span> 
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                          Implement recommended strategy adjustments immediately
                        </span>
                      </div>
                    </>
                  ) : risk === 'Medium' ? (
                    <>
                      <span className={cx(
                        "font-semibold flex items-center",
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Moderate Risk Factors Present
                      </span>
                      <ul className={cx(
                        "mt-2 list-disc pl-4 text-xs space-y-1.5",
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        {withdrawalRate.current > 4 && (
                          <li>Withdrawal rate of <span className={cx(
                            "font-medium",
                            darkMode ? "text-yellow-400" : "text-yellow-600"
                          )}>{formatPercentage(withdrawalRate.current)}</span> is above ideal thresholds</li>
                        )}
                        {validCapitalRatio < 1 && validCapitalRatio >= 0.8 && (
                          <li>Capital adequacy ratio: <span className={cx(
                            "font-medium",
                            darkMode ? "text-yellow-400" : "text-yellow-600"
                          )}>{Math.round(validCapitalRatio * 100)}%</span> (approaching minimum target)</li>
                        )}
                        {targetAge - retirementStartAge > 80 - retirementStartAge && (
                          <li>Moderate longevity risk: Planning beyond average life expectancy</li>
                        )}
                      </ul>
                      <div className={cx(
                        "pl-3 py-1.5 mt-2 rounded-sm border-l-4",
                        darkMode ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-500"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                          "h-3.5 w-3.5 inline mr-1", 
                          darkMode ? "text-blue-400" : "text-blue-700"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={cx(
                          "font-medium",
                          darkMode ? "text-blue-300" : "text-blue-800"
                        )}>Recommended Action:</span> 
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                          Address key risk factors within the next 3-6 months
                        </span>
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
                        Your Risk Profile is Well-Managed
                      </span>
                      <ul className={cx(
                        "mt-2 list-disc pl-4 text-xs space-y-1.5",
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        <li>Withdrawal rate of <span className={cx(
                          "font-medium",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{formatPercentage(withdrawalRate.current)}</span> is within safe parameters</li>
                        <li>Capital adequacy ratio: <span className={cx(
                          "font-medium",
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>{Math.round(validCapitalRatio * 100)}%</span> (exceeds target)</li>
                        <li>Your retirement plan includes appropriate safety margins</li>
                      </ul>
                      <div className={cx(
                        "pl-3 py-1.5 mt-2 rounded-sm border-l-4",
                        darkMode ? "bg-blue-900/30 border-blue-500" : "bg-blue-50 border-blue-500"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                          "h-3.5 w-3.5 inline mr-1", 
                          darkMode ? "text-blue-400" : "text-blue-700"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={cx(
                          "font-medium",
                          darkMode ? "text-blue-300" : "text-blue-800"
                        )}>Action:</span> 
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                          Continue current strategy with regular quarterly reviews
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Portal for tooltips - positioned fixed relative to viewport */}
      {hoveredMetric && (
        <div
          className="fixed shadow-xl"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 100}px`,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {getTooltipContent(hoveredMetric)}
        </div>
      )}
    </>
  );
};

export default RiskAssessmentCard; 