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
    const monthlyRate = Math.pow(1 + annualRateDecimal, 1 / 12) - 1;
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
    const realMonthlyRate = Math.pow(1 + realAnnualRate, 1 / 12) - 1;
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
    const realMonthlyRate = Math.pow(1 + realAnnualRate, 1 / 12) - 1;
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
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
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

/**
 * Calculate optimal investment adjustments to reach retirement goals.
 * This function determines both realistic and ideal investment amounts based on current plan.
 * 
 * @param currentMonthlyInvestment Current monthly investment amount
 * @param capitalAtRetirement Projected capital at retirement with current plan
 * @param totalNeededCapital Total capital needed for retirement goals
 * @param yearsUntilRetirement Years until retirement begins
 * @param annualReturnRate Annual return rate percentage
 * @param monthlyRetirementWithdrawal Planned monthly withdrawal during retirement
 * @param targetAge Target retirement end age
 * @param currentAge Current age of the person
 * @param retirementStartAge Age at which retirement begins
 * @returns Object containing recommended and ideal investment values with impact metrics
 */
export const calculateRecommendedInvestment = (
  currentMonthlyInvestment: number,
  capitalAtRetirement: number,
  totalNeededCapital: number,
  yearsUntilRetirement: number,
  annualReturnRate: number,
  monthlyRetirementWithdrawal: number,
  targetAge: number = 95,
  currentAge: number = 30,
  retirementStartAge: number = 65
): {
  realistic: {
    monthlyAmount: number;
    percentageIncrease: number;
    additionalCapital: number;
    additionalYears: number;
    newCapitalAtRetirement: number;
    percentOfTarget: number;
  };
  ideal: {
    monthlyAmount: number;
    percentageIncrease: number;
    additionalCapital: number;
    newCapitalAtRetirement: number;
    percentOfTarget: number;
  };
} => {
  // Get capital gap
  const capitalGap = Math.max(0, totalNeededCapital - capitalAtRetirement);

  // Calculate the annual withdrawal for years calculation
  const annualWithdrawal = monthlyRetirementWithdrawal * 12;

  // Calculate years retirement will last with current plan
  const currentYearsUntilExhaustion = calculateYearsUntilExhaustion(
    capitalAtRetirement,
    annualWithdrawal,
    annualReturnRate,
    0.85, // Slightly more conservative for planning
    100
  );

  // Convert to age at exhaustion
  const exhaustionAge = retirementStartAge + currentYearsUntilExhaustion;

  // Determine if there's a shortfall vs. target age
  const ageShortfall = Math.max(0, targetAge - exhaustionAge);

  // Calculate additional capital needed for each year of retirement
  const capitalPerYear = annualWithdrawal * (1 - 1 / Math.pow(1 + annualReturnRate / 100, 1));

  // Calculate additional capital needed to reach target age
  const additionalCapitalNeeded = ageShortfall * capitalPerYear;

  // REALISTIC CALCULATION
  // Determine a realistic investment increase (cap at 40% increase)
  let realisticPercentageIncrease: number;

  if (capitalGap > 0) {
    // Different increases based on the relative size of the gap
    const gapRatio = capitalGap / capitalAtRetirement;

    if (gapRatio > 0.5) {
      // Large gap - recommend 30-40% increase
      realisticPercentageIncrease = Math.min(0.4, Math.max(0.3, gapRatio * 0.4));
    } else if (gapRatio > 0.2) {
      // Medium gap - recommend 15-30% increase
      realisticPercentageIncrease = Math.min(0.3, Math.max(0.15, gapRatio * 0.3));
    } else {
      // Small gap - recommend 10-15% increase
      realisticPercentageIncrease = Math.min(0.15, Math.max(0.1, gapRatio * 0.25));
    }
  } else {
    // No gap, but recommend small optimization of 5-10%
    realisticPercentageIncrease = 0.05 + (Math.random() * 0.05);
  }

  // Calculate the realistic monthly amount
  const realisticMonthlyIncrease = currentMonthlyInvestment * realisticPercentageIncrease;
  const realisticMonthlyAmount = currentMonthlyInvestment + realisticMonthlyIncrease;

  // Calculate the impact of this realistic increase
  const realisticAdditionalContributions = realisticMonthlyIncrease * 12 * yearsUntilRetirement;

  // Calculate estimated returns on additional contributions (simplified)
  const annualRateDecimal = annualReturnRate / 100;
  const realisticEstimatedReturns = realisticAdditionalContributions * (Math.pow(1 + annualRateDecimal, yearsUntilRetirement / 2) - 1);

  // Total benefit at retirement from realistic increase
  const realisticAdditionalCapital = realisticAdditionalContributions + realisticEstimatedReturns;
  const realisticNewCapitalAtRetirement = capitalAtRetirement + realisticAdditionalCapital;

  // Calculate additional years this would provide
  const realisticAdditionalYears = annualWithdrawal > 0
    ? Math.round((realisticAdditionalCapital / annualWithdrawal) * (1 - 1 / Math.pow(1 + annualRateDecimal, 1)))
    : 0;

  // Calculate percent of target for realistic scenario
  const realisticPercentOfTarget = (realisticNewCapitalAtRetirement / totalNeededCapital) * 100;

  // IDEAL CALCULATION
  // Calculate the monthly investment needed to meet the total needed capital
  // Consider constraints on the maximum viable increase (cap at 100% increase for reality)
  const idealAdditionalCapitalNeeded = Math.max(0, totalNeededCapital - capitalAtRetirement);

  // Using future value formula to determine how much additional monthly investment is needed
  // to close the gap over the remaining years until retirement
  const monthlyRateDecimal = Math.pow(1 + annualRateDecimal, 1 / 12) - 1;
  const totalMonths = yearsUntilRetirement * 12;

  // Calculate monthly investment needed to close the gap
  // FV = PMT * ((1 + r)^n - 1) / r
  // Therefore, PMT = FV * r / ((1 + r)^n - 1)
  let idealMonthlyAdditional = 0;

  if (totalMonths > 0 && monthlyRateDecimal > 0) {
    idealMonthlyAdditional = idealAdditionalCapitalNeeded * monthlyRateDecimal /
      (Math.pow(1 + monthlyRateDecimal, totalMonths) - 1);
  } else if (totalMonths > 0) {
    // If rate is zero, use simple division
    idealMonthlyAdditional = idealAdditionalCapitalNeeded / totalMonths;
  }

  // Cap the ideal monthly amount to be at most 100% more than current
  const maxIdealIncrease = currentMonthlyInvestment;
  const cappedIdealAdditional = Math.min(idealMonthlyAdditional, maxIdealIncrease);
  const idealMonthlyAmount = currentMonthlyInvestment + cappedIdealAdditional;
  const idealPercentageIncrease = cappedIdealAdditional / currentMonthlyInvestment;

  // Calculate the impact if the ideal increase was applied
  const idealAdditionalContributions = cappedIdealAdditional * 12 * yearsUntilRetirement;
  const idealEstimatedReturns = idealAdditionalContributions * (Math.pow(1 + annualRateDecimal, yearsUntilRetirement / 2) - 1);
  const idealTotalBenefit = idealAdditionalContributions + idealEstimatedReturns;
  const idealNewCapitalAtRetirement = capitalAtRetirement + idealTotalBenefit;

  // Calculate percent of target for ideal scenario
  const idealPercentOfTarget = (idealNewCapitalAtRetirement / totalNeededCapital) * 100;

  return {
    realistic: {
      monthlyAmount: realisticMonthlyAmount,
      percentageIncrease: realisticPercentageIncrease * 100,
      additionalCapital: realisticAdditionalCapital,
      additionalYears: realisticAdditionalYears,
      newCapitalAtRetirement: realisticNewCapitalAtRetirement,
      percentOfTarget: realisticPercentOfTarget
    },
    ideal: {
      monthlyAmount: idealMonthlyAmount,
      percentageIncrease: idealPercentageIncrease * 100,
      additionalCapital: idealTotalBenefit,
      newCapitalAtRetirement: idealNewCapitalAtRetirement,
      percentOfTarget: idealPercentOfTarget
    }
  };
};

/**
 * Calculate inflation-adjusted monthly investment
 * @param monthlyInvestment Monthly investment amount
 * @param inflationRate Annual inflation rate (as percentage, e.g., 3 for 3%)
 * @param years Number of years
 * @returns Inflation-adjusted monthly investment amount
 */
export const calculateInflationAdjustedInvestment = (
  monthlyInvestment: number,
  inflationRate: number,
  years: number
): number => {
  return calculateInflationAdjustedValue(
    monthlyInvestment,
    inflationRate,
    years
  );
};

/**
 * Calculate inflation-adjusted capital
 * @param capital Capital amount
 * @param inflationRate Annual inflation rate (as percentage, e.g., 3 for 3%)
 * @param years Number of years
 * @returns Inflation-adjusted capital amount
 */
export const calculateInflationAdjustedCapital = (
  capital: number,
  inflationRate: number,
  years: number
): number => {
  return calculateInflationAdjustedValue(
    capital,
    inflationRate,
    years
  );
};

/**
 * Calculate the optimal withdrawal rate to make retirement funds last until a target age
 * @param capitalAtRetirement Capital amount at retirement
 * @param annualReturnRate Annual return rate (as percentage, e.g., 5 for 5%)
 * @param retirementStartAge Age at retirement start
 * @param targetAge Target age for funds to last until
 * @param conservativeMultiplier Adjustment factor for conservative return estimate (default: 0.7)
 * @returns Optimal annual withdrawal rate as a decimal (e.g., 0.04 for 4%)
 */
export const calculateOptimalWithdrawalRate = (
  capitalAtRetirement: number,
  annualReturnRate: number,
  retirementStartAge: number,
  targetAge: number = 95,
  conservativeMultiplier: number = 0.7
): number => {
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
      annualReturnRate * conservativeMultiplier,
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

/**
 * Calculate the impact of improving the investment return rate
 * @param monthlyInvestment Monthly investment amount
 * @param yearsToRetirement Number of years until retirement
 * @param currentReturnRate Current annual return rate (as percentage, e.g., 5 for 5%)
 * @param improvedReturnRate Improved annual return rate (as percentage, e.g., 5.5 for 5.5%)
 * @returns Object containing the benefit and new capital amount
 */
export const calculateReturnImprovementImpact = (
  monthlyInvestment: number,
  yearsToRetirement: number,
  currentReturnRate: number,
  improvedReturnRate: number = -1 // If not provided, default to current + 0.5%
): {
  improvementRate: number;
  benefit: number;
  futureValueCurrentRate: number;
  futureValueImprovedRate: number;
} => {
  // If improved rate not provided, default to 0.5% improvement
  if (improvedReturnRate === -1) {
    improvedReturnRate = currentReturnRate + 0.5;
  }

  const improvementRate = improvedReturnRate - currentReturnRate;
  const months = yearsToRetirement * 12;

  // Calculate monthly rates
  const currentMonthlyRate = currentReturnRate / 12 / 100;
  const improvedMonthlyRate = improvedReturnRate / 12 / 100;

  // Calculate future values with current and improved returns
  const futureValueCurrentRate = monthlyInvestment *
    ((Math.pow(1 + currentMonthlyRate, months) - 1) / currentMonthlyRate) *
    (1 + currentMonthlyRate);

  const futureValueImprovedRate = monthlyInvestment *
    ((Math.pow(1 + improvedMonthlyRate, months) - 1) / improvedMonthlyRate) *
    (1 + improvedMonthlyRate);

  // Calculate the benefit from improved returns
  const benefit = futureValueImprovedRate - futureValueCurrentRate;

  return {
    improvementRate,
    benefit,
    futureValueCurrentRate,
    futureValueImprovedRate
  };
};

/**
 * Calculate the impact of increasing the monthly investment amount
 * @param currentMonthlyInvestment Current monthly investment amount
 * @param increaseRate Rate of increase (as decimal, e.g., 0.2 for 20%)
 * @param yearsToRetirement Number of years until retirement
 * @param annualReturnRate Annual return rate (as percentage, e.g., 5 for 5%)
 * @returns Object containing the impact details
 */
export const calculateAdditionalInvestmentImpact = (
  currentMonthlyInvestment: number,
  increaseRate: number,
  yearsToRetirement: number,
  annualReturnRate: number
): {
  monthlyIncrease: number;
  additionalContributions: number;
  estimatedReturns: number;
  totalBenefit: number;
} => {
  // Calculate the monthly increase amount
  const monthlyIncrease = currentMonthlyInvestment * increaseRate;

  // Calculate total additional contributions without interest
  const additionalContributions = monthlyIncrease * 12 * yearsToRetirement;

  // Calculate future value of additional monthly investments with compound interest
  const monthlyRate = annualReturnRate / 12 / 100;
  const months = yearsToRetirement * 12;
  const futureValueOfAdditional = monthlyIncrease *
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) *
    (1 + monthlyRate);

  // Calculate estimated returns (difference between future value and contributions)
  const estimatedReturns = futureValueOfAdditional - additionalContributions;

  return {
    monthlyIncrease,
    additionalContributions,
    estimatedReturns,
    totalBenefit: futureValueOfAdditional
  };
};

/**
 * Calculate the exhaustion age with consideration for inflation
 * @param startingCapital Starting capital amount
 * @param monthlyWithdrawal Monthly withdrawal amount
 * @param annualReturnRate Annual return rate (as percentage, e.g., 5 for 5%)
 * @param inflation Annual inflation rate (as percentage, e.g., 2 for 2%)
 * @param retirementStartAge Age at retirement start
 * @param conservativeMultiplier Adjustment factor for conservative return estimate (default: 0.7)
 * @returns Projected exhaustion age
 */
export const calculateExhaustionAge = (
  startingCapital: number,
  monthlyWithdrawal: number,
  annualReturnRate: number,
  inflation: number,
  retirementStartAge: number,
  conservativeMultiplier: number = 0.7
): number => {
  // Convert percentages to decimals
  const inflationRate = inflation / 100;

  // Calculate real return rate (adjusted for inflation)
  const realReturnRate = ((1 + annualReturnRate / 100) / (1 + inflationRate) - 1) * 100;

  // Use conservative real return rate
  const conservativeRealReturnRate = realReturnRate * conservativeMultiplier;

  // Calculate years until exhaustion
  const annualWithdrawal = monthlyWithdrawal * 12;
  const yearsUntilExhaustion = calculateYearsUntilExhaustion(
    startingCapital,
    annualWithdrawal,
    conservativeRealReturnRate,
    1,
    100
  );

  // Calculate exhaustion age
  return retirementStartAge + yearsUntilExhaustion;
};

/**
 * Calculate additional years of retirement funding based on additional capital
 * @param monthlyWithdrawal Monthly withdrawal amount
 * @param additionalCapital Additional capital amount
 * @returns Number of additional years of retirement funding
 */
export const calculateAdditionalYears = (
  monthlyWithdrawal: number,
  additionalCapital: number
): number => {
  // Simple estimation - how many additional years the extra capital would last
  const annualWithdrawal = monthlyWithdrawal * 12;

  if (annualWithdrawal <= 0) return 0;

  return Math.round(additionalCapital / annualWithdrawal);
};

/**
 * Calculate if delaying retirement would allow capital to last until target age
 * @param initialCapital Initial capital amount
 * @param monthlyInvestment Monthly investment amount
 * @param monthlyWithdrawal Monthly withdrawal amount
 * @param retirementYear Planned retirement year
 * @param delayYears Years to delay retirement
 * @param annualReturnRate Annual return rate (as percentage, e.g., 5 for 5%)
 * @param inflation Annual inflation rate (as percentage, e.g., 2 for 2%)
 * @param retirementStartAge Original retirement start age
 * @param targetAge Target age for capital to last until (default: 95)
 * @param conservativeMultiplier Adjustment factor for conservative return estimate (default: 0.7)
 * @returns Object containing whether capital lasts until target age and the projected exhaustion age
 */
export const calculateDelayImpactOnLongevity = (
  initialCapital: number,
  monthlyInvestment: number,
  monthlyWithdrawal: number,
  retirementYear: number,
  delayYears: number,
  annualReturnRate: number,
  inflation: number,
  retirementStartAge: number,
  targetAge: number = 95,
  conservativeMultiplier: number = 0.7
): {
  lastsUntilTargetAge: boolean;
  delayedRetirementAge: number;
  exhaustionAge: number;
} => {
  // Calculate delayed retirement age
  const delayedRetirementAge = retirementStartAge + delayYears;

  // Calculate impact of delay on capital
  const result = calculateDelayedRetirementImpact(
    initialCapital,
    monthlyInvestment,
    monthlyWithdrawal,
    retirementYear,
    delayYears,
    annualReturnRate,
    inflation
  );

  // Calculate years until exhaustion
  const yearsUntilExhaustion = calculateYearsUntilExhaustion(
    result.delayedCapitalAtRetirement,
    monthlyWithdrawal * 12,
    annualReturnRate * conservativeMultiplier, // Conservative return estimate
    1,
    100
  );

  // Calculate exhaustion age
  const exhaustionAge = delayedRetirementAge + yearsUntilExhaustion;

  return {
    lastsUntilTargetAge: exhaustionAge >= targetAge,
    delayedRetirementAge,
    exhaustionAge
  };
};

/**
 * Calculate effective withdrawal amount with inflation adjustment if needed
 * @param monthlyRetirementWithdrawal Monthly withdrawal amount
 * @param inflationAdjustedWithdrawal Whether withdrawal is adjusted for inflation
 * @param withdrawalMode Withdrawal mode ('amount', 'rate', or 'age')
 * @param inflation Annual inflation rate (percentage)
 * @param yearsUntilRetirement Years until retirement
 * @returns Effective monthly withdrawal amount
 */
export const calculateEffectiveWithdrawalAmount = (
  monthlyRetirementWithdrawal: number,
  inflationAdjustedWithdrawal: boolean = false,
  withdrawalMode: string = 'amount',
  inflation: number = 2,
  yearsUntilRetirement: number = 0
): number => {
  if (inflationAdjustedWithdrawal && withdrawalMode === "amount" && inflation > 0) {
    // Calculate inflation-adjusted withdrawal using compound interest formula
    return monthlyRetirementWithdrawal * Math.pow(1 + inflation / 100, yearsUntilRetirement);
  }
  return monthlyRetirementWithdrawal;
};

/**
 * Calculate recommended withdrawal reduction to make capital last until target age
 * @param capitalAtRetirement Capital amount at retirement
 * @param currentMonthlyWithdrawal Current monthly withdrawal amount
 * @param annualReturnRate Annual return rate (percentage)
 * @param retirementStartAge Age at retirement start
 * @param targetAge Target age for funds to last until (default: 95)
 * @param conservativeMultiplier Adjustment factor for conservative return estimate (default: 0.7)
 * @returns Object with optimal monthly withdrawal and reduction details
 */
export const calculateWithdrawalReduction = (
  capitalAtRetirement: number,
  currentMonthlyWithdrawal: number,
  annualReturnRate: number,
  retirementStartAge: number,
  targetAge: number = 95,
  conservativeMultiplier: number = 0.7
): {
  optimalRate: number;
  optimalMonthlyWithdrawal: number;
  reductionAmount: number;
  reductionPercentage: number;
  reductionNeeded: boolean;
} => {
  // Calculate optimal withdrawal rate
  const optimalRate = calculateOptimalWithdrawalRate(
    capitalAtRetirement,
    annualReturnRate,
    retirementStartAge,
    targetAge,
    conservativeMultiplier
  );

  // Calculate optimal monthly withdrawal
  const optimalAnnualWithdrawal = capitalAtRetirement * optimalRate;
  const optimalMonthlyWithdrawal = optimalAnnualWithdrawal / 12;

  // Calculate reduction details
  const reductionNeeded = currentMonthlyWithdrawal > optimalMonthlyWithdrawal;
  const reductionAmount = reductionNeeded
    ? Math.max(0, currentMonthlyWithdrawal - optimalMonthlyWithdrawal)
    : 0;
  const reductionPercentage = reductionNeeded
    ? Math.round((reductionAmount / currentMonthlyWithdrawal) * 100)
    : 0;

  return {
    optimalRate,
    optimalMonthlyWithdrawal: Math.round(optimalMonthlyWithdrawal),
    reductionAmount: Math.round(reductionAmount),
    reductionPercentage,
    reductionNeeded
  };
};

/**
 * Calculate the optimal number of years to delay retirement to sustain capital until target age
 * @param initialCapital Initial capital amount
 * @param monthlyInvestment Monthly investment amount
 * @param monthlyWithdrawal Monthly withdrawal amount
 * @param retirementYear Planned retirement year
 * @param annualReturnRate Annual return rate (percentage)
 * @param inflation Annual inflation rate (percentage)
 * @param currentAge Current age
 * @param currentYear Current year (default: current year)
 * @param withdrawalMode Withdrawal mode ('amount', 'rate', or 'age')
 * @param maxAge Maximum age for planning (default: 95)
 * @param riskLevel Risk level ('High', 'Medium', or 'Low')
 * @returns Optimal number of years to delay retirement
 */
export const calculateOptimalDelayYears = (
  initialCapital: number,
  monthlyInvestment: number,
  monthlyWithdrawal: number,
  retirementYear: number,
  annualReturnRate: number,
  inflation: number,
  currentAge: number,
  currentYear: number = new Date().getFullYear(),
  withdrawalMode: string = 'amount',
  maxAge: number = 95,
  riskLevel: 'High' | 'Medium' | 'Low' = 'Medium'
): number => {
  // Handle case when necessary data is missing
  if (!initialCapital || !monthlyWithdrawal || !annualReturnRate) {
    return riskLevel === 'High' ? 4 : riskLevel === 'Medium' ? 2 : 0;
  }

  const targetMaxAge = withdrawalMode === "age" ? maxAge : 95;

  // Calculate the year when user reaches target max age
  const targetYear = currentYear + (targetMaxAge - currentAge);

  // Check if capital is already exhausted at target age with current plan
  const capitalEvolution = [];
  let scenario = {
    capital: initialCapital,
    investment: monthlyInvestment,
    withdrawal: monthlyWithdrawal
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
      inflation
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
    return 0;
  }

  // If capital gets exhausted, calculate various delay scenarios
  for (let delayYears = 1; delayYears <= 5; delayYears++) {
    // Initialize scenario for this delay option
    scenario = {
      capital: initialCapital,
      investment: monthlyInvestment,
      withdrawal: monthlyWithdrawal
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
        inflation
      );

      delayCapitalEvolution.push({
        year,
        capital: scenario.capital
      });
    }

    // Check if capital remains positive at target age with this delay
    const delayFinalCapital = delayCapitalEvolution[delayCapitalEvolution.length - 1].capital;

    if (delayFinalCapital > 0) {
      return delayYears;
    }
  }

  // If we reach here, even 5 years delay isn't enough, so recommend maximum
  return 5;
};

/**
 * Calculate suggested withdrawal rate and monthly withdrawal amount
 * @param currentMonthlyWithdrawal Current monthly withdrawal amount
 * @param currentWithdrawalRate Current withdrawal rate (percentage)
 * @param safeWithdrawalRate Safe withdrawal rate (percentage)
 * @returns Suggested withdrawal rate and monthly amount
 */
export const calculateSuggestedWithdrawal = (
  currentMonthlyWithdrawal: number,
  currentWithdrawalRate: number,
  safeWithdrawalRate: number
): {
  suggestedWithdrawalRate: number;
  suggestedMonthlyWithdrawal: number;
} => {
  const suggestedWithdrawalRate = Math.min(safeWithdrawalRate, currentWithdrawalRate * 0.85);
  const suggestedMonthlyWithdrawal = currentMonthlyWithdrawal * (suggestedWithdrawalRate / currentWithdrawalRate);

  return {
    suggestedWithdrawalRate,
    suggestedMonthlyWithdrawal: Math.round(suggestedMonthlyWithdrawal)
  };
};

/**
 * Assess retirement age optimization opportunities
 * @param retirementStartAge Retirement start age
 * @param currentAge Current age
 * @param capitalAtRetirement Capital amount at retirement
 * @param totalNeededCapital Total capital needed for retirement
 * @param effectiveMonthlyWithdrawal Effective monthly withdrawal amount
 * @returns Assessment object with assessment type and message
 */
export const calculateOptimalAssessment = (
  retirementStartAge: number,
  currentAge: number,
  capitalAtRetirement: number,
  totalNeededCapital: number,
  effectiveMonthlyWithdrawal: number
): {
  assessment: "risky" | "moderate" | "soon" | "solid";
  message: string;
} => {
  const yearsToRetirement = retirementStartAge - currentAge;
  const capitalRatio = capitalAtRetirement / totalNeededCapital;

  // Calculate withdrawal rate
  const withdrawalRate = (effectiveMonthlyWithdrawal * 12 / capitalAtRetirement) * 100;

  if (capitalRatio < 0.9) {
    return {
      assessment: "risky",
      message: "Your auto-calculated retirement age may be optimistic. Consider increasing savings or adjusting your withdrawal plans."
    };
  } else if (withdrawalRate > 4) {
    return {
      assessment: "moderate",
      message: "The withdrawal rate is higher than the recommended 4%. This retirement age is financially possible but carries some long-term risk."
    };
  } else if (yearsToRetirement < 5) {
    return {
      assessment: "soon",
      message: "Good news! Financial independence is within reach in the next few years."
    };
  } else {
    return {
      assessment: "solid",
      message: "The calculated retirement age provides a solid financial foundation with a safe withdrawal rate."
    };
  }
};

/**
 * Calculate detailed investment impact on retirement capital and funding duration
 * @param monthlyInvestment Current monthly investment amount
 * @param investmentIncrease Investment increase details with totalBenefit
 * @param capitalAtRetirement Capital amount at retirement
 * @param totalNeededCapital Total capital needed for retirement
 * @param effectiveMonthlyWithdrawal Effective monthly withdrawal amount
 * @param annualReturnRate Annual return rate (percentage)
 * @param inflation Annual inflation rate (percentage)
 * @param retirementStartAge Age at retirement start
 * @returns Detailed impact of the investment increase
 */
export const calculateInvestmentImpact = (
  monthlyInvestment: number,
  investmentIncrease: {
    monthlyIncrease: number;
    totalBenefit: number;
  },
  capitalAtRetirement: number,
  totalNeededCapital: number,
  effectiveMonthlyWithdrawal: number,
  annualReturnRate: number,
  inflation: number,
  retirementStartAge: number
): {
  improvedCapitalAtRetirement: number;
  exhaustionAge: number;
  improvedExhaustionAge: number;
  yearsGained: number;
  yearlyCapitalIncrease: number;
  percentageIncrease: number;
  capitalGap: number;
  gapPercentage: number;
  additionalYears: number;
} => {
  // Default inflation if not provided
  const inflationRate = inflation ?? 2;

  // Calculate improved capital at retirement
  const improvedCapitalAtRetirement = capitalAtRetirement + investmentIncrease.totalBenefit;

  // Calculate exhaustion ages using existing function
  const exhaustionAge = calculateExhaustionAge(
    capitalAtRetirement,
    effectiveMonthlyWithdrawal,
    annualReturnRate,
    inflationRate,
    retirementStartAge,
    0.7 // Conservative multiplier
  );

  const improvedExhaustionAge = calculateExhaustionAge(
    improvedCapitalAtRetirement,
    effectiveMonthlyWithdrawal,
    annualReturnRate,
    inflationRate,
    retirementStartAge,
    0.7 // Conservative multiplier
  );

  // Calculate years gained
  const yearsGained = improvedExhaustionAge - exhaustionAge;

  // Estimate the yearly capital increase from investing
  const yearlyCapitalIncrease = monthlyInvestment * 12 * (1 + annualReturnRate / 100);

  // Calculate percentage increase in monthly investment
  const percentageIncrease = (investmentIncrease.monthlyIncrease / monthlyInvestment) * 100;

  // Calculate capital gap
  const capitalGap = totalNeededCapital - capitalAtRetirement;
  const gapPercentage = (capitalGap / totalNeededCapital) * 100;

  // Calculate additional years of retirement funding
  const additionalYears = calculateAdditionalYears(
    effectiveMonthlyWithdrawal,
    investmentIncrease.totalBenefit
  );

  return {
    improvedCapitalAtRetirement,
    exhaustionAge,
    improvedExhaustionAge,
    yearsGained,
    yearlyCapitalIncrease,
    percentageIncrease,
    capitalGap,
    gapPercentage,
    additionalYears
  };
};

/**
 * Calculate ideal withdrawal amount based on the safe withdrawal rate (4% rule)
 * @param capitalAtRetirement Capital amount at retirement
 * @param safeWithdrawalRatePercentage Safe withdrawal rate percentage (default: 4%)
 * @returns Object with annual and monthly withdrawal amounts and the rate
 */
export const calculateIdealWithdrawal = (
  capitalAtRetirement: number,
  safeWithdrawalRatePercentage: number = 4
): {
  annualWithdrawal: number;
  monthlyWithdrawal: number;
  withdrawalRate: number;
} => {
  const withdrawalRate = safeWithdrawalRatePercentage / 100;
  const annualWithdrawal = capitalAtRetirement * withdrawalRate;
  const monthlyWithdrawal = annualWithdrawal / 12;

  return {
    annualWithdrawal,
    monthlyWithdrawal,
    withdrawalRate
  };
};

/**
 * Calculate comprehensive retirement risk assessment based on multiple factors
 * @param capitalAtRetirement Capital amount at retirement
 * @param totalNeededCapital Total capital needed for retirement
 * @param monthlyRetirementWithdrawal Monthly withdrawal amount during retirement
 * @param annualReturnRate Annual return rate (percentage)
 * @param inflation Annual inflation rate (percentage)
 * @param retirementStartAge Age at retirement start
 * @param currentAge Current age
 * @param lifeExpectancy Expected life expectancy
 * @param monthlyInvestment Current monthly investment
 * @param targetAge Target age for capital to last (default: 95)
 * @returns Detailed risk assessment with level and recommendations
 */
export const calculateRetirementRisk = (
  capitalAtRetirement: number,
  totalNeededCapital: number,
  monthlyRetirementWithdrawal: number,
  annualReturnRate: number,
  inflation: number,
  retirementStartAge: number,
  currentAge: number,
  lifeExpectancy: number,
  monthlyInvestment: number,
  targetAge: number = 95
): {
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
} => {
  // Default inflation if not provided
  const inflationRate = inflation || 2;
  const yearsToRetirement = retirementStartAge - currentAge;

  // Calculate capital adequacy ratio (capital at retirement / needed capital)
  const capitalRatio = totalNeededCapital > 0 ? capitalAtRetirement / totalNeededCapital : 1;

  // Calculate effective withdrawal rate considering inflation
  const effectiveMonthlyWithdrawal = calculateEffectiveWithdrawalAmount(
    monthlyRetirementWithdrawal,
    true, // Inflation-adjusted
    'amount',
    inflationRate,
    yearsToRetirement
  );

  // Calculate withdrawal rate as percentage of capital
  const withdrawalRate = capitalAtRetirement > 0
    ? (effectiveMonthlyWithdrawal * 12 / capitalAtRetirement) * 100
    : 100;

  // Calculate withdrawal risk factor (Non-linear scale)
  // < 3%: Very Safe (0)
  // 3-4%: Safe (0-0.2)
  // 4-5%: Moderate Risk (0.2-0.5)
  // 5-6%: High Risk (0.5-0.8)
  // > 6%: Critical (0.8-1.0)
  let normalizedWithdrawalRisk = 0;
  if (withdrawalRate <= 3) normalizedWithdrawalRisk = 0;
  else if (withdrawalRate <= 4) normalizedWithdrawalRisk = (withdrawalRate - 3) * 0.2;
  else if (withdrawalRate <= 5) normalizedWithdrawalRisk = 0.2 + (withdrawalRate - 4) * 0.3;
  else if (withdrawalRate <= 6) normalizedWithdrawalRisk = 0.5 + (withdrawalRate - 5) * 0.3;
  else normalizedWithdrawalRisk = Math.min(1, 0.8 + (withdrawalRate - 6) * 0.2);

  // Calculate longevity risk factor (Continuous scale)
  const estimatedExhaustionAge = calculateExhaustionAge(
    capitalAtRetirement,
    effectiveMonthlyWithdrawal,
    annualReturnRate,
    inflationRate,
    retirementStartAge,
    0.7 // Conservative multiplier
  );

  // Calculate years short of target age
  const yearsShort = Math.max(0, targetAge - estimatedExhaustionAge);

  // Normalize longevity risk: 
  // 0 years short = 0 risk
  // 20+ years short = 1 (100%) risk
  const normalizedLongevityRisk = Math.min(1, yearsShort / 20);

  // Calculate recommended investment increase for context
  const recommendedInvestment = calculateRecommendedInvestment(
    monthlyInvestment,
    capitalAtRetirement,
    totalNeededCapital,
    yearsToRetirement,
    annualReturnRate,
    monthlyRetirementWithdrawal,
    targetAge,
    currentAge,
    retirementStartAge
  );

  // Investment shortfall factor
  const investmentShortfallFactor = recommendedInvestment.realistic.percentageIncrease / 100;

  // Volatility risk factor based on real return rate stability
  const realReturnRate = ((1 + annualReturnRate / 100) / (1 + inflationRate / 100) - 1) * 100;
  // If real return < 3%, risk increases. If real return < 0%, risk is max.
  const normalizedVolatilityRisk = realReturnRate >= 3 ? 0 : Math.min(1, (3 - realReturnRate) / 3);

  // Capital Adequacy Normalization
  // > 1.2 ratio = 0 risk
  // < 0.5 ratio = 1 risk
  const normalizedCapitalRatio = Math.max(0, Math.min(1, (1.2 - capitalRatio) / 0.7));

  // Investment Shortfall Normalization
  // 0 increase needed = 0 risk
  // > 50% increase needed = 1 risk
  const normalizedInvestmentShortfall = Math.max(0, Math.min(1, investmentShortfallFactor * 2));

  // Calculate weighted risk score (0-10 scale)
  // Adjusted weights to prioritize running out of money (Longevity + Capital)
  const riskScore = (
    (normalizedLongevityRisk * 0.35) +       // 35% - Usefulness: Do I run out of money?
    (normalizedCapitalRatio * 0.25) +        // 25% - Robustness: Do I have enough buffer?
    (normalizedWithdrawalRisk * 0.25) +      // 25% - Sustainability: Is my burn rate too high?
    (normalizedInvestmentShortfall * 0.10) + // 10% - Fixability: Can I fix it by saving more?
    (normalizedVolatilityRisk * 0.05)        // 5% - Market: am I too dependent on high returns?
  ) * 10;

  // Determine risk level
  let riskLevel: 'Low' | 'Moderate' | 'Significant' | 'High' | 'Critical';
  let description: string;
  let recommendationPriority: 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical';

  if (riskScore < 2) riskLevel = 'Low';
  else if (riskScore < 4) riskLevel = 'Moderate';
  else if (riskScore < 6) riskLevel = 'Significant';
  else if (riskScore < 8) riskLevel = 'High';
  else riskLevel = 'Critical';

  // Determine priority
  if (riskLevel === 'Low') recommendationPriority = 'Low';
  else if (riskLevel === 'Moderate') recommendationPriority = 'Medium';
  else if (riskLevel === 'Significant') recommendationPriority = 'High';
  else if (riskLevel === 'High') recommendationPriority = 'Urgent';
  else recommendationPriority = 'Critical';

  // Generate Dynamic Description based on primary risk driver
  const risks = [
    { name: 'longevity', val: normalizedLongevityRisk, label: 'running out of money early' },
    { name: 'capital', val: normalizedCapitalRatio, label: 'insufficient total capital' },
    { name: 'withdrawal', val: normalizedWithdrawalRisk, label: 'unsustainable withdrawal rate' },
    { name: 'investment', val: normalizedInvestmentShortfall, label: 'low savings rate' }
  ];

  // Sort by risk value descending
  risks.sort((a, b) => b.val - a.val);
  const primaryRisk = risks[0];

  if (riskLevel === 'Low') {
    description = 'Your retirement plan is on solid ground. You are projected to meet your goals with a comfortable safety margin.';
  } else {
    // Dynamic description construction
    const urgency = riskLevel === 'Critical' || riskLevel === 'High' ? 'critical' : 'significant';

    if (primaryRisk.name === 'longevity') {
      description = `Your plan faces ${urgency} risk of ${primaryRisk.label}. Projections show funds may be depleted ${Math.round(yearsShort)} years before age ${targetAge}.`;
    } else if (primaryRisk.name === 'withdrawal') {
      description = `Your plan faces ${urgency} risk due to an ${primaryRisk.label} of ${withdrawalRate.toFixed(1)}%. A sustainable rate is typically under 4%.`;
    } else if (primaryRisk.name === 'capital') {
      description = `Your plan faces ${urgency} risk due to ${primaryRisk.label}. You are on track to reach only ${(capitalRatio * 100).toFixed(0)}% of your target.`;
    } else {
      description = `Your plan requires optimization. The main factor is a ${primaryRisk.label}, requiring a ${recommendedInvestment.realistic.percentageIncrease.toFixed(0)}% increase in contributions.`;
    }
  }

  // Define recommendations
  // ... (keep existing logic for recommendations or refine similarly)

  let primaryRecommendation = '';
  let secondaryRecommendations: string[] = [];

  // Calculate optimal withdrawal reduction
  const withdrawalReduction = calculateWithdrawalReduction(
    capitalAtRetirement,
    effectiveMonthlyWithdrawal,
    annualReturnRate,
    retirementStartAge,
    targetAge,
    0.7
  );

  if (riskLevel === 'Low') {
    primaryRecommendation = 'Maintain your current strategy while monitoring annualy.';
    secondaryRecommendations = [
      'Consider tax-efficient withdrawal strategies',
      'Review estate planning goals',
      'Optimize asset location for tax benefits'
    ];
  } else if (riskLevel === 'Moderate') {
    primaryRecommendation = comparisonRecommendation(
      monthlyInvestment,
      recommendedInvestment.realistic.monthlyAmount,
      monthlyRetirementWithdrawal,
      withdrawalReduction.optimalMonthlyWithdrawal,
      'investment' // bias towards investment for moderate risk
    );
    secondaryRecommendations = [
      'Optimize investment allocation for better risk-adjusted returns',
      'Review discretionary spending in retirement budget',
      'Consider small annual increases in contributions'
    ];
  } else {
    // Significant, High, Critical
    primaryRecommendation = comparisonRecommendation(
      monthlyInvestment,
      recommendedInvestment.realistic.monthlyAmount,
      monthlyRetirementWithdrawal,
      withdrawalReduction.optimalMonthlyWithdrawal,
      'withdrawal' // bias towards withdrawal for high risk as it's more immediate
    );

    secondaryRecommendations = [
      `Consider delaying retirement by ${riskLevel === 'Critical' ? '3-5' : '1-2'} years`,
      `Reduce essential retirement expenses to lower the required capital`,
      'Explore part-time work during early retirement years'
    ];
  }

  return {
    riskLevel,
    riskScore,
    factors: {
      capitalRatio,
      withdrawalRiskFactor: normalizedWithdrawalRisk,
      longevityRiskFactor: normalizedLongevityRisk,
      investmentShortfallFactor: normalizedInvestmentShortfall,
      volatilityRiskFactor: normalizedVolatilityRisk
    },
    description,
    recommendationPriority,
    primaryRecommendation,
    secondaryRecommendations
  };
};

// Helper to choose between investment or withdrawal recommendation
const comparisonRecommendation = (
  currentInv: number,
  targetInv: number,
  currentWith: number,
  targetWith: number,
  bias: 'investment' | 'withdrawal'
): string => {
  const invDiff = targetInv - currentInv;
  const withDiff = currentWith - targetWith;

  // If no change needed in one, recommend the other
  if (invDiff <= 0 && withDiff <= 0) return "Review your overall financial plan.";
  if (invDiff <= 0) return `Reduce monthly withdrawal to ${Math.round(targetWith)} to ensure sustainability.`;
  if (withDiff <= 0 || targetWith <= 0) return `Increase monthly investment by ${Math.round(invDiff)} to build safety.`;

  // Otherwise prioritize based on bias or impact
  if (bias === 'withdrawal') {
    return `Reduce monthly withdrawal to ${Math.round(targetWith)} to extend portfolio longevity.`;
  } else {
    return `Increase monthly investment by ${Math.round(invDiff)} to reach your capital goals.`;
  }
};
