import { useMemo } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction } from './types';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';

interface AnalysesProps {
  statistics: Statistics;
  params: SimulatorParams;
  formatAmount: FormatAmountFunction;
}

export const Analyses: React.FC<AnalysesProps> = ({
  statistics,
  params,
  formatAmount,
}) => {
  // Helper function to calculate optimal assessment
  const calculateOptimalAssessment = (stats: Statistics, params: SimulatorParams) => {
    const yearsToRetirement = stats.retirementStartAge - params.currentAge;
    const capitalRatio = stats.capitalAtRetirement / stats.totalNeededCapital;
    const withdrawalRate = (params.monthlyRetirementWithdrawal * 12 / stats.capitalAtRetirement) * 100;
    
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

  // Calculate potential improvements
  const analyses = useMemo(() => {
    // 1. Investment increase analysis
    const investmentIncrease = params.monthlyInvestment * 0.2; // Suggest 20% increase
    const additionalCapital = investmentIncrease * 12 * (statistics.retirementStartAge - params.currentAge);
    const estimatedAdditionalReturns = additionalCapital * (statistics.capitalAtRetirement / statistics.totalInvestedAmount - 1);
    const totalBenefit = additionalCapital + estimatedAdditionalReturns;
    
    // 2. Calculate impact of delaying retirement
    const yearDelayImpact = params.monthlyInvestment * 12 + 
      (statistics.capitalAtRetirement * (params.annualReturnRate / 100));
    
    // 3. Calculate withdrawal reduction impact
    const withdrawalReduction = params.monthlyRetirementWithdrawal * 0.1; // 10% reduction
    const withdrawalYears = statistics.retirementDuration;
    const withdrawalSavings = withdrawalReduction * 12 * withdrawalYears;
    const additionalYears = Math.floor(withdrawalSavings / (params.monthlyRetirementWithdrawal * 12));
    
    // 4. Calculate return improvement impact
    const returnImprovement = 0.5; // 0.5% improvement
    const currentReturnAmount = statistics.capitalAtRetirement - statistics.totalInvestedAmount;
    const improvedReturn = statistics.totalInvestedAmount * (1 + (params.annualReturnRate + returnImprovement) / 100) ** (statistics.retirementStartAge - params.currentAge);
    const returnBenefit = improvedReturn - statistics.capitalAtRetirement;
    
    // 5. Calculate risk of running out analysis
    const safeWithdrawalRate = 4; // 4% is often considered safe
    const currentWithdrawalRate = (params.monthlyRetirementWithdrawal * 12 / statistics.capitalAtRetirement) * 100;
    const isWithdrawalRateSafe = currentWithdrawalRate <= safeWithdrawalRate;
    
    // 6. Recommended changes
    const yearsRemaining = statistics.isCapitalExhausted ? 0 : 
      Math.floor(statistics.finalCapital / (params.monthlyRetirementWithdrawal * 12));
    const safetyMargin = statistics.isCapitalExhausted ? 
      -Math.floor((statistics.lifeExpectancy - statistics.exhaustionAge) / 5) * 5 : 
      Math.floor(yearsRemaining / 5) * 5;
    
    const needsSignificantChanges = statistics.isCapitalExhausted || 
      (statistics.finalCapital / statistics.capitalAtRetirement < 0.3);

    const recommendations = [];
    
    if (needsSignificantChanges) {
      if ((statistics.retirementStartAge - params.currentAge) > 5) {
        recommendations.push({
          change: 'Increase monthly investment',
          impact: `+${Math.round(params.monthlyInvestment * 0.3)} ${params.currency}/month`,
          priority: 'High'
        });
      }
      
      recommendations.push({
        change: 'Delay retirement',
        impact: `+${needsSignificantChanges ? 3 : 1} years`,
        priority: needsSignificantChanges ? 'High' : 'Medium'
      });
      
      recommendations.push({
        change: 'Reduce withdrawal',
        impact: `-${Math.round(params.monthlyRetirementWithdrawal * 0.15)} ${params.currency}/month`,
        priority: 'Medium'
      });
    } else {
      recommendations.push({
        change: 'Increase monthly investment',
        impact: `+${Math.round(params.monthlyInvestment * 0.1)} ${params.currency}/month`,
        priority: 'Medium'
      });
      
      recommendations.push({
        change: 'Optimize investment returns',
        impact: `+${returnImprovement.toFixed(1)}% return rate`,
        priority: 'Medium'
      });
    }
    
    // Small adjustment always suggested for best practices
    recommendations.push({
      change: 'Reduce investment fees',
      impact: 'Find lower cost options',
      priority: 'Low'
    });
    
    // 7. For auto-calculated retirement age, additional insights
    let retirementAgeInsights = null;
    
    if (params.autoCalculateRetirementAge) {
      // Calculate early retirement possibility
      const possibleEarlierAge = Math.max(params.currentAge + 1, statistics.retirementStartAge - 5);
      const extraSavingsForEarlier = params.monthlyInvestment * 0.5; // 50% more savings
      const earlierByYears = statistics.retirementStartAge - possibleEarlierAge;
      
      // Calculate delayed retirement benefits
      const delayedRetirementAge = Math.min(statistics.retirementStartAge + 3, params.maxAge - 5);
      const capitalIncreaseByDelaying = yearDelayImpact * (delayedRetirementAge - statistics.retirementStartAge);
      
      retirementAgeInsights = {
        calculatedAge: statistics.retirementStartAge,
        earlierPossible: {
          age: possibleEarlierAge,
          extraMonthlyInvestment: extraSavingsForEarlier,
          yearsEarlier: earlierByYears,
        },
        laterBenefits: {
          age: delayedRetirementAge,
          additionalCapital: capitalIncreaseByDelaying,
          improvedSafety: capitalIncreaseByDelaying / statistics.totalNeededCapital * 100,
        },
        optimalAssessment: calculateOptimalAssessment(statistics, params)
      };
    }
    
    return {
      investmentIncrease: {
        monthlyIncrease: investmentIncrease,
        additionalCapital,
        estimatedAdditionalReturns,
        totalBenefit
      },
      yearDelayImpact,
      delayRetirement: {
        years: 2,
        impact: yearDelayImpact * 2,
        newCapital: statistics.capitalAtRetirement + yearDelayImpact * 2
      },
      withdrawalReduction: {
        monthlyReduction: withdrawalReduction,
        totalSavings: withdrawalSavings,
        additionalYears
      },
      returnImprovement: {
        improvementRate: returnImprovement,
        benefit: returnBenefit,
        newCapital: statistics.capitalAtRetirement + returnBenefit
      },
      runningOut: {
        risk: statistics.isCapitalExhausted ? 'High' : (statistics.finalCapital / statistics.capitalAtRetirement < 0.3 ? 'Medium' : 'Low'),
        safetyMargin,
        statusClass: statistics.isCapitalExhausted ? 'text-red-600' : 
                    (statistics.finalCapital / statistics.capitalAtRetirement < 0.3 ? 'text-yellow-600' : 'text-green-600')
      },
      recommendations,
      retirementAgeInsights
    };
  }, [statistics, params]);
  
  return (
    <div className="mt-8 bg-gray-50 p-5 rounded-2xl shadow-md border border-gray-200">
      {/* Header section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gradient mb-1">Retirement Optimization</h2>
        <p className={typography.style.subtitle}>Strategies to improve your retirement plan</p>
      </div>
      
      {/* Auto-calculated retirement age insights */}
      {params.autoCalculateRetirementAge && analyses.retirementAgeInsights && (
        <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-lg border border-purple-100 mb-4">
          <h3 className="text-md font-medium text-purple-800 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auto-Calculated Retirement Age: {analyses.retirementAgeInsights.calculatedAge}
          </h3>
          
          <div className="text-sm text-gray-700 mb-3">
            <p>We've calculated age <span className="font-semibold">{analyses.retirementAgeInsights.calculatedAge}</span> as the earliest you could achieve financial independence based on your current savings plan and withdrawal needs.</p>
            <p className="mt-1 italic text-purple-700">{analyses.retirementAgeInsights.optimalAssessment.message}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="bg-white p-3 rounded-md border border-purple-100">
              <h4 className="text-sm font-medium text-purple-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Want to retire earlier?
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                To retire at age <span className="font-semibold">{analyses.retirementAgeInsights.earlierPossible.age}</span> (
                {analyses.retirementAgeInsights.earlierPossible.yearsEarlier} years earlier), consider increasing your 
                monthly investment by {formatAmount(analyses.retirementAgeInsights.earlierPossible.extraMonthlyInvestment)}.
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-md border border-purple-100">
              <h4 className="text-sm font-medium text-indigo-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Benefits of delaying retirement
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Working until age <span className="font-semibold">{analyses.retirementAgeInsights.laterBenefits.age}</span> would 
                add approximately {formatAmount(analyses.retirementAgeInsights.laterBenefits.additionalCapital)} to your 
                retirement fund, improving your financial safety by 
                {Math.round(analyses.retirementAgeInsights.laterBenefits.improvedSafety)}%.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main analyses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Improvement strategies tile */}
        <div className={components.container.card}>
          <div className={cx("bg-indigo-50 px-4 py-3 border-b border-gray-200")}>
            <h3 className={typography.style.sectionTitle}>Recommended Improvements</h3>
          </div>
          <div className="p-3">
            <div className="space-y-3">
              {analyses.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <div className={cx(
                    "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                    rec.priority === 'High' ? 'bg-red-100' : 
                    rec.priority === 'Medium' ? 'bg-yellow-100' : 'bg-blue-100'
                  )}>
                    {rec.priority === 'High' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    )}
                    {rec.priority === 'Medium' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {rec.priority === 'Low' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className={cx(typography.weight.medium, "text-gray-800")}>{rec.change}</div>
                    <div className={cx(typography.size.sm, "text-gray-500")}>{rec.impact}</div>
                  </div>
                  <div className={cx(
                    "px-2 py-1 rounded text-xs font-medium",
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' : 
                    rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  )}>
                    {rec.priority}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Impact of delaying retirement */}
        <div className={components.container.card}>
          <div className={cx("bg-blue-50 px-4 py-3 border-b border-gray-200")}>
            <h3 className={typography.style.sectionTitle}>Impact of Delaying Retirement</h3>
          </div>
          <div className="p-3">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className={typography.size.base}>Delaying by {analyses.delayRetirement.years} years would add:</div>
                <div className={cx(typography.weight.bold, typography.size.lg, "text-green-600")}>
                  {formatAmount(analyses.delayRetirement.impact)}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex justify-between mb-2">
                <div className={typography.size.sm}>Current retirement age:</div>
                <div className={cx(typography.size.sm, typography.weight.semibold)}>{statistics.retirementStartAge} years</div>
              </div>
              <div className="flex justify-between mb-2">
                <div className={typography.size.sm}>Delayed retirement age:</div>
                <div className={cx(typography.size.sm, typography.weight.semibold)}>{statistics.retirementStartAge + analyses.delayRetirement.years} years</div>
              </div>
              <div className="flex justify-between">
                <div className={typography.size.sm}>New retirement capital:</div>
                <div className={cx(typography.size.sm, typography.weight.semibold, "text-green-600")}>
                  {formatAmount(analyses.delayRetirement.newCapital)}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Delaying retirement allows for more contributions and compound growth time while reducing the withdrawal period.
            </div>
          </div>
        </div>
        
        {/* The rest of the analyses sections */}
        <div className={components.container.card}>
          <div className={cx("bg-green-50 px-4 py-3 border-b border-gray-200")}>
            <h3 className={typography.style.sectionTitle}>Investment Increase Analysis</h3>
          </div>
          <div className="p-3">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <div>
                <div className={typography.size.base}>
                  Increasing your monthly investment by {formatAmount(analyses.investmentIncrease.monthlyIncrease)} would add:
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className={typography.size.xs}>Additional contributions</div>
                  <div className={cx(typography.size.base, typography.weight.bold, "text-blue-600")}>
                    {formatAmount(analyses.investmentIncrease.additionalCapital)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className={typography.size.xs}>Additional returns</div>
                  <div className={cx(typography.size.base, typography.weight.bold, "text-purple-600")}>
                    {formatAmount(analyses.investmentIncrease.estimatedAdditionalReturns)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-px w-full bg-gray-200 my-3"></div>
            
            <div className="flex justify-between items-center">
              <div className={typography.size.sm}>Total benefit at retirement:</div>
              <div className={cx(typography.size.base, typography.weight.bold, "text-green-600")}>
                {formatAmount(analyses.investmentIncrease.totalBenefit)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk of running out */}
        <div className={components.container.card}>
          <div className={cx("bg-purple-50 px-4 py-3 border-b border-gray-200")}>
            <div className="flex items-center">
              <div className={cx(
                "w-3 h-3 rounded-full mr-2",
                analyses.runningOut.risk === 'High' ? "bg-red-500" : 
                analyses.runningOut.risk === 'Medium' ? "bg-yellow-500" : "bg-green-500"
              )}></div>
              <h3 className={cx(typography.style.sectionTitle, analyses.runningOut.statusClass)}>
                Risk of Outliving Your Money: {analyses.runningOut.risk}
              </h3>
            </div>
          </div>
          <div className="p-3">
            <div className={cx(typography.size.sm, "text-gray-600 mb-4")}>
              {analyses.runningOut.risk === 'High' ? (
                <>Your capital is projected to run out before your life expectancy. Consider implementing multiple strategies above.</>
              ) : analyses.runningOut.risk === 'Medium' ? (
                <>Your plan has limited safety margin. Consider at least one optimization strategy to increase security.</>
              ) : (
                <>Your plan appears robust with sufficient safety margin, but optimization can still provide more flexibility.</>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {analyses.runningOut.risk === 'High' ? (
                <>Your highest priority should be increasing monthly investments and delaying retirement if possible.</>
              ) : analyses.runningOut.risk === 'Medium' ? (
                <>You have approximately {analyses.runningOut.safetyMargin} years of safety margin beyond life expectancy.</>
              ) : (
                <>You have {analyses.runningOut.safetyMargin}+ years of safety margin beyond your life expectancy.</>
              )}
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className={typography.size.sm}>Current withdrawal rate:</div>
                <div className={cx(
                  typography.size.base, 
                  typography.weight.bold,
                  (params.monthlyRetirementWithdrawal * 12 / statistics.capitalAtRetirement * 100) > 4 
                    ? "text-red-600" 
                    : "text-green-600"
                )}>
                  {(params.monthlyRetirementWithdrawal * 12 / statistics.capitalAtRetirement * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional advice sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h4 className={cx(typography.weight.semibold, "text-gray-800")}>Optimize Returns</h4>
          </div>
          <p className={cx(typography.size.sm, "text-gray-600 mb-3")}>
            A {analyses.returnImprovement.improvementRate.toFixed(1)}% improvement in return rate could add {formatAmount(analyses.returnImprovement.benefit)} to your retirement capital.
          </p>
          <div className={cx(typography.size.xs, "text-gray-500")}>
            Consider rebalancing your portfolio or searching for lower fee investment options to increase your effective returns.
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className={cx(typography.weight.semibold, "text-gray-800")}>Inflation Protection</h4>
          </div>
          <p className={cx(typography.size.sm, "text-gray-600 mb-3")}>
            With a {params.inflation}% inflation rate, your purchasing power will decrease by approximately {Math.round((1 - 1/Math.pow(1 + params.inflation/100, 15)) * 100)}% over 15 years.
          </p>
          <div className={cx(typography.size.xs, "text-gray-500")}>
            Consider allocating a portion of your portfolio to inflation-protected securities or assets that historically perform well during inflationary periods.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyses; 