import React, { useState, useMemo } from 'react';
import { FormatAmountFunction, WithdrawalMode } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card, PositiveMetric } from '../../common/StyledComponents';
import { calculateYearsUntilExhaustion, calculateDelayedScenario, calculateDelayedRetirementImpact } from '../../../utils/financialCalculations';
import { formatPercentage } from '../../../utils/formatters';

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
  inflation
}) => {
  // State to track which section is being hovered
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  // State to track tooltip position
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Handle mouse enter with position
  const handleMouseEnter = (sectionType: string, e: React.MouseEvent) => {
    setHoveredSection(sectionType);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Get effective withdrawal amount considering inflation adjustment
  const getEffectiveWithdrawalAmount = () => {
    if (inflationAdjustedWithdrawal && withdrawalMode === "amount" && inflation !== undefined) {
      // Calculate years until retirement
      const yearsUntilRetirement = retirementStartAge - currentAge;
      
      // Calculate inflation-adjusted withdrawal
      return monthlyRetirementWithdrawal * Math.pow(1 + inflation / 100, yearsUntilRetirement);
    }
    return monthlyRetirementWithdrawal;
  };

  const effectiveMonthlyWithdrawal = getEffectiveWithdrawalAmount();

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
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64 z-50">
            <h3 className="font-semibold text-gray-800 mb-1">Current Retirement Plan</h3>
            <p className="text-xs text-gray-600">Your current planned retirement starting at age {retirementStartAge}.</p>
            <p className="text-xs text-gray-600 mt-1">Projected retirement capital: <span className="font-semibold">{formatDisplayValue(capitalAtRetirement)}</span></p>
            <p className="text-xs text-gray-600 mt-1">This is your baseline retirement plan without any timing adjustments.</p>
          </div>
        );
      case 'optimizedPlan':
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64 z-50">
            <h3 className="font-semibold text-gray-800 mb-1">Optimized Retirement Plan</h3>
            <p className="text-xs text-gray-600">Recommended delay: <span className="font-semibold">{optimalDelayYears} {optimalDelayYears === 1 ? 'year' : 'years'}</span></p>
            <p className="text-xs text-gray-600 mt-1">This represents a <span className="font-semibold">{formatPercentage(percentageIncrease)}</span> increase in retirement capital.</p>
            {isMaxDelayInsufficient && (
              <p className="text-xs text-red-600 mt-1">Note: Even with this delay, additional strategies will be needed to reach your target.</p>
            )}
          </div>
        );
      case 'capitalProjections':
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64 z-50">
            <h3 className="font-semibold text-gray-800 mb-1">Capital Projection Logic</h3>
            <p className="text-xs text-gray-600">Our recommendation is based on ensuring your capital isn't exhausted before your target age ({params.maxAge}).</p>
            <p className="text-xs text-gray-600 mt-1">Delaying retirement has multiple benefits:</p>
            <ul className="text-xs text-gray-600 mt-1 list-disc pl-4">
              <li>Additional retirement contributions</li>
              <li>Extra investment growth time</li>
              <li>Fewer years of capital drawdown</li>
            </ul>
            <p className="text-xs text-gray-600 mt-1">We've simulated your capital evolution to find the minimum delay needed to prevent exhaustion.</p>
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
  const calculateIdealDelay = useMemo(() => {
    // Start with current retirement age and increment until we find a solution
    let idealDelay = 0;
    let maxIterations = 20; // Reasonable maximum to prevent infinite loops
    let found = false;
    
    const simulateRetirementWithDelay = (delayYears: number) => {
      const delayedRetirementAge = retirementStartAge + delayYears;
      const result = calculateDelayedRetirementImpact(
        params.initialCapital,
        params.monthlyInvestment,
        effectiveMonthlyWithdrawal,
        statistics.calculatedRetirementStartYear,
        delayYears,
        annualReturnRate,
        params.inflation
      );
      
      // Calculate if this capital would last until target age
      const yearsUntilExhaustion = calculateYearsUntilExhaustion(
        result.delayedCapitalAtRetirement,
        effectiveMonthlyWithdrawal * 12,
        annualReturnRate * 0.7, // Conservative return estimate
        1,
        100
      );
      
      const exhaustionAge = delayedRetirementAge + yearsUntilExhaustion;
      return exhaustionAge >= targetAge;
    };

    // Find minimum delay needed to reach target age
    while (!found && idealDelay < maxIterations) {
      if (simulateRetirementWithDelay(idealDelay)) {
        found = true;
      } else {
        idealDelay++;
      }
    }

    // Calculate the capital impact of this delay
    const idealImpact = calculateDelayedRetirementImpact(
      params.initialCapital,
      params.monthlyInvestment,
      effectiveMonthlyWithdrawal,
      statistics.calculatedRetirementStartYear,
      idealDelay,
      annualReturnRate,
      params.inflation
    );

    return {
      years: idealDelay,
      newCapital: idealImpact.delayedCapitalAtRetirement,
      capitalIncrease: idealImpact.capitalIncrease,
      exhaustionAge: targetAge
    };
  }, [retirementStartAge, params, effectiveMonthlyWithdrawal, statistics, annualReturnRate, targetAge]);

  // Calculate current exhaustion age
  const currentExhaustionAge = useMemo(() => {
    const yearsUntilExhaustion = calculateYearsUntilExhaustion(
      capitalAtRetirement,
      effectiveMonthlyWithdrawal * 12,
      annualReturnRate * 0.7,
      1,
      100
    );
    return retirementStartAge + yearsUntilExhaustion;
  }, [capitalAtRetirement, effectiveMonthlyWithdrawal, annualReturnRate, retirementStartAge]);

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

  return (
    <>
      <Card className="overflow-hidden lg:col-span-2">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-blue-200 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <SectionTitle className="text-blue-800 mb-0 text-sm sm:text-base">Retirement Age Strategy</SectionTitle>
          </div>
          <div className={cx(
            "text-xs font-medium px-1.5 py-0.5 rounded-full",
            risk === 'High' ? "bg-red-100 text-red-700" : 
            risk === 'Medium' ? "bg-yellow-100 text-yellow-700" : 
            "bg-blue-100 text-blue-700"
          )}>
            {risk === 'High' ? 'Critical' : risk === 'Medium' ? 'Recommended' : 'Optional'}
          </div>
        </div>
        <div className="p-2 sm:p-3">
          <div className="flex items-start mb-2.5 p-2 bg-blue-50/70 rounded-lg border border-blue-100">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center mr-2.5 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-700 flex items-center gap-1.5">
                <span><span className="font-bold">Recommended</span> retirement delay</span>
              </div>
              <div className="flex items-baseline mt-1">
                <PositiveMetric className="text-base">
                  {optimalDelayYears === 0 ? 'No delay needed' : `${optimalDelayYears} years`}
                </PositiveMetric>
                <span className="text-xs text-blue-700 ml-1">
                  {optimalDelayYears > 0 ? `(+${formatDisplayValue(yearDelayImpact * optimalDelayYears)})` : '(on track)'}
                </span>
              </div>
              <div className="flex items-baseline text-[10px] text-blue-700">
                <span>+{Math.round(yearsGained)} years of retirement coverage</span>
                <span className="text-gray-500 ml-1">(until age {recommendedExhaustionAge})</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
              <div className="text-xs font-medium text-gray-500 flex items-center">
                <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5"></span>
                <span className="font-bold">Current</span>&nbsp;age
              </div>
              <div className="text-sm font-semibold text-gray-700 mt-1">
                {retirementStartAge} years
              </div>
              <div className="text-[10px] text-gray-500">
                Capital: {formatDisplayValue(capitalAtRetirement)}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Funds last until age <span className={currentExhaustionAge < params.maxAge ? "text-red-500" : "text-green-500"}>{currentExhaustionAge}</span>
              </div>
            </div>

            <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
              <div className="text-xs font-medium text-gray-500 flex items-center">
                <span className="h-2 w-2 rounded-full bg-purple-500 mr-1.5"></span>
                <span className="font-bold">Ideal</span>&nbsp;age
              </div>
              <div className="text-sm font-semibold text-purple-700 mt-1">
                {retirementStartAge + calculateIdealDelay.years} years
              </div>
              <div className="text-[10px] text-purple-700">
                +{formatDisplayValue(calculateIdealDelay.capitalIncrease)} capital
              </div>
              <div className="text-[10px] text-purple-700 mt-1">
                Funds last until age <span className="font-semibold">{calculateIdealDelay.exhaustionAge}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100 mb-2.5 cursor-help"
            onMouseEnter={(e) => handleMouseEnter('capitalProjections', e)}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center mr-1.5">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              </div>
              <div className="text-xs font-medium text-blue-800">Capital increase projections</div>
            </div>
            
            <div className="grid grid-cols-3 gap-1 mb-1">
              <div className="text-[10px] font-medium text-gray-500">+1 year</div>
              <div className="text-[10px] font-medium text-gray-500">+3 years</div>
              <div className="text-[10px] font-medium text-gray-500">+5 years</div>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              <div className="text-xs font-semibold text-blue-700">
                {formatDisplayValue(delayScenarios[0].capital)}
              </div>
              <div className="text-xs font-semibold text-blue-700">
                {formatDisplayValue(delayScenarios[1].capital)}
              </div>
              <div className="text-xs font-semibold text-blue-700">
                {formatDisplayValue(delayScenarios[2].capital)}
              </div>
            </div>
            
            <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                style={{ 
                  width: `${Math.min(100, (yearDelayImpact * 5) / capitalAtRetirement * 100)}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg p-2.5 border border-blue-100">
            <div className="text-xs space-y-2">
              <div>
                <div className="text-xs font-medium text-blue-800 mb-1 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Strategic Timing Review
                </div>
                <div className="text-gray-600">
                  {risk === 'High' ? (
                    <>
                      {optimalDelayYears === 0 ? (
                        <>
                          <span className="font-semibold text-orange-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Your capital is adequate but has limited safety buffer
                          </span>
                          <ul className="mt-2 list-disc pl-4 text-xs space-y-1.5">
                            <li>Current capital ({formatDisplayValue(capitalAtRetirement)}) is sufficient <span className="font-medium text-orange-600">but has limited buffer</span></li>
                            <li>A 1-2 year delay would add <span className="font-semibold text-green-600">{formatDisplayValue(delayScenarios[1]?.capital - capitalAtRetirement)}</span> to your capital <span className="font-medium">({Math.ceil((delayScenarios[1]?.capital - capitalAtRetirement) / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This creates a safety margin against market volatility, with projected capital at target age: <span className="font-medium">{formatDisplayValue(Math.max(0, projectedFinalCapital + (delayScenarios[1]?.capital - capitalAtRetirement)))}</span></li>
                          </ul>
                          <div className="bg-blue-50 border-l-4 border-blue-500 pl-3 py-1.5 mt-2 rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-800 font-medium">Recommended Action:</span> Consider a short delay for significantly improved financial security
                            <div className="mt-1 text-xs">
                              <li><span className="text-blue-700 font-medium">Capital impact:</span> {formatDisplayValue(delayScenarios[0]?.capital - capitalAtRetirement)} added</li>
                              <li><span className="text-blue-700 font-medium">Projected retirement age:</span> {retirementStartAge + 1}</li>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-red-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Critical: Delay retirement by {optimalDelayYears} {optimalDelayYears === 1 ? 'year' : 'years'}
                          </span>
                          <ul className="mt-2 list-disc pl-4 text-xs space-y-1.5">
                            <li>Without delay, your capital would be <span className="font-medium text-red-600">exhausted before target age</span> <span className="font-medium text-orange-600">(around age {statistics.exhaustionAge || Math.floor(retirementStartAge + (capitalAtRetirement / (effectiveMonthlyWithdrawal * 12)))})</span></li>
                            <li>Delaying adds <span className="font-semibold text-green-600">{formatDisplayValue(additionalCapital)}</span> to your retirement capital <span className="font-medium">({Math.ceil(additionalCapital / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This addresses <span className="font-medium text-green-600">{formatPercentage(gapClosurePercentage)}</span> of your capital gap</li>
                            <li>Extends capital longevity by <span className="font-medium">{yearsUntilExhaustionImprovement} years</span></li>
                          </ul>
                          <div className="bg-blue-50 border-l-4 border-blue-500 pl-3 py-1.5 mt-2 rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-800 font-medium">Recommended Action:</span> Consider consulting or flexible work arrangements
                            <div className="mt-1 text-xs">
                              <li><span className="text-blue-700 font-medium">Capital impact:</span> {formatDisplayValue(additionalCapital)} added</li>
                              <li><span className="text-blue-700 font-medium">Projected retirement age:</span> {retirementStartAge + optimalDelayYears}</li>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : risk === 'Medium' ? (
                    <>
                      {optimalDelayYears === 0 ? (
                        <>
                          <span className="font-semibold text-amber-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Plan Review Needed
                          </span>
                          <ul className="mt-2 list-disc pl-4 text-xs space-y-1.5">
                            <li>Your capital <span className="font-medium">({formatDisplayValue(capitalAtRetirement)})</span> meets required sustainability targets</li>
                            <li>Continue with your current investment and withdrawal strategy</li>
                            <li className="text-orange-600">Consider a 1-year delay for an additional <span className="font-medium">{formatDisplayValue(yearDelayImpact)}</span> safety margin</li>
                          </ul>
                          <div className="bg-blue-50 border-l-4 border-blue-500 pl-3 py-1.5 mt-2 rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-800 font-medium">Action:</span> Maintain regular reviews and consider extending work period
                            <div className="mt-1 text-xs">
                              <li><span className="text-blue-700 font-medium">Capital impact:</span> {formatDisplayValue(yearDelayImpact)} per year</li>
                              <li><span className="text-blue-700 font-medium">Current retirement age:</span> {retirementStartAge}</li>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-amber-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Timing Adjustment Needed
                          </span>
                          <ul className="mt-2 list-disc pl-4 text-xs space-y-1.5">
                            <li>Without delay, your capital would be exhausted before target age <span className="font-medium text-orange-600">(around age {statistics.exhaustionAge || Math.floor(retirementStartAge + (capitalAtRetirement / (effectiveMonthlyWithdrawal * 12)))})</span></li>
                            <li>Delaying adds <span className="font-semibold text-green-600">{formatDisplayValue(additionalCapital)}</span> to your retirement capital <span className="font-medium">({Math.ceil(additionalCapital / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This addresses <span className="font-medium text-green-600">{formatPercentage(gapClosurePercentage)}</span> of your capital gap</li>
                            <li>Extends capital longevity by <span className="font-medium">{yearsUntilExhaustionImprovement} years</span></li>
                          </ul>
                          <div className="bg-blue-50 border-l-4 border-blue-500 pl-3 py-1.5 mt-2 rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-800 font-medium">Recommended Action:</span> Consider consulting or part-time work during this period
                            <div className="mt-1 text-xs">
                              <span className="text-blue-700 font-medium">Capital impact:</span> {formatDisplayValue(additionalCapital)} added |
                              <span className="text-blue-700 font-medium ml-1">Projected retirement age:</span> {retirementStartAge + optimalDelayYears}
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
                            <span className="font-semibold text-green-600 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Your retirement plan is excellent - no delay needed
                            </span>
                          ) : (
                            <span className="font-semibold text-orange-600 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Your plan is on track, but consider enhancing your buffer
                            </span>
                          )}
                          <ul className="mt-2 list-disc pl-4 text-xs space-y-1.5">
                            <li>Your current capital <span className="font-medium">({formatDisplayValue(capitalAtRetirement)})</span> exceeds sustainability requirements</li>
                            <li>Capital sufficiency ratio: <span className="font-semibold text-green-600">{Math.round((capitalAtRetirement / (totalNeededCapital || capitalAtRetirement)) * 100)}%</span> of target</li>
                            <li>Projected to maintain positive balance through age <span className="font-medium">{params.maxAge}</span></li>
                            <li>Potential for legacy planning: <span className="font-medium text-green-600">{formatDisplayValue(Math.max(0, projectedFinalCapital))}</span> estimated at end of plan</li>
                            <li>You have flexibility to increase withdrawals by up to <span className="font-medium text-green-600">{formatPercentage(Math.min(30, (projectedFinalCapital / capitalAtRetirement) * 10))}</span> if desired</li>
                          </ul>
                          {projectedFinalCapital < effectiveMonthlyWithdrawal * 12 * 5 && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 pl-3 py-1.5 mt-2 rounded-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-blue-800 font-medium">Optional Enhancement:</span> Consider a 1-year delay for an additional <span className="font-medium text-green-600">{formatDisplayValue(delayScenarios[0]?.capital - capitalAtRetirement)}</span> buffer ({Math.ceil((delayScenarios[0]?.capital - capitalAtRetirement) / (effectiveMonthlyWithdrawal * 12))} extra years of safety)
                              <div className="mt-1 text-xs">
                                <span className="text-blue-700 font-medium">Projected retirement age:</span> {retirementStartAge + 1} |
                                <span className="text-blue-700 font-medium ml-1">Estimated final capital:</span> {formatDisplayValue(Math.max(0, projectedFinalCapital + (delayScenarios[0]?.capital - capitalAtRetirement)))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-blue-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recommended: Delay retirement by {optimalDelayYears} {optimalDelayYears === 1 ? 'year' : 'years'}
                          </span>
                          <ul className="mt-2 list-disc pl-4 text-xs space-y-1.5">
                            <li>Without delay, your capital would be exhausted before target age <span className="font-medium text-orange-600">(around age {statistics.exhaustionAge || Math.floor(retirementStartAge + (capitalAtRetirement / (effectiveMonthlyWithdrawal * 12)))})</span></li>
                            <li>Delaying adds <span className="font-semibold text-green-600">{formatDisplayValue(additionalCapital)}</span> to your retirement capital <span className="font-medium">({Math.ceil(additionalCapital / (effectiveMonthlyWithdrawal * 12))} additional years of safety)</span></li>
                            <li>This addresses <span className="font-medium text-green-600">{formatPercentage(gapClosurePercentage)}</span> of your capital gap</li>
                            <li>Extends capital longevity by <span className="font-medium">{yearsUntilExhaustionImprovement} years</span></li>
                          </ul>
                          <div className="bg-blue-50 border-l-4 border-blue-500 pl-3 py-1.5 mt-2 rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline mr-1 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-blue-800 font-medium">Recommended Action:</span> Consider part-time work, consulting, or phased retirement
                            <div className="mt-1 text-xs">
                              <span className="text-blue-700 font-medium">Capital impact:</span> {formatDisplayValue(additionalCapital)} added |
                              <span className="text-blue-700 font-medium ml-1">Projected retirement age:</span> {retirementStartAge + optimalDelayYears}
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