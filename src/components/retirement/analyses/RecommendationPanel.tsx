import React, { useState, useMemo } from 'react';
import { FormatAmountFunction, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card } from '../../common/StyledComponents';
import {
  calculateDelayedScenario,
  calculateOptimalDelayYears,
  calculateSuggestedWithdrawal
} from '../../../utils/financialCalculations';
import { useTheme } from '../../../context/ThemeContext';
import Modal from '../../common/Modal';

// Helper function for consistent percentage formatting with 1 decimal place
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

interface Recommendation {
  change: string;
  impact: string;
  impact_detail?: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  withdrawalRate: {
    current: number;
    safe: number;
    isSafe: boolean;
  };
  capitalAtRetirement: number;
  totalNeededCapital: number;
  monthlyRetirementWithdrawal: number;
  annualReturnRate: number;
  formatDisplayValue: (value: number) => string;
  params: {
    initialCapital: number;
    monthlyInvestment: number;
    withdrawalMode: string;
    maxAge: number;
    inflation: number;
  };
  statistics: {
    calculatedRetirementStartYear: number;
    exhaustionAge?: number;
  };
  currentAge: number;
  risk: 'High' | 'Medium' | 'Low';
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

// Update Modal component to match RiskAssessmentCard tooltip style
const RecommendationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation;
  position: { x: number; y: number };
}> = ({ isOpen, onClose, recommendation, position }) => {
  if (!isOpen) return null;
  const { darkMode } = useTheme();

  return (
    <div
      className="fixed shadow-xl z-50 pointer-events-auto"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 100}px`
      }}
    >
      <div className={cx(
        "p-3 rounded-lg shadow-lg border w-64",
        darkMode
          ? "bg-gray-800 border-indigo-700 text-gray-200"
          : "bg-white border-indigo-200"
      )}>
        <h3 className={cx(
          "font-semibold mb-1",
          darkMode ? "text-gray-100" : "text-gray-800"
        )}>{recommendation.change}</h3>
        <p className={cx(
          "text-xs",
          darkMode ? "text-gray-300" : "text-gray-700"
        )}>{recommendation.impact}</p>
        {recommendation.impact_detail && (
          <p className={cx(
            "text-xs mt-1 italic",
            darkMode ? "text-indigo-400" : "text-indigo-700"
          )}>{recommendation.impact_detail}</p>
        )}
        <div className={cx(
          "mt-2 border-t pt-2",
          darkMode ? "border-indigo-700" : "border-indigo-100"
        )}>
          <div className={cx(
            "text-xs font-medium mb-1",
            darkMode ? "text-indigo-400" : "text-indigo-800"
          )}>Implementation Steps:</div>
          <ul className={cx(
            "text-xs space-y-1",
            darkMode ? "text-gray-300" : "text-gray-700"
          )}>
            {getImplementationSteps(recommendation).map((step, index) => (
              <li key={index} className="flex items-start">
                <span className={cx(
                  "mr-1.5",
                  darkMode ? "text-indigo-400" : "text-indigo-500"
                )}>•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Add helper function for implementation steps
const getImplementationSteps = (recommendation: Recommendation): string[] => {
  if (recommendation.change.toLowerCase().includes('withdraw')) {
    return [
      'Calculate new sustainable withdrawal amount',
      'Adjust monthly budget to accommodate changes',
      'Review and optimize expense categories',
      'Consider part-time work to supplement income'
    ];
  } else if (recommendation.change.toLowerCase().includes('delay')) {
    return [
      'Review current employment situation',
      'Explore part-time or consulting opportunities',
      'Adjust retirement date in financial plans',
      'Update investment strategy for extended timeline'
    ];
  } else {
    return [
      'Review current strategy implementation',
      'Set specific milestones and deadlines',
      'Monitor progress regularly',
      'Adjust approach based on results'
    ];
  }
};

// Update RecommendationItem component
const RecommendationItem = React.memo(({
  recommendation,
  index
}: {
  recommendation: Recommendation;
  index: number
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const { change, impact, impact_detail, priority } = recommendation;
  const { darkMode } = useTheme();

  // More descriptive labels for the priority
  const priorityLabel = priority === 'High'
    ? 'Critical'
    : priority === 'Medium'
      ? 'Recommended'
      : 'Beneficial';

  // More specific tooltip text for each priority level  
  const priorityDescription = priority === 'High'
    ? 'Critical action for financial security'
    : priority === 'Medium'
      ? 'Recommended for improved security'
      : 'Beneficial for long-term growth';

  // Function to determine which icon to show
  const getIcon = () => {
    if (change.toLowerCase().includes('withdraw')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    } else if (priority === 'High') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    } else if (priority === 'Medium') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  // Handle mouse enter with position
  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsModalOpen(true);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        className={cx(
          "flex items-center p-2 sm:p-2.5 rounded-lg border group transition-all duration-200 cursor-help",
          darkMode ? (
            priority === 'High' ? "border-red-700 bg-red-900/30 hover:bg-red-900/50" :
              priority === 'Medium' ? "border-yellow-700 bg-yellow-900/30 hover:bg-yellow-900/50" :
                "border-indigo-700 bg-indigo-900/30 hover:bg-indigo-900/50"
          ) : (
            priority === 'High' ? "border-red-200 bg-red-50/50 hover:bg-red-100/70" :
              priority === 'Medium' ? "border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100/70" :
                "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70"
          )
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={cx(
          "w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0",
          darkMode ? (
            priority === 'High' ? "bg-red-800 text-red-300" :
              priority === 'Medium' ? "bg-yellow-800 text-yellow-300" :
                "bg-indigo-800 text-indigo-300"
          ) : (
            priority === 'High' ? "bg-red-200 text-red-700" :
              priority === 'Medium' ? "bg-yellow-200 text-yellow-700" :
                "bg-indigo-200 text-indigo-700"
          )
        )}>
          {getIcon()}
        </div>
        <div className="flex-grow min-w-0">
          <div className={cx(
            "text-xs sm:text-sm font-medium truncate",
            darkMode ? "text-gray-200" : "text-gray-800"
          )}>{change}</div>
          <div className={cx(
            "text-xs truncate",
            darkMode ? "text-gray-400" : "text-gray-700"
          )}>{impact}</div>
          {impact_detail && (
            <div className={cx(
              "text-[10px] sm:text-xs italic mt-0.5 truncate",
              darkMode ? "text-indigo-400" : "text-indigo-700"
            )}>{impact_detail}</div>
          )}
        </div>
        <div className={cx(
          "ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap",
          darkMode ? (
            priority === 'High' ? "bg-red-900 text-red-300" :
              priority === 'Medium' ? "bg-yellow-900 text-yellow-300" :
                "bg-indigo-900 text-indigo-300"
          ) : (
            priority === 'High' ? "bg-red-100 text-red-700" :
              priority === 'Medium' ? "bg-yellow-100 text-yellow-700" :
                "bg-indigo-100 text-indigo-700"
          )
        )}>
          {priorityLabel}
        </div>
      </div>

      <RecommendationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={recommendation}
        position={tooltipPosition}
      />
    </>
  );
});

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  withdrawalRate,
  capitalAtRetirement,
  totalNeededCapital,
  monthlyRetirementWithdrawal,
  annualReturnRate,
  formatDisplayValue,
  params,
  statistics,
  currentAge,
  risk,
  riskAssessment
}) => {
  const { darkMode } = useTheme();

  // Use centralized function for optimal delay years calculation
  const optimalDelayYears = useMemo(() => {
    return calculateOptimalDelayYears(
      params.initialCapital,
      params.monthlyInvestment,
      monthlyRetirementWithdrawal,
      statistics.calculatedRetirementStartYear,
      annualReturnRate,
      params.inflation,
      currentAge,
      new Date().getFullYear(),
      params.withdrawalMode,
      params.maxAge,
      risk
    );
  }, [
    params.initialCapital,
    params.monthlyInvestment,
    monthlyRetirementWithdrawal,
    statistics.calculatedRetirementStartYear,
    annualReturnRate,
    params.inflation,
    currentAge,
    params.withdrawalMode,
    params.maxAge,
    risk
  ]);

  // Use centralized function for suggested withdrawal calculation
  const withdrawalSuggestion = useMemo(() => {
    return calculateSuggestedWithdrawal(
      monthlyRetirementWithdrawal,
      withdrawalRate.current,
      withdrawalRate.safe
    );
  }, [monthlyRetirementWithdrawal, withdrawalRate.current, withdrawalRate.safe]);

  const suggestedWithdrawalRate = withdrawalSuggestion.suggestedWithdrawalRate;
  const suggestedMonthlyWithdrawal = withdrawalSuggestion.suggestedMonthlyWithdrawal;

  // Check if withdrawal rate is high (greater than 6%)
  const isWithdrawalRateSafe = withdrawalRate.isSafe;
  const isWithdrawalRateHigh = withdrawalRate.current > 6;

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

  // Get recommendation priority based on risk level
  const getRecommendationPriority = (level: string): 'High' | 'Medium' | 'Low' => {
    switch (level) {
      case 'Critical':
      case 'High':
        return 'High';
      case 'Significant':
      case 'Moderate':
        return 'Medium';
      case 'Low':
        return 'Low';
      default:
        return 'Medium';
    }
  };

  // Update recommendations based on risk level
  const enhancedRecommendations = useMemo(() => {
    return recommendations.map(rec => ({
      ...rec,
      priority: getRecommendationPriority(effectiveRiskLevel)
    }));
  }, [recommendations, effectiveRiskLevel]);

  return (
    <Card className="overflow-hidden lg:col-span-2">
      <div className={cx(
        "px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center",
        darkMode
          ? "bg-indigo-900/50 border-indigo-700"
          : "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200"
      )}>
        <svg xmlns="http://www.w3.org/2000/svg" className={cx(
          "h-4 w-4 mr-2",
          darkMode ? "text-indigo-400" : "text-indigo-600"
        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <h3 className={cx(
          "mb-0 text-sm sm:text-base font-semibold",
          darkMode ? "text-indigo-300" : "text-indigo-800"
        )}>Recommended Action Plan</h3>
      </div>
      <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        <div className={cx(
          "pb-1.5 border-b mb-1 flex justify-between items-center",
          darkMode ? "border-indigo-700" : "border-indigo-200"
        )}>
          <div className={cx(
            "text-xs font-medium",
            darkMode ? "text-indigo-300" : "text-indigo-700"
          )}>
            {effectiveRiskLevel === 'Critical' || effectiveRiskLevel === 'High' ? 'Critical Actions Required' :
              effectiveRiskLevel === 'Significant' || effectiveRiskLevel === 'Moderate' ? 'Recommended Actions to Improve Security' :
                'Top Priorities'}
          </div>
          <div className={cx(
            "text-xs font-medium flex items-center gap-1",
            darkMode ? "text-indigo-300" : "text-indigo-700"
          )}>
            <span className="hidden sm:inline">Impact</span>
            <span className="sm:hidden">Priority</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={cx(
              "h-3 w-3",
              darkMode ? "text-indigo-400" : "text-indigo-500"
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Show top 3 recommendations (highest priority first) */}
        {enhancedRecommendations
          .slice()
          .sort((a, b) => {
            const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .slice(0, 3)
          .map((rec, index) => (
            <RecommendationItem
              key={index}
              recommendation={rec}
              index={index}
            />
          ))
        }

        <div className={cx(
          "rounded-lg p-2 border mt-2",
          darkMode ? "bg-indigo-900/40 border-indigo-700" : "bg-indigo-100/70 border-indigo-200"
        )}>
          <div className="flex items-center justify-between mb-1.5">
            <div className={cx(
              "text-xs font-medium",
              darkMode ? "text-indigo-300" : "text-indigo-800"
            )}>Current withdrawal rate:</div>
            <div className={cx(
              "text-sm font-bold flex items-center",
              darkMode ? (
                withdrawalRate.current <= 4 ? "text-green-400" :
                  withdrawalRate.current <= 6 ? "text-yellow-400" :
                    "text-red-400"
              ) : (
                withdrawalRate.current <= 4 ? "text-green-600" :
                  withdrawalRate.current <= 6 ? "text-yellow-600" :
                    "text-red-600"
              )
            )}>
              {formatPercentage(withdrawalRate.current)}
              <span className="ml-1.5">
                {withdrawalRate.current <= 4
                  ? <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-4 w-4",
                    darkMode ? "text-green-400" : "text-green-500"
                  )} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-4 w-4",
                    darkMode ? "text-red-400" : "text-red-500"
                  )} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                }
              </span>
            </div>
          </div>

          {/* Withdrawal rate progress bar container */}
          <div className="relative">
            {/* Safe zone indicator */}
            <div className={cx(
              "absolute inset-y-0 left-0 rounded-l-full",
              darkMode ? "bg-green-900/50" : "bg-green-100"
            )} style={{ width: '50%' }}></div>
            {/* Warning zone indicator */}
            <div className={cx(
              "absolute inset-y-0 left-[50%]",
              darkMode ? "bg-yellow-900/50" : "bg-yellow-100"
            )} style={{ width: '25%' }}></div>
            {/* Danger zone indicator */}
            <div className={cx(
              "absolute inset-y-0 left-[75%] rounded-r-full",
              darkMode ? "bg-red-900/50" : "bg-red-100"
            )} style={{ width: '25%' }}></div>

            {/* Main progress bar */}
            <div
              className="relative w-full bg-transparent h-2 rounded-full"
              role="progressbar"
              aria-valuenow={Math.round(withdrawalRate.current * 10) / 10}
              aria-valuemin={0}
              aria-valuemax={8}
            >
              {/* Current rate indicator */}
              <div
                className={cx(
                  "absolute -top-[3px] w-2 h-8 rounded-full transition-all",
                  darkMode ? (
                    withdrawalRate.current <= 4 ? "bg-green-400" :
                      withdrawalRate.current <= 6 ? "bg-yellow-400" :
                        "bg-red-400"
                  ) : (
                    withdrawalRate.current <= 4 ? "bg-green-600" :
                      withdrawalRate.current <= 6 ? "bg-yellow-600" :
                        "bg-red-600"
                  )
                )}
                style={{
                  left: `${Math.min(100, (withdrawalRate.current / 8) * 100)}%`,
                  transform: 'translateX(-50%)'
                }}
              ></div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-between mt-2 text-[10px]">
            <div className={cx(
              "flex items-center",
              darkMode ? "text-green-400" : "text-green-700"
            )}>
              <div className={cx(
                "w-2 h-2 rounded-full mr-1",
                darkMode ? "bg-green-700" : "bg-green-200"
              )}></div>
              Safe (0-4%)
            </div>
            <div className={cx(
              "flex items-center",
              darkMode ? "text-yellow-400" : "text-yellow-700"
            )}>
              <div className={cx(
                "w-2 h-2 rounded-full mr-1",
                darkMode ? "bg-yellow-700" : "bg-yellow-200"
              )}></div>
              Warning (4-6%)
            </div>
            <div className={cx(
              "flex items-center",
              darkMode ? "text-red-400" : "text-red-700"
            )}>
              <div className={cx(
                "w-2 h-2 rounded-full mr-1",
                darkMode ? "bg-red-700" : "bg-red-200"
              )}></div>
              High Risk (6%+)
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-2.5 border border-indigo-100">
          <div className="text-xs space-y-2">
            <div>
              <div className={cx(
                "text-xs font-medium mb-1 flex items-center",
                darkMode ? "text-indigo-800" : "text-indigo-700"
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Implementation Strategy
              </div>

              <div className={cx(
                "text-xs",
                darkMode ? "text-gray-300" : "text-gray-600"
              )}>
                {withdrawalRate.isSafe ? (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-green-400" : "text-green-600"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your withdrawal strategy is sustainable
                    </span>
                    <ul className={cx(
                      "mt-2 list-disc pl-4 text-xs space-y-1.5",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      <li>Your current withdrawal rate of <span className={cx(
                        "font-medium",
                        darkMode ? "text-green-400" : "text-green-600"
                      )}>{formatPercentage(withdrawalRate.current)}</span> is within the safe zone</li>
                      <li>Continue with your current withdrawal strategy</li>
                      <li>Maintain regular portfolio reviews to ensure continued alignment with market conditions</li>
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
                        Maintain your current withdrawal rate and review annually
                      </span>
                    </div>
                  </>
                ) : withdrawalRate.current <= 6 ? (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-yellow-400" : "text-yellow-600"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Withdrawal strategy needs attention
                    </span>
                    <ul className={cx(
                      "mt-2 list-disc pl-4 text-xs space-y-1.5",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      <li>Your current withdrawal rate of <span className={cx(
                        "font-medium",
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      )}>{formatPercentage(withdrawalRate.current)}</span> is slightly above recommended limits</li>
                      <li>Consider a moderate reduction to <span className={cx(
                        "font-medium",
                        darkMode ? "text-green-400" : "text-green-600"
                      )}>{formatDisplayValue(suggestedMonthlyWithdrawal)}</span> per month ({formatPercentage(suggestedWithdrawalRate)})</li>
                      <li>This adjustment would significantly improve the long-term sustainability of your retirement plan</li>
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
                        Gradually reduce withdrawal rate over the next 6 months
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className={cx(
                      "font-semibold flex items-center",
                      darkMode ? "text-red-400" : "text-red-600"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Urgent adjustment needed to withdrawal strategy
                    </span>
                    <ul className={cx(
                      "mt-2 list-disc pl-4 text-xs space-y-1.5",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      <li>Your current withdrawal rate of <span className={cx(
                        "font-medium",
                        darkMode ? "text-red-400" : "text-red-600"
                      )}>{formatPercentage(withdrawalRate.current)}</span> is unsustainably high</li>
                      <li>This rate significantly increases the risk of depleting your capital prematurely</li>
                      <li>Consider reducing your monthly withdrawals to <span className={cx(
                        "font-medium",
                        darkMode ? "text-green-400" : "text-green-600"
                      )}>{formatDisplayValue(suggestedMonthlyWithdrawal)}</span> ({formatPercentage(suggestedWithdrawalRate)})</li>
                      <li>Review your budget to identify potential areas for expense reduction</li>
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
                      )}>Immediate Action:</span>
                      <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                        Reduce withdrawal rate by {formatPercentage(withdrawalRate.current - suggestedWithdrawalRate)} within the next 3 months
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
  );
};

export default RecommendationPanel; 