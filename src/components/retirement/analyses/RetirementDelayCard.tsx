import React, { useState, useMemo, useRef, useCallback } from 'react';
import { FormatAmountFunction, WithdrawalMode, Currency } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';
import { Metric } from '../../common/Metric';
import { calculateYearsUntilExhaustion, calculateDelayedScenario, calculateDelayedRetirementImpact, calculateExhaustionAge, calculateDelayImpactOnLongevity, calculateEffectiveWithdrawalAmount } from '../../../utils/financialCalculations';
import { formatPercentage } from '../../../utils/formatters';
import { useTheme } from '../../../context/ThemeContext';

interface RetirementDelayCardProps {
  risk: 'High' | 'Medium' | 'Low';
  yearDelayImpact: number;
  capitalAtRetirement: number;
  retirementStartAge: number;
  formatDisplayValue: (value: number) => string;
  totalNeededCapital?: number;
  monthlyRetirementWithdrawal?: number;
  annualReturnRate?: number;
  params: any;
  statistics: any;
  currentAge: number;
  inflationAdjustedWithdrawal?: boolean;
  withdrawalMode?: WithdrawalMode;
  inflation?: number;
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

export const RetirementDelayCard: React.FC<RetirementDelayCardProps> = ({
  risk,
  yearDelayImpact,
  capitalAtRetirement,
  retirementStartAge,
  formatDisplayValue,
  totalNeededCapital = 0,
  monthlyRetirementWithdrawal = 0,
  annualReturnRate = 5,
  params,
  statistics,
  currentAge,
  inflationAdjustedWithdrawal,
  withdrawalMode,
  inflation,
  riskAssessment
}) => {
  const { darkMode } = useTheme();
  // State to track which section is being hovered
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  // State to track tooltip position
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Handle mouse enter with position
  const handleMouseEnter = (sectionType: string, e: React.MouseEvent) => {
    setHoveredSection(sectionType);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

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

  // Calculate optimal delay years based on capital exhaustion at target age
  const calculateOptimalDelayYears = useMemo(() => {
    // Handle case when necessary data is missing
    if (!capitalAtRetirement || !totalNeededCapital || !effectiveMonthlyWithdrawal || !annualReturnRate) {
      return risk === 'High' ? 4 : risk === 'Medium' ? 2 : 0;
    }

    const currentYear = new Date().getFullYear();
    const retirementYear = statistics.calculatedRetirementStartYear;
    const targetMaxAge = params.withdrawalMode === "age" ? params.maxAge : 95;
    
    // Calculate the year when user reaches target max age
    const targetYear = currentYear + (targetMaxAge - currentAge);
    
    // Check if capital is already exhausted at target age with current plan
    const capitalEvolution = [];
    let scenario = {
      capital: params.initialCapital,
      investment: params.monthlyInvestment,
      withdrawal: effectiveMonthlyWithdrawal // Use inflation-adjusted withdrawal
    };
    
    // Simulate from current year to target year with original retirement plan
    for (let year = currentYear; year <= targetYear; year++) {
      scenario = calculateDelayedScenario(
        scenario.capital,
        scenario.investment,
        scenario.withdrawal,
        retirementYear,
        0, // No delay
        year,
        annualReturnRate,
        params.inflation
      );
      
      capitalEvolution.push({
        year,
        capital: scenario.capital
      });
    }
    
    // Check if capital is exhausted at target age
    const finalCapital = capitalEvolution[capitalEvolution.length - 1].capital;
    
    // If capital isn't exhausted at target age, no need for delay
    if (finalCapital > 0) {
      console.log("Capital not exhausted at target age with current plan, no delay needed");
      return 0;
    }
    
    // Find the exhaustion year in the original plan
    const exhaustionYear = capitalEvolution.findIndex(point => point.capital <= 0);
    const actualExhaustionYear = exhaustionYear >= 0 ? 
      capitalEvolution[exhaustionYear].year : 
      targetYear + 1;
    
    console.log(`Capital exhausted at age ${actualExhaustionYear - currentYear + currentAge} with current plan`);
    
    // If capital gets exhausted, calculate various delay scenarios
    for (let delayYears = 1; delayYears <= 5; delayYears++) {
      // Initialize scenario for this delay option
      scenario = {
        capital: params.initialCapital,
        investment: params.monthlyInvestment,
        withdrawal: effectiveMonthlyWithdrawal // Use inflation-adjusted withdrawal
      };
      
      const delayedRetirementYear = retirementYear + delayYears;
      const delayCapitalEvolution = [];
      
      // Simulate from current year to target year with delayed retirement
      for (let year = currentYear; year <= targetYear; year++) {
        scenario = calculateDelayedScenario(
          scenario.capital,
          scenario.investment,
          scenario.withdrawal,
          retirementYear,
          delayYears,
          year,
          annualReturnRate,
          params.inflation
        );
        
        delayCapitalEvolution.push({
          year,
          capital: scenario.capital
        });
      }
      
      // Check if capital remains positive at target age with this delay
      const delayFinalCapital = delayCapitalEvolution[delayCapitalEvolution.length - 1].capital;
      
      console.log(`With ${delayYears} year delay: Capital at target age = ${Math.round(delayFinalCapital).toLocaleString()}`);
      
      if (delayFinalCapital > 0) {
        console.log(`Found optimal delay: ${delayYears} years`);
        return delayYears;
      }
    }
    
    // If we reach here, even 5 years delay isn't enough, so recommend maximum
    console.log("Even 5 years delay isn't enough, recommending maximum delay");
    return 5;
  }, [risk, capitalAtRetirement, totalNeededCapital, effectiveMonthlyWithdrawal, annualReturnRate, params, statistics, currentAge]);

  // Calculate optimal delay years
  const optimalDelayYears = calculateOptimalDelayYears;
  
  // Check if maximum delay (5 years) is insufficient
  const isMaxDelayInsufficient = useMemo(() => {
    if (!capitalAtRetirement || !totalNeededCapital || !effectiveMonthlyWithdrawal || !annualReturnRate) {
      return false;
    }

    const currentYear = new Date().getFullYear();
    const retirementYear = statistics.calculatedRetirementStartYear;
    const targetMaxAge = params.withdrawalMode === "age" ? params.maxAge : 95;
    const targetYear = currentYear + (targetMaxAge - currentAge);
    
    // Simulate with 5-year delay (maximum)
    let scenario = {
      capital: params.initialCapital,
      investment: params.monthlyInvestment,
      withdrawal: effectiveMonthlyWithdrawal // Use inflation-adjusted withdrawal
    };
    
    // Simulate from current year to target year with 5-year delayed retirement
    for (let year = currentYear; year <= targetYear; year++) {
      scenario = calculateDelayedScenario(
        scenario.capital,
        scenario.investment,
        scenario.withdrawal,
        retirementYear,
        5, // Maximum delay
        year,
        annualReturnRate,
        params.inflation
      );
    }
    
    // Check if capital is still exhausted at target age even with max delay
    return scenario.capital <= 0;
  }, [capitalAtRetirement, totalNeededCapital, effectiveMonthlyWithdrawal, annualReturnRate, statistics, params, currentAge]);
  
  // Calculate percentage of gap that would be closed with recommended delay
  const gapClosurePercentage = useMemo(() => {
    if (!capitalAtRetirement || !totalNeededCapital || optimalDelayYears === 0) {
      return (capitalAtRetirement / totalNeededCapital) * 100;
    }

    // Use the shared utility function for consistency across components
    const result = calculateDelayedRetirementImpact(
      params.initialCapital,
      params.monthlyInvestment,
      effectiveMonthlyWithdrawal,
      statistics.calculatedRetirementStartYear,
      optimalDelayYears,
      annualReturnRate,
      params.inflation
    );

    return Math.min(100, (result.delayedCapitalAtRetirement / totalNeededCapital) * 100);
  }, [capitalAtRetirement, totalNeededCapital, effectiveMonthlyWithdrawal, annualReturnRate, optimalDelayYears, statistics, params]);

  // Calculate optimized retirement age
  const optimizedRetirementAge = retirementStartAge + optimalDelayYears;
  
  // Calculate capital metrics using the shared function for consistency
  const delayImpactResult = useMemo(() => {
    if (optimalDelayYears === 0) {
      return {
        originalCapitalAtRetirement: capitalAtRetirement,
        delayedCapitalAtRetirement: capitalAtRetirement, 
        capitalIncrease: 0,
        percentageIncrease: 0
      };
    }
    
    return calculateDelayedRetirementImpact(
      params.initialCapital,
      params.monthlyInvestment,
      effectiveMonthlyWithdrawal,
      statistics.calculatedRetirementStartYear,
      optimalDelayYears,
      annualReturnRate,
      params.inflation
    );
  }, [capitalAtRetirement, optimalDelayYears, params, statistics, effectiveMonthlyWithdrawal, annualReturnRate]);
  
  // Use the results from the shared function
  const optimizedCapital = delayImpactResult.delayedCapitalAtRetirement;
  const additionalCapital = delayImpactResult.capitalIncrease;
  const percentageIncrease = delayImpactResult.percentageIncrease;

  // Calculate years until exhaustion improvement
  const yearsUntilExhaustionImprovement = useMemo(() => {
    if (!capitalAtRetirement || !effectiveMonthlyWithdrawal || !annualReturnRate || optimalDelayYears === 0) {
      return 0;
    }

    const currentYear = new Date().getFullYear();
    const retirementYear = statistics.calculatedRetirementStartYear;
    const targetMaxAge = params.withdrawalMode === "age" ? params.maxAge : 95;
    const targetYear = currentYear + (targetMaxAge - currentAge);
    
    // Simulate original plan to find exhaustion year
    let originalScenario = {
      capital: params.initialCapital,
      investment: params.monthlyInvestment,
      withdrawal: params.monthlyRetirementWithdrawal
    };
    
    const originalCapitalByYear = [];
    
    for (let year = currentYear; year <= targetYear; year++) {
      originalScenario = calculateDelayedScenario(
        originalScenario.capital,
        originalScenario.investment,
        originalScenario.withdrawal,
        retirementYear,
        0, // No delay
        year,
        annualReturnRate,
        params.inflation
      );
      
      originalCapitalByYear.push({
        year,
        capital: originalScenario.capital
      });
    }
    
    // Find exhaustion year in original plan
    const originalExhaustionIndex = originalCapitalByYear.findIndex(point => point.capital <= 0);
    const originalExhaustionYear = originalExhaustionIndex >= 0 ? 
      originalCapitalByYear[originalExhaustionIndex].year : 
      targetYear + 1;
    
    // Simulate delayed plan
    let delayedScenario = {
      capital: params.initialCapital,
      investment: params.monthlyInvestment,
      withdrawal: params.monthlyRetirementWithdrawal
    };
    
    const delayedCapitalByYear = [];
    
    for (let year = currentYear; year <= targetYear; year++) {
      delayedScenario = calculateDelayedScenario(
        delayedScenario.capital,
        delayedScenario.investment,
        delayedScenario.withdrawal,
        retirementYear,
        optimalDelayYears,
        year,
        annualReturnRate,
        params.inflation
      );
      
      delayedCapitalByYear.push({
        year,
        capital: delayedScenario.capital
      });
    }
    
    // Find exhaustion year in delayed plan
    const delayedExhaustionIndex = delayedCapitalByYear.findIndex(point => point.capital <= 0);
    const delayedExhaustionYear = delayedExhaustionIndex >= 0 ? 
      delayedCapitalByYear[delayedExhaustionIndex].year : 
      targetYear + 1;
    
    // Calculate years of improvement
    return delayedExhaustionYear - originalExhaustionYear;
  }, [capitalAtRetirement, effectiveMonthlyWithdrawal, annualReturnRate, optimalDelayYears, statistics, params, currentAge]);

  // Get all delay scenarios for display in the UI
  const delayScenarios = useMemo(() => {
    if (!capitalAtRetirement || !effectiveMonthlyWithdrawal || !annualReturnRate) {
      return [
        { years: 1, capital: capitalAtRetirement + yearDelayImpact },
        { years: 3, capital: capitalAtRetirement + yearDelayImpact * 3 },
        { years: 5, capital: capitalAtRetirement + yearDelayImpact * 5 }
      ];
    }

    // Use the shared utility function for consistent calculations across components
    const years = [1, 3, 5];
    return years.map(delayYears => {
      const result = calculateDelayedRetirementImpact(
        params.initialCapital,
        params.monthlyInvestment,
        effectiveMonthlyWithdrawal,
        statistics.calculatedRetirementStartYear,
        delayYears,
        annualReturnRate,
        params.inflation
      );
      
      return {
        years: delayYears,
        capital: result.delayedCapitalAtRetirement
      };
    });
  }, [capitalAtRetirement, yearDelayImpact, effectiveMonthlyWithdrawal, annualReturnRate, statistics, params.inflation, params.initialCapital, params.monthlyInvestment]);

  // Get tooltip content for each section
  const getTooltipContent = (sectionType: string) => {
    switch(sectionType) {
      case 'currentPlan':
        return (
          <div className={cx(
            "p-3 rounded-lg shadow-lg border w-64",
            darkMode 
              ? "bg-gray-800 border-blue-700 text-gray-200" 
              : "bg-white border-gray-200"
          )}>
            <h3 className={cx(
              "font-semibold mb-1",
              darkMode ? "text-gray-100" : "text-gray-800"
            )}>Current Retirement Plan</h3>
            <p className={cx(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Your current planned retirement starting at age {retirementStartAge}.</p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Projected retirement capital: <span className="font-semibold">{formatDisplayValue(capitalAtRetirement)}</span></p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>This is your baseline retirement plan without any timing adjustments.</p>
          </div>
        );
      case 'optimizedPlan':
        return (
          <div className={cx(
            "p-3 rounded-lg shadow-lg border w-64",
            darkMode 
              ? "bg-gray-800 border-blue-700 text-gray-200" 
              : "bg-white border-gray-200"
          )}>
            <h3 className={cx(
              "font-semibold mb-1",
              darkMode ? "text-gray-100" : "text-gray-800"
            )}>Optimized Retirement Plan</h3>
            <p className={cx(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Recommended delay: <span className="font-semibold">{optimalDelayYears} {optimalDelayYears === 1 ? 'year' : 'years'}</span></p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>This represents a <span className="font-semibold">{formatPercentage(percentageIncrease)}</span> increase in retirement capital.</p>
            {isMaxDelayInsufficient && (
              <p className={cx(
                "text-xs mt-1",
                darkMode ? "text-red-400" : "text-red-600"
              )}>Note: Even with this delay, additional strategies will be needed to reach your target.</p>
            )}
          </div>
        );
      case 'capitalProjections':
        return (
          <div className={cx(
            "p-3 rounded-lg shadow-lg border w-64",
            darkMode 
              ? "bg-gray-800 border-blue-700 text-gray-200" 
              : "bg-white border-gray-200"
          )}>
            <h3 className={cx(
              "font-semibold mb-1",
              darkMode ? "text-gray-100" : "text-gray-800"
            )}>Capital Projection Logic</h3>
            <p className={cx(
              "text-xs",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Our recommendation is based on ensuring your capital isn't exhausted before your target age ({params.maxAge}).</p>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>Delaying retirement has multiple benefits:</p>
            <ul className={cx(
              "text-xs mt-1 list-disc pl-4",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>
              <li>Additional retirement contributions</li>
              <li>Extra investment growth time</li>
              <li>Fewer years of capital drawdown</li>
            </ul>
            <p className={cx(
              "text-xs mt-1",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>We've simulated your capital evolution to find the minimum delay needed to prevent exhaustion.</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate projected capital at max age
  const projectedFinalCapital = useMemo(() => {
    if (!capitalAtRetirement || !effectiveMonthlyWithdrawal || !annualReturnRate) {
      return 0;
    }

    // Define calculation parameters directly
    const currentYear = new Date().getFullYear();
    const retirementYear = statistics.calculatedRetirementStartYear;
    const targetYear = currentYear + (params.maxAge - currentAge);
    
    // For original plan (no delay) we start simulation from retirement with capitalAtRetirement
    let scenario = {
      capital: capitalAtRetirement,
      investment: 0, // No more investments during retirement
      withdrawal: effectiveMonthlyWithdrawal // Use inflation-adjusted withdrawal
    };
    
    // Simulate from retirement year to target year
    for (let year = retirementYear; year <= targetYear; year++) {
      scenario = calculateDelayedScenario(
        scenario.capital,
        scenario.investment,
        scenario.withdrawal,
        retirementYear,
        0, // No delay
        year,
        annualReturnRate,
        params.inflation
      );
    }
    
    return scenario.capital;
  }, [capitalAtRetirement, effectiveMonthlyWithdrawal, annualReturnRate, params.inflation, params.maxAge, statistics.calculatedRetirementStartYear, currentAge]);

  // Set target age
  const targetAge = 95;

  // Calculate ideal delay without 5-year limit
  const idealDelayInfo = useMemo(() => {
    // Start with current retirement age and increment until we find a solution
    let idealDelay = 0;
    let maxIterations = 20; // Reasonable maximum to prevent infinite loops
    let found = false;
    let delayedCapital = 0;
    let delayCapitalIncrease = 0;
    
    // Use centralized function to evaluate each delay option
    while (!found && idealDelay < maxIterations) {
      const result = calculateDelayImpactOnLongevity(
        params.initialCapital,
        params.monthlyInvestment,
        effectiveMonthlyWithdrawal,
        statistics.calculatedRetirementStartYear,
        idealDelay,
        annualReturnRate,
        params.inflation,
        retirementStartAge,
        targetAge,
        0.7 // Conservative multiplier
      );
      
      if (result.lastsUntilTargetAge) {
        found = true;
        
        // Calculate the capital impact for this delay
        const capitalImpact = calculateDelayedRetirementImpact(
          params.initialCapital,
          params.monthlyInvestment,
          effectiveMonthlyWithdrawal,
          statistics.calculatedRetirementStartYear,
          idealDelay,
          annualReturnRate,
          params.inflation
        );
        
        delayedCapital = capitalImpact.delayedCapitalAtRetirement;
        delayCapitalIncrease = capitalImpact.capitalIncrease;
      } else {
        idealDelay++;
      }
    }
    
    // Return complete information about the ideal delay
    return {
      years: found ? idealDelay : maxIterations,
      newCapital: delayedCapital,
      capitalIncrease: delayCapitalIncrease,
      exhaustionAge: targetAge
    };
  }, [params.initialCapital, params.monthlyInvestment, effectiveMonthlyWithdrawal, 
      statistics.calculatedRetirementStartYear, annualReturnRate, params.inflation, 
      retirementStartAge, targetAge]);

  // Calculate the exhaustion age for current plan
  const inflationRate = inflation ?? 2; // Default to 2% if inflation is undefined
  
  const currentExhaustionAge = calculateExhaustionAge(
    capitalAtRetirement,
    effectiveMonthlyWithdrawal,
    annualReturnRate,
    inflationRate,
    retirementStartAge,
    0.7 // Conservative multiplier
  );

  // Calculate exhaustion age for the recommended delay (optimalDelayYears)
  const recommendedExhaustionAge = useMemo(() => {
    if (optimalDelayYears === 0) {
      // If no delay is recommended, return the current exhaustion age
      return currentExhaustionAge;
    }

    // Get the delayed capital at retirement with optimal delay years
    const delayImpact = calculateDelayedRetirementImpact(
      params.initialCapital,
      params.monthlyInvestment,
      effectiveMonthlyWithdrawal,
      statistics.calculatedRetirementStartYear,
      optimalDelayYears,
      annualReturnRate,
      params.inflation
    );

    // Calculate years until exhaustion with the new capital
    const yearsUntilExhaustion = calculateYearsUntilExhaustion(
      delayImpact.delayedCapitalAtRetirement,
      effectiveMonthlyWithdrawal * 12,
      annualReturnRate * 0.7, // Conservative return estimate
      1,
      100
    );

    // The new exhaustion age is retirement age + delay + years until exhaustion
    return retirementStartAge + optimalDelayYears + yearsUntilExhaustion;
  }, [optimalDelayYears, currentExhaustionAge, params, effectiveMonthlyWithdrawal, statistics, annualReturnRate, retirementStartAge]);

  // Calculate years gained with the recommended delay
  const yearsGained = useMemo(() => {
    if (optimalDelayYears === 0) {
      return 0;
    }
    return recommendedExhaustionAge - currentExhaustionAge;
  }, [recommendedExhaustionAge, currentExhaustionAge, optimalDelayYears]);

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

  // Get priority label based on risk level
  const getPriorityLabel = (level: string): string => {
    switch(level) {
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
    <>
      <Card className="overflow-hidden lg:col-span-2">
        <div className={cx(
          "px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between",
          darkMode 
            ? "bg-blue-900/50 border-blue-700" 
            : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
        )}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={cx(
              "h-4 w-4 mr-2",
              darkMode ? "text-blue-400" : "text-blue-600"
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className={cx(
              "mb-0 text-sm sm:text-base font-semibold",
              darkMode ? "text-blue-300" : "text-blue-800"
            )}>Retirement Age Strategy</h3>
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
              ? "bg-blue-900/40 border-blue-700" 
              : "bg-blue-100/70 border-blue-200"
          )}>
            <div className={cx(
              "w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center mr-2.5 mt-0.5",
              darkMode ? "bg-blue-800" : "bg-blue-200"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                "h-4.5 w-4.5",
                darkMode ? "text-blue-300" : "text-blue-600"
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className={cx(
                "text-sm flex items-center gap-1.5",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <span><span className="font-bold">Recommended</span> retirement delay</span>
              </div>
              <div className="flex items-baseline mt-1">
                <PositiveMetric className="text-base">
                  {optimalDelayYears === 0 ? 'No delay needed' : `${optimalDelayYears} years`}
                </PositiveMetric>
                <span className={cx(
                  "text-xs ml-1",
                  darkMode ? "text-blue-400" : "text-blue-700"
                )}>
                  {optimalDelayYears > 0 ? `(+${formatDisplayValue(yearDelayImpact * optimalDelayYears)})` : '(on track)'}
                </span>
              </div>
              <div className={cx(
                "flex items-baseline text-[10px]",
                darkMode ? "text-blue-400" : "text-blue-700"
              )}>
                <span>+{Math.round(yearsGained)} years of retirement coverage</span>
                <span className={cx(
                  "ml-1",
                  darkMode ? "text-gray-500" : "text-gray-500"
                )}>(until age {recommendedExhaustionAge})</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div className={cx(
              "p-2 rounded-lg border",
              darkMode 
                ? "bg-blue-900/30 border-blue-700" 
                : "bg-blue-50/90 border-blue-200"
            )}>
              <div className={cx(
                "text-xs font-medium flex items-center",
                darkMode ? "text-gray-400" : "text-gray-700"
              )}>
                <span className={cx(
                  "h-2 w-2 rounded-full mr-1.5",
                  darkMode ? "bg-blue-600" : "bg-blue-400"
                )}></span>
                <span className="font-bold">Current</span>&nbsp;age
              </div>
              <div className={cx(
                "text-sm font-semibold mt-1",
                darkMode ? "text-gray-300" : "text-gray-800"
              )}>
                {retirementStartAge} years
              </div>
              <div className={cx(
                "text-[10px]",
                darkMode ? "text-gray-400" : "text-gray-700"
              )}>
                Capital: {formatDisplayValue(capitalAtRetirement)}
              </div>
              <div className={cx(
                "text-[10px] mt-1",
                darkMode ? "text-gray-400" : "text-gray-700"
              )}>
                Funds last until age <span className={currentExhaustionAge < params.maxAge 
                  ? darkMode ? "text-red-400" : "text-red-600"
                  : darkMode ? "text-green-400" : "text-green-600"
                }>{currentExhaustionAge}</span>
              </div>
            </div>

            <div className={cx(
              "p-2 rounded-lg border",
              darkMode 
                ? "bg-blue-900/50 border-blue-700" 
                : "bg-blue-100/80 border-blue-200"
            )}>
              <div className={cx(
                "text-xs font-medium flex items-center",
                darkMode ? "text-gray-400" : "text-gray-700"
              )}>
                <span className={cx(
                  "h-2 w-2 rounded-full mr-1.5",
                  darkMode ? "bg-blue-400" : "bg-blue-600"
                )}></span>
                <span className="font-bold">Ideal</span>&nbsp;age
              </div>
              <div className={cx(
                "text-sm font-semibold mt-1",
                darkMode ? "text-blue-300" : "text-blue-800"
              )}>
                {retirementStartAge + idealDelayInfo.years} years
              </div>
              <div className={cx(
                "text-[10px]",
                darkMode ? "text-blue-300" : "text-blue-800"
              )}>
                +{formatDisplayValue(idealDelayInfo.capitalIncrease)} capital
              </div>
              <div className={cx(
                "text-[10px] mt-1",
                darkMode ? "text-blue-300" : "text-blue-800"
              )}>
                Funds last until age <span className="font-semibold">{idealDelayInfo.exhaustionAge}</span>
              </div>
            </div>
          </div>
          
          {/* Capital increase projections */}
          <div className={cx(
            "bg-blue-100/70 rounded-lg p-2.5 border border-blue-200 mb-2.5 cursor-help",
            darkMode ? "bg-blue-900/10 border-blue-700" : ""
          )}
            onMouseEnter={(e) => handleMouseEnter('capitalProjections', e)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <div className="flex items-center mb-2">
              <div className={cx(
                "w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mr-1.5",
                darkMode ? "bg-blue-800" : "bg-blue-200"
              )}>
                <div className={cx(
                  "w-1.5 h-1.5 rounded-full",
                  darkMode ? "bg-blue-400" : "bg-blue-600"
                )}></div>
              </div>
              <div className={cx(
                "text-xs font-medium",
                darkMode ? "text-blue-300" : "text-blue-800"
              )}>Capital increase projections</div>
            </div>
            
            <div className="grid grid-cols-3 gap-1 mb-1">
              <div className={cx(
                "text-[10px] font-medium",
                darkMode ? "text-gray-400" : "text-gray-700"
              )}>+1 year</div>
              <div className={cx(
                "text-[10px] font-medium",
                darkMode ? "text-gray-400" : "text-gray-700"
              )}>+3 years</div>
              <div className={cx(
                "text-[10px] font-medium",
                darkMode ? "text-gray-400" : "text-gray-700"
              )}>+5 years</div>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              <div className={cx(
                "text-xs font-semibold",
                darkMode ? "text-blue-300" : "text-blue-700"
              )}>
                {formatDisplayValue(delayScenarios[0].capital)}
              </div>
              <div className={cx(
                "text-xs font-semibold",
                darkMode ? "text-blue-300" : "text-blue-700"
              )}>
                {formatDisplayValue(delayScenarios[1].capital)}
              </div>
              <div className={cx(
                "text-xs font-semibold",
                darkMode ? "text-blue-300" : "text-blue-700"
              )}>
                {formatDisplayValue(delayScenarios[2].capital)}
              </div>
            </div>
            
            <div className={cx(
              "mt-1.5 w-full rounded-full h-1.5",
              darkMode ? "bg-gray-700" : "bg-gray-200"
            )}>
              <div 
                className={cx(
                  "h-1.5 rounded-full bg-gradient-to-r",
                  darkMode ? "from-blue-700 to-green-700" : "from-blue-500 to-green-500"
                )}
                style={{ 
                  width: `${Math.min(100, (yearDelayImpact * 5) / capitalAtRetirement * 100)}%` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Strategic Timing Review - updated to match Key Recommendations styling */}
          <div className={cx(
            "rounded-lg p-2.5 border mb-2.5",
            darkMode 
              ? getRiskColorClasses(effectiveRiskLevel, darkMode)
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
                  Strategic Timing Review
                </div>
                
                {/* Add back the content with updated styling */}
                <div className={cx(
                  "text-xs",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {risk === 'High' ? (
                    <>
                      {optimalDelayYears === 0 ? (
                        <>
                          <span className={cx(
                            "font-semibold flex items-center",
                            darkMode ? "text-orange-400" : "text-orange-600"
                          )}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Your capital is adequate but has limited safety buffer
                          </span>
                          <ul className={cx(
                            "mt-2 list-disc pl-4 text-xs space-y-1.5",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            <li>Current capital ({formatDisplayValue(capitalAtRetirement)}) is sufficient <span className={cx(
                              "font-medium",
                              darkMode ? "text-orange-400" : "text-orange-600"
                            )}>but has limited buffer</span></li>
                            <li>A 1-2 year delay would add <span className={cx(
                              "font-semibold",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatDisplayValue(delayScenarios[1]?.capital - capitalAtRetirement)}</span> to your capital <span className="font-medium">({Math.ceil((delayScenarios[1]?.capital - capitalAtRetirement) / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This creates a safety margin against market volatility, with projected capital at target age: <span className="font-medium">{formatDisplayValue(Math.max(0, projectedFinalCapital + (delayScenarios[1]?.capital - capitalAtRetirement)))}</span></li>
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
                              Consider a short delay for significantly improved financial security
                            </span>
                            <div className={cx(
                              "mt-1 text-xs",
                              darkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <li><span className={cx(
                                "font-medium",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Capital impact:</span> {formatDisplayValue(delayScenarios[0]?.capital - capitalAtRetirement)} added</li>
                              <li><span className={cx(
                                "font-medium",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Projected retirement age:</span> {retirementStartAge + 1}</li>
                            </div>
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
                            Critical: Delay retirement by {optimalDelayYears} {optimalDelayYears === 1 ? 'year' : 'years'}
                          </span>
                          <ul className={cx(
                            "mt-2 list-disc pl-4 text-xs space-y-1.5",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            <li>Without delay, your capital would be <span className={cx(
                              "font-medium",
                              darkMode ? "text-red-400" : "text-red-600"
                            )}>exhausted before target age</span> <span className={cx(
                              "font-medium",
                              darkMode ? "text-orange-400" : "text-orange-600"
                            )}>(around age {statistics.exhaustionAge || Math.floor(retirementStartAge + (capitalAtRetirement / (effectiveMonthlyWithdrawal * 12)))})</span></li>
                            <li>Delaying adds <span className={cx(
                              "font-semibold",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatDisplayValue(additionalCapital)}</span> to your retirement capital <span className="font-medium">({Math.ceil(additionalCapital / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This addresses <span className={cx(
                              "font-medium",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatPercentage(gapClosurePercentage)}</span> of your capital gap</li>
                            <li>Extends capital longevity by <span className="font-medium">{yearsUntilExhaustionImprovement} years</span></li>
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
                              Consider consulting or flexible work arrangements
                            </span>
                            <div className={cx(
                              "mt-1 text-xs",
                              darkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <span className={cx(
                                "font-medium",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Capital impact:</span> {formatDisplayValue(additionalCapital)} added |
                              <span className={cx(
                                "font-medium ml-1",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Projected retirement age:</span> {retirementStartAge + optimalDelayYears}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : risk === 'Medium' ? (
                    <>
                      {optimalDelayYears === 0 ? (
                        <>
                          <span className={cx(
                            "font-semibold flex items-center",
                            darkMode ? "text-amber-400" : "text-amber-500"
                          )}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Plan Review Needed
                          </span>
                          <ul className={cx(
                            "mt-2 list-disc pl-4 text-xs space-y-1.5",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            <li>Your capital <span className="font-medium">({formatDisplayValue(capitalAtRetirement)})</span> meets required sustainability targets</li>
                            <li>Continue with your current investment and withdrawal strategy</li>
                            <li className={darkMode ? "text-orange-400" : "text-orange-600"}>Consider a 1-year delay for an additional <span className="font-medium">{formatDisplayValue(yearDelayImpact)}</span> safety margin</li>
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
                              Maintain regular reviews and consider extending work period
                            </span>
                            <div className={cx(
                              "mt-1 text-xs",
                              darkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <li><span className={cx(
                                "font-medium",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Capital impact:</span> {formatDisplayValue(yearDelayImpact)} per year</li>
                              <li><span className={cx(
                                "font-medium",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Current retirement age:</span> {retirementStartAge}</li>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className={cx(
                            "font-semibold flex items-center",
                            darkMode ? "text-amber-400" : "text-amber-600"
                          )}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Timing Adjustment Needed
                          </span>
                          <ul className={cx(
                            "mt-2 list-disc pl-4 text-xs space-y-1.5",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            <li>Without delay, your capital would be exhausted before target age <span className={cx(
                              "font-medium",
                              darkMode ? "text-orange-400" : "text-orange-600"
                            )}>(around age {statistics.exhaustionAge || Math.floor(retirementStartAge + (capitalAtRetirement / (effectiveMonthlyWithdrawal * 12)))})</span></li>
                            <li>Delaying adds <span className={cx(
                              "font-semibold",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatDisplayValue(additionalCapital)}</span> to your retirement capital <span className="font-medium">({Math.ceil(additionalCapital / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This addresses <span className={cx(
                              "font-medium",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatPercentage(gapClosurePercentage)}</span> of your capital gap</li>
                            <li>Extends capital longevity by <span className="font-medium">{yearsUntilExhaustionImprovement} years</span></li>
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
                              Consider consulting or part-time work during this period
                            </span>
                            <div className={cx(
                              "mt-1 text-xs",
                              darkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <span className={cx(
                                "font-medium",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Capital impact:</span> {formatDisplayValue(additionalCapital)} added |
                              <span className={cx(
                                "font-medium ml-1",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Projected retirement age:</span> {retirementStartAge + optimalDelayYears}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {optimalDelayYears === 0 ? (
                        <>
                          {projectedFinalCapital > effectiveMonthlyWithdrawal * 12 * 5 ? (
                            <span className={cx(
                              "font-semibold flex items-center",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Your retirement plan is excellent - no delay needed
                            </span>
                          ) : (
                            <span className={cx(
                              "font-semibold flex items-center",
                              darkMode ? "text-orange-400" : "text-orange-600"
                            )}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Your plan is on track, but consider enhancing your buffer
                            </span>
                          )}
                          <ul className={cx(
                            "mt-2 list-disc pl-4 text-xs space-y-1.5",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            <li>Your current capital <span className="font-medium">({formatDisplayValue(capitalAtRetirement)})</span> exceeds sustainability requirements</li>
                            <li>Capital sufficiency ratio: <span className={cx(
                              "font-semibold",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{Math.round((capitalAtRetirement / (totalNeededCapital || capitalAtRetirement)) * 100)}%</span> of target</li>
                            <li>Projected to maintain positive balance through age <span className="font-medium">{params.maxAge}</span></li>
                            <li>Potential for legacy planning: <span className={cx(
                              "font-medium",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatDisplayValue(Math.max(0, projectedFinalCapital))}</span> estimated at end of plan</li>
                            <li>You have flexibility to increase withdrawals by up to <span className={cx(
                              "font-medium",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatPercentage(Math.min(30, (projectedFinalCapital / capitalAtRetirement) * 10))}</span> if desired</li>
                          </ul>
                          {projectedFinalCapital < effectiveMonthlyWithdrawal * 12 * 5 && (
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
                              )}>Optional Enhancement:</span>
                              <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                                Consider a 1-year delay for an additional <span className={cx(
                                  "font-medium",
                                  darkMode ? "text-green-400" : "text-green-600"
                                )}>{formatDisplayValue(delayScenarios[0]?.capital - capitalAtRetirement)}</span> buffer ({Math.ceil((delayScenarios[0]?.capital - capitalAtRetirement) / (effectiveMonthlyWithdrawal * 12))} extra years of safety)
                              </span>
                              <div className={cx(
                                "mt-1 text-xs",
                                darkMode ? "text-gray-300" : "text-gray-700"
                              )}>
                                <span className={cx(
                                  "font-medium",
                                  darkMode ? "text-blue-300" : "text-blue-700"
                                )}>Projected retirement age:</span> {retirementStartAge + 1} |
                                <span className={cx(
                                  "font-medium ml-1",
                                  darkMode ? "text-blue-300" : "text-blue-700"
                                )}>Estimated final capital:</span> {formatDisplayValue(Math.max(0, projectedFinalCapital + (delayScenarios[0]?.capital - capitalAtRetirement)))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span className={cx(
                            "font-semibold flex items-center",
                            darkMode ? "text-blue-400" : "text-blue-600"
                          )}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recommended: Delay retirement by {optimalDelayYears} {optimalDelayYears === 1 ? 'year' : 'years'}
                          </span>
                          <ul className={cx(
                            "mt-2 list-disc pl-4 text-xs space-y-1.5",
                            darkMode ? "text-gray-300" : "text-gray-700"
                          )}>
                            <li>Without delay, your capital would be exhausted before target age <span className={cx(
                              "font-medium",
                              darkMode ? "text-orange-400" : "text-orange-600"
                            )}>(around age {statistics.exhaustionAge || Math.floor(retirementStartAge + (capitalAtRetirement / (effectiveMonthlyWithdrawal * 12)))})</span></li>
                            <li>Delaying adds <span className={cx(
                              "font-semibold",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatDisplayValue(additionalCapital)}</span> to your retirement capital <span className="font-medium">({Math.ceil(additionalCapital / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This addresses <span className={cx(
                              "font-medium",
                              darkMode ? "text-green-400" : "text-green-600"
                            )}>{formatPercentage(gapClosurePercentage)}</span> of your capital gap</li>
                            <li>Extends capital longevity by <span className="font-medium">{yearsUntilExhaustionImprovement} years</span></li>
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
                              Consider part-time work, consulting, or phased retirement
                            </span>
                            <div className={cx(
                              "mt-1 text-xs",
                              darkMode ? "text-gray-300" : "text-gray-700"
                            )}>
                              <span className={cx(
                                "font-medium",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Capital impact:</span> {formatDisplayValue(additionalCapital)} added |
                              <span className={cx(
                                "font-medium ml-1",
                                darkMode ? "text-blue-300" : "text-blue-700"
                              )}>Projected retirement age:</span> {retirementStartAge + optimalDelayYears}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Portal for tooltips - positioned fixed relative to viewport */}
      {hoveredSection && (
        <div
          className="fixed shadow-xl"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 100}px`,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {getTooltipContent(hoveredSection)}
        </div>
      )}
    </>
  );
};

export default RetirementDelayCard; 