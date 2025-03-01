import { useMemo } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction } from './types';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';
import { FiArrowUp, FiArrowDown, FiClock, FiTrendingUp, FiDollarSign } from 'react-icons/fi';

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
    
    // 4. Calculate return improvement impact
    const returnImprovement = 0.5; // 0.5% improvement
    const currentReturnAmount = statistics.capitalAtRetirement - statistics.totalInvestedAmount;
    const improvedReturn = statistics.totalInvestedAmount * (1 + (params.annualReturnRate + returnImprovement) / 100) ** (statistics.retirementStartAge - params.currentAge);
    const returnBenefit = improvedReturn - statistics.capitalAtRetirement;
    
    // 5. Calculate risk of running out analysis
    const yearsRemaining = statistics.isCapitalExhausted ? 0 : 
      Math.floor(statistics.finalCapital / (params.monthlyRetirementWithdrawal * 12));
    const safetyMargin = statistics.isCapitalExhausted ? 
      -Math.floor((statistics.lifeExpectancy - statistics.exhaustionAge) / 5) * 5 : 
      Math.floor(yearsRemaining / 5) * 5;
    
    // 6. Recommended changes
    const needsSignificantChanges = statistics.isCapitalExhausted || 
      (statistics.finalCapital / statistics.capitalAtRetirement < 0.3);

    const recommendedChanges = [];
    
    if (needsSignificantChanges) {
      if ((statistics.retirementStartAge - params.currentAge) > 5) {
        recommendedChanges.push({
          change: 'Increase monthly investment',
          impact: `+${Math.round(params.monthlyInvestment * 0.3)} ${params.currency}/month`,
          priority: 'High'
        });
      }
      
      recommendedChanges.push({
        change: 'Delay retirement',
        impact: `+${needsSignificantChanges ? 3 : 1} years`,
        priority: needsSignificantChanges ? 'High' : 'Medium'
      });
      
      recommendedChanges.push({
        change: 'Reduce withdrawal',
        impact: `-${Math.round(params.monthlyRetirementWithdrawal * 0.15)} ${params.currency}/month`,
        priority: 'Medium'
      });
    } else {
      recommendedChanges.push({
        change: 'Increase monthly investment',
        impact: `+${Math.round(params.monthlyInvestment * 0.1)} ${params.currency}/month`,
        priority: 'Medium'
      });
      
      recommendedChanges.push({
        change: 'Optimize investment returns',
        impact: `+${returnImprovement.toFixed(1)}% return rate`,
        priority: 'Medium'
      });
    }
    
    // Small adjustment always suggested for best practices
    recommendedChanges.push({
      change: 'Reduce investment fees',
      impact: 'Find lower cost options',
      priority: 'Low'
    });
    
    return {
      investmentIncrease: {
        amount: investmentIncrease,
        additionalCapital,
        estimatedAdditionalReturns,
        totalBenefit
      },
      delayRetirement: {
        years: 2,
        impact: yearDelayImpact * 2,
        newCapital: statistics.capitalAtRetirement + yearDelayImpact * 2
      },
      withdrawalReduction: {
        amount: withdrawalReduction,
        totalSavings: withdrawalSavings,
        additionalYears: Math.floor(withdrawalSavings / (params.monthlyRetirementWithdrawal * 12))
      },
      returnImprovement: {
        percent: returnImprovement,
        benefit: returnBenefit,
        newCapital: statistics.capitalAtRetirement + returnBenefit
      },
      runningOut: {
        risk: statistics.isCapitalExhausted ? 'High' : (statistics.finalCapital / statistics.capitalAtRetirement < 0.3 ? 'Medium' : 'Low'),
        safetyMargin,
        statusClass: statistics.isCapitalExhausted ? 'text-red-600' : 
                     (statistics.finalCapital / statistics.capitalAtRetirement < 0.3 ? 'text-yellow-600' : 'text-green-600')
      },
      recommendations: recommendedChanges
    };
  }, [statistics, params]);

  return (
    <div className="mt-8 bg-gray-50 p-5 rounded-2xl shadow-md border border-gray-200">
      {/* Header section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gradient mb-1">Retirement Optimization</h2>
        <p className={typography.style.subtitle}>Strategies to improve your retirement plan</p>
      </div>
      
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
                    {rec.priority === 'High' && FiArrowUp({ className: "w-4 h-4 text-red-600" })}
                    {rec.priority === 'Medium' && FiTrendingUp({ className: "w-4 h-4 text-yellow-600" })}
                    {rec.priority === 'Low' && FiDollarSign({ className: "w-4 h-4 text-blue-600" })}
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
                {FiClock({ className: "w-6 h-6 text-blue-600" })}
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
        
        {/* Increase investment analysis */}
        <div className={components.container.card}>
          <div className={cx("bg-green-50 px-4 py-3 border-b border-gray-200")}>
            <h3 className={typography.style.sectionTitle}>Investment Increase Analysis</h3>
          </div>
          <div className="p-3">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                {FiArrowUp({ className: "w-5 h-5 text-green-600" })}
              </div>
              <div>
                <div className={typography.size.base}>
                  Increasing your monthly investment by {formatAmount(analyses.investmentIncrease.amount)} would add:
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
        
        {/* Withdrawal Reduction Impact */}
        <div className={components.container.card}>
          <div className={cx("bg-purple-50 px-4 py-3 border-b border-gray-200")}>
            <h3 className={typography.style.sectionTitle}>Withdrawal Reduction Impact</h3>
          </div>
          <div className="p-3">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
                {FiArrowDown({ className: "w-5 h-5 text-purple-600" })}
              </div>
              <div>
                <div className={typography.size.base}>
                  Reducing monthly withdrawal by {formatAmount(analyses.withdrawalReduction.amount)} would save:
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
              <div className="flex justify-between mb-2">
                <div className={typography.size.sm}>Current monthly withdrawal:</div>
                <div className={cx(typography.size.sm, typography.weight.semibold)}>
                  {formatAmount(params.monthlyRetirementWithdrawal)}
                </div>
              </div>
              <div className="flex justify-between mb-2">
                <div className={typography.size.sm}>Reduced monthly withdrawal:</div>
                <div className={cx(typography.size.sm, typography.weight.semibold, "text-green-600")}>
                  {formatAmount(params.monthlyRetirementWithdrawal - analyses.withdrawalReduction.amount)}
                </div>
              </div>
              <div className="flex justify-between">
                <div className={typography.size.sm}>Total lifetime savings:</div>
                <div className={cx(typography.size.sm, typography.weight.semibold, "text-green-600")}>
                  {formatAmount(analyses.withdrawalReduction.totalSavings)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
              <div className={typography.size.sm}>Additional years of retirement:</div>
              <div className={cx(typography.size.base, typography.weight.bold, "text-indigo-600")}>
                + {analyses.withdrawalReduction.additionalYears} years
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional optimization strategies */}
      <div className="border-t border-gray-200 pt-4 mt-2">
        <h3 className={cx(typography.style.sectionTitle, "mb-3")}>Additional Strategies</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Strategy 1: Optimize investment returns */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center mb-2">
              {FiTrendingUp({ className: "w-5 h-5 text-green-500 mr-2" })}
              <h4 className={cx(typography.weight.semibold, "text-gray-800")}>Optimize Returns</h4>
            </div>
            <p className={cx(typography.size.sm, "text-gray-600 mb-3")}>
              A {analyses.returnImprovement.percent}% improvement in return rate could add {formatAmount(analyses.returnImprovement.benefit)} to your retirement capital.
            </p>
            <div className={cx(typography.size.xs, "text-gray-500")}>
              Consider diversification, rebalancing, and low-fee investment options.
            </div>
          </div>
          
          {/* Strategy 2: Inflation hedging */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center mb-2">
              {FiDollarSign({ className: "w-5 h-5 text-yellow-500 mr-2" })}
              <h4 className={cx(typography.weight.semibold, "text-gray-800")}>Inflation Protection</h4>
            </div>
            <p className={cx(typography.size.sm, "text-gray-600 mb-3")}>
              Your plan accounts for {params.inflation.toFixed(1)}% inflation. Consider assets that hedge against higher inflation.
            </p>
            <div className={cx(typography.size.xs, "text-gray-500")}>
              Options include TIPS, I-bonds, real estate, and certain stock sectors.
            </div>
          </div>
          
          {/* Strategy 3: Tax optimization */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
              </svg>
              <h4 className={cx(typography.weight.semibold, "text-gray-800")}>Tax Optimization</h4>
            </div>
            <p className={cx(typography.size.sm, "text-gray-600 mb-3")}>
              Strategic use of tax-advantaged accounts can significantly increase your after-tax returns.
            </p>
            <div className={cx(typography.size.xs, "text-gray-500")}>
              Balance between traditional and Roth accounts for tax diversification.
            </div>
          </div>
        </div>
      </div>
      
      {/* Risk assessment */}
      <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center mb-3">
          <div className={cx(
            "w-3 h-3 rounded-full mr-2",
            analyses.runningOut.risk === 'High' ? "bg-red-500" : 
            analyses.runningOut.risk === 'Medium' ? "bg-yellow-500" : "bg-green-500"
          )}></div>
          <h3 className={cx(typography.style.sectionTitle, analyses.runningOut.statusClass)}>
            Risk of Outliving Your Money: {analyses.runningOut.risk}
          </h3>
        </div>
        
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
      </div>
    </div>
  );
};

export default Analyses; 