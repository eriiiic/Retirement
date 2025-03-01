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