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
 * @returns Future value
 */
export const calculateFutureValue = (
  principal: number,
  annualRate: number,
  years: number,
  monthlyContribution: number
): number => {
  // Convert annual rate to monthly rate
  const monthlyRate = Math.pow(1 + annualRate / 100, 1/12) - 1;
  const totalMonths = years * 12;
  
  // Calculate future value of initial principal with monthly compounding
  const principalFV = principal * Math.pow(1 + monthlyRate, totalMonths);
  
  // Calculate future value of regular contributions with monthly compounding
  const contributionFV = monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  
  return principalFV + contributionFV;
};

/**
 * Calculate withdrawal amount for a given retirement duration
 * @param principal Capital at retirement
 * @param annualRate Annual interest rate (as percentage, e.g., 5 for 5%)
 * @param years Number of years in retirement
 * @param inflation Annual inflation rate (as percentage)
 * @returns Monthly withdrawal amount
 */
export const calculateWithdrawalAmount = (
  principal: number,
  annualRate: number,
  years: number,
  inflation: number
): number => {
  // Calculate real rate (adjusted for inflation) using the Fisher equation
  const nominalRate = annualRate / 100;
  const inflationRate = inflation / 100;
  const realAnnualRate = (1 + nominalRate) / (1 + inflationRate) - 1;
  
  // Convert to monthly rate
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
};

/**
 * Calculate capital needed for a specific monthly withdrawal
 * @param monthlyWithdrawal Desired monthly withdrawal amount
 * @param annualRate Annual interest rate (as percentage, e.g., 5 for 5%)
 * @param years Number of years in retirement
 * @param inflation Annual inflation rate (as percentage)
 * @returns Capital needed at retirement
 */
export const calculateCapitalNeeded = (
  monthlyWithdrawal: number,
  annualRate: number,
  years: number,
  inflation: number
): number => {
  // Calculate real rate (adjusted for inflation) using the Fisher equation
  const nominalRate = annualRate / 100;
  const inflationRate = inflation / 100;
  const realAnnualRate = (1 + nominalRate) / (1 + inflationRate) - 1;
  
  // Convert to monthly rate
  const realMonthlyRate = Math.pow(1 + realAnnualRate, 1/12) - 1;
  const totalMonths = years * 12;
  
  // Calculate present value (PV) of the annuity with monthly compounding
  if (realMonthlyRate <= 0) {
    // If real rate is zero or negative, use simple multiplication
    return monthlyWithdrawal * totalMonths;
  }
  
  const capitalNeeded = monthlyWithdrawal * (1 - Math.pow(1 + realMonthlyRate, -totalMonths)) / realMonthlyRate;
  
  return capitalNeeded;
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