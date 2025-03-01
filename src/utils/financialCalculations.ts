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
  // Convert annual rate to decimal
  const rate = annualRate / 100;
  
  // Calculate future value of initial principal
  const principalFV = principal * Math.pow(1 + rate, years);
  
  // Calculate future value of regular contributions (annuity)
  // Using the formula for future value of an annuity
  const contributionFV = monthlyContribution * ((Math.pow(1 + rate/12, years * 12) - 1) / (rate/12));
  
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
  // Adjust interest rate for inflation
  const realRate = (1 + annualRate / 100) / (1 + inflation / 100) - 1;
  
  // Calculate monthly payment (PMT) that will exhaust the principal over the retirement period
  // Using the formula for payment of an annuity
  const monthlyWithdrawal = principal * (realRate / 12) / (1 - Math.pow(1 + realRate / 12, -(years * 12)));
  
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
  // Adjust interest rate for inflation
  const realRate = (1 + annualRate / 100) / (1 + inflation / 100) - 1;
  
  // Calculate present value (PV) of the annuity
  // Using the formula for present value of an annuity
  const capitalNeeded = monthlyWithdrawal * (1 - Math.pow(1 + realRate / 12, -(years * 12))) / (realRate / 12);
  
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
  const rate = annualRate / 100;
  return futureValue / Math.pow(1 + rate, years);
}; 