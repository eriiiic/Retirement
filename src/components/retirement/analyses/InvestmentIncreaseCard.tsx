import React, { useState } from 'react';
import { FormatAmountFunction, Currency, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';

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
  inflation
}) => {
  // Get effective withdrawal amount considering inflation adjustment
  const getEffectiveWithdrawalAmount = () => {
    if (inflationAdjustedWithdrawal && withdrawalMode === "amount" && inflation !== undefined) {
      // Assuming retirement is 25 years away for estimation
      const yearsUntilRetirement = 25;
      
      // Calculate inflation-adjusted withdrawal
      return monthlyRetirementWithdrawal * Math.pow(1 + inflation / 100, yearsUntilRetirement);
    }
    return monthlyRetirementWithdrawal;
  };

  const effectiveMonthlyWithdrawal = getEffectiveWithdrawalAmount();

  const [showRange, setShowRange] = useState(false);
  const [rangeValue, setRangeValue] = useState(investmentIncrease.monthlyIncrease);

  // Helper function to calculate additional years based on capital
  const calculateAdditionalYears = (capital: number, additionalCapital: number) => {
    // Simple estimation - how many additional years the extra capital would last
    const annualWithdrawal = effectiveMonthlyWithdrawal * 12;
    if (annualWithdrawal <= 0) return 0;
    return Math.round(additionalCapital / annualWithdrawal);
  };

  // Calculate additional years of retirement funding this increase provides
  const additionalYears = calculateAdditionalYears(capitalAtRetirement, investmentIncrease.totalBenefit);
  
  // Estimate the yearly capital increase from delaying retirement by one year
  const yearlyCapitalIncrease = monthlyInvestment * 12 * 1.07; // Assuming 7% annual return
  
  // Estimate a default exhaustion age for statistical reference
  const estimatedExhaustionAge = 95; // Default age if not provided
  const statistics = {
    exhaustionAge: estimatedExhaustionAge
  };

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
              <span>Recommended monthly increase</span>
            </div>
            <div className="flex items-baseline mt-1">
              <PositiveMetric className="text-base">
                {formatDisplayValue(monthlyInvestment * (risk === 'High' ? 0.3 : risk === 'Medium' ? 0.15 : 0.1))}/month
              </PositiveMetric>
              <span className="text-xs text-green-700 ml-1">
                ({risk === 'High' ? '30%' : risk === 'Medium' ? '15%' : '10%'} increase)
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
              Current investment
            </div>
            <div className="text-sm font-semibold text-gray-700 mt-1">
              {formatDisplayValue(monthlyInvestment)}/month
            </div>
            <div className="text-[10px] text-gray-500">
              {formatDisplayValue(monthlyInvestment * 12)}/year
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Rate: {formatPercentage((monthlyInvestment * 12 / totalNeededCapital) * 100)}
              <span className={monthlyInvestment * 12 / totalNeededCapital >= 0.1 ? "text-green-600" : "text-yellow-600"}>
                {monthlyInvestment * 12 / totalNeededCapital >= 0.1 ? " (good savings rate)" : " (below recommended)"}
              </span>
            </div>
          </div>
          <div className="bg-green-50 p-2 rounded-lg border border-green-100">
            <div className="text-xs font-medium text-gray-500 flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
              After increase
            </div>
            <div className="text-sm font-semibold text-green-700 mt-1">
              {formatDisplayValue(monthlyInvestment * (1 + (risk === 'High' ? 0.3 : risk === 'Medium' ? 0.15 : 0.1)))}/month
            </div>
            <div className="text-[10px] text-green-700">
              {formatDisplayValue(monthlyInvestment * 12 * (1 + (risk === 'High' ? 0.3 : risk === 'Medium' ? 0.15 : 0.1)))}/year
            </div>
            <div className="text-[10px] text-green-700 mt-1">
              Rate: {formatPercentage((monthlyInvestment * 12 * (1 + (risk === 'High' ? 0.3 : risk === 'Medium' ? 0.15 : 0.1)) / totalNeededCapital) * 100)}
              <span> (improved savings rate)</span>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-2.5 border border-green-100 mb-2.5">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div className="text-xs font-medium text-green-800">Impact Analysis</div>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">Additional contributions until retirement</div>
                <div className="text-xs font-semibold text-green-700">
                  {formatDisplayValue(investmentIncrease.additionalContributions)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Estimated growth on additional contributions</div>
                <div className="text-xs font-semibold text-green-700">
                  {formatDisplayValue(investmentIncrease.estimatedReturns)}
                </div>
              </div>
            </div>

            <div className="border-t border-green-200 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">Total benefit at retirement</div>
                <div className="text-sm font-bold text-green-700">
                  {formatDisplayValue(investmentIncrease.totalBenefit)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">New total retirement capital</div>
                <div className="text-xs font-semibold text-blue-700">
                  {formatDisplayValue(capitalAtRetirement + investmentIncrease.totalBenefit)}
                </div>
              </div>
            </div>

            <div className="border-t border-green-200 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">Safety margin improvement</div>
                <div className="text-xs font-semibold text-green-700">
                  +{Math.round((investmentIncrease.totalBenefit / totalNeededCapital) * 100)}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Additional years of coverage</div>
                <div className="text-xs font-semibold text-green-700">
                  +{additionalYears} years
                </div>
              </div>
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
                Risk Assessment
              </div>
              <div className="text-gray-600">
                {risk === 'High' ? (
                  <>
                    Your current savings rate of {formatPercentage((monthlyInvestment * 12 / totalNeededCapital) * 100)} is significantly below the target. Based on your current plan:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Capital shortfall: {formatDisplayValue(totalNeededCapital - (capitalAtRetirement + investmentIncrease.totalBenefit))} below target</li>
                      <li>Monthly savings gap: Need {formatDisplayValue(monthlyInvestment * 0.3)} additional monthly investment</li>
                      <li>Impact of delay: Each year of delayed retirement adds approximately {formatDisplayValue(yearlyCapitalIncrease)} to your capital</li>
                      <li>Recommended withdrawal adjustment: Reduce from {formatDisplayValue(monthlyRetirementWithdrawal)} to {formatDisplayValue(monthlyRetirementWithdrawal * 0.85)} monthly</li>
                    </ul>
                    <div className="mt-2 text-xs bg-red-50 p-2 rounded border border-red-100">
                      Combined strategy needed:
                      <ul className="mt-1 list-disc pl-4 space-y-1">
                        <li>Immediate: Increase monthly investment by {formatDisplayValue(monthlyInvestment * 0.3)} (30%)</li>
                        <li>Short-term: Optimize portfolio for {formatPercentage(8)} return potential (+{formatDisplayValue(capitalAtRetirement * 0.02)} estimated annual gain)</li>
                        <li>Long-term: Consider {Math.max(2, Math.ceil(safetyMargin / -5))} year retirement delay (+{formatDisplayValue(Math.max(2, Math.ceil(safetyMargin / -5)) * yearlyCapitalIncrease)} total)</li>
                      </ul>
                    </div>
                  </>
                ) : risk === 'Medium' ? (
                  <>
                    Your investment strategy requires moderate adjustments to reach optimal levels:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Current gap: {formatDisplayValue(totalNeededCapital - capitalAtRetirement)} from target ({formatPercentage((1 - capitalAtRetirement / totalNeededCapital) * 100)} shortfall)</li>
                      <li>Recommended increase: {formatDisplayValue(monthlyInvestment * 0.15)} additional monthly investment</li>
                      <li>Portfolio optimization potential: +{formatDisplayValue(capitalAtRetirement * 0.1)} by retirement through improved asset allocation</li>
                      <li>Emergency fund target: {formatDisplayValue(monthlyRetirementWithdrawal * 6)} (6 months of expenses)</li>
                    </ul>
                    <div className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-100">
                      Balanced approach recommended:
                      <ul className="mt-1 list-disc pl-4 space-y-1">
                        <li>Near-term: Build emergency fund of {formatDisplayValue(monthlyRetirementWithdrawal * 6)}</li>
                        <li>Mid-term: Increase monthly investment to {formatDisplayValue(monthlyInvestment * 1.15)}</li>
                        <li>Long-term: Optional 1-year delay adds {formatDisplayValue(yearlyCapitalIncrease)} to retirement fund</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    Your plan is well-positioned with {formatPercentage((capitalAtRetirement / totalNeededCapital) * 100)} of required capital secured:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Current surplus: {formatDisplayValue(capitalAtRetirement - totalNeededCapital)} above target</li>
                      <li>Safety buffer: {formatDisplayValue(investmentIncrease.totalBenefit)} additional with recommended increase</li>
                      <li>Withdrawal flexibility: Can increase to {formatDisplayValue(monthlyRetirementWithdrawal * 1.1)} monthly</li>
                      <li>Extended coverage: {additionalYears} extra years beyond age {statistics.exhaustionAge || 95}</li>
                    </ul>
                    <div className="mt-2 text-xs bg-green-50 p-2 rounded border border-green-100">
                      Optional enhancements:
                      <ul className="mt-1 list-disc pl-4 space-y-1">
                        <li>Lifestyle buffer: {formatDisplayValue(investmentIncrease.totalBenefit * 0.2)} available for discretionary spending</li>
                        <li>Healthcare reserve: Consider setting aside {formatDisplayValue(totalNeededCapital * 0.1)} for medical expenses</li>
                        <li>Legacy planning: {formatDisplayValue(capitalAtRetirement * 0.15)} potential inheritance fund</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress visualization */}
        <div className="mt-3 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600">Progress Toward Financial Security</div>
            <div className="text-[10px] text-gray-500">
              Target: {formatDisplayValue(totalNeededCapital)}
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Current position */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-600">Current position</span>
                <span className="text-gray-700">{formatDisplayValue(capitalAtRetirement)} ({Math.round((capitalAtRetirement / totalNeededCapital) * 100)}%)</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-400 rounded-full"
                  style={{ width: `${Math.min(100, (capitalAtRetirement / totalNeededCapital) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* With increased investments */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-gray-600">With increased investments</span>
                <span className="text-green-700">
                  {formatDisplayValue(capitalAtRetirement + investmentIncrease.totalBenefit)} 
                  ({Math.round(((capitalAtRetirement + investmentIncrease.totalBenefit) / totalNeededCapital) * 100)}%)
                </span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-400 rounded-full"
                  style={{ width: `${Math.min(100, (capitalAtRetirement / totalNeededCapital) * 100)}%` }}
                ></div>
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ 
                    width: `${Math.min(100, ((capitalAtRetirement + investmentIncrease.totalBenefit) / totalNeededCapital) * 100)}%`,
                    opacity: '0.8'
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
              <span className="text-gray-600">Current capital</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-1"></div>
              <span className="text-gray-600">With increased investments</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InvestmentIncreaseCard; 