// Utility functions for retirement calculations
import { GraphDataPoint, SimulatorParams } from './types';

export interface DelayedRetirementPoint {
  year: number;
  age: number;
  capital: number;
  capitalMin: number;
  capitalMax: number;
  capitalWithoutInterest: number;
  variation: number;
  retirement: "Yes" | "No";
  annualInvestment: number;
  annualWithdrawal: number;
  annualInterest: number;
  netVariationExcludingInterest: number;
  finalMonthlyInvestment: number;
  finalMonthlyWithdrawal: number;
  totalInvested: number;
  totalWithdrawn: number;
  targetAge: boolean;
}

export function calculateDelayedCapital(delayYears: [number, number], baseData: GraphDataPoint[], params: SimulatorParams): DelayedRetirementPoint[] {
  // Find original retirement year and point
  const originalRetirementPoint = baseData.find(point => point.retirement === "Yes");
  if (!originalRetirementPoint) return baseData as DelayedRetirementPoint[];

  const originalRetirementYear = originalRetirementPoint.year;
  const [minDelay, maxDelay] = delayYears;

  // Calculate scenarios for min and max delays
  const calculateScenario = (delay: number): GraphDataPoint[] => {
    const delayedRetirementYear = originalRetirementYear + delay;
    
    // Copy the base data structure but reset calculated values
    const scenario = baseData.map(point => ({
      ...point,
      capital: 0,
      capitalWithoutInterest: 0,
      variation: 0,
      retirement: (point.year >= delayedRetirementYear ? "Yes" : "No") as "Yes" | "No",
      annualInvestment: 0,
      annualWithdrawal: 0,
      annualInterest: 0,
      netVariationExcludingInterest: 0,
      finalMonthlyInvestment: 0,
      finalMonthlyWithdrawal: 0,
      totalInvested: 0,
      totalWithdrawn: 0
    }));

    let capital = params.initialCapital;
    let principalOnly = params.initialCapital;
    let currentMonthlyInvestment = params.monthlyInvestment;
    let currentMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    let totalInvested = params.initialCapital;
    let totalWithdrawn = 0;

    // Calculate monthly rates
    const monthlyReturn = params.compoundFrequency === 'monthly'
      ? (Math.pow(1 + params.annualReturnRate / 100, 1/12) - 1)
      : (params.annualReturnRate / 100) / 12;

    const monthlyInflation = (Math.pow(1 + params.inflation / 100, 1/12) - 1);

    // Process each year
    for (let i = 0; i < scenario.length; i++) {
      const point = scenario[i];
      const yearsSinceStart = i;
      const inRetirementPhase = point.year >= delayedRetirementYear;
      
      if (capital <= 0) {
        point.capital = 0;
        point.capitalWithoutInterest = 0;
        point.variation = 0;
        point.retirement = inRetirementPhase ? "Yes" : "No";
        point.annualInvestment = 0;
        point.annualWithdrawal = 0;
        point.annualInterest = 0;
        point.netVariationExcludingInterest = 0;
        point.finalMonthlyInvestment = Math.round(currentMonthlyInvestment);
        point.finalMonthlyWithdrawal = Math.round(currentMonthlyWithdrawal);
        point.totalInvested = totalInvested;
        point.totalWithdrawn = totalWithdrawn;
        continue;
      }

      let capitalAtStart = capital;
      let annualInvestment = 0;
      let annualWithdrawal = 0;
      let annualInterest = 0;

      // Monthly calculations for the year
      if (params.compoundFrequency === 'monthly') {
        for (let month = 0; month < 12; month++) {
          if (capital <= 0) {
            capital = 0;
            principalOnly = Math.max(0, totalInvested - totalWithdrawn);
            break;
          }

          // Calculate and add monthly interest
          const interest = capital * monthlyReturn;
          annualInterest += interest;
          capital += interest;

          // Apply inflation to monthly values
          if (month === 0) {
            currentMonthlyInvestment *= (1 + monthlyInflation);
            currentMonthlyWithdrawal *= (1 + monthlyInflation);
          }

          if (!inRetirementPhase) {
            // Investment phase
            capital += currentMonthlyInvestment;
            annualInvestment += currentMonthlyInvestment;
            totalInvested += currentMonthlyInvestment;
            principalOnly = totalInvested - totalWithdrawn;
          } else {
            // Retirement phase
            capital -= currentMonthlyWithdrawal;
            annualWithdrawal += currentMonthlyWithdrawal;
            totalWithdrawn += currentMonthlyWithdrawal;
            principalOnly = Math.max(0, totalInvested - totalWithdrawn);
          }
        }
      } else {
        // Annual compounding
        if (!inRetirementPhase) {
          const yearlyInvestment = currentMonthlyInvestment * 12;
          capital += yearlyInvestment;
          annualInvestment = yearlyInvestment;
          totalInvested += yearlyInvestment;
        } else {
          const yearlyWithdrawal = currentMonthlyWithdrawal * 12;
          capital -= yearlyWithdrawal;
          annualWithdrawal = yearlyWithdrawal;
          totalWithdrawn += yearlyWithdrawal;
        }

        // Calculate annual interest
        const interest = Math.max(0, capital) * (params.annualReturnRate / 100);
        annualInterest = interest;
        capital += interest;

        // Apply annual inflation adjustment
        currentMonthlyInvestment *= (1 + params.inflation / 100);
        currentMonthlyWithdrawal *= (1 + params.inflation / 100);
      }

      // Ensure capital doesn't go negative
      if (capital < 0) capital = 0;

      // Update point with calculated values
      point.capital = Math.round(capital);
      point.capitalWithoutInterest = Math.round(principalOnly);
      point.variation = Math.round(capital - capitalAtStart);
      point.annualInvestment = Math.round(annualInvestment);
      point.annualWithdrawal = Math.round(annualWithdrawal);
      point.annualInterest = Math.round(annualInterest);
      point.netVariationExcludingInterest = Math.round(inRetirementPhase ? -annualWithdrawal : annualInvestment);
      point.finalMonthlyInvestment = Math.round(inRetirementPhase ? 0 : currentMonthlyInvestment);
      point.finalMonthlyWithdrawal = Math.round(inRetirementPhase ? currentMonthlyWithdrawal : 0);
      point.totalInvested = Math.round(totalInvested);
      point.totalWithdrawn = Math.round(totalWithdrawn);
    }

    return scenario;
  };

  const minDelayScenario = calculateScenario(minDelay);
  const maxDelayScenario = calculateScenario(maxDelay);

  // Combine scenarios into banded chart data, using minDelayScenario as the lower bound
  return baseData.map((point, index) => ({
    ...point,
    capitalMin: minDelayScenario[index].capital,
    capitalMax: maxDelayScenario[index].capital,
    capital: point.capital // Keep the original capital value
  })) as DelayedRetirementPoint[];
}

export {}; 