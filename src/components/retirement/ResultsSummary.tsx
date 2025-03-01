import React, { useReducer, useEffect } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction, TimelineWidths, CapitalComparison, StatusInfo, WithdrawalMode, GraphDataPoint } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';

interface ResultsSummaryProps {
  statistics: Statistics;
  params: SimulatorParams;
  formatAmount: FormatAmountFunction;
}

interface SummaryState {
  timelineWidths: TimelineWidths;
  capitalComparison: {
    investedPercentage: number;
    returnPercentage: number;
  };
  status: {
    isOnTrack: boolean;
    statusText: string;
    statusClass: string;
    message: string;
  };
}

type SummaryAction =
  | { type: 'UPDATE_TIMELINE_WIDTHS'; payload: TimelineWidths }
  | { type: 'UPDATE_CAPITAL_COMPARISON'; payload: CapitalComparison }
  | { type: 'UPDATE_STATUS'; payload: StatusInfo };

function summaryReducer(state: SummaryState, action: SummaryAction): SummaryState {
  switch (action.type) {
    case 'UPDATE_TIMELINE_WIDTHS':
      return {
        ...state,
        timelineWidths: action.payload
      };
    case 'UPDATE_CAPITAL_COMPARISON':
      return {
        ...state,
        capitalComparison: {
          investedPercentage: 100,
          returnPercentage: ((action.payload.atRetirement - action.payload.invested) / action.payload.invested) * 100
        }
      };
    case 'UPDATE_STATUS':
      const { isOnTrack } = action.payload;
      return {
        ...state,
        status: {
          isOnTrack,
          statusText: isOnTrack ? 'On Track' : 'At Risk',
          statusClass: isOnTrack ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
          message: isOnTrack 
            ? 'Your capital is projected to last through your expected lifetime.' 
            : 'Your capital may be depleted before your expected lifetime.'
        }
      };
    default:
      return state;
  }
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  statistics,
  params,
  formatAmount,
}) => {
  const { withdrawalMode } = params;

  const [summaryState, dispatch] = useReducer(summaryReducer, {
    timelineWidths: {
      working: 0,
      retirement: 0,
      depleted: 0
    },
    capitalComparison: {
      investedPercentage: 100,
      returnPercentage: 0
    },
    status: {
      isOnTrack: true,
      statusText: 'On Track',
      statusClass: 'bg-green-100 text-green-800',
      message: 'Your capital is projected to last through your expected lifetime.'
    }
  });

  const { postWorkerMessage } = useWorker('resultsSummary');

  useEffect(() => {
    // Generate graph data from statistics
    const graphData: GraphDataPoint[] = [];
    
    // Calculate start and end years
    const startYear = new Date().getFullYear();
    const startAge = params.currentAge;
    const retirementYear = statistics.calculatedRetirementStartYear;
    const retirementAge = statistics.retirementStartAge;
    const endAge = statistics.isCapitalExhausted ? statistics.exhaustionAge : statistics.lifeExpectancy;
    const endYear = startYear + (endAge - startAge);
    
    // Generate data points for each year
    for (let year = startYear; year <= endYear; year++) {
      const age = startAge + (year - startYear);
      const isRetirementYear = year >= retirementYear;
      
      // Create a data point
      const dataPoint: GraphDataPoint = {
        year,
        age,
        capital: year === retirementYear ? statistics.capitalAtRetirement : 
                (year === endYear ? statistics.finalCapital : 0),
        capitalWithoutInterest: 0, // We don't have this data
        variation: 0, // We don't have year-by-year variation
        retirement: isRetirementYear ? "Yes" : "No",
        annualInvestment: isRetirementYear ? 0 : params.monthlyInvestment * 12,
        annualWithdrawal: isRetirementYear ? params.monthlyRetirementWithdrawal * 12 : 0,
        annualInterest: 0, // We don't have year-by-year interest
        netVariationExcludingInterest: isRetirementYear ? 
          -(params.monthlyRetirementWithdrawal * 12) : (params.monthlyInvestment * 12),
        finalMonthlyInvestment: statistics.finalMonthlyInvestment,
        finalMonthlyWithdrawal: statistics.finalMonthlyWithdrawalValue,
        totalInvested: year === retirementYear ? statistics.totalInvestedAmount : 0,
        totalWithdrawn: 0, // We don't have this data
        targetAge: age === endAge
      };
      
      graphData.push(dataPoint);
    }
    
    postWorkerMessage({
      type: WorkerMessageType.CALCULATE_SUMMARY,
      payload: {
        graphData
      }
    }, (response: WorkerResponse) => {
      if (response.type === WorkerMessageType.ERROR) {
        console.error('Worker error:', response.error);
        return;
      }

      if (response.type === WorkerMessageType.SUMMARY_RESULT && response.data) {
        // Calculate timeline widths based on retirement duration and life expectancy
        const retirementDuration = response.data.retirementDuration;
        const totalYears = statistics.lifeExpectancy - params.currentAge;
        const workingYears = statistics.retirementStartAge - params.currentAge;
        
        // Calculate timeline widths as percentages, ensuring they sum to 100%
        let workingWidth = (workingYears / totalYears) * 100;
        let retirementWidth, depletedWidth = 0;

        if (statistics.isCapitalExhausted) {
          // If capital is exhausted, calculate all three phases
          const retirementYears = statistics.exhaustionAge - statistics.retirementStartAge;
          const depletedYears = statistics.lifeExpectancy - statistics.exhaustionAge;
          
          retirementWidth = (retirementYears / totalYears) * 100;
          depletedWidth = (depletedYears / totalYears) * 100;
        } else {
          // If capital is not exhausted, only two phases: working and retirement
          retirementWidth = 100 - workingWidth; // Ensure they sum to 100%
          depletedWidth = 0;
        }
        
        // Ensure all widths are non-negative
        workingWidth = Math.max(0, workingWidth);
        retirementWidth = Math.max(0, retirementWidth);
        depletedWidth = Math.max(0, depletedWidth);
        
        // Create timeline widths object
        const timelineWidths: TimelineWidths = {
          working: workingWidth,
          retirement: retirementWidth,
          depleted: depletedWidth
        };
        
        // Create capital comparison object
        const capitalComparison: CapitalComparison = {
          invested: response.data.totalContributions,
          atRetirement: statistics.capitalAtRetirement
        };
        
        // Create status info object
        const status: StatusInfo = {
          isOnTrack: !statistics.isCapitalExhausted
        };
        
        // Dispatch updates
        dispatch({ type: 'UPDATE_TIMELINE_WIDTHS', payload: timelineWidths });
        dispatch({ type: 'UPDATE_CAPITAL_COMPARISON', payload: capitalComparison });
        dispatch({ type: 'UPDATE_STATUS', payload: status });
      } else {
        console.error('Invalid worker response type:', response.type);
      }
    });
  }, [statistics, withdrawalMode, postWorkerMessage, params.currentAge, params.monthlyInvestment, params.monthlyRetirementWithdrawal]);

  const { timelineWidths, status } = summaryState;
  const workingWidth = `${timelineWidths.working}%`;
  const retirementWidth = `${timelineWidths.retirement}%`;
  const depletedWidth = `${timelineWidths.depleted}%`;

  // Calculate annual retirement income
  const annualRetirementIncome = params.monthlyRetirementWithdrawal * 12;
  
  // Calculate return on investment percentage
  const roi = statistics.capitalAtRetirement > 0 && statistics.totalInvestedAmount > 0
    ? ((statistics.capitalAtRetirement - statistics.totalInvestedAmount) / statistics.totalInvestedAmount) * 100
    : 0;
    
  // Calculate withdrawal rate
  const withdrawalRate = statistics.capitalAtRetirement > 0
    ? (annualRetirementIncome / statistics.capitalAtRetirement) * 100
    : 0;

  return (
    <div className="mt-8 bg-gray-50 p-5 rounded-2xl shadow-md border border-gray-200">
      {/* Header with status indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <div>
          <h2 className="text-xl font-semibold text-gradient mb-1 sm:mb-0">Retirement Summary</h2>
          <p className={typography.style.subtitle}>Analysis of your financial journey</p>
        </div>
        <div className={cx(
          "rounded-lg px-4 py-2 mt-3 sm:mt-0 flex items-center gap-2 shadow-sm",
          status.isOnTrack 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : "bg-red-100 text-red-800 border border-red-200 animate-pulse"
        )}>
          <div className={cx(
            "w-3 h-3 rounded-full",
            status.isOnTrack ? "bg-green-500" : "bg-red-600"
          )}></div>
          <div>
            <div className={cx(typography.weight.semibold, status.isOnTrack ? "text-green-800" : "text-red-800")}>{status.statusText}</div>
            <div className={cx(typography.size.xs, status.isOnTrack ? "text-green-700" : "text-red-700")}>{status.message}</div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="pt-2">
        {/* Timeline visualization */}
        <div className="mb-4">
          <h3 className={cx(typography.style.sectionTitle, "mb-2")}>Your Retirement Timeline</h3>
          
          <div className={cx(components.dataViz.timeline, "mb-3")}>
            <div 
              className={cx("h-full flex flex-col justify-center px-3", colors.phases.investment.bg)}
              style={{ width: workingWidth }}
            >
              <div className="text-sm text-white font-medium">{statistics.retirementStartAge - params.currentAge} years</div>
              <div className="text-xs text-blue-100">Working Phase</div>
              <div className="text-xs text-blue-100">{new Date().getFullYear()}—{statistics.calculatedRetirementStartYear}</div>
            </div>
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 flex flex-col justify-center px-3"
              style={{ width: retirementWidth }}
            >
              <div className="text-sm text-white font-medium">
                {statistics.isCapitalExhausted 
                  ? statistics.exhaustionAge - statistics.retirementStartAge 
                  : statistics.lifeExpectancy - statistics.retirementStartAge} years
              </div>
              <div className="text-xs text-green-100">Retirement</div>
              <div className="text-xs text-green-100">
                {statistics.calculatedRetirementStartYear}—
                {statistics.isCapitalExhausted 
                  ? statistics.exhaustionYear
                  : new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}
              </div>
            </div>
            {timelineWidths.depleted > 0 && (
              <div 
                className={cx("h-full flex flex-col justify-center px-3", colors.phases.depleted.bg)}
                style={{ width: depletedWidth }}
              >
                <div className="text-sm text-white font-medium">{statistics.lifeExpectancy - statistics.exhaustionAge} years</div>
                <div className="text-xs text-red-100">Depleted</div>
                <div className="text-xs text-red-100">
                  {statistics.exhaustionYear}—{new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}
                </div>
              </div>
            )}
          </div>

          {/* Key milestones - Redesigned to be less tall and more explicit */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100 flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-blue-700 font-bold">{params.currentAge}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Starting Age</div>
                <div className="text-sm font-semibold">{new Date().getFullYear()}</div>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100 flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-indigo-700 font-bold">{statistics.retirementStartAge}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Retirement Begins</div>
                <div className="text-sm font-semibold">{statistics.calculatedRetirementStartYear}</div>
              </div>
            </div>
            
            {statistics.isCapitalExhausted ? (
              <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100 flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-red-700 font-bold">{statistics.exhaustionAge}</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600">Funds Depleted</div>
                  <div className="text-sm font-semibold text-red-700">{statistics.exhaustionYear}</div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100 flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600">Funds Remaining</div>
                  <div className="text-sm font-semibold text-emerald-700">{formatAmount(statistics.finalCapital).split('.')[0]}</div>
                </div>
              </div>
            )}
            
            <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-100 flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-purple-700 font-bold">{statistics.lifeExpectancy}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Life Expectancy</div>
                <div className="text-sm font-semibold">{new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Financial details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Capital Section */}
          <div className={components.container.card}>
            <div className={cx("bg-blue-50 px-4 py-3 border-b border-gray-200")}>
              <h3 className={typography.style.sectionTitle}>Capital</h3>
            </div>
            <div className="p-3">
              {/* Capital breakdown */}
              <div className="flex items-center mb-4">
                <div className={cx("w-24", typography.size.sm, "text-gray-600")}>Initial</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${(params.initialCapital / statistics.capitalAtRetirement) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className={cx("w-32 text-right", typography.size.sm, typography.weight.semibold, "text-gray-800")}>{formatAmount(params.initialCapital)}</div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className={cx("w-24", typography.size.sm, "text-gray-600")}>Contributions</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500"
                      style={{ width: `${((statistics.totalInvestedAmount - params.initialCapital) / statistics.capitalAtRetirement) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className={cx("w-32 text-right", typography.size.sm, typography.weight.semibold, "text-gray-800")}>{formatAmount(statistics.totalInvestedAmount - params.initialCapital)}</div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className={cx("w-24", typography.size.sm, "text-gray-600")}>Returns <span className={colors.phases.investment.text}>({Math.round(roi)}%)</span></div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500"
                      style={{ width: `${((statistics.capitalAtRetirement - statistics.totalInvestedAmount) / statistics.capitalAtRetirement) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className={cx("w-32 text-right", typography.size.sm, typography.weight.semibold, colors.phases.investment.text)}>{formatAmount(statistics.capitalAtRetirement - statistics.totalInvestedAmount)}</div>
              </div>
              
              <div className="h-px w-full bg-gray-200 my-4"></div>
              
              <div className="flex items-center">
                <div className={cx("w-24", typography.size.sm, typography.weight.medium, "text-gray-800")}>At Retirement</div>
                <div className="flex-1"></div>
                <div className={cx("w-32 text-right", typography.size.base, typography.weight.bold, "text-green-600")}>{formatAmount(statistics.capitalAtRetirement)}</div>
              </div>
              
              <div className="flex items-center mt-2">
                <div className={cx("w-24", typography.size.sm, typography.weight.medium, "text-gray-800")}>Final</div>
                <div className="flex-1"></div>
                <div className={cx(
                  "w-32 text-right", 
                  typography.size.base, 
                  typography.weight.bold, 
                  statistics.finalCapital > 0 ? components.dataViz.positive : components.dataViz.negative
                )}>
                  {formatAmount(statistics.finalCapital)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Retirement Details */}
          <div className={components.container.card}>
            <div className={cx("bg-green-50 px-4 py-3 border-b border-gray-200")}>
              <h3 className={typography.style.sectionTitle}>Retirement Details</h3>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className={cx(components.container.highlight, "p-3 text-center bg-indigo-50")}>
                  <div className={cx(typography.size.sm, "text-gray-600 mb-1")}>Working Period</div>
                  <div className={cx(typography.size.xl, typography.weight.bold, colors.phases.investment.dark)}>{statistics.retirementStartAge - params.currentAge} years</div>
                </div>
                
                <div className={cx(components.container.highlight, "p-3 text-center bg-green-50")}>
                  <div className={cx(typography.size.sm, "text-gray-600 mb-1")}>Retirement Period</div>
                  <div className={cx(typography.size.xl, typography.weight.bold, "text-green-700")}>{statistics.retirementDuration} years</div>
                </div>
              </div>
              
              {/* Inflation impact */}
              <div className="mb-5">
                <h4 className={cx(typography.size.sm, typography.weight.semibold, "text-gray-700 mb-3")}>Inflation Impact</h4>
                
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className={cx(typography.size.sm, "text-gray-700")}>Monthly Investment</div>
                    <div className={cx(typography.size.sm, typography.weight.medium, colors.phases.investment.text)}>{formatAmount(params.monthlyInvestment)} → {formatAmount(statistics.finalMonthlyInvestment)}</div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600"
                      style={{ width: `${(params.monthlyInvestment / statistics.finalMonthlyInvestment) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className={cx(typography.size.sm, "text-gray-700")}>Monthly Withdrawal</div>
                    <div className={cx(typography.size.sm, typography.weight.medium, colors.phases.retirement.text)}>{formatAmount(params.monthlyRetirementWithdrawal)} → {formatAmount(statistics.finalMonthlyWithdrawalValue)}</div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600"
                      style={{ width: `${(params.monthlyRetirementWithdrawal / statistics.finalMonthlyWithdrawalValue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <div className={cx(typography.size.sm, "text-gray-600")}>Withdrawal Rate</div>
                  <div className={cx(typography.size.lg, typography.weight.bold, "text-green-600")}>{withdrawalRate.toFixed(1)}%</div>
                  <div className={typography.style.caption}>annually from capital</div>
                </div>
                
                <div className="flex flex-col">
                  <div className={cx(typography.size.sm, "text-gray-600")}>Retirement:Working Ratio</div>
                  <div className={cx(typography.size.lg, typography.weight.bold, colors.phases.retirement.text)}>{(statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge)).toFixed(1)}x</div>
                  <div className={typography.style.caption}>years retired per year worked</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary; 