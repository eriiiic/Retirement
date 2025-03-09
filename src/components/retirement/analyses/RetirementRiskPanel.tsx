import React, { useMemo } from 'react';
import { FormatAmountFunction, Currency } from '../types';
import { useTheme } from '../../../context/ThemeContext';
import { calculateRetirementRisk } from '../../../utils/financialCalculations';

// Risk level color mapping
const riskColors = {
  Low: {
    light: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'bg-green-100',
      accentText: 'text-green-700',
      accentBorder: 'border-green-200',
      icon: 'bg-green-100 text-green-600',
      iconDark: 'bg-green-800 text-green-200',
    },
    dark: {
      bg: 'bg-green-900/30',
      border: 'border-green-800/50',
      text: 'text-green-300',
      accent: 'bg-green-800/50',
      accentText: 'text-green-300',
      accentBorder: 'border-green-700',
      icon: 'bg-green-800 text-green-200',
      iconBorder: 'border-green-700',
    }
  },
  Moderate: {
    light: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'bg-blue-100',
      accentText: 'text-blue-700',
      accentBorder: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      iconDark: 'bg-blue-800 text-blue-200',
    },
    dark: {
      bg: 'bg-blue-900/30',
      border: 'border-blue-800/50',
      text: 'text-blue-300',
      accent: 'bg-blue-800/50',
      accentText: 'text-blue-300',
      accentBorder: 'border-blue-700',
      icon: 'bg-blue-800 text-blue-200',
      iconBorder: 'border-blue-700',
    }
  },
  Significant: {
    light: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      accent: 'bg-yellow-100',
      accentText: 'text-yellow-700',
      accentBorder: 'border-yellow-200',
      icon: 'bg-yellow-100 text-yellow-600',
      iconDark: 'bg-yellow-800 text-yellow-200',
    },
    dark: {
      bg: 'bg-yellow-900/30',
      border: 'border-yellow-800/50',
      text: 'text-yellow-300',
      accent: 'bg-yellow-800/50',
      accentText: 'text-yellow-300',
      accentBorder: 'border-yellow-700',
      icon: 'bg-yellow-800 text-yellow-200',
      iconBorder: 'border-yellow-700',
    }
  },
  High: {
    light: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      accent: 'bg-orange-100',
      accentText: 'text-orange-700',
      accentBorder: 'border-orange-200',
      icon: 'bg-orange-100 text-orange-600',
      iconDark: 'bg-orange-800 text-orange-200',
    },
    dark: {
      bg: 'bg-orange-900/30',
      border: 'border-orange-800/50',
      text: 'text-orange-300',
      accent: 'bg-orange-800/50',
      accentText: 'text-orange-300',
      accentBorder: 'border-orange-700',
      icon: 'bg-orange-800 text-orange-200',
      iconBorder: 'border-orange-700',
    }
  },
  Critical: {
    light: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      accent: 'bg-red-100',
      accentText: 'text-red-700',
      accentBorder: 'border-red-200',
      icon: 'bg-red-100 text-red-600',
      iconDark: 'bg-red-800 text-red-200',
    },
    dark: {
      bg: 'bg-red-900/30',
      border: 'border-red-800/50',
      text: 'text-red-300',
      accent: 'bg-red-800/50',
      accentText: 'text-red-300',
      accentBorder: 'border-red-700',
      icon: 'bg-red-800 text-red-200',
      iconBorder: 'border-red-700',
    }
  }
};

// Priority color mapping 
const priorityColors = {
  Low: {
    light: 'bg-green-100 text-green-800',
    dark: 'bg-green-900/50 text-green-300'
  },
  Medium: {
    light: 'bg-blue-100 text-blue-800',
    dark: 'bg-blue-900/50 text-blue-300'
  },
  High: {
    light: 'bg-yellow-100 text-yellow-800',
    dark: 'bg-yellow-900/50 text-yellow-300'
  },
  Urgent: {
    light: 'bg-orange-100 text-orange-800',
    dark: 'bg-orange-900/50 text-orange-300'
  },
  Critical: {
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-900/50 text-red-300'
  }
};

// Icons for different risk levels
const RiskIcon = ({ riskLevel, darkMode }: { riskLevel: string; darkMode: boolean }) => {
  const colors = riskColors[riskLevel as keyof typeof riskColors];
  const iconColor = darkMode ? colors.dark.icon : colors.light.icon;

  switch (riskLevel) {
    case 'Low':
      return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'Moderate':
      return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'Significant':
      return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'High':
      return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    case 'Critical':
      return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
};

// Progress bar for risk score visualization
const RiskScoreBar = ({ score, darkMode }: { score: number; darkMode: boolean }) => {
  // Determine color based on score
  let color = '';
  
  if (score < 2) {
    color = darkMode ? 'bg-green-600' : 'bg-green-500';
  } else if (score < 4) {
    color = darkMode ? 'bg-blue-600' : 'bg-blue-500';
  } else if (score < 6) {
    color = darkMode ? 'bg-yellow-600' : 'bg-yellow-500';
  } else if (score < 8) {
    color = darkMode ? 'bg-orange-600' : 'bg-orange-500';
  } else {
    color = darkMode ? 'bg-red-600' : 'bg-red-500';
  }
  
  // Cap score at 10 for display purposes
  const capScore = Math.min(score, 10);
  const percentage = (capScore / 10) * 100;
  
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className={darkMode ? "text-gray-300 text-xs" : "text-gray-600 text-xs"}>
          Risk Score: {score.toFixed(1)}/10
        </span>
        <div className="flex space-x-1">
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-green-600' : 'bg-green-500'}`}></span>
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-blue-500'}`}></span>
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-yellow-600' : 'bg-yellow-500'}`}></span>
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-orange-600' : 'bg-orange-500'}`}></span>
          <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'}`}></span>
        </div>
      </div>
      <div className={`w-full h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
        <div 
          className={`h-2 rounded-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Props for the component
interface RetirementRiskPanelProps {
  capitalAtRetirement: number;
  totalNeededCapital: number;
  monthlyRetirementWithdrawal: number;
  annualReturnRate: number;
  inflation: number;
  retirementStartAge: number;
  currentAge: number;
  lifeExpectancy: number;
  monthlyInvestment: number;
  formatAmount: FormatAmountFunction;
  targetAge?: number;
  showFactors?: boolean;
  currency: Currency;
  className?: string;
}

const RetirementRiskPanel: React.FC<RetirementRiskPanelProps> = ({
  capitalAtRetirement,
  totalNeededCapital,
  monthlyRetirementWithdrawal,
  annualReturnRate,
  inflation,
  retirementStartAge,
  currentAge,
  lifeExpectancy,
  monthlyInvestment,
  formatAmount,
  targetAge = 95,
  showFactors = false,
  currency,
  className = ''
}) => {
  const { darkMode } = useTheme();
  
  // Calculate risk assessment
  const riskAssessment = useMemo(() => {
    return calculateRetirementRisk(
      capitalAtRetirement,
      totalNeededCapital,
      monthlyRetirementWithdrawal,
      annualReturnRate,
      inflation,
      retirementStartAge,
      currentAge,
      lifeExpectancy,
      monthlyInvestment,
      targetAge
    );
  }, [
    capitalAtRetirement,
    totalNeededCapital,
    monthlyRetirementWithdrawal,
    annualReturnRate,
    inflation,
    retirementStartAge,
    currentAge,
    lifeExpectancy,
    monthlyInvestment,
    targetAge
  ]);
  
  // Format percentage for display
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };
  
  const { riskLevel, riskScore, factors, description, recommendationPriority, primaryRecommendation, secondaryRecommendations } = riskAssessment;
  
  // Get risk level specific colors
  const colors = riskColors[riskLevel as keyof typeof riskColors];
  const bgColor = darkMode ? colors.dark.bg : colors.light.bg;
  const borderColor = darkMode ? colors.dark.border : colors.light.border;
  const textColor = darkMode ? colors.dark.text : colors.light.text;
  const accentBg = darkMode ? colors.dark.accent : colors.light.accent;
  const accentText = darkMode ? colors.dark.accentText : colors.light.accentText;
  
  // Get priority colors
  const priorityColor = priorityColors[recommendationPriority as keyof typeof priorityColors];
  const priorityBgColor = darkMode ? priorityColor.dark : priorityColor.light;
  
  return (
    <div className={`rounded-xl border ${bgColor} ${borderColor} overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-opacity-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <RiskIcon riskLevel={riskLevel} darkMode={darkMode} />
          <div>
            <h3 className={`font-bold text-xl ${textColor}`}>
              {riskLevel} Risk
            </h3>
            <RiskScoreBar score={riskScore} darkMode={darkMode} />
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityBgColor}`}>
          {recommendationPriority} Priority
        </div>
      </div>
      
      {/* Body */}
      <div className="p-4">
        {/* Description */}
        <p className={`mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          {description}
        </p>
        
        {/* Risk Factors */}
        {showFactors && (
          <div className={`p-3 rounded-lg mb-4 ${darkMode ? "bg-gray-800" : "bg-white"} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h4 className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Risk Factors Analysis
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Capital Adequacy</span>
                <div className="flex items-center mt-1">
                  <div className={`h-1.5 rounded-full flex-grow ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div 
                      className={`h-1.5 rounded-full ${factors.capitalRatio >= 1 ? (darkMode ? "bg-green-600" : "bg-green-500") : (darkMode ? "bg-orange-600" : "bg-orange-500")}`} 
                      style={{ width: `${Math.min(factors.capitalRatio * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs ml-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{(factors.capitalRatio * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Withdrawal Safety</span>
                <div className="flex items-center mt-1">
                  <div className={`h-1.5 rounded-full flex-grow ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div 
                      className={`h-1.5 rounded-full ${factors.withdrawalRiskFactor <= 1 ? (darkMode ? "bg-green-600" : "bg-green-500") : (darkMode ? "bg-red-600" : "bg-red-500")}`} 
                      style={{ width: `${Math.min(factors.withdrawalRiskFactor * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs ml-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{(factors.withdrawalRiskFactor * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Longevity Risk</span>
                <div className="flex items-center mt-1">
                  <div className={`h-1.5 rounded-full flex-grow ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div 
                      className={`h-1.5 rounded-full ${factors.longevityRiskFactor <= 0.5 ? (darkMode ? "bg-green-600" : "bg-green-500") : (darkMode ? "bg-yellow-600" : "bg-yellow-500")}`} 
                      style={{ width: `${Math.min(factors.longevityRiskFactor * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs ml-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{Math.round(factors.longevityRiskFactor * 10)} yrs</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Investment Gap</span>
                <div className="flex items-center mt-1">
                  <div className={`h-1.5 rounded-full flex-grow ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div 
                      className={`h-1.5 rounded-full ${factors.investmentShortfallFactor <= 0.15 ? (darkMode ? "bg-green-600" : "bg-green-500") : (darkMode ? "bg-orange-600" : "bg-orange-500")}`} 
                      style={{ width: `${Math.min(factors.investmentShortfallFactor * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs ml-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{(factors.investmentShortfallFactor * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Primary Recommendation */}
        <div className={`p-3 rounded-lg mb-3 ${accentBg} border ${darkMode ? colors.dark.accentBorder : colors.light.accentBorder}`}>
          <h4 className={`text-sm font-medium mb-1 ${accentText}`}>
            Primary Recommendation
          </h4>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            {primaryRecommendation}
          </p>
        </div>
        
        {/* Secondary Recommendations */}
        <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <h4 className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Additional Recommendations
          </h4>
          <ul className="space-y-2">
            {secondaryRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <div className={`mt-0.5 mr-2 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? colors.dark.icon : colors.light.icon}`}>
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {recommendation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RetirementRiskPanel; 