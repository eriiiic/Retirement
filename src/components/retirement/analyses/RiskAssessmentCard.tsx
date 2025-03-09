import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FormatAmountFunction, Currency, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card } from '../../common/StyledComponents';
import { Metric } from '../../common/Metric';
import { validateNumber, validatePercentage, formatPercentage as baseFormatPercentage } from '../../../utils/formatters';
import { 
  calculateYearsUntilExhaustion, 
  calculateOptimalWithdrawalRate, 
  calculateEffectiveWithdrawalAmount,
  calculateWithdrawalReduction,
  calculateIdealWithdrawal,
  calculateExhaustionAge
} from '../../../utils/financialCalculations';
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
    currentAge: number;
  };
  formatDisplayValue: (value: number) => string;
  riskAssessment?: {
    riskLevel: 'Low' | 'Moderate' | 'Significant' | 'High' | 'Critical';
    riskScore: number;
    factors: {
      capitalRatio: number;
      withdrawalRiskFactor: number;
      longevityRiskFactor: number;
      investmentShortfallFactor: number;
      volatilityRiskFactor: number;
    };
    description: string;
    recommendationPriority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical';
    primaryRecommendation: string;
    secondaryRecommendations: string[];
  };
}

// Use a consistent percentage formatter with 1 decimal place
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Map legacy risk levels to new standardized levels
const mapRiskLevel = (legacyRisk: 'High' | 'Medium' | 'Low'): 'Critical' | 'High' | 'Significant' | 'Moderate' | 'Low' => {
  switch(legacyRisk) {
    case 'High':
      return 'Critical';
    case 'Medium':
      return 'Significant';
    case 'Low':
      return 'Low';
  }
};

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  risk,
  safetyMargin,
  withdrawalRate,
  statistics,
  params,
  formatDisplayValue,
  riskAssessment
}) => {
  const { darkMode } = useTheme();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Get enhanced risk description from riskAssessment if available
  const riskDescription = riskAssessment?.description || (
    risk === 'High' 
      ? "Your retirement plan has significant risks that require attention."
      : risk === 'Medium' 
        ? "Your retirement plan has some risks but is generally on track."
        : "Your retirement plan is on solid ground with minimal risk."
  );

  // Get priority recommendation if available
  const primaryRecommendation = riskAssessment?.primaryRecommendation;

  // Determine if capital is sufficient
  const capitalSufficiency = statistics.capitalAtRetirement / statistics.totalNeededCapital;
  const capitalGap = statistics.totalNeededCapital - statistics.capitalAtRetirement;
  const isCapitalSufficient = capitalSufficiency >= 1;

  // Handle tooltip display
  const handleMouseEnter = (metricType: string, e: React.MouseEvent) => {
    setShowTooltip(metricType);
    setTooltipPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseLeave = () => {
    setShowTooltip(null);
  };

  // Validate inputs
  const validSafetyMargin = validateNumber(safetyMargin);
  const validWithdrawalRate = validatePercentage(withdrawalRate.current);
  const validSafeRate = validatePercentage(withdrawalRate.safe);
  const validCapitalRatio = validatePercentage((statistics.capitalAtRetirement / statistics.totalNeededCapital) * 100);

  // Calculate years until retirement based on safety margin
  const retirementStartAge = statistics.exhaustionAge - validSafetyMargin;
  const yearsUntilRetirement = Math.max(0, retirementStartAge - params.currentAge);
  
  // Use centralized function for effective withdrawal amount
  const effectiveMonthlyWithdrawal = useMemo(() => {
    return calculateEffectiveWithdrawalAmount(
      params.monthlyRetirementWithdrawal,
      params.inflationAdjustedWithdrawal,
      params.withdrawalMode,
      params.inflation,
      yearsUntilRetirement
    );
  }, [params.monthlyRetirementWithdrawal, params.inflationAdjustedWithdrawal, params.withdrawalMode, params.inflation, yearsUntilRetirement]);

  // Define target age for retirement planning
  const targetAge = 95;
  
  // Use centralized function for ideal withdrawal based on 4% rule
  const idealWithdrawalData = useMemo(() => {
    return calculateIdealWithdrawal(statistics.capitalAtRetirement);
  }, [statistics.capitalAtRetirement]);
  
  // Extract values from ideal withdrawal data
  const recommendedMonthlyWithdrawal = idealWithdrawalData.monthlyWithdrawal;
  const annualSafeWithdrawal = idealWithdrawalData.annualWithdrawal;
  const safeWithdrawalRate = idealWithdrawalData.withdrawalRate * 100; // Convert from decimal to percentage
  
  // Calculate the adjustment needed based on safe withdrawal rate
  const currentAnnualWithdrawal = effectiveMonthlyWithdrawal * 12;
  const adjustmentNeeded = currentAnnualWithdrawal - annualSafeWithdrawal;
  const adjustmentPercentage = (adjustmentNeeded / currentAnnualWithdrawal) * 100;
  
  // Use the centralized function to calculate withdrawal reduction
  const withdrawalReductionData = useMemo(() => {
    return calculateWithdrawalReduction(
      statistics.capitalAtRetirement,
      effectiveMonthlyWithdrawal,
      7, // Assuming 7% return for calculation
      retirementStartAge,
      targetAge,
      0.7 // Conservative multiplier
    );
  }, [statistics.capitalAtRetirement, effectiveMonthlyWithdrawal, retirementStartAge, targetAge]);
  
  // Extract values from withdrawal reduction data
  const optimalRate = withdrawalReductionData.optimalRate;
  const optimalMonthlyWithdrawal = withdrawalReductionData.optimalMonthlyWithdrawal;
  const reductionNeeded = withdrawalReductionData.reductionNeeded;
  const reductionPercent = withdrawalReductionData.reductionPercentage;
  
  // Compare with safe withdrawal rate
  const isSaferThan4Percent = optimalRate <= 0.04;
  const finalRecommendedWithdrawal = isSaferThan4Percent ? recommendedMonthlyWithdrawal : optimalMonthlyWithdrawal;
  
  // Calculate exhaustion age with optimal withdrawal
  const newExhaustionAge = useMemo(() => {
    return calculateExhaustionAge(
      statistics.capitalAtRetirement,
      optimalMonthlyWithdrawal,
      7, // Assuming 7% return for calculation
      params.inflation || 2,
      retirementStartAge,
      0.7 // Conservative multiplier
    );
  }, [statistics.capitalAtRetirement, optimalMonthlyWithdrawal, params.inflation, retirementStartAge]);

  // Calculate capital gap
  const gapPercentage = (capitalGap / statistics.totalNeededCapital) * 100;
  
  // Calculate years until exhaustion with current withdrawal
  const yearsUntilExhaustion = useMemo(() => {
    return calculateYearsUntilExhaustion(
      statistics.capitalAtRetirement,
      effectiveMonthlyWithdrawal * 12,
      7 * 0.7, // Conservative return estimate
      1,
      100
    );
  }, [statistics.capitalAtRetirement, effectiveMonthlyWithdrawal]);

  // Get years in retirement
  const yearsInRetirement = statistics.isCapitalExhausted 
    ? statistics.exhaustionAge - params.currentAge 
    : 30; // Default to 30 years if capital not exhausted

  // Get risk level from assessment or map from legacy
  const effectiveRiskLevel = riskAssessment?.riskLevel || mapRiskLevel(risk);

  // Get risk color classes based on standardized risk level
  const getRiskColorClasses = (level: string, isDark: boolean = false) => {
    switch(level) {
      case 'Critical':
        return isDark ? "bg-red-900/50 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-700";
      case 'High':
        return isDark ? "bg-red-900/40 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-700";
      case 'Significant':
        return isDark ? "bg-yellow-900/50 border-yellow-700 text-yellow-300" : "bg-yellow-50 border-yellow-200 text-yellow-700";
      case 'Moderate':
        return isDark ? "bg-yellow-900/40 border-yellow-700 text-yellow-300" : "bg-yellow-50 border-yellow-200 text-yellow-700";
      case 'Low':
        return isDark ? "bg-green-900/50 border-green-700 text-green-300" : "bg-green-50 border-green-200 text-green-700";
      default:
        return isDark ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  // Tooltip content for each metric
  const getTooltipContent = (metricType: string) => {
    switch (metricType) {
      case 'capital-sufficiency':
        return (
          <div>
            <p className="font-semibold mb-1">Capital Sufficiency</p>
            <p className="text-sm">This shows whether your projected retirement capital will be sufficient for your needs.</p>
            <p className="text-sm mt-1">Your projected capital: {formatDisplayValue(statistics.capitalAtRetirement)}</p>
            <p className="text-sm">Required capital: {formatDisplayValue(statistics.totalNeededCapital)}</p>
            {!isCapitalSufficient && (
              <p className="text-sm mt-1">Shortfall: {formatDisplayValue(capitalGap)}</p>
            )}
          </div>
        );
      case 'withdrawal-rate':
        return (
          <div>
            <p className="font-semibold mb-1">Withdrawal Rate</p>
            <p className="text-sm">Your withdrawal rate is the percentage of your retirement capital you'll withdraw annually.</p>
            <p className="text-sm mt-1">Your rate: {formatPercentage(withdrawalRate.current)}</p>
            <p className="text-sm">Safe rate: {formatPercentage(withdrawalRate.safe)}</p>
            <p className="text-sm mt-1">The "4% rule" suggests withdrawing no more than 4% of your retirement savings annually to sustain your portfolio.</p>
          </div>
        );
      case 'exhaustion-age':
        return (
          <div>
            <p className="font-semibold mb-1">Fund Exhaustion</p>
            <p className="text-sm">This is the estimated age when your retirement savings may be depleted.</p>
            {statistics.isCapitalExhausted ? (
              <p className="text-sm mt-1">Your funds are projected to last until age {statistics.exhaustionAge}.</p>
            ) : (
              <p className="text-sm mt-1">Your funds are projected to last throughout your retirement.</p>
            )}
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
            ? getRiskColorClasses(effectiveRiskLevel, true)
            : getRiskColorClasses(effectiveRiskLevel)
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
            {riskAssessment?.riskLevel || risk} Risk
          </div>
        </div>
        <div className="p-2 sm:p-3">
          <div className={cx(
            "p-2.5 rounded-lg border mb-2.5 text-sm",
            darkMode 
              ? risk === 'Low' ? "bg-green-900/40 border-green-700" : "bg-red-900/40 border-red-700" 
              : risk === 'Low' ? "bg-green-100/70 border-green-200" : "bg-red-100/70 border-red-200"
          )}>
            {riskDescription}
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div 
              className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              onMouseEnter={(e) => handleMouseEnter('capital-sufficiency', e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Capital</p>
                <div className={`w-2 h-2 rounded-full ${isCapitalSufficient ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatPercentage(capitalSufficiency * 100)}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {isCapitalSufficient ? 'Sufficient' : 'Insufficient'}
              </p>
            </div>
            
            <div 
              className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              onMouseEnter={(e) => handleMouseEnter('withdrawal-rate', e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Withdrawal</p>
                <div className={`w-2 h-2 rounded-full ${withdrawalRate.isSafe ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              </div>
              <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatPercentage(withdrawalRate.current)}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {withdrawalRate.isSafe ? 'Safe Rate' : `4% Rule: ${formatPercentage(withdrawalRate.safe)}`}
              </p>
            </div>
            
            <div 
              className={`p-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              onMouseEnter={(e) => handleMouseEnter('exhaustion-age', e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Lasts Until</p>
                <div className={`w-2 h-2 rounded-full ${!statistics.isCapitalExhausted ? 'bg-green-500' : statistics.exhaustionAge >= params.currentAge + 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              </div>
              <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {statistics.isCapitalExhausted ? `Age ${statistics.exhaustionAge}` : 'Lifetime'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {statistics.isCapitalExhausted 
                  ? `${yearsInRetirement} years of retirement` 
                  : 'No depletion predicted'}
              </p>
            </div>
          </div>
          
          {/* Enhanced Risk Metrics (if available) */}
          {riskAssessment && (
            <div className="mt-3 space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Risk Score</p>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                  <div 
                    className={`h-2 rounded-full ${
                      riskAssessment.riskScore < 2 ? "bg-green-500 dark:bg-green-600" :
                      riskAssessment.riskScore < 4 ? "bg-blue-500 dark:bg-blue-600" :
                      riskAssessment.riskScore < 6 ? "bg-yellow-500 dark:bg-yellow-600" :
                      riskAssessment.riskScore < 8 ? "bg-orange-500 dark:bg-orange-600" :
                      "bg-red-500 dark:bg-red-600"
                    }`} 
                    style={{ width: `${Math.min(riskAssessment.riskScore * 10, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Lower Risk</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{riskAssessment.riskScore.toFixed(1)}/10</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Higher Risk</span>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-1 mt-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Key Risk Factors</p>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Capital Adequacy</span>
                      <span>{(riskAssessment.factors.capitalRatio * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`h-1.5 rounded-full ${
                          riskAssessment.factors.capitalRatio >= 1 ? "bg-green-500 dark:bg-green-600" : "bg-orange-500 dark:bg-orange-600"
                        }`} 
                        style={{ width: `${Math.min(riskAssessment.factors.capitalRatio * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Withdrawal Safety</span>
                      <span>{(riskAssessment.factors.withdrawalRiskFactor * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`h-1.5 rounded-full ${
                          riskAssessment.factors.withdrawalRiskFactor <= 1 ? "bg-green-500 dark:bg-green-600" : "bg-red-500 dark:bg-red-600"
                        }`} 
                        style={{ width: `${Math.min(riskAssessment.factors.withdrawalRiskFactor * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Primary Recommendation */}
          {primaryRecommendation && (
            <div className={`mt-4 p-3 rounded border ${
              risk === 'High' 
                ? darkMode ? "bg-red-900/20 border-red-800/30" : "bg-red-50 border-red-200"
                : risk === 'Medium' 
                  ? darkMode ? "bg-yellow-900/20 border-yellow-800/30" : "bg-yellow-50 border-yellow-200"
                  : darkMode ? "bg-green-900/20 border-green-800/30" : "bg-green-50 border-green-200"
            }`}>
              <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Primary Recommendation
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {primaryRecommendation}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Portal for tooltips - positioned fixed relative to viewport */}
      {showTooltip && (
        <div
          className="fixed shadow-xl"
          style={{
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y - 100}px`,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {getTooltipContent(showTooltip)}
        </div>
      )}
    </>
  );
};

export default RiskAssessmentCard; 