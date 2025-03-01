import React, { useReducer, useEffect } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction, TimelineWidths, CapitalComparison, StatusInfo, WithdrawalMode, GraphDataPoint } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';

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
    <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with status indicator */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Retirement Summary</h2>
            <p className="text-sm text-gray-600 mt-1">Analysis of your financial journey</p>
          </div>
          <div className={`${status.statusClass} rounded-lg px-4 py-2 mt-3 sm:mt-0 flex items-center gap-2 shadow-sm`}>
            <div className={`w-3 h-3 rounded-full ${status.isOnTrack ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <div>
              <div className="font-semibold">{status.statusText}</div>
              <div className="text-xs">{status.message}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-5">
        {/* Timeline visualization */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Retirement Timeline</h3>
          
          <div className="relative h-16 w-full bg-gray-100 rounded-lg overflow-hidden flex mb-3">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 flex flex-col justify-center px-3"
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
                className="h-full bg-gradient-to-r from-red-500 to-pink-600 flex flex-col justify-center px-3"
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

          {/* Key milestones */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="flex flex-col items-center bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="text-sm text-blue-700 mb-1">Current</div>
              <div className="text-xl font-bold text-gray-800">{params.currentAge}</div>
              <div className="text-xs text-gray-500">{new Date().getFullYear()}</div>
            </div>
            
            <div className="flex flex-col items-center bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <div className="text-sm text-indigo-700 mb-1">Retirement</div>
              <div className="text-xl font-bold text-gray-800">{statistics.retirementStartAge}</div>
              <div className="text-xs text-gray-500">{statistics.calculatedRetirementStartYear}</div>
            </div>
            
            {statistics.isCapitalExhausted ? (
              <div className="flex flex-col items-center bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="text-sm text-red-700 mb-1">Depletion</div>
                <div className="text-xl font-bold text-red-600">{statistics.exhaustionAge}</div>
                <div className="text-xs text-gray-500">{statistics.exhaustionYear}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="text-sm text-emerald-700 mb-1">Safety</div>
                <div className="text-xl font-bold text-emerald-600">+{formatAmount(statistics.finalCapital).split('.')[0]}</div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
            )}
            
            <div className="flex flex-col items-center bg-purple-50 rounded-xl p-3 border border-purple-100">
              <div className="text-sm text-purple-700 mb-1">Life Expectancy</div>
              <div className="text-xl font-bold text-gray-800">{statistics.lifeExpectancy}</div>
              <div className="text-xs text-gray-500">years</div>
            </div>
          </div>
        </div>
        
        {/* Financial details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capital Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Capital</h3>
            </div>
            <div className="p-4">
              {/* Capital breakdown */}
              <div className="flex items-center mb-4">
                <div className="w-24 text-sm text-gray-600">Initial</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${(params.initialCapital / statistics.capitalAtRetirement) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-32 text-right text-sm font-semibold text-gray-800">{formatAmount(params.initialCapital)}</div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-24 text-sm text-gray-600">Contributions</div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500"
                      style={{ width: `${((statistics.totalInvestedAmount - params.initialCapital) / statistics.capitalAtRetirement) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-32 text-right text-sm font-semibold text-gray-800">{formatAmount(statistics.totalInvestedAmount - params.initialCapital)}</div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-24 text-sm text-gray-600">Returns <span className="text-indigo-600">({Math.round(roi)}%)</span></div>
                <div className="flex-1">
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500"
                      style={{ width: `${((statistics.capitalAtRetirement - statistics.totalInvestedAmount) / statistics.capitalAtRetirement) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-32 text-right text-sm font-semibold text-indigo-600">{formatAmount(statistics.capitalAtRetirement - statistics.totalInvestedAmount)}</div>
              </div>
              
              <div className="h-px w-full bg-gray-200 my-4"></div>
              
              <div className="flex items-center">
                <div className="w-24 text-sm font-medium text-gray-800">At Retirement</div>
                <div className="flex-1"></div>
                <div className="w-32 text-right text-base font-bold text-green-600">{formatAmount(statistics.capitalAtRetirement)}</div>
              </div>
              
              <div className="flex items-center mt-2">
                <div className="w-24 text-sm font-medium text-gray-800">Final</div>
                <div className="flex-1"></div>
                <div className={`w-32 text-right text-base font-bold ${statistics.finalCapital > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatAmount(statistics.finalCapital)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Retirement Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Retirement Details</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600 mb-1">Working Period</div>
                  <div className="text-xl font-bold text-indigo-700">{statistics.retirementStartAge - params.currentAge} years</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600 mb-1">Retirement Period</div>
                  <div className="text-xl font-bold text-green-700">{statistics.retirementDuration} years</div>
                </div>
              </div>
              
              {/* Inflation impact */}
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Inflation Impact</h4>
                
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm text-gray-700">Monthly Investment</div>
                    <div className="text-sm font-medium text-blue-600">{formatAmount(params.monthlyInvestment)} → {formatAmount(statistics.finalMonthlyInvestment)}</div>
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
                    <div className="text-sm text-gray-700">Monthly Withdrawal</div>
                    <div className="text-sm font-medium text-purple-600">{formatAmount(params.monthlyRetirementWithdrawal)} → {formatAmount(statistics.finalMonthlyWithdrawalValue)}</div>
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
                  <div className="text-sm text-gray-600">Withdrawal Rate</div>
                  <div className="text-lg font-bold text-green-600">{withdrawalRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">annually from capital</div>
                </div>
                
                <div className="flex flex-col">
                  <div className="text-sm text-gray-600">Retirement:Working Ratio</div>
                  <div className="text-lg font-bold text-purple-600">{(statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge)).toFixed(1)}x</div>
                  <div className="text-xs text-gray-500">years retired per year worked</div>
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