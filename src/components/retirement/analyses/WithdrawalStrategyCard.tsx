import React, { useState, useRef, useCallback, useMemo } from 'react';
import { FormatAmountFunction, WithdrawalMode, Currency } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';
import { Metric } from '../../common/Metric';
import {
  calculateYearsUntilExhaustion,
  calculateOptimalWithdrawalRate,
  calculateExhaustionAge,
  calculateEffectiveWithdrawalAmount,
  calculateWithdrawalReduction,
  calculateIdealWithdrawal
} from '../../../utils/financialCalculations';
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
  withdrawalReduction?: {
    optimalRate: number;
    optimalMonthlyWithdrawal: number;
    reductionAmount: number;
    reductionPercentage: number;
    reductionNeeded: boolean;
  };
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
  currentAge,
  withdrawalReduction,
  riskAssessment
}) => {
  const { darkMode } = useTheme();

  // Calculate years until retirement
  const yearsUntilRetirement = retirementStartAge - currentAge;

  // Use centralized function for effective withdrawal amount
  const effectiveMonthlyWithdrawal = calculateEffectiveWithdrawalAmount(
    monthlyRetirementWithdrawal,
    inflationAdjustedWithdrawal,
    withdrawalMode,
    inflation,
    yearsUntilRetirement
  );

  // Calculate current withdrawal details using the effective monthly withdrawal
  const currentAnnualWithdrawal = effectiveMonthlyWithdrawal * 12;
  const currentWithdrawalRate = (currentAnnualWithdrawal / capitalAtRetirement) * 100;

  // Define target age
  const targetAge = 95;

  // Use either the provided withdrawal reduction data or calculate it if not provided
  const withdrawalReductionData = useMemo(() => {
    return withdrawalReduction || calculateWithdrawalReduction(
      capitalAtRetirement,
      effectiveMonthlyWithdrawal,
      annualReturnRate,
      retirementStartAge,
      targetAge,
      0.7 // Conservative multiplier
    );
  }, [
    withdrawalReduction,
    capitalAtRetirement,
    effectiveMonthlyWithdrawal,
    annualReturnRate,
    retirementStartAge,
    targetAge
  ]);

  // Extract values from the withdrawal reduction data
  const optimalRate = withdrawalReductionData.optimalRate;
  const optimizedMonthlyWithdrawal = withdrawalReductionData.optimalMonthlyWithdrawal;
  const reductionNeeded = withdrawalReductionData.reductionNeeded;
  const reductionPercent = withdrawalReductionData.reductionPercentage;

  // Use centralized function to calculate exhaustion age with default inflation if not provided
  const inflationRate = inflation ?? 2; // Default to 2% if inflation is undefined

  // Calculate exhaustion ages using the centralized function
  const currentExhaustionAge = useMemo(() => {
    return calculateExhaustionAge(
      capitalAtRetirement,
      effectiveMonthlyWithdrawal,
      annualReturnRate,
      inflationRate,
      retirementStartAge,
      0.7 // Conservative multiplier
    );
  }, [capitalAtRetirement, effectiveMonthlyWithdrawal, annualReturnRate, inflationRate, retirementStartAge]);

  const newExhaustionAge = useMemo(() => {
    return calculateExhaustionAge(
      capitalAtRetirement,
      optimizedMonthlyWithdrawal,
      annualReturnRate,
      inflationRate,
      retirementStartAge,
      0.7 // Conservative multiplier
    );
  }, [capitalAtRetirement, optimizedMonthlyWithdrawal, annualReturnRate, inflationRate, retirementStartAge]);

  const yearsGained = newExhaustionAge - currentExhaustionAge;

  // Use centralized function for ideal withdrawal based on 4% rule
  const idealWithdrawalData = useMemo(() => {
    return calculateIdealWithdrawal(capitalAtRetirement);
  }, [capitalAtRetirement]);

  // Extract values from ideal withdrawal data
  const idealMonthlyWithdrawal = idealWithdrawalData.monthlyWithdrawal;
  const idealAnnualWithdrawal = idealWithdrawalData.annualWithdrawal;
  const idealRate = idealWithdrawalData.withdrawalRate;

  // Calculate ideal withdrawal exhaustion age using the centralized function
  const idealExhaustionAge = useMemo(() => {
    return calculateExhaustionAge(
      capitalAtRetirement,
      idealMonthlyWithdrawal,
      annualReturnRate,
      inflationRate,
      retirementStartAge,
      0.7 // Conservative multiplier
    );
  }, [capitalAtRetirement, idealMonthlyWithdrawal, annualReturnRate, inflationRate, retirementStartAge]);

  // Define safe withdrawal threshold from the 4% rule
  const safeWithdrawalThreshold = 4; // 4% rule

  // Map legacy risk levels to new standardized levels
  const mapRiskLevel = (legacyRisk: 'High' | 'Medium' | 'Low'): 'Critical' | 'High' | 'Significant' | 'Moderate' | 'Low' => {
    switch (legacyRisk) {
      case 'High':
        return 'Critical';
      case 'Medium':
        return 'Significant';
      case 'Low':
        return 'Low';
    }
  };

  // Get risk level from assessment or map from legacy
  const effectiveRiskLevel = riskAssessment?.riskLevel || mapRiskLevel(risk);

  // Get risk color classes based on standardized risk level
  const getRiskColorClasses = (level: string, isDark: boolean = false) => {
    switch (level) {
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

  // Get priority label based on risk level
  const getPriorityLabel = (level: string): string => {
    switch (level) {
      case 'Critical':
      case 'High':
        return 'Critical';
      case 'Significant':
      case 'Moderate':
        return 'Recommended';
      case 'Low':
        return 'Optional';
      default:
        return 'Review';
    }
  };

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
          )}>Withdrawal Strategy</h3>
        </div>
        <div className={cx(
          "text-xs font-medium px-1.5 py-0.5 rounded-full",
          getRiskColorClasses(effectiveRiskLevel, darkMode)
        )}>
          {getPriorityLabel(effectiveRiskLevel)}
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
              {formatDisplayValue(currentAnnualWithdrawal)}/year
            </div>
            <div className={cx(
              "text-[10px] mt-1",
              darkMode ? "text-gray-400" : "text-gray-700"
            )}>
              Rate: {formatPercentage(currentWithdrawalRate)}
              <span className={currentWithdrawalRate <= safeWithdrawalThreshold
                ? darkMode ? "text-green-400" : "text-green-600"
                : darkMode ? "text-red-400" : "text-red-600"
              }>
                ({currentWithdrawalRate <= safeWithdrawalThreshold ? `within safe ${safeWithdrawalThreshold}%` : `exceeds ${safeWithdrawalThreshold}%`})
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
              Rate: {formatPercentage(idealRate * 100)} (standard safe rate)
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
              )}>Retirement Fund Longevity</div>
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
              {Math.max(newExhaustionAge, idealExhaustionAge) < targetAge && (
                <div
                  className={cx(
                    "absolute h-full right-0",
                    darkMode ? "bg-red-900/60" : "bg-red-200"
                  )}
                  style={{
                    width: `${Math.min(100, ((targetAge - Math.max(newExhaustionAge, idealExhaustionAge)) / targetAge) * 100)}%`
                  }}
                ></div>
              )}

              {/* Blue section for current plan */}
              <div
                className={cx(
                  "absolute h-full left-0",
                  darkMode ? "bg-blue-800" : "bg-blue-400"
                )}
                style={{ width: `${Math.min(100, (currentExhaustionAge / targetAge) * 100)}%` }}
              ></div>

              {/* Green section for recommended plan (additional years) */}
              {newExhaustionAge > currentExhaustionAge && (
                <div
                  className={cx(
                    "absolute h-full opacity-80",
                    darkMode ? "bg-green-700" : "bg-green-500"
                  )}
                  style={{
                    left: `${Math.min(100, (currentExhaustionAge / targetAge) * 100)}%`,
                    width: `${Math.min(100, ((newExhaustionAge - currentExhaustionAge) / targetAge) * 100)}%`
                  }}
                ></div>
              )}

              {/* Purple section for ideal plan (additional years beyond recommended) */}
              {idealExhaustionAge > newExhaustionAge && (
                <div
                  className={cx(
                    "absolute h-full opacity-80",
                    darkMode ? "bg-purple-700" : "bg-purple-500"
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
                  darkMode ? "bg-red-500 border-red-500" : "bg-red-500 border-red-500"
                )}
                style={{ left: `${Math.min(100, (targetAge / targetAge) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className={cx(
            "grid grid-cols-3 gap-2 text-[10px]",
            darkMode ? "text-gray-300" : ""
          )}>
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-red-600" : "bg-red-400"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Current</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>{currentExhaustionAge} years</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-purple-600" : "bg-purple-400"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Optimal</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>{newExhaustionAge} years</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center mb-1">
                <div className={cx(
                  "w-2 h-2 rounded-full mr-1",
                  darkMode ? "bg-green-600" : "bg-green-400"
                )}></div>
                <span className={cx(
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Ideal ({safeWithdrawalThreshold}%)</span>
              </div>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-gray-200" : "text-gray-700"
              )}>{idealExhaustionAge} years</span>
            </div>
          </div>
        </div>

        <div className={cx(
          "rounded-lg p-2.5 border",
          darkMode
            ? getRiskColorClasses(effectiveRiskLevel, true)
            : getRiskColorClasses(effectiveRiskLevel, false)
        )}>
          <div className="text-xs space-y-2">
            <div>
              <div className={cx(
                "text-xs font-medium mb-1 flex items-center",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Optimal Withdrawal Strategy
              </div>
              <div className={cx("text-gray-600", darkMode && "text-gray-400")}>
                {effectiveRiskLevel === 'Critical' ? (
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
                ) : effectiveRiskLevel === 'High' ? (
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
                ) : effectiveRiskLevel === 'Significant' ? (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-yellow-400" : "text-yellow-600"
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
                ) : effectiveRiskLevel === 'Moderate' ? (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-yellow-400" : "text-yellow-600"
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
                      <li><span className="font-medium">Continue with your sustainable</span> <span className={cx(
                        "font-semibold",
                        darkMode ? "text-green-400" : "text-green-600"
                      )}>{formatPercentage(currentWithdrawalRate)}</span> withdrawal rate</li>
                      <li><span className="font-medium">Alternative option:</span> {currentWithdrawalRate < optimalRate * 100
                        ? <>Increase to <span className="font-semibold">{formatDisplayValue(optimizedMonthlyWithdrawal)}/month</span> for more enjoyment</>
                        : <>Continue your current <span className="font-semibold">{formatDisplayValue(effectiveMonthlyWithdrawal)}/month</span> approach</>
                      }</li>
                      <li><span className="font-medium">Consider charitable giving:</span> Your surplus retirement funds could benefit others</li>
                    </ul>
                  </>
                )}
              </div>
            </div>

            <div className={cx(
              "border-t pt-2",
              darkMode ? "border-red-700" : "border-green-700"
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
                )}>Sustainable Withdrawal Summary</div>
              </div>
              <div className={cx(
                "grid grid-cols-2 gap-x-4 gap-y-1.5",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <div className={cx(
                  "text-xs",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Safe standard rate ({safeWithdrawalThreshold}%)</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  {formatDisplayValue(idealMonthlyWithdrawal)}/month
                </div>

                <div className={cx(
                  "text-xs",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Optimal for your situation</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  {formatDisplayValue(optimizedMonthlyWithdrawal)}/month
                </div>

                <div className={cx(
                  "text-xs",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Rate difference</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  {formatPercentage(idealRate * 100)} vs {formatPercentage(optimalRate * 100)}
                </div>

                <div className={cx(
                  "text-xs",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>Years gained</div>
                <div className={cx(
                  "text-xs font-semibold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  +{Math.round(yearsGained)}
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