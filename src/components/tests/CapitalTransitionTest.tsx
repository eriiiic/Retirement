import React, { useEffect } from 'react';
import { calculateFutureValue } from '../../utils/financialCalculations';

const CapitalTransitionTest: React.FC = () => {
  useEffect(() => {
    // Test parameters
    const params = {
      initialCapital: 100000,
      monthlyInvestment: 2000,
      annualReturnRate: 7,
      inflation: 2,
      currentAge: 40,
      retirementAge: 65,
      compoundFrequency: 'monthly' as const
    };

    // Calculate years to retirement
    const yearsToRetirement = params.retirementAge - params.currentAge;
    
    // Calculate capital at retirement using the utility function
    const capitalAtRetirement = calculateFutureValue(
      params.initialCapital,
      params.annualReturnRate,
      yearsToRetirement,
      params.monthlyInvestment,
      params.compoundFrequency
    );
    
    // Manual calculation for the years around retirement
    let capital = params.initialCapital;
    const monthlyReturn = Math.pow(1 + params.annualReturnRate / 100, 1/12) - 1;
    
    // Track capital for each year
    const yearlyCapital: number[] = [capital];
    
    // Simulate 27 years (2 before retirement, retirement year, 2 after)
    for (let year = 1; year <= yearsToRetirement + 2; year++) {
      // Annualized logic for comparison 
      if (year <= yearsToRetirement) {
        // Pre-retirement: full year of investments
        for (let month = 0; month < 12; month++) {
          capital += params.monthlyInvestment;
          capital *= (1 + monthlyReturn);
        }
      } else if (year === yearsToRetirement + 1) {
        // Transition year: half investments, half withdrawals
        for (let month = 0; month < 12; month++) {
          if (month < 6) {
            capital += params.monthlyInvestment;
          }
          capital *= (1 + monthlyReturn);
        }
      } else {
        // Post-retirement: no investments
        for (let month = 0; month < 12; month++) {
          capital *= (1 + monthlyReturn);
        }
      }
      
      yearlyCapital.push(capital);
      
      // Check for anomalies in growth rate
      if (year > 1) {
        const growthRate = (yearlyCapital[year] - yearlyCapital[year-1]) / yearlyCapital[year-1] * 100;
        console.log(`Year ${year}, Capital: ${Math.round(yearlyCapital[year])}, Growth Rate: ${growthRate.toFixed(2)}%`);
      }
    }
    
    // Calculate year-over-year growth rates to identify any anomalies
    console.log('Capital at retirement (from utility):', Math.round(capitalAtRetirement));
    console.log('Capital after manual calculation:', Math.round(yearlyCapital[yearsToRetirement]));
    console.log('Difference:', Math.round(capitalAtRetirement - yearlyCapital[yearsToRetirement]));
    
    // Analyze the transition year specifically
    const beforeRetirement = yearlyCapital[yearsToRetirement - 1];
    const atRetirement = yearlyCapital[yearsToRetirement];
    const afterRetirement = yearlyCapital[yearsToRetirement + 1];
    
    console.log('Year before retirement:', Math.round(beforeRetirement));
    console.log('Retirement year:', Math.round(atRetirement));
    console.log('Year after retirement:', Math.round(afterRetirement));
    
    console.log('Growth rate into retirement year:', ((atRetirement - beforeRetirement) / beforeRetirement * 100).toFixed(2) + '%');
    console.log('Growth rate after retirement year:', ((afterRetirement - atRetirement) / atRetirement * 100).toFixed(2) + '%');
    
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Capital Transition Test</h1>
      <p>Check the console for test results.</p>
    </div>
  );
};

export default CapitalTransitionTest; 