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
      return {
        ...state,
        status: {
          isOnTrack: action.payload.isOnTrack,
          statusText: action.payload.isOnTrack ? 'On Track' : 'At Risk',
          statusClass: action.payload.isOnTrack ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
      statusClass: 'bg-green-100 text-green-800'
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
        
        // Calculate timeline widths as percentages
        const workingWidth = (workingYears / totalYears) * 100;
        const retirementWidth = (retirementDuration / totalYears) * 100;
        const depletedWidth = statistics.isCapitalExhausted ? 
          ((statistics.lifeExpectancy - statistics.exhaustionAge) / totalYears) * 100 : 0;
        
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

  return (
    <div className="p-4 bg-gray-50 rounded-2xl shadow mb-5">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary</h2>
      
      {/* Overview Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Overview</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.statusClass}`}>
            {status.statusText}
          </span>
        </div>
        
        <div className="mt-3 flex">
          <div className="border-r border-gray-200 pr-3 w-1/2">
            <div className="text-xs text-gray-500 mb-1">Retirement Start</div>
            <div className="text-lg font-semibold text-gray-800">{statistics.calculatedRetirementStartYear}</div>
            <div className="text-xs text-gray-500">Age {statistics.retirementStartAge}</div>
          </div>
          <div className="pl-3 w-1/2">
            <div className="text-xs text-gray-500 mb-1">Life Expectancy</div>
            <div className="text-lg font-semibold text-gray-800">Age {statistics.lifeExpectancy}</div>
            <div className="text-xs text-gray-500">{withdrawalMode === "age" ? "Target" : "Estimated"}</div>
          </div>
        </div>
        
        {/* Capital Timeline Visualization */}
        <div className="mt-4">
          <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden flex">
            <div 
              className="h-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
              style={{ width: workingWidth }}
            >
              Working
            </div>
            <div 
              className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
              style={{ width: retirementWidth }}
            >
              Retirement
            </div>
            {timelineWidths.depleted > 0 && (
              <div 
                className="h-full bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: depletedWidth }}
              >
                Depleted
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Capital Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Capital</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">At Retirement</div>
            <div className="text-xl font-semibold text-blue-600">{formatAmount(statistics.capitalAtRetirement)}</div>
            <div className="text-xs text-gray-500">Age {statistics.retirementStartAge}</div>
          </div>
          
          <div className={`border rounded-xl p-3 ${statistics.finalCapital <= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Final Capital</div>
            <div className={`text-xl font-semibold ${statistics.finalCapital <= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(statistics.finalCapital)}
            </div>
            <div className="text-xs text-gray-500">
              {statistics.exhaustionYear === "Not exhausted" 
                ? `At age ${statistics.lifeExpectancy}` 
                : `Depleted at age ${statistics.exhaustionAge}`}
            </div>
          </div>
        </div>
        
        {/* Capital/Investment Comparison */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <div className="text-xs text-gray-500">Total Invested</div>
            <div className="text-xs font-medium text-gray-800">{formatAmount(statistics.totalInvestedAmount)}</div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500"
              style={{ width: `100%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mb-1 mt-3">
            <div className="text-xs text-gray-500">Capital at Retirement</div>
            <div className="text-xs font-medium text-gray-800">{formatAmount(statistics.capitalAtRetirement)}</div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: `${(statistics.capitalAtRetirement / statistics.totalInvestedAmount) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-blue-600">Investment Growth</div>
            <div className="text-xs font-medium text-blue-600">
              {formatAmount(statistics.capitalAtRetirement - statistics.totalInvestedAmount)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Monthly Amounts Card */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Amounts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Monthly Investment</div>
            <div className="text-lg font-semibold text-blue-600">{formatAmount(params.monthlyInvestment)}</div>
            <div className="text-xs text-gray-500 mt-1">Current</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{formatAmount(statistics.finalMonthlyInvestment)}</div>
            <div className="text-xs text-gray-500">Final (inflation adjusted)</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Monthly Withdrawal</div>
            <div className="text-lg font-semibold text-purple-600">{formatAmount(params.monthlyRetirementWithdrawal)}</div>
            <div className="text-xs text-gray-500 mt-1">Current</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{formatAmount(statistics.finalMonthlyWithdrawalValue)}</div>
            <div className="text-xs text-gray-500">Final (inflation adjusted)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary; 