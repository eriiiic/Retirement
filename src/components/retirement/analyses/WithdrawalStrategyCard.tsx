import React from 'react';
import { FormatAmountFunction, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';
import { calculateYearsUntilExhaustion } from '../../../utils/financialCalculations';

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
  
  return (
    <Card className="overflow-hidden lg:col-span-3">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-purple-200 flex items-center justify-between">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <SectionTitle className="text-purple-800 mb-0 text-sm sm:text-base">Withdraw Strategy</SectionTitle>
        </div>
        <div className={cx(
          "text-xs font-medium px-1.5 py-0.5 rounded-full",
          risk === 'High' ? "bg-red-100 text-red-700" : 
          risk === 'Medium' ? "bg-yellow-100 text-yellow-700" : 
          "bg-purple-100 text-purple-700"
        )}>
          {risk === 'High' ? 'Critical' : risk === 'Medium' ? 'Recommended' : 'Optional'}
        </div>
      </div>
      <div className="p-2 sm:p-3">
        <div className="flex items-start mb-2.5 p-2 bg-purple-50/70 rounded-lg border border-purple-100">
          <div className="w-9 h-9 bg-purple-100 rounded-full flex-shrink-0 flex items-center justify-center mr-2.5 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-700 flex items-center gap-1.5">
              <span>Optimized monthly withdrawal</span>
            </div>
            <div className="flex items-baseline mt-1">
              <PositiveMetric className="text-base">
                {formatDisplayValue(optimizedMonthlyWithdrawal)}
              </PositiveMetric>
              <span className="text-xs text-purple-700 ml-1">
                {reductionNeeded ? `(${formatPercentage(reductionPercent)} reduction)` : '(optimal rate)'}
              </span>
            </div>
            {inflationAdjustedWithdrawal && withdrawalMode === "amount" && (
              <div className="text-[10px] text-purple-600 mt-0.5">
                Values shown include inflation adjustment
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
              Current withdrawal {inflationAdjustedWithdrawal ? '(inflation-adjusted)' : ''}
            </div>
            <div className="text-sm font-semibold text-gray-700 mt-1">
              {formatDisplayValue(effectiveMonthlyWithdrawal)}/month
            </div>
            <div className="text-[10px] text-gray-500">
              {formatDisplayValue(effectiveMonthlyWithdrawal * 12)}/year
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Rate: {formatPercentage(currentWithdrawalRate)} 
              <span className={currentWithdrawalRate <= 4 ? "text-green-600" : "text-red-600"}>
                ({currentWithdrawalRate <= 4 ? "within safe 4%" : "exceeds 4%"})
              </span>
            </div>
          </div>
          <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-purple-500 mr-1.5"></span>
              {isSafeRate ? 'Safe withdrawal' : 'Optimized withdrawal'} {inflationAdjustedWithdrawal ? '(inflation-adjusted)' : ''}
            </div>
            <div className="text-sm font-semibold text-purple-700 mt-1">
              {formatDisplayValue(optimizedMonthlyWithdrawal)}/month
            </div>
            <div className="text-[10px] text-purple-700">
              {formatDisplayValue(optimalAnnualWithdrawal)}/year
            </div>
            <div className="text-[10px] text-purple-700 mt-1">
              Rate: {formatPercentage(optimalRate * 100)} (lasts until age {targetAge})
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100 mb-2.5">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="text-xs font-medium text-purple-800">Withdrawal Strategy Impact</div>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">
                  {reductionNeeded ? "Annual withdrawal adjustment" : "Potential annual increase"}
                </div>
                <div className="text-xs font-semibold text-purple-700">
                  {reductionNeeded ? 
                    `-${formatDisplayValue((effectiveMonthlyWithdrawal - optimizedMonthlyWithdrawal) * 12)}` :
                    `+${formatDisplayValue((optimizedMonthlyWithdrawal - effectiveMonthlyWithdrawal) * 12)}`
                  }
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Optimal withdrawal rate</div>
                <div className="text-xs font-semibold text-purple-700">
                  {formatPercentage(optimalRate * 100)}
                  <span className="text-xs text-gray-500 ml-1">
                    ({optimalRate <= 0.04 ? "conservative" : optimalRate <= 0.05 ? "balanced" : "aggressive"})
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-purple-200 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">4% rule reference</div>
                <div className="text-xs font-semibold text-purple-700">
                  {formatPercentage(4.0)}
                  <span className="text-xs text-gray-500 ml-1">
                    (traditional safe rate)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Withdrawal safety assessment</div>
                <div className="text-xs font-semibold text-blue-700">
                  {optimalRate <= 0.04 ? 
                    'Very safe, below 4% threshold' : 
                    optimalRate <= 0.05 ? 
                      'Reasonable for this time horizon' : 
                      'Higher than traditional guidelines'
                  }
                </div>
              </div>
            </div>

            <div className="border-t border-purple-200 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">Longevity impact</div>
                <div className="text-xs font-semibold text-purple-700">
                  {yearsGained > 0 ? 
                    `+${Math.round(yearsGained)} years with optimal rate` : 
                    yearsGained < 0 ? 
                      `${Math.round(yearsGained)} years with optimal rate` : 
                      "Already optimal"
                  }
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Capital projection</div>
                <div className="text-xs font-semibold text-purple-700">
                  {optimalRate > 0 ? 
                    `Lasts until age ${targetAge}` : 
                    "Potentially indefinite"
                  }
                  <span className="text-xs text-gray-500 ml-1">
                    ({targetAge - 85 > 0 ? `+${targetAge - 85} years buffer` : "no buffer"})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk assessment and recommendations */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-2.5 border border-purple-100">
          <div className="text-xs space-y-2">
            <div>
              <div className="text-xs font-medium text-purple-800 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Optimal Withdrawal Strategy
              </div>
              <div className="text-gray-600">
                {risk === 'High' ? (
                  <>
                    Your current withdrawal rate of {formatPercentage(currentWithdrawalRate)} is significantly higher than sustainable. Consider these strategies:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Reduce to {formatDisplayValue(optimizedMonthlyWithdrawal)}/month ({formatPercentage(optimalRate * 100)} rate)</li>
                      <li>Use a dynamic withdrawal approach: reduce in down markets, increase in strong markets</li>
                      <li>Consider a "floor and ceiling" strategy with essential vs. discretionary spending</li>
                    </ul>
                  </>
                ) : risk === 'Medium' ? (
                  <>
                    A withdrawal rate of {formatPercentage(optimalRate * 100)} balances spending with longevity. Consider these approaches:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Adjust to {formatDisplayValue(optimizedMonthlyWithdrawal)}/month for optimal sustainability</li>
                      <li>Implement a "bucket strategy" with 2-3 years of expenses in cash/bonds</li>
                      <li>Consider part-time work in early retirement to reduce withdrawal pressure</li>
                    </ul>
                  </>
                ) : (
                  <>
                    Your withdrawal approach is {currentWithdrawalRate < optimalRate * 100 ? "more conservative than needed" : "well-balanced"}. Consider these optimizations:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>{currentWithdrawalRate < optimalRate * 100 ? `You could safely increase to ${formatDisplayValue(optimizedMonthlyWithdrawal)}/month` : `Your current withdrawal is sustainable long-term`}</li>
                      <li>Focus on tax-efficient withdrawal sequencing (taxable → tax-deferred → tax-free)</li>
                      <li>Consider Roth conversions in lower income years to optimize future flexibility</li>
                    </ul>
                  </>
                )}
                
                {inflationAdjustedWithdrawal && withdrawalMode === "amount" && (
                  <div className="mt-1 text-xs text-blue-600">
                    Note: Values shown include estimated inflation adjustment, which increases future purchasing power.
                  </div>
                )}
              </div>
            </div>
            
            <div className="pl-4">
              <ul className="list-disc space-y-1 text-gray-600">
                {risk === 'High' ? (
                  <>
                    <li>Dynamic withdrawal strategy based on market performance</li>
                    <li>Essential vs. discretionary spending separation</li>
                    <li>Phased retirement to supplement income initially</li>
                  </>
                ) : risk === 'Medium' ? (
                  <>
                    <li>Variable withdrawal rates in early retirement years</li>
                    <li>Bucket strategy for different time horizons</li>
                    <li>Strategic withdrawals from different account types</li>
                  </>
                ) : (
                  <>
                    <li>Optimizing tax efficiency of withdrawals</li>
                    <li>Creating flexibility for special expenses</li>
                    <li>Building in buffers for market volatility</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Progress visualization */}
        <div className="mt-3 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">Withdrawal Impact on Retirement Duration</div>
            <div className="text-[10px] text-gray-500">
              Target: Age {retirementStartAge + 30}+
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Current withdrawal */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-600">Current withdrawal plan</span>
                <span className="text-gray-700">
                  {retirementStartAge + 15 < targetAge ? `Capital may be exhausted at age ${retirementStartAge + 15}` : "Sustainable"}
                </span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-400 rounded-full"
                  style={{ 
                    width: `${Math.min(100, ((retirementStartAge + 15 - retirementStartAge) / 30) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* With reduced withdrawals */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-600">With optimized withdrawals</span>
                <span className="text-purple-700">
                  {newExhaustionAge >= targetAge ? `Capital lasts until age ${newExhaustionAge} ✓` : `Capital lasts until age ${newExhaustionAge} (target: ${targetAge})`}
                </span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-400 rounded-full"
                  style={{ 
                    width: `${Math.min(100, ((retirementStartAge + 15 - retirementStartAge) / 30) * 100)}%` 
                  }}
                ></div>
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  style={{ 
                    width: `${Math.min(100, ((newExhaustionAge - retirementStartAge) / 30) * 100)}%`,
                    opacity: '0.8'
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
              <span className="text-gray-600">Current plan</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-1"></div>
              <span className="text-gray-600">Optimized withdrawals</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WithdrawalStrategyCard; 