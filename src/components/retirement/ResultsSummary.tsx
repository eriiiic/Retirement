import { useReducer, useEffect, useState, useRef } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction, TimelineWidths, CapitalComparison, StatusInfo, WithdrawalMode, GraphDataPoint, Currency } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';
import FormulaModal from './FormulaModal';

interface ResultsSummaryProps {
  statistics: Statistics;
  params: SimulatorParams;
  formatAmount: FormatAmountFunction;
  currency: Currency;
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

// Add interface for countdown
interface CountdownTime {
  years: number;
  months: number;
  days: number;
  hours: number;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  statistics,
  params,
  formatAmount,
  currency
}) => {
  const { withdrawalMode } = params;
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [showInvestmentFutureText, setShowInvestmentFutureText] = useState(true);
  const [showWithdrawalFutureText, setShowWithdrawalFutureText] = useState(true);
  const barContainerRef = useRef<HTMLDivElement>(null);

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

  // Add state for countdown
  const [countdown, setCountdown] = useState<CountdownTime>({ years: 0, months: 0, days: 0, hours: 0 });
  
  // Add effect for countdown calculation
  useEffect(() => {
    if (!summaryState.status.isOnTrack || statistics.isCapitalExhausted) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const retirementYear = statistics.calculatedRetirementStartYear;
      const retirementDate = new Date(retirementYear, 0, 1); // January 1st of retirement year
      
      const difference = retirementDate.getTime() - now.getTime();
      
      if (difference <= 0) return null;
      
      const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor((difference % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((difference % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      return { years, months, days, hours };
    };

    const updateCountdown = () => {
      const timeLeft = calculateTimeLeft();
      if (timeLeft) {
        setCountdown(timeLeft);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(timer);
  }, [summaryState.status.isOnTrack, statistics.calculatedRetirementStartYear, statistics.isCapitalExhausted]);

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
    
    postWorkerMessage(
      WorkerMessageType.CALCULATE_SUMMARY,
      {
        graphData,
        params
      },
      (response) => {
        if (response.error) {
          console.error('Worker error:', response.error);
          return;
        }

        // We've changed how worker responses are structured - now successful responses are directly the data object
        // Calculate timeline widths based on retirement duration and life expectancy
        const retirementDuration = response.retirementDuration;
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
          invested: response.totalInvestedAmount || statistics.totalInvestedAmount,
          atRetirement: response.capitalAtRetirement || statistics.capitalAtRetirement
        };
        
        // Create status info object
        const status: StatusInfo = {
          isOnTrack: !response.isCapitalExhausted
        };
        
        // Dispatch updates
        dispatch({ type: 'UPDATE_TIMELINE_WIDTHS', payload: timelineWidths });
        dispatch({ type: 'UPDATE_CAPITAL_COMPARISON', payload: capitalComparison });
        dispatch({ type: 'UPDATE_STATUS', payload: status });
      }
    );
  }, [statistics, withdrawalMode, postWorkerMessage, params.currentAge, params.monthlyInvestment, params.monthlyRetirementWithdrawal]);

  // Add effect to check container width and available space
  useEffect(() => {
    const checkSpace = () => {
      if (barContainerRef.current) {
        const containerWidth = barContainerRef.current.offsetWidth;
        const minWidthForText = 80; // Minimum width needed to display "Future Value" text

        // Calculate available space for investment bar
        const investmentRatio = params.monthlyInvestment / statistics.finalMonthlyInvestment;
        const investmentFutureSpace = containerWidth * (1 - investmentRatio);
        setShowInvestmentFutureText(investmentFutureSpace >= minWidthForText);

        // Calculate available space for withdrawal bar
        const withdrawalRatio = params.monthlyRetirementWithdrawal / statistics.finalMonthlyWithdrawalValue;
        const withdrawalFutureSpace = containerWidth * (1 - withdrawalRatio);
        setShowWithdrawalFutureText(withdrawalFutureSpace >= minWidthForText);
      }
    };

    checkSpace();
    window.addEventListener('resize', checkSpace);
    return () => window.removeEventListener('resize', checkSpace);
  }, [params.monthlyInvestment, statistics.finalMonthlyInvestment, 
      params.monthlyRetirementWithdrawal, statistics.finalMonthlyWithdrawalValue]);

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
    <div className="bg-gray-50 p-5 rounded-2xl shadow-md border border-gray-200">
      {/* Header with status indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
        <div>
          <h2 className="text-xl font-semibold text-gradient mb-1 sm:mb-0">Retirement Summary</h2>
          <p className={typography.style.subtitle}>Analysis of your financial journey</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-3 sm:mt-0">
          <div className={cx(
            "rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm",
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
          
          <button 
            onClick={() => setIsFormulaModalOpen(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-4 py-2 border border-indigo-200 shadow-sm transition-colors flex items-center"
          >
            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
            <div>
              <div className={cx(typography.weight.semibold, "text-indigo-800")}>Calculation Formulas</div>
              <div className={cx(typography.size.xs, "text-indigo-700")}>View financial equations used</div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="pt-2">
        {/* Timeline visualization */}
        <div className="mb-4">
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

          {/* Key milestones grid */}
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100 flex items-center">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <span className="text-blue-700 text-sm sm:text-base font-bold">{params.currentAge}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Starting Age</div>
                <div className="text-xs sm:text-sm font-semibold">{new Date().getFullYear()}</div>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100 flex items-center">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <span className="text-indigo-700 text-sm sm:text-base font-bold">{statistics.retirementStartAge}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Retirement Begins</div>
                <div className="text-xs sm:text-sm font-semibold">{ }</div>
                {params.autoCalculateRetirementAge && (
                  <div className="text-xs italic text-purple-700 mt-0.5">
                    Auto-calculated for financial independence
                  </div>
                )}
              </div>
            </div>
            
            {statistics.isCapitalExhausted ? (
              <div className="bg-red-50 rounded-lg px-3 py-2 border border-red-100 flex items-center">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                  <span className="text-red-700 text-sm sm:text-base font-bold">{statistics.exhaustionAge}</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600">Funds Depleted</div>
                  <div className="text-xs sm:text-sm font-semibold text-red-700">{statistics.exhaustionYear}</div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100 flex items-center">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                  <span className="text-emerald-700 text-sm sm:text-base font-bold">✓</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600">Funds Remaining</div>
                  <div className="text-xs sm:text-sm font-semibold text-emerald-700">{formatAmount(statistics.finalCapital).split('.')[0]}</div>
                </div>
              </div>
            )}
            
            <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-100 flex items-center">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <span className="text-purple-700 text-sm sm:text-base font-bold">{statistics.lifeExpectancy}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600">Life Expectancy</div>
                <div className="text-xs sm:text-sm font-semibold">{new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}</div>
              </div>
            </div>
          </div>

          {/* Countdown Timer - Only shown when on track */}
          {status.isOnTrack && !statistics.isCapitalExhausted && (
            <div className="bg-gradient-to-r from-green-700 via-green-800 to-emerald-800 p-0.5 rounded-xl mb-4 animate-heartbeat shadow-lg shadow-green-900/30 hover:shadow-green-800/40 transition-all duration-300">
              <div className="bg-gradient-to-b from-green-800/95 to-emerald-900/95 backdrop-blur-sm rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-100 mr-3 animate-float-rotate relative z-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-base sm:text-lg font-medium text-green-100">
                      Countdown to Financial Freedom
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col items-center transform hover:scale-105 transition-all duration-300 ease-out">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:shadow-green-900/20 active:shadow-inner active:scale-95 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-emerald-200/30 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:skew-x-12 transition-all duration-500"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-800 text-center relative z-10 animate-number-bounce tabular-nums group-active:scale-90 transition-transform">
                        {countdown.years}
                      </div>
                    </div>
                    <div className="text-xs text-green-100 font-medium mt-1">Years</div>
                  </div>
                  
                  <div className="flex flex-col items-center transform hover:scale-105 transition-all duration-300 ease-out">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:shadow-green-900/20 active:shadow-inner active:scale-95 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/30 to-green-200/30 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:skew-x-12 transition-all duration-500"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-800 text-center relative z-10 animate-number-bounce tabular-nums group-active:scale-90 transition-transform">
                        {countdown.months}
                      </div>
                    </div>
                    <div className="text-xs text-green-100 font-medium mt-1">Months</div>
                  </div>
                  
                  <div className="flex flex-col items-center transform hover:scale-105 transition-all duration-300 ease-out">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:shadow-green-900/20 active:shadow-inner active:scale-95 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-emerald-200/30 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:skew-x-12 transition-all duration-500"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-800 text-center relative z-10 animate-number-bounce tabular-nums group-active:scale-90 transition-transform">
                        {countdown.days}
                      </div>
                    </div>
                    <div className="text-xs text-green-100 font-medium mt-1">Days</div>
                  </div>
                  
                  <div className="flex flex-col items-center transform hover:scale-105 transition-all duration-300 ease-out">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:shadow-green-900/20 active:shadow-inner active:scale-95 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/30 to-green-200/30 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:skew-x-12 transition-all duration-500"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-800 text-center relative z-10 animate-number-bounce tabular-nums group-active:scale-90 transition-transform">
                        {countdown.hours}
                      </div>
                    </div>
                    <div className="text-xs text-green-100 font-medium mt-1">Hours</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Financial details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Capital Section */}
            <div className={components.container.card}>
              <div className={cx("bg-blue-50 px-4 py-3 border-b border-gray-200")}>
                <h3 className={typography.style.sectionTitle}>Capital</h3>
                <div className="text-xs text-gray-500 -mt-1">Overview of your investment growth</div>
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
            
            {/* Inflation Impact - New dedicated tile */}
            <div className={components.container.card}>
              <div className={cx("bg-orange-50 px-4 py-3 border-b border-gray-200")}>
                <h3 className={typography.style.sectionTitle}>Inflation Impact</h3>
                <div className="text-xs text-gray-500 -mt-1">{params.inflation.toFixed(1)}% annual inflation over time</div>
              </div>
              <div className="p-3" ref={barContainerRef}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className={cx(typography.size.sm, "text-gray-700")}>Monthly Investment</div>
                    <div className={cx(typography.size.sm, typography.weight.medium, "text-gray-700")}>
                      <span className={colors.phases.investment.text}>{formatAmount(params.monthlyInvestment)}</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="text-red-600">{formatAmount(statistics.finalMonthlyInvestment)}</span>
                    </div>
                  </div>
                  <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-2"
                      style={{ width: `${(params.monthlyInvestment / statistics.finalMonthlyInvestment) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">Today</span>
                    </div>
                    {showInvestmentFutureText && (
                      <div className="absolute top-0 right-2 h-full flex items-center">
                        <span className="text-xs font-medium text-gray-800">Future Value</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Inflation will effectively increase your investment needs by {((statistics.finalMonthlyInvestment / params.monthlyInvestment - 1) * 100).toFixed(0)}% over time
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className={cx(typography.size.sm, "text-gray-700")}>Monthly Withdrawal</div>
                    <div className={cx(typography.size.sm, typography.weight.medium, "text-gray-700")}>
                      <span className={colors.phases.retirement.text}>{formatAmount(params.monthlyRetirementWithdrawal)}</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="text-red-600">{formatAmount(statistics.finalMonthlyWithdrawalValue)}</span>
                    </div>
                  </div>
                  <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-end px-2"
                      style={{ width: `${(params.monthlyRetirementWithdrawal / statistics.finalMonthlyWithdrawalValue) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">Today</span>
                    </div>
                    {showWithdrawalFutureText && (
                      <div className="absolute top-0 right-2 h-full flex items-center">
                        <span className="text-xs font-medium text-gray-800">Future Value</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Your purchasing power will decrease by {((statistics.finalMonthlyWithdrawalValue / params.monthlyRetirementWithdrawal - 1) * 100).toFixed(0)}% due to inflation
                  </div>
                </div>
              </div>
            </div>
            
            {/* Retirement Details */}
            <div className={components.container.card}>
              <div className={cx("bg-green-50 px-4 py-3 border-b border-gray-200")}>
                <h3 className={typography.style.sectionTitle}>Retirement Details</h3>
                <div className="text-xs text-gray-500 -mt-1">Key metrics for your retirement plan</div>
              </div>
              <div className="p-3">
                {/* Key metrics */}
                <div className="grid grid-cols-1 gap-4">
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
                  
                  <div className="flex flex-col">
                    <div className={cx(typography.size.sm, "text-gray-600")}>Retirement Duration</div>
                    <div className={cx(typography.size.lg, typography.weight.bold, "text-indigo-600")}>{statistics.retirementDuration} years</div>
                    <div className={typography.style.caption}>from age {statistics.retirementStartAge} to {statistics.lifeExpectancy}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formula Modal */}
      <FormulaModal 
        isOpen={isFormulaModalOpen} 
        onClose={() => setIsFormulaModalOpen(false)} 
      />
    </div>
  );
};

export default ResultsSummary; 

<style>
{`
  @keyframes animate-in {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes number-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  @keyframes float-rotate {
    0% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-4px) rotate(-8deg); }
    50% { transform: translateY(0) rotate(0deg); }
    75% { transform: translateY(4px) rotate(8deg); }
    100% { transform: translateY(0) rotate(0deg); }
  }

  @keyframes heartbeat {
    0%, 100% { 
      transform: scale(1);
      background-size: 200% 200%;
    }
    25% { 
      transform: scale(1.004);
      background-size: 210% 210%;
    }
    35% {
      transform: scale(1.002);
      background-size: 205% 205%;
    }
    50% {
      transform: scale(1.004);
      background-size: 210% 210%;
    }
    75% {
      transform: scale(1);
      background-size: 200% 200%;
    }
  }

  .animate-heartbeat {
    animation: heartbeat 2s ease-in-out infinite;
    background-position: center;
    transform-origin: center;
  }

  .animate-float-rotate {
    animation: float-rotate 2s ease-in-out infinite;
  }

  .animate-ping {
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  .animate-in {
    animation: animate-in 0.6s ease-out forwards;
  }

  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 8s ease infinite;
  }

  .animate-number-bounce {
    animation: number-bounce 2s ease-in-out infinite;
    animation-delay: var(--delay, 0ms);
  }

  .group:hover .group-hover\\:skew-x-12 {
    transition-delay: 150ms;
  }

  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  .active\\:shadow-inner:active {
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  }

  .active\\:scale-95:active {
    transform: scale(0.95);
  }

  .group-active\\:scale-90:active {
    transform: scale(0.9);
  }
`}
</style> 