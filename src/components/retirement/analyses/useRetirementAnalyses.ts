import { useMemo, useCallback } from 'react';
import { 
  Statistics, 
  SimulatorParams, 
  FormatAmountFunction, 
  Currency 
} from '../types';
import { 
  calculateFutureValue, 
  calculateCapitalMetrics, 
  calculateTimeToRetirement,
  calculateYearsUntilExhaustion,
  calculateDelayedScenario,
  calculateDelayedRetirementImpact,
  calculateOptimalWithdrawalRate,
  calculateReturnImprovementImpact,
  calculateAdditionalInvestmentImpact,
  calculateEffectiveWithdrawalAmount,
  calculateWithdrawalReduction,
  calculateOptimalAssessment
} from '../../../utils/financialCalculations';

export interface AnalysesResult {
  investmentIncrease: {
    monthlyIncrease: number;
    additionalContributions: number;
    estimatedReturns: number;
    totalBenefit: number;
  };
  yearDelayImpact: number;
  delayRetirement: {
    years: number;
    impact: number;
    newCapital: number;
  };
  returnImprovement: {
    improvementRate: number;
    benefit: number;
    newCapital: number;
  };
  withdrawalReduction: {
    optimalRate: number;
    optimalMonthlyWithdrawal: number;
    reductionAmount: number;
    reductionPercentage: number;
    reductionNeeded: boolean;
  };
  totalBenefitAtRetirement: number;
  newCapitalAtRetirement: number;
  additionalYearsOfCoverage: number;
  runningOut: {
    risk: 'High' | 'Medium' | 'Low';
    safetyMargin: number;
    statusClass: string;
  };
  recommendations: Array<{
    change: string;
    impact: string;
    impact_detail?: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  retirementAgeInsights: any;
  withdrawalRate: {
    current: number;
    safe: number;
    isSafe: boolean;
  };
  withdrawalRateWidth: string;
  benefitRatio: number;
  personalizedInsights: {
    withdrawalAdvice: string;
    investmentProfile: {
      profile: string;
      allocation: string;
      advice: string;
    };
    priorityAction: string;
  };
}

/**
 * Custom hook to calculate retirement analyses and optimizations
 */
export const useRetirementAnalyses = (
  statistics: Statistics,
  params: SimulatorParams,
  formatDisplayValue: (value: number) => string
): AnalysesResult => {
  // Helper function that uses the centralized calculation
  const getEffectiveWithdrawalAmount = useCallback((yearsToRetirement: number) => {
    return calculateEffectiveWithdrawalAmount(
      params.monthlyRetirementWithdrawal,
      params.inflationAdjustedWithdrawal,
      params.withdrawalMode,
      params.inflation,
      yearsToRetirement
    );
  }, [params.monthlyRetirementWithdrawal, params.inflationAdjustedWithdrawal, params.withdrawalMode, params.inflation]);

  // Use memoization for derived statistics
  return useMemo(() => {
    // Extract common variables to avoid recalculation
    const { 
      retirementStartAge, 
      lifeExpectancy, 
      capitalAtRetirement, 
      totalNeededCapital,
      totalInvestedAmount,
      isCapitalExhausted,
      exhaustionAge,
      finalCapital
    } = statistics;
    
    const { 
      currentAge, 
      monthlyInvestment, 
      monthlyRetirementWithdrawal,
      annualReturnRate,
      currency: currencyCode,
      maxAge
    } = params;
    
    const yearsToRetirement = retirementStartAge - currentAge;
    
    // Get effective withdrawal amount considering inflation
    const effectiveMonthlyWithdrawal = getEffectiveWithdrawalAmount(yearsToRetirement);
    
    // Use centralized function for optimal assessment
    const optimalAssessment = calculateOptimalAssessment(
      retirementStartAge,
      currentAge,
      capitalAtRetirement,
      totalNeededCapital,
      effectiveMonthlyWithdrawal
    );
    
    const retirementDuration = lifeExpectancy - retirementStartAge;
    
    // Get effective withdrawal amount considering inflation
    const annualWithdrawal = effectiveMonthlyWithdrawal * 12;
    const currentWithdrawalRate = (annualWithdrawal / capitalAtRetirement) * 100;
    const safeWithdrawalRate = 4; // 4% is often considered safe
    
    // Calculate recommended delay based on risk level
    const recommendedDelay = isCapitalExhausted ? 3 : 
                          currentWithdrawalRate > 6 ? 2 :
                          currentWithdrawalRate > 4 ? 1 : 0;
    
    // Calculate recommended investment increase based on risk level
    const recommendedIncreaseRate = isCapitalExhausted ? 0.3 :
                                  currentWithdrawalRate > 6 ? 0.2 :
                                  currentWithdrawalRate > 4 ? 0.15 : 0.1;
    
    // Use centralized function for investment increase analysis
    const investmentImpactResult = calculateAdditionalInvestmentImpact(
      monthlyInvestment,
      recommendedIncreaseRate,
      yearsToRetirement,
      annualReturnRate
    );

    // Use centralized function for return improvement calculation
    const returnImprovementCalc = calculateReturnImprovementImpact(
      monthlyInvestment,
      yearsToRetirement,
      annualReturnRate
    );
    
    // Create the returnImprovementResult with the correct structure
    const returnImprovementResult = {
      improvementRate: returnImprovementCalc.improvementRate,
      benefit: returnImprovementCalc.benefit,
      newCapital: statistics.capitalAtRetirement + returnImprovementCalc.benefit
    };
    
    // 3. Delay retirement impact - Use shared calculation function for consistency
    const delayImpactResult = calculateDelayedRetirementImpact(
      params.initialCapital,
      params.monthlyInvestment,
      params.monthlyRetirementWithdrawal,
      statistics.calculatedRetirementStartYear,
      1, // Calculate for exactly 1 year delay
      params.annualReturnRate,
      params.inflation
    );
    
    // Extract the capital increase as yearDelayImpact
    const yearDelayImpact = delayImpactResult.capitalIncrease;
    
    // Calculate total benefit from all recommendations
    const totalBenefitAtRetirement = 
      investmentImpactResult.totalBenefit + // Benefit from increased investments
      returnImprovementResult.benefit + // Benefit from improved returns
      (recommendedDelay > 0 ? yearDelayImpact * recommendedDelay : 0); // Benefit from delay
    
    // Calculate new total retirement capital
    const newCapitalAtRetirement = capitalAtRetirement + totalBenefitAtRetirement;
    
    // Calculate years of coverage with current and new capital
    const currentYearsOfCoverage = calculateYearsUntilExhaustion(
      capitalAtRetirement,
      annualWithdrawal,
      annualReturnRate
    );
    
    const newYearsOfCoverage = calculateYearsUntilExhaustion(
      newCapitalAtRetirement,
      annualWithdrawal,
      annualReturnRate
    );
    
    const additionalYearsOfCoverage = Math.max(0, newYearsOfCoverage - currentYearsOfCoverage);
    
    // 4. Risk analysis and safety margin
    const yearsRemaining = isCapitalExhausted ? 0 : 
      Math.floor(finalCapital / annualWithdrawal);
    const safetyMargin = isCapitalExhausted ? 
      Math.max(-50, -Math.floor((lifeExpectancy - exhaustionAge) / 5) * 5) : // Cap negative safety margin
      Math.min(100, Math.floor(yearsRemaining / 5) * 5); // Cap overly optimistic safety margin
    
    // Better risk level calculation with safeguards
    const capitalRatio = finalCapital > 0 && capitalAtRetirement > 0 ? 
      finalCapital / capitalAtRetirement : 0;
    
    // Type-safe risk level assignment as a union type
    const riskLevel: 'High' | 'Medium' | 'Low' = isCapitalExhausted ? 'High' : 
                    (capitalRatio < 0.3 || currentWithdrawalRate > 7) ? 'Medium' : 'Low';
    
    // Update the calculation for ratios to avoid divide-by-zero issues
    const withdrawalRateSafe = typeof currentWithdrawalRate === 'number' && !isNaN(currentWithdrawalRate) ? 
      currentWithdrawalRate <= safeWithdrawalRate : false;
    
    // Update the progress bar style for the withdrawal rate to avoid visual issues with extreme values
    // Limit the width to ensure it stays within reasonable bounds (0-100%)
    const withdrawalRateWidth = `${Math.min(100, Math.max(0, (currentWithdrawalRate / 8) * 100))}%`;
    
    // When calculating the investment increase benefit ratio, add safety check for comparison
    const benefitRatio = yearDelayImpact > 0 ? 
      Math.min(100, (totalBenefitAtRetirement / yearDelayImpact) * 100) : 
      50; // Default to 50% if we can't calculate
    
    // 6. Generate personalized recommendations based on risk level
    const needsSignificantChanges = riskLevel === 'High' || riskLevel === 'Medium';
    const recommendationPriority = riskLevel === 'High' ? 'High' : 
                                 riskLevel === 'Medium' ? 'Medium' : 'Low';
                                  
    const recommendations: Array<{
      change: string;
      impact: string;
      impact_detail?: string;
      priority: 'High' | 'Medium' | 'Low';
    }> = [];
    
    // Core recommendations based on risk level
    if (needsSignificantChanges) {
      if (yearsToRetirement > 5) {
        recommendations.push({
          change: 'Increase monthly investment',
          impact: `+${Math.round(monthlyInvestment * (riskLevel === 'High' ? 0.3 : 0.15))} ${currencyCode}/month`,
          priority: recommendationPriority as 'High' | 'Medium' | 'Low'
        });
      }
      
      recommendations.push({
        change: 'Delay retirement',
        impact: `+${riskLevel === 'High' ? 3 : 1} years`,
        priority: recommendationPriority as 'High' | 'Medium' | 'Low'
      });
      
      recommendations.push({
        change: 'Reduce monthly withdrawals',
        impact: `-${Math.round(effectiveMonthlyWithdrawal * (riskLevel === 'High' ? 0.15 : 0.1))} ${currencyCode}/month`,
        impact_detail: `Improves sustainability by ${Math.round(riskLevel === 'High' ? 15 : 10)}%`,
        priority: riskLevel === 'High' ? recommendationPriority as 'High' | 'Medium' | 'Low' : 'Medium'
      });
    } else {
      // Optimization recommendations for healthier finances
      recommendations.push({
        change: 'Increase monthly investment',
        impact: `+${Math.round(monthlyInvestment * 0.1)} ${currencyCode}/month`,
        impact_detail: `→ ${formatDisplayValue(totalBenefitAtRetirement)} more at retirement`,
        priority: 'Medium'
      });
      
      recommendations.push({
        change: 'Optimize investment returns',
        impact: `+${returnImprovementResult.improvementRate.toFixed(1)}% return rate`,
        impact_detail: `→ ${formatDisplayValue(returnImprovementResult.benefit)} benefit`,
        priority: 'Medium'
      });
    }
    
    // Always suggest fee reduction as a best practice
    recommendations.push({
      change: 'Reduce investment fees',
      impact: 'Lower cost funds/ETFs',
      impact_detail: 'Improves long-term returns',
      priority: 'Low'
    });
    
    // Calculate withdrawal reduction
    const withdrawalReductionResult = calculateWithdrawalReduction(
      capitalAtRetirement,
      effectiveMonthlyWithdrawal,
      annualReturnRate,
      retirementStartAge,
      95, // Target age
      0.7 // Conservative multiplier
    );

    // Withdrawal reduction recommendation
    if (currentWithdrawalRate > safeWithdrawalRate) {
      // Use results from centralized calculation
      if (withdrawalReductionResult.reductionNeeded) {
        recommendations.push({
          change: "Optimize withdrawal strategy",
          impact: `-${formatDisplayValue(withdrawalReductionResult.reductionAmount)}/month (${withdrawalReductionResult.reductionPercentage}%)`,
          impact_detail: `Extends capital to age 95+`,
          priority: riskLevel === 'High' ? 'High' : 'Medium'
        });
      }
      
      // Add specific withdrawal strategy recommendations based on risk level
      if (riskLevel === 'High') {
        recommendations.push({
          change: "Implement dynamic withdrawal strategy",
          impact: "Reduces sequence of returns risk",
          impact_detail: "Adjust withdrawals based on market performance",
          priority: 'Medium'
        });
      } else if (currentWithdrawalRate > 5) {
        recommendations.push({
          change: "Create essential vs. discretionary budget",
          impact: "Flexibility during market downturns",
          impact_detail: "Identify 20-30% of spending that can be reduced if needed",
          priority: 'Medium'
        });
      }
    }
    
    // 7. Auto-calculated retirement age insights
    let retirementAgeInsights = null;
    
    if (params.autoCalculateRetirementAge) {
      const possibleEarlierAge = Math.max(currentAge + 1, retirementStartAge - 5);
      const extraSavingsForEarlier = monthlyInvestment * 0.5; // 50% more savings
      const earlierByYears = retirementStartAge - possibleEarlierAge;
      
      const delayedRetirementAge = Math.min(retirementStartAge + 3, maxAge - 5);
      const delayYears = delayedRetirementAge - retirementStartAge;
      const capitalIncreaseByDelaying = yearDelayImpact * delayYears;
      const safetyImprovement = capitalIncreaseByDelaying / totalNeededCapital * 100;
      
      retirementAgeInsights = {
        calculatedAge: retirementStartAge,
        earlierPossible: {
          age: possibleEarlierAge,
          extraMonthlyInvestment: extraSavingsForEarlier,
          yearsEarlier: earlierByYears,
        },
        laterBenefits: {
          age: delayedRetirementAge,
          additionalCapital: capitalIncreaseByDelaying,
          improvedSafety: safetyImprovement,
        },
        optimalAssessment: optimalAssessment
      };
    }
    
    // Personalized withdrawal advice based on risk level
    let withdrawalAdvice = "";
    if (riskLevel === 'High') {
      withdrawalAdvice = `Your current withdrawal rate of ${currentWithdrawalRate.toFixed(1)}% is significantly higher than the recommended 4% safe withdrawal rate. Consider reducing your monthly withdrawals by ${formatDisplayValue(effectiveMonthlyWithdrawal * 0.2)} to bring it closer to a sustainable level.`;
    } else if (riskLevel === 'Medium') {
      withdrawalAdvice = `Your withdrawal rate of ${currentWithdrawalRate.toFixed(1)}% is slightly above the recommended 4% safe withdrawal rate. For improved long-term security, consider a modest reduction in your monthly withdrawals.`;
    } else {
      withdrawalAdvice = `Your withdrawal rate of ${currentWithdrawalRate.toFixed(1)}% is within the recommended safe range. This provides good flexibility and security for your retirement plan.`;
    }

    // Add more personalized investment strategy recommendations
    const yearsToRetirementRemaining = retirementStartAge - currentAge;
    let investmentProfile = {
      profile: "Balanced growth",
      allocation: "~70% stocks / 30% bonds",
      advice: "Review and adjust your asset allocation annually. Consider diversifying across different asset classes."
    };

    if (yearsToRetirementRemaining > 20) {
      investmentProfile = {
        profile: "Long-term growth",
        allocation: "~90% stocks / 10% bonds",
        advice: "With 20+ years to retirement, focus on growth through diversified equity investments. Maximize tax-advantaged accounts before using taxable accounts."
      };
    } else if (yearsToRetirementRemaining > 10) {
      investmentProfile = {
        profile: "Growth-oriented",
        allocation: "~80% stocks / 20% bonds",
        advice: "With 10-20 years to retirement, maintain a growth focus while gradually increasing stability. Consider international diversification for additional growth opportunities."
      };
    } else if (yearsToRetirementRemaining > 5) {
      investmentProfile = {
        profile: "Balanced growth",
        allocation: "~70% stocks / 30% bonds",
        advice: "With 5-10 years to retirement, begin moderating risk while maintaining growth potential. Review and adjust your asset allocation annually."
      };
    } else {
      investmentProfile = {
        profile: "Conservative growth",
        allocation: "~60% stocks / 40% bonds",
        advice: "With retirement within 5 years, focus on capital preservation while maintaining some growth. Consider reducing exposure to higher volatility investments."
      };
    }

    // Add tailored recommendation based on current situation
    const priorityAction = isCapitalExhausted 
      ? "increasing monthly investments and delaying retirement" 
      : capitalRatio < 0.3
        ? "optimizing investment returns and slightly increasing contributions"
        : "maintaining your current strategy while seeking fee reductions";

    // Create the result object
    const result = {
      investmentIncrease: investmentImpactResult,
      yearDelayImpact,
      delayRetirement: {
        years: recommendedDelay,
        impact: yearDelayImpact * recommendedDelay,
        newCapital: capitalAtRetirement + (yearDelayImpact * recommendedDelay)
      },
      returnImprovement: returnImprovementResult,
      totalBenefitAtRetirement,
      newCapitalAtRetirement,
      additionalYearsOfCoverage,
      runningOut: {
        risk: riskLevel,
        safetyMargin,
        statusClass: riskLevel === 'High' ? 'text-red-600' : 
                   riskLevel === 'Medium' ? 'text-yellow-600' : 'text-green-600'
      },
      recommendations,
      retirementAgeInsights,
      withdrawalRate: {
        current: currentWithdrawalRate,
        safe: safeWithdrawalRate,
        isSafe: withdrawalRateSafe
      },
      withdrawalRateWidth,
      benefitRatio,
      withdrawalReduction: withdrawalReductionResult,
      
      // Add the personalized insights
      personalizedInsights: {
        withdrawalAdvice: withdrawalAdvice,
        investmentProfile,
        priorityAction
      }
    };
    
    return result;
  }, [statistics, params, formatDisplayValue, getEffectiveWithdrawalAmount, calculateOptimalAssessment]);
};

export default useRetirementAnalyses; 