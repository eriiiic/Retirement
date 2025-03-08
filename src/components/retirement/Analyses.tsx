import React, { useMemo, useCallback } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction, Currency } from './types';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';
import { SectionTitle } from '../common/StyledComponents';
import { useRetirementAnalyses } from './analyses/useRetirementAnalyses';
import { useTheme } from '../../context/ThemeContext';

// Import sub-components
import RiskAssessmentCard from './analyses/RiskAssessmentCard';
import RecommendationPanel from './analyses/RecommendationPanel';
import RetirementDelayCard from './analyses/RetirementDelayCard';
import InvestmentIncreaseCard from './analyses/InvestmentIncreaseCard';
import WithdrawalStrategyCard from './analyses/WithdrawalStrategyCard';

interface AnalysesProps {
  statistics: Statistics;
  params: SimulatorParams;
  formatAmount: FormatAmountFunction;
  currency: Currency;
}

export const Analyses: React.FC<AnalysesProps> = ({
  statistics,
  params,
  formatAmount,
  currency
}) => {
  const { darkMode } = useTheme();
  
  // Currency formatting with appropriate locale and decimals
  const formatCurrencyValue = useCallback((value: number, showDecimals: boolean = false): string => {
    const locale = currency === 'EUR' ? 'fr-FR' : 
      currency === 'GBP' ? 'en-GB' :
                   currency === 'JPY' ? 'ja-JP' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: showDecimals ? 1 : 0,
        maximumFractionDigits: showDecimals ? 1 : 0
    }).format(value);
  }, [currency]);

  // Format display values with M suffix for millions
  const formatDisplayValue = useCallback((value: number): string => {
    if (value >= 1000000) {
      return formatCurrencyValue(value / 1000000, true) + 'M';
    }
    return formatCurrencyValue(value, false);
  }, [formatCurrencyValue]);

  // Use the custom hook to calculate analyses
  const analyses = useRetirementAnalyses(
    statistics,
    params,
    formatDisplayValue
  );
  
  return (
    <div className={cx(
      "p-4 rounded-2xl shadow-md border",
      darkMode 
        ? "bg-gray-900 border-gray-700" 
        : "bg-gray-50 border-gray-200"
    )}>
      {/* Header section with title and description */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex-1">
          <h2 className={cx(
            "text-xl font-semibold mb-1 sm:mb-0",
            darkMode ? "text-gray-100" : "text-gradient"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className={cx(
              "h-5 w-5 mr-2 inline",
              darkMode ? "text-indigo-400" : "text-indigo-600"
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Optimization Insights
          </h2>
          <p className={cx(
            typography.style.subtitle, 
            "sm:pl-7",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Personalized strategies to enhance your retirement plan
          </p>
        </div>
        
        {/* Risk indicator badge */}
        <div className="mt-2 sm:mt-0">
          <div 
            className={cx(
              "rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5 border",
              analyses.runningOut.risk === 'High' 
                ? darkMode ? "bg-red-900/30 text-red-300 border-red-800/50" : "bg-red-50 text-red-800 border-red-200"
                : analyses.runningOut.risk === 'Medium' 
                  ? darkMode ? "bg-yellow-900/30 text-yellow-300 border-yellow-800/50" : "bg-yellow-50 text-yellow-800 border-yellow-200"
                  : darkMode ? "bg-green-900/30 text-green-300 border-green-800/50" : "bg-green-50 text-green-800 border-green-200"
            )}
            role="status"
            aria-label={`Risk level: ${analyses.runningOut.risk}`}
          >
            <div className={cx(
              "w-2.5 h-2.5 rounded-full",
              analyses.runningOut.risk === 'High' 
                ? darkMode ? "bg-red-600" : "bg-red-500"
                : analyses.runningOut.risk === 'Medium' 
                  ? darkMode ? "bg-yellow-600" : "bg-yellow-500" 
                  : darkMode ? "bg-green-600" : "bg-green-500"
            )}
            aria-hidden="true"
            ></div>
            <span className={cx(
              "text-xs font-semibold",
              darkMode 
                ? analyses.runningOut.risk === 'High' ? "text-red-300" 
                  : analyses.runningOut.risk === 'Medium' ? "text-yellow-300" 
                  : "text-green-300"
                : ""
            )}>
              {analyses.runningOut.risk === 'High' ? "High Risk" : 
              analyses.runningOut.risk === 'Medium' ? "Medium Risk" : 
              "Low Risk"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Auto-calculated retirement age insights - Conditionally displayed card */}
      {params.autoCalculateRetirementAge && analyses.retirementAgeInsights && (
        <div className={cx(
          "rounded-xl border mb-4 overflow-hidden",
          darkMode
            ? "bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-800/50"
            : "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100"
        )}>
          <div className={cx(
            "px-4 py-3 border-b flex items-center",
            darkMode ? "border-purple-800/50" : "border-purple-100"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className={cx(
              "h-4 w-4 mr-2",
              darkMode ? "text-purple-400" : "text-purple-600"
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <SectionTitle className={cx(
              "mb-0",
              darkMode ? "text-purple-300" : "text-purple-800"
            )}>
            Auto-Calculated Retirement Age: {analyses.retirementAgeInsights.calculatedAge}
            </SectionTitle>
            <span className={cx(
              "ml-auto px-2 py-0.5 text-xs font-medium rounded",
              analyses.retirementAgeInsights.optimalAssessment.assessment === "risky" 
                ? darkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-800"
                : analyses.retirementAgeInsights.optimalAssessment.assessment === "moderate" 
                  ? darkMode ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-100 text-yellow-800"
                  : analyses.retirementAgeInsights.optimalAssessment.assessment === "soon" 
                    ? darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800"
                    : darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
            )}>
              {analyses.retirementAgeInsights.optimalAssessment.assessment === "risky" ? "Risky" :
               analyses.retirementAgeInsights.optimalAssessment.assessment === "moderate" ? "Moderate" :
               analyses.retirementAgeInsights.optimalAssessment.assessment === "soon" ? "Coming Soon" :
               "Solid Plan"}
            </span>
          </div>
          
          <div className="p-3">
            <p className={cx(
              "text-sm mb-3 italic font-medium",
              darkMode ? "text-purple-400" : "text-purple-700"
            )}>
              {analyses.retirementAgeInsights.optimalAssessment.message}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className={cx(
                "rounded-lg p-3 border flex items-start",
                darkMode 
                  ? "bg-gray-800 border-purple-800/50" 
                  : "bg-white border-purple-100"
              )}>
                <div className={cx(
                  "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3",
                  darkMode ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                )}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
                <div>
                  <h4 className={cx(
                    "text-sm font-medium", 
                    darkMode ? "text-indigo-300" : "text-indigo-800"
                  )}>Earlier Retirement Option</h4>
                  <p className={cx(
                    "text-xs mt-1",
                    darkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    Retire at age <span className="font-semibold">{analyses.retirementAgeInsights.earlierPossible.age}</span> by increasing monthly investment by {formatDisplayValue(analyses.retirementAgeInsights.earlierPossible.extraMonthlyInvestment)}.
                  </p>
                </div>
              </div>
            
              <div className={cx(
                "rounded-lg p-3 border flex items-start",
                darkMode 
                  ? "bg-gray-800 border-purple-800/50" 
                  : "bg-white border-purple-100"
              )}>
                <div className={cx(
                  "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-3",
                  darkMode ? "bg-purple-900/50 text-purple-400" : "bg-purple-100 text-purple-600"
                )}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                </div>
                <div>
                  <h4 className={cx(
                    "text-sm font-medium", 
                    darkMode ? "text-purple-300" : "text-purple-800"
                  )}>Delaying Benefits</h4>
                  <p className={cx(
                    "text-xs mt-1",
                    darkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    Working until <span className="font-semibold">{analyses.retirementAgeInsights.laterBenefits.age}</span> would add {formatDisplayValue(analyses.retirementAgeInsights.laterBenefits.additionalCapital)} (+{Math.round(analyses.retirementAgeInsights.laterBenefits.improvedSafety)}% safety).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content grid - use our refactored components */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* First row: 3 cards */}
       
        {/* 1. Risk Assessment card */}
        <RiskAssessmentCard 
          risk={analyses.runningOut.risk}
          safetyMargin={analyses.runningOut.safetyMargin}
          withdrawalRate={analyses.withdrawalRate}
          statistics={{
            isCapitalExhausted: statistics.isCapitalExhausted,
            exhaustionAge: statistics.exhaustionAge,
            capitalAtRetirement: statistics.capitalAtRetirement,
            totalNeededCapital: statistics.totalNeededCapital
          }}
          params={{
            monthlyInvestment: params.monthlyInvestment,
            monthlyRetirementWithdrawal: params.monthlyRetirementWithdrawal,
            currency: params.currency,
            inflationAdjustedWithdrawal: params.inflationAdjustedWithdrawal,
            withdrawalMode: params.withdrawalMode,
            inflation: params.inflation
          }}
          formatDisplayValue={formatDisplayValue}
        />

        {/* 2. Recommended Action Plan card */}
        <RecommendationPanel 
          recommendations={analyses.recommendations}
          withdrawalRate={analyses.withdrawalRate}
          capitalAtRetirement={statistics.capitalAtRetirement}
          totalNeededCapital={statistics.totalNeededCapital}
          monthlyRetirementWithdrawal={params.monthlyRetirementWithdrawal}
          annualReturnRate={params.annualReturnRate}
          params={params}
          statistics={statistics}
          currentAge={params.currentAge}
          risk={analyses.runningOut.risk}
        />
        
        {/* 3. Delaying retirement impact card */}
        <RetirementDelayCard 
          risk={analyses.runningOut.risk}
          yearDelayImpact={analyses.yearDelayImpact}
          capitalAtRetirement={statistics.capitalAtRetirement}
          retirementStartAge={statistics.retirementStartAge}
          formatDisplayValue={formatDisplayValue}
          totalNeededCapital={statistics.totalNeededCapital}
          monthlyRetirementWithdrawal={params.monthlyRetirementWithdrawal}
          annualReturnRate={params.annualReturnRate}
          params={params}
          statistics={statistics}
          currentAge={params.currentAge}
          inflationAdjustedWithdrawal={params.inflationAdjustedWithdrawal}
          withdrawalMode={params.withdrawalMode}
          inflation={params.inflation}
        />
        
        {/* Second row: 2 cards spanning wider */}
        {/* 4. Investment Increase Strategy card */}
        <InvestmentIncreaseCard 
          risk={analyses.runningOut.risk}
          monthlyInvestment={params.monthlyInvestment}
          investmentIncrease={analyses.investmentIncrease}
          safetyMargin={analyses.runningOut.safetyMargin}
          totalNeededCapital={statistics.totalNeededCapital}
          capitalAtRetirement={statistics.capitalAtRetirement}
          monthlyRetirementWithdrawal={params.monthlyRetirementWithdrawal}
          currency={params.currency}
          formatDisplayValue={formatDisplayValue}
          inflationAdjustedWithdrawal={params.inflationAdjustedWithdrawal}
          withdrawalMode={params.withdrawalMode}
          inflation={params.inflation}
        />
        
        {/* 5. Withdraw Strategy card */}
        <WithdrawalStrategyCard 
          risk={analyses.runningOut.risk}
          monthlyRetirementWithdrawal={params.monthlyRetirementWithdrawal}
          capitalAtRetirement={statistics.capitalAtRetirement}
          retirementStartAge={statistics.retirementStartAge}
          annualReturnRate={params.annualReturnRate}
          formatAmount={formatAmount}
          formatDisplayValue={formatDisplayValue}
          inflationAdjustedWithdrawal={params.inflationAdjustedWithdrawal}
          withdrawalMode={params.withdrawalMode}
          inflation={params.inflation}
          currentAge={params.currentAge}
        />
                </div>
    </div>
  );
};

export default Analyses; 