import React, { useState } from 'react';
import { FormatAmountFunction, Currency, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card } from '../../common/StyledComponents';
import { Metric } from '../../common/Metric';
import { validateNumber, validatePercentage, formatPercentage as baseFormatPercentage } from '../../../utils/formatters';
import { calculateYearsUntilExhaustion } from '../../../utils/financialCalculations';

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
  // State to track which metric is being hovered
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  // State to track tooltip position
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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

  // Tooltip content for each metric
  const getTooltipContent = (metricType: string) => {
    switch(metricType) {
      case 'capitalRatio':
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64 z-50">
            <h3 className="font-semibold text-gray-800 mb-1">Capital Ratio</h3>
            <p className="text-xs text-gray-600">The percentage of your required retirement capital that you've already saved.</p>
            <p className="text-xs text-gray-600 mt-1">A value of 100% or higher means you have sufficient capital for your planned retirement.</p>
            <p className="text-xs text-gray-600 mt-1">Current value: <span className="font-semibold">{formatPercentage(validCapitalRatio)}</span></p>
          </div>
        );
      case 'safetyMargin':
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64 z-50">
            <h3 className="font-semibold text-gray-800 mb-1">Safety Margin</h3>
            <p className="text-xs text-gray-600">The number of years your capital will last beyond or fall short of your life expectancy.</p>
            <p className="text-xs text-gray-600 mt-1">A positive value provides a buffer against market volatility and longevity risk.</p>
            <p className="text-xs text-gray-600 mt-1">Current value: <span className="font-semibold">{validSafetyMargin < 0 ? '-' : '+'}{Math.abs(validSafetyMargin)} years</span></p>
          </div>
        );
      case 'currentRate':
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64 z-50">
            <h3 className="font-semibold text-gray-800 mb-1">Current Rate</h3>
            <p className="text-xs text-gray-600">Your annual withdrawal as a percentage of your total retirement capital.</p>
            <p className="text-xs text-gray-600 mt-1">The traditional "safe" withdrawal rate is 4%. Higher rates increase the risk of depleting your capital.</p>
            <p className="text-xs text-gray-600 mt-1">Current rate: <span className="font-semibold">{formatPercentage(withdrawalRate.current)}</span></p>
          </div>
        );
      case 'exhaustionAge':
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64 z-50">
            <h3 className="font-semibold text-gray-800 mb-1">Exhaustion Age</h3>
            <p className="text-xs text-gray-600">The projected age when your retirement capital will be completely depleted.</p>
            <p className="text-xs text-gray-600 mt-1">"N/A" means your capital is projected to last your entire lifetime.</p>
            <p className="text-xs text-gray-600 mt-1">Value: <span className="font-semibold">{statistics.isCapitalExhausted ? `Age ${statistics.exhaustionAge}` : "Capital not exhausted"}</span></p>
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
          risk === 'High' ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200" : 
          risk === 'Medium' ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200" : 
          "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200"
        )}>
          <div className="flex items-center">
            <div className={cx(
              "w-4 h-4 rounded-full mr-2",
              risk === 'High' ? "bg-red-500" : 
              risk === 'Medium' ? "bg-yellow-500" : 
              "bg-emerald-500"
            )}></div>
            <SectionTitle className={cx(
              risk === 'High' ? "text-red-800" : 
              risk === 'Medium' ? "text-yellow-800" : 
              "text-emerald-800",
              "mb-0 text-sm sm:text-base"
            )}>
              Risk Assessment
            </SectionTitle>
          </div>
          <div className={cx(
            "text-xs font-medium px-1.5 py-0.5 rounded-full",
            risk === 'High' ? "bg-red-100 text-red-700" : 
            risk === 'Medium' ? "bg-yellow-100 text-yellow-700" : 
            "bg-green-100 text-green-700"
          )}>
            {risk} Risk
          </div>
        </div>
        <div className="p-2 sm:p-3">
          <div className={cx(
            "p-2.5 rounded-lg border mb-2.5 text-sm",
            risk === 'High' ? "bg-red-50 text-red-800 border-red-100" : 
            risk === 'Medium' ? "bg-yellow-50 text-yellow-800 border-yellow-100" : 
            "bg-emerald-50 text-emerald-800 border-emerald-100"
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
                <span className="font-semibold">Low Risk:</span> Your plan is well-balanced with a sustainable withdrawal rate of {formatPercentage(validWithdrawalRate)}. Capital projected to last until age {newExhaustionAge}, providing a significant buffer for longevity and market fluctuations.
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
                  validCapitalRatio >= 100 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
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
                  validSafetyMargin >= 5 ? "bg-green-50 border-green-100" : 
                  validSafetyMargin >= 0 ? "bg-blue-50 border-blue-100" : 
                  "bg-red-50 border-red-100"
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
                  withdrawalRate.current <= 4 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
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
                trend={!statistics.isCapitalExhausted ? 'up' : statistics.exhaustionAge >= 90 ? 'neutral' : 'down'}
                className={cx(
                  "p-2 rounded-lg border cursor-help",
                  !statistics.isCapitalExhausted ? "bg-green-50 border-green-100" : 
                  statistics.exhaustionAge >= 90 ? "bg-blue-50 border-blue-100" : 
                  "bg-red-50 border-red-100"
                )}
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500/10 to-emerald-500/10 rounded-lg p-2.5 border border-gray-200 mt-3">
            <div className="text-xs space-y-2">
              <div>
                <div className="text-xs font-medium text-red-800 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Risk Factors Analysis
                </div>
                <div className="text-gray-600">
                  {risk === 'High' ? (
                    <>
                      Your retirement plan faces several critical risk factors:
                      <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                        <li><span className="font-medium">Withdrawal rate:</span> {formatPercentage(validWithdrawalRate)} exceeds the 4% safe threshold, significantly increasing depletion risk</li>
                        <li><span className="font-medium">Capital adequacy:</span> Current savings at {formatPercentage(validCapitalRatio)} of required amount</li>
                        <li><span className="font-medium">Longevity risk:</span> Funds projected to deplete by age {statistics.exhaustionAge}</li>
                      </ul>
                    </>
                  ) : risk === 'Medium' ? (
                    <>
                      Your plan requires strategic adjustments:
                      <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                        <li><span className="font-medium">Current status:</span> {validWithdrawalRate <= 4 ? 
                          `Withdrawal rate of ${formatPercentage(validWithdrawalRate)} is near threshold` : 
                          `Withdrawal rate of ${formatPercentage(validWithdrawalRate)} exceeds safe threshold`}</li>
                        <li><span className="font-medium">Opportunity:</span> {validCapitalRatio < 90 ? 
                          `Increasing savings by ${formatPercentage(100 - validCapitalRatio)} would reach optimal target` :
                          'Building additional safety margin would strengthen plan'}</li>
                        <li><span className="font-medium">Key action:</span> {statistics.isCapitalExhausted ? 
                          `Consider part-time work to extend beyond age ${statistics.exhaustionAge}` : 
                          'Review investment mix to protect against market volatility'}</li>
                      </ul>
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        <span className="text-amber-700 font-medium text-[11px]">
                          💡 Recommended: {validWithdrawalRate > 4 ? 
                            `Reduce withdrawals by ${formatPercentage(validWithdrawalRate - 4)} or supplement with part-time income` : 
                            `Build a ${formatPercentage(Math.min(15, (100 - validCapitalRatio)))} safety buffer through additional savings`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      Your retirement plan is well-positioned with low risk:
                      <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                        <li><span className="font-medium">Withdrawal rate:</span> {formatPercentage(validWithdrawalRate)} is within safe parameters</li>
                        <li><span className="font-medium">Capital adequacy:</span> Current savings at {formatPercentage(validCapitalRatio)} of required amount</li>
                        <li><span className="font-medium">Longevity risk:</span> Funds projected to last your entire lifetime</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-gray-600">Overall risk assessment</div>
                  <div className={cx(
                    "text-xs font-semibold",
                    risk === 'High' ? "text-red-700" : 
                    risk === 'Medium' ? "text-yellow-700" : 
                    "text-green-700"
                  )}>
                    {risk === 'High' ? 'Critical attention needed' : risk === 'Medium' ? 'Moderate adjustments recommended' : 'Well-balanced plan'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">Primary concern</div>
                  <div className={cx(
                    "text-xs font-semibold",
                    risk === 'High' ? "text-red-700" : 
                    risk === 'Medium' ? "text-yellow-700" : 
                    "text-green-700"
                  )}>
                    {risk === 'High' ? 
                      (validWithdrawalRate > 4 ? 'Excessive withdrawal rate' : 'Insufficient capital') : 
                      risk === 'Medium' ? 
                        (statistics.isCapitalExhausted ? 'Potential fund depletion' : 'Market volatility exposure') : 
                        'Maintaining current balance'}
                  </div>
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