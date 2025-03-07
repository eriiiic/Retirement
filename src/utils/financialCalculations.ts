import * as financial from 'financial';

/**
 * Financial calculation utilities for retirement planning
 * Using specialized financial math library for improved accuracy
 */

/**
 * Calculate future value of an investment with regular contributions
 * @param principal Initial investment amount
 * @param annualRate Annual interest rate (as percentage, e.g., 5 for 5%)
 * @param years Number of years
 * @param monthlyContribution Monthly contribution amount
 * @param compoundFrequency Frequency of compounding ('monthly' or 'annual')
 * @returns Future value
 */
export const calculateFutureValue = (
  principal: number,
  annualRate: number,
  years: number,
  monthlyContribution: number,
  compoundFrequency: 'monthly' | 'annual' = 'monthly'
): number => {
  const annualRateDecimal = annualRate / 100;
  
  if (compoundFrequency === 'monthly') {
    // Convert annual rate to monthly rate for monthly compounding
    const monthlyRate = Math.pow(1 + annualRateDecimal, 1/12) - 1;
    const totalMonths = years * 12;
    
    // Calculate future value of initial principal with monthly compounding
    const principalFV = principal * Math.pow(1 + monthlyRate, totalMonths);
    
    // Calculate future value of regular contributions with monthly compounding
    const contributionFV = monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    
    return principalFV + contributionFV;
  } else {
    // Annual compounding
    // First calculate annual contribution from monthly contributions
    const annualContribution = monthlyContribution * 12;
    
    // Calculate future value with annual compounding
    let totalValue = principal;
    
    for (let i = 0; i < years; i++) {
      // Add annual contribution at the beginning of the year
      totalValue += annualContribution;
      
      // Apply annual interest
      totalValue *= (1 + annualRateDecimal);
    }
    
    return totalValue;
  }
};

/**
 * Calculate withdrawal amount for a given retirement duration
 * @param principal Capital at retirement
 * @param annualRate Annual interest rate (as percentage, e.g., 5 for 5%)
 * @param years Number of years in retirement
 * @param inflation Annual inflation rate (as percentage)
 * @param compoundFrequency Frequency of compounding ('monthly' or 'annual')
 * @returns Monthly withdrawal amount
 */
export const calculateWithdrawalAmount = (
  principal: number,
  annualRate: number,
  years: number,
  inflation: number,
  compoundFrequency: 'monthly' | 'annual' = 'monthly'
): number => {
  // Calculate real rate (adjusted for inflation) using the Fisher equation
  const nominalRate = annualRate / 100;
  const inflationRate = inflation / 100;
  const realAnnualRate = (1 + nominalRate) / (1 + inflationRate) - 1;
  
  if (compoundFrequency === 'monthly') {
    // Convert to monthly rate for monthly compounding
    const realMonthlyRate = Math.pow(1 + realAnnualRate, 1/12) - 1;
    const totalMonths = years * 12;
    
    // Calculate monthly payment (PMT) that will exhaust the principal over the retirement period
    // Using the formula for payment of an annuity with monthly compounding
    if (realMonthlyRate <= 0) {
      // If real rate is zero or negative, use simple division
      return principal / totalMonths;
    }
    
    const monthlyWithdrawal = principal * realMonthlyRate / (1 - Math.pow(1 + realMonthlyRate, -totalMonths));
    
    return monthlyWithdrawal;
  } else {
    // Annual compounding
    const totalMonths = years * 12;
    
    if (realAnnualRate <= 0) {
      // If real rate is zero or negative, use simple division
      return principal / totalMonths;
    }
    
    // For annual compounding, we need to determine what monthly withdrawal would
    // deplete the principal over the specified years with annual interest calculation
    
    // This is a simplified approximation for annual compounding
    // A more accurate computation would require iterative or solver approaches
    const annualWithdrawal = principal * realAnnualRate / (1 - Math.pow(1 + realAnnualRate, -years));
    const monthlyWithdrawal = annualWithdrawal / 12;
    
    return monthlyWithdrawal;
  }
};

/**
 * Calculate capital needed for a specific monthly withdrawal
 * @param monthlyWithdrawal Desired monthly withdrawal amount
 * @param annualRate Annual interest rate (as percentage, e.g., 5 for 5%)
 * @param years Number of years in retirement
 * @param inflation Annual inflation rate (as percentage)
 * @param compoundFrequency Frequency of compounding ('monthly' or 'annual')
 * @returns Capital needed at retirement
 */
export const calculateCapitalNeeded = (
  monthlyWithdrawal: number,
  annualRate: number,
  years: number,
  inflation: number,
  compoundFrequency: 'monthly' | 'annual' = 'monthly'
): number => {
  // Calculate real rate (adjusted for inflation) using the Fisher equation
  const nominalRate = annualRate / 100;
  const inflationRate = inflation / 100;
  const realAnnualRate = (1 + nominalRate) / (1 + inflationRate) - 1;
  
  if (compoundFrequency === 'monthly') {
    // Convert to monthly rate for monthly compounding
    const realMonthlyRate = Math.pow(1 + realAnnualRate, 1/12) - 1;
    const totalMonths = years * 12;
    
    // Calculate present value (PV) of the annuity with monthly compounding
    if (realMonthlyRate <= 0) {
      // If real rate is zero or negative, use simple multiplication
      return monthlyWithdrawal * totalMonths;
    }
    
    const capitalNeeded = monthlyWithdrawal * (1 - Math.pow(1 + realMonthlyRate, -totalMonths)) / realMonthlyRate;
    
    return capitalNeeded;
  } else {
    // Annual compounding
    const annualWithdrawal = monthlyWithdrawal * 12;
    
    if (realAnnualRate <= 0) {
      // If real rate is zero or negative, use simple multiplication
      return annualWithdrawal * years;
    }
    
    // Present value calculation with annual compounding
    const capitalNeeded = annualWithdrawal * (1 - Math.pow(1 + realAnnualRate, -years)) / realAnnualRate;
    
    return capitalNeeded;
  }
};

/**
 * Calculate internal rate of return (IRR) for a series of cash flows
 * @param cashFlows Array of cash flows (negative for investments, positive for returns)
 * @returns Annual IRR as a percentage
 */
export const calculateIRR = (cashFlows: number[]): number => {
  // Calculate IRR and convert to percentage
  return financial.irr(cashFlows) * 100;
};

/**
 * Calculate inflation-adjusted value
 * @param currentValue Current monetary value
 * @param inflationRate Annual inflation rate (as percentage)
 * @param years Number of years
 * @returns Inflation-adjusted value
 */
export const calculateInflationAdjustedValue = (
  currentValue: number,
  inflationRate: number,
  years: number
): number => {
  return currentValue * Math.pow(1 + inflationRate / 100, years);
};

/**
 * Calculate present value of a future amount
 * @param futureValue Future monetary value
 * @param annualRate Annual interest rate (as percentage)
 * @param years Number of years
 * @returns Present value
 */
export const calculatePresentValue = (
  futureValue: number,
  annualRate: number,
  years: number
): number => {
  // Convert annual rate to monthly rate
  const monthlyRate = Math.pow(1 + annualRate / 100, 1/12) - 1;
  const totalMonths = years * 12;
  
  // Calculate present value with monthly compounding
  return futureValue / Math.pow(1 + monthlyRate, totalMonths);
};

/**
 * Calculate rate-based monthly withdrawal amount
 * @param capital Current capital amount
 * @param withdrawalRate Annual withdrawal rate (as percentage, e.g., 4 for 4%)
 * @returns Monthly withdrawal amount
 */
export const calculateRateBasedWithdrawal = (
  capital: number,
  withdrawalRate: number
): number => {
  // Convert annual rate to monthly amount (divide by 12)
  return (capital * (withdrawalRate / 100)) / 12;
};

/**
 * Consolidated function for all capital calculations in the application
 * @param initialCapital Initial capital amount 
 * @param monthlyInvestment Monthly investment amount
 * @param annualReturnRate Annual return rate percentage
 * @param inflation Annual inflation rate percentage
 * @param years Years until retirement
 * @param compoundFrequency Compounding frequency
 * @returns Object containing various capital calculations
 */
export const calculateCapitalMetrics = (
  initialCapital: number,
  monthlyInvestment: number,
  annualReturnRate: number,
  inflation: number,
  years: number,
  compoundFrequency: 'monthly' | 'annual' = 'monthly'
): {
  capitalAtRetirement: number;
  totalInvestedAmount: number;
  growthAmount: number;
  growthPercentage: number;
} => {
  // Calculate future value (capital at retirement)
  const capitalAtRetirement = calculateFutureValue(
    initialCapital,
    annualReturnRate,
    years,
    monthlyInvestment,
    compoundFrequency
  );
  
  // Calculate total invested amount
  const totalInvestedAmount = initialCapital + (monthlyInvestment * 12 * years);
  
  // Calculate growth amount and percentage
  const growthAmount = capitalAtRetirement - totalInvestedAmount;
  const growthPercentage = (growthAmount / totalInvestedAmount) * 100;
  
  return {
    capitalAtRetirement,
    totalInvestedAmount,
    growthAmount,
    growthPercentage
  };
};

/**
 * Calculate delayed retirement scenario
 * 
 * IMPORTANT: This function is used in multiple places throughout the application to ensure
 * consistency in delayed retirement calculations:
 * - CapitalEvolutionChart.tsx - For visualizing different delay scenarios
 * - RetirementDelayCard.tsx - For calculating optimal delay years and showing recommendations
 * - useRetirementAnalyses.ts - For calculating yearDelayImpact
 * 
 * Any changes to this function may affect multiple components! Always ensure all components
 * are using the same calculation methodology.
 * 
 * @param initialCapital Initial capital amount
 * @param monthlyInvestment Monthly investment amount
 * @param monthlyWithdrawal Monthly withdrawal in retirement
 * @param retirementYear Planned retirement year
 * @param delayYears Number of years to delay retirement
 * @param currentYear Current simulation year
 * @param annualReturnRate Annual return rate percentage
 * @param inflation Annual inflation rate percentage
 * @returns Updated capital after 1 year in the delayed scenario
 */
export const calculateDelayedScenario = (
  initialCapital: number,
  monthlyInvestment: number,
  monthlyWithdrawal: number,
  retirementYear: number,
  delayYears: number,
  currentYear: number,
  annualReturnRate: number,
  inflation: number
): { 
  capital: number;
  investment: number;
  withdrawal: number;
} => {
  let capital = initialCapital;
  let investment = monthlyInvestment;
  let withdrawal = monthlyWithdrawal;
  
  const delayedRetirementYear = retirementYear + delayYears;
  const isRetired = currentYear >= delayedRetirementYear;
  
  if (!isRetired) {
    // Investment phase: apply returns on capital + monthly investments
    capital = calculateFutureValue(capital, annualReturnRate, 1, investment, 'monthly');
    investment *= (1 + inflation / 100);
  } else {
    // Retirement phase: apply returns on capital - monthly withdrawals
    // Note: The withdrawal is already inflation-adjusted through the progression of the simulation
    // We don't need to explicitly adjust it for the delay period
    capital = calculateFutureValue(capital, annualReturnRate, 1, -withdrawal, 'monthly');
    withdrawal *= (1 + inflation / 100); // Adjust withdrawal for next year's inflation
  }
  
  return { 
    capital, 
    investment, 
    withdrawal 
  };
};

/**
 * Calculate remaining time to retirement
 * @param retirementYear Year of planned retirement
 * @returns Object with years, months, days, and hours or null if already retired
 */
export const calculateTimeToRetirement = (retirementYear: number): {
  years: number;
  months: number;
  days: number;
  hours: number;
} | null => {
  const now = new Date();
  const retirementDate = new Date(retirementYear, 0, 1); // January 1st of retirement year
  
  const difference = retirementDate.getTime() - now.getTime();
  
  if (difference <= 0) return null;
  
  const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor((difference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  const days = Math.floor((difference % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return { years, months, days, hours };
};

/**
 * Format large numbers for display in charts
 * @param value Number to format
 * @returns Formatted string with K for thousands and M for millions
 */
export const formatChartValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

/**
 * Calculate phase summary metrics for schedule details
 * @param data Array of data points representing a phase
 * @returns Summary metrics for the phase
 */
export const calculatePhaseSummary = (data: any[]): {
  years: number;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  startCapital: number;
  endCapital: number;
  totalInterest: number;
  totalInvestment: number;
  totalWithdrawal: number;
} | null => {
  if (!data.length) return null;
  
  const firstEntry = data[0];
  const lastEntry = data[data.length - 1];
  
  const totalInterest = data.reduce((sum, entry) => sum + entry.annualInterest, 0);
  const totalInvestment = data.reduce((sum, entry) => sum + entry.annualInvestment, 0);
  const totalWithdrawal = data.reduce((sum, entry) => sum + entry.annualWithdrawal, 0);
  
  return {
    years: data.length,
    startYear: firstEntry.year,
    endYear: lastEntry.year,
    startAge: firstEntry.age,
    endAge: lastEntry.age,
    startCapital: firstEntry.capital - firstEntry.variation,
    endCapital: lastEntry.capital,
    totalInterest,
    totalInvestment,
    totalWithdrawal
  };
};

/**
 * Find retirement start index in graph data
 * @param graphData Array of graph data points
 * @returns Index of the first retirement point or -1 if not found
 */
export const findRetirementStartIndex = (graphData: any[]): number => {
  return graphData.findIndex(point => point.retirement === "Yes");
};

/**
 * Find the year when capital withdrawals start decreasing
 * @param graphData Array of graph data points
 * @returns The year when withdrawals start decreasing or null if not applicable
 */
export const findCapitalWithdrawalDecreaseYear = (graphData: any[]): number | null => {
  const retirementIndex = findRetirementStartIndex(graphData);
  if (retirementIndex === -1) return null;

  const decreasePoint = graphData.slice(retirementIndex).find((point, index, arr) => 
    index > 0 && point.annualWithdrawal < arr[index - 1].annualWithdrawal
  );
  return decreasePoint?.year || null;
};

/**
 * Calculate effective retirement duration when capital gets exhausted
 * @param graphData Array of graph data points
 * @param defaultDuration Default retirement duration if not exhausted
 * @returns Effective retirement duration in years
 */
export const calculateEffectiveRetirementDuration = (
  graphData: any[], 
  defaultDuration: number
): number => {
  const retirementYearIndex = findRetirementStartIndex(graphData);
  const exhaustionIndex = graphData.length - 1;
  
  if (retirementYearIndex !== -1) {
    return exhaustionIndex - retirementYearIndex + 1;
  }
  
  return defaultDuration;
};

/**
 * Calculate how many years a capital will last with given withdrawal and return rates
 * @param capital Initial capital amount
 * @param annualWithdrawal Annual withdrawal amount
 * @param annualReturnRate Annual return rate percentage
 * @param conservativeMultiplier Multiplier to apply to return rate for conservative estimate (default 0.7)
 * @param maxYears Maximum years to calculate (to prevent infinite loops)
 * @returns Number of years the capital will last
 */
export const calculateYearsUntilExhaustion = (
  capital: number,
  annualWithdrawal: number,
  annualReturnRate: number,
  conservativeMultiplier: number = 0.7,
  maxYears: number = 50
): number => {
  const conservativeReturnRate = annualReturnRate * conservativeMultiplier / 100;
  let remainingCapital = capital;
  let years = 0;
  
  while (remainingCapital > 0 && years < maxYears) {
    const annualReturn = remainingCapital * conservativeReturnRate;
    remainingCapital = remainingCapital + annualReturn - annualWithdrawal;
    if (remainingCapital > 0) years++;
  }
  
  return years;
};

/**
 * Calculate the impact of delaying retirement by a specified number of years.
 * This function provides a consistent calculation method to be used across all components.
 * 
 * @param initialCapital The initial capital at the start of simulation (NOT capital at retirement)
 * @param monthlyInvestment Monthly investment amount
 * @param monthlyWithdrawal Monthly withdrawal amount during retirement
 * @param retirementYear Original planned retirement year
 * @param delayYears Number of years to delay retirement
 * @param annualReturnRate Annual return rate percentage
 * @param inflation Annual inflation rate percentage
 * @param currentYear Current year for simulation start (optional, defaults to current year)
 * @returns Object containing capital at delayed retirement and other metrics
 */
export const calculateDelayedRetirementImpact = (
  initialCapital: number,
  monthlyInvestment: number,
  monthlyWithdrawal: number,
  retirementYear: number,
  delayYears: number,
  annualReturnRate: number,
  inflation: number,
  currentYear: number = new Date().getFullYear()
): {
  originalCapitalAtRetirement: number;
  delayedCapitalAtRetirement: number;
  capitalIncrease: number;
  percentageIncrease: number;
} => {
  // Initialize scenarios for both original and delayed retirement
  let originalScenario = {
    capital: initialCapital,
    investment: monthlyInvestment,
    withdrawal: monthlyWithdrawal
  };
  
  let delayedScenario = {
    capital: initialCapital,
    investment: monthlyInvestment,
    withdrawal: monthlyWithdrawal
  };
  
  // Calculate the delayed retirement year
  const delayedRetirementYear = retirementYear + delayYears;
  
  // Variable to store capital at original retirement year
  let originalCapitalAtRetirementValue = 0;
  
  // Simulate year by year from current year to max(retirement, delayedRetirement)
  for (let year = currentYear; year <= delayedRetirementYear; year++) {
    // Update original retirement scenario
    originalScenario = calculateDelayedScenario(
      originalScenario.capital,
      originalScenario.investment,
      originalScenario.withdrawal,
      retirementYear,
      0, // No delay for original scenario
      year,
      annualReturnRate,
      inflation
    );
    
    // Update delayed retirement scenario
    delayedScenario = calculateDelayedScenario(
      delayedScenario.capital,
      delayedScenario.investment,
      delayedScenario.withdrawal,
      retirementYear,
      delayYears,
      year,
      annualReturnRate,
      inflation
    );
    
    // Capture capital at original retirement year
    if (year === retirementYear) {
      originalCapitalAtRetirementValue = originalScenario.capital;
    }
  }
  
  // Capital at the end of delayed retirement
  const delayedCapitalAtRetirement = delayedScenario.capital;
  
  // Calculate the increase in capital
  const capitalIncrease = delayedCapitalAtRetirement - originalCapitalAtRetirementValue;
  
  // Calculate percentage increase
  const percentageIncrease = (capitalIncrease / originalCapitalAtRetirementValue) * 100;
  
  return {
    originalCapitalAtRetirement: originalCapitalAtRetirementValue,
    delayedCapitalAtRetirement,
    capitalIncrease,
    percentageIncrease
  };
}; 