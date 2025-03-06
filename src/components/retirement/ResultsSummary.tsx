import { useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction, TimelineWidths, CapitalComparison, StatusInfo, WithdrawalMode, GraphDataPoint, Currency } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';
import FormulaModal from './FormulaModal';
import { calculateInflationAdjustedValue } from '../../utils/financialCalculations';

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

  // Add currency formatting function
  const formatCurrencyValue = useCallback((value: number, showDecimals: boolean = false): string => {
    const formatter = new Intl.NumberFormat(
      currency === 'EUR' ? 'fr-FR' :
      currency === 'GBP' ? 'en-GB' :
      currency === 'JPY' ? 'ja-JP' : 'en-US',
      {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: showDecimals ? 1 : 0,
        maximumFractionDigits: showDecimals ? 1 : 0
      }
    );
    return formatter.format(value);
  }, [currency]);

  // Update the display values to use the new currency formatter
  const formatDisplayValue = useCallback((value: number): string => {
    if (value >= 1000000) {
      return formatCurrencyValue(value / 1000000, true) + 'M';
    }
    return formatCurrencyValue(value, false);
  }, [formatCurrencyValue]);

  return (
    <div className="bg-gray-50 p-4 rounded-2xl shadow-md border border-gray-200">
      {/* Header with status indicator */}
      <div className="flex flex-row justify-between items-start mb-3">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gradient mb-1 sm:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Retirement Summary
          </h2>
          <p className={cx(typography.style.subtitle, "sm:pl-7")}>Analysis of your financial journey</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          <div className={cx(
            "rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 shadow-sm w-auto",
            status.isOnTrack 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200 animate-pulse"
          )}>
            {status.isOnTrack ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            )}
            <div>
              <div className={cx(typography.weight.semibold, status.isOnTrack ? "text-green-800" : "text-red-800", "text-xs sm:text-sm")}>{status.statusText}</div>
              <div className={cx(typography.size.xs, status.isOnTrack ? "text-green-700" : "text-red-700", "hidden sm:block")}>{status.message}</div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsFormulaModalOpen(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 border border-indigo-200 shadow-sm transition-colors flex items-center"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <div className="text-left">
              <div className={cx(typography.weight.semibold, "text-indigo-800 text-xs sm:text-sm")}>Formulas</div>
              <div className={cx(typography.size.xs, "text-indigo-700 hidden sm:block")}>View financial equations used</div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="pt-2">
        {/* Timeline visualization */}
        <div className="mb-0">
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
                <div className="text-xs font-medium text-gray-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Starting Age
                </div>
                <div className="text-xs sm:text-sm font-semibold ml-4">{new Date().getFullYear()}</div>
              </div>
            </div>
            
            <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100 flex items-center">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <span className="text-indigo-700 text-sm sm:text-base font-bold">{statistics.retirementStartAge}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Retirement Begins
                </div>
                <div className="text-xs sm:text-sm font-semibold ml-4">{statistics.calculatedRetirementStartYear}</div>
                {params.autoCalculateRetirementAge && (
                  <div className="text-xs italic text-purple-700 mt-0.5 ml-4">
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
                  <div className="text-xs font-medium text-gray-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Funds Depleted
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-red-700 ml-4">{statistics.exhaustionYear}</div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100 flex items-center">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                  <span className="text-emerald-700 text-sm sm:text-base font-bold">✓</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Funds Remaining
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-emerald-700 ml-4">{formatDisplayValue(statistics.finalCapital)}</div>
                </div>
              </div>
            )}
            
            <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-100 flex items-center">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center mr-1 sm:mr-2">
                <span className="text-purple-700 text-sm sm:text-base font-bold">{statistics.lifeExpectancy}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Life Expectancy
                </div>
                <div className="text-xs sm:text-sm font-semibold ml-4">{new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}</div>
              </div>
            </div>
          </div>

          {/* Countdown Timer - Only shown when on track */}
          {status.isOnTrack && !statistics.isCapitalExhausted && (
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-0.5 rounded-xl mb-4 shadow-lg shadow-purple-900/30 hover:shadow-purple-800/40 transition-all duration-300">
              <div className="bg-gradient-to-b from-indigo-900/95 to-purple-900/95 backdrop-blur-sm rounded-lg p-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center">
                    <div className="relative mr-3">
                      <div className="absolute inset-0 bg-pink-400/30 rounded-full animate-ping-slow"></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-100 relative z-10 animate-float-rotate" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-base sm:text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-pink-100 to-indigo-100 animate-gradient">
                      Countdown to Financial Freedom
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col items-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 animate-heartbeat" style={{"--delay": "0ms"} as any}>
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 group-hover:opacity-50 blur-lg group-hover:blur transition-all duration-700"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 text-center relative z-10 tabular-nums">
                        {countdown.years}
                      </div>
                    </div>
                    <div className="text-xs text-purple-100 font-medium mt-1">Years</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-300 animate-heartbeat" style={{"--delay": "200ms"} as any}>
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 group-hover:opacity-50 blur-lg group-hover:blur transition-all duration-700"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-pink-600 text-center relative z-10 tabular-nums">
                        {countdown.months}
                      </div>
                    </div>
                    <div className="text-xs text-pink-100 font-medium mt-1">Months</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:bg-gradient-to-br hover:from-pink-50 hover:to-red-50 transition-all duration-300 animate-heartbeat" style={{"--delay": "400ms"} as any}>
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-red-500 opacity-20 group-hover:opacity-50 blur-lg group-hover:blur transition-all duration-700"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-pink-600 to-red-600 text-center relative z-10 tabular-nums">
                        {countdown.days}
                      </div>
                    </div>
                    <div className="text-xs text-red-100 font-medium mt-1">Days</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-full shadow-lg relative overflow-hidden group hover:shadow-xl hover:bg-gradient-to-br hover:from-red-50 hover:to-orange-50 transition-all duration-300 animate-heartbeat" style={{"--delay": "600ms"} as any}>
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 opacity-20 group-hover:opacity-50 blur-lg group-hover:blur transition-all duration-700"></div>
                      <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-red-600 to-orange-600 text-center relative z-10 tabular-nums">
                        {countdown.hours}
                      </div>
                    </div>
                    <div className="text-xs text-orange-100 font-medium mt-1">Hours</div>
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
                <h3 className={typography.style.sectionTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-700">Capital</span>
                </h3>
                <div className="text-xs text-gray-500 -mt-1">Overview of your investment growth</div>
              </div>
              
              <div className="p-3">
                {/* Capital summary at the top - more compact */}
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-lg border border-blue-100 text-center">
                    <div className="text-xs text-gray-500">At Retirement</div>
                    <div className="text-sm font-semibold text-green-600">
                      {formatDisplayValue(statistics.capitalAtRetirement)}
                    </div>
                  </div>
                  
                  <div className="bg-white p-2 rounded-lg border border-blue-100 text-center">
                    <div className="text-xs text-gray-500">Capital at {statistics.lifeExpectancy}</div>
                    <div className={cx(
                      "text-sm font-semibold",
                      statistics.finalCapital > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatDisplayValue(statistics.finalCapital)}
                    </div>
                  </div>
                </div>
                
                {/* Capital breakdown - compact visualization */}
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-700 mb-1">Capital Breakdown</div>
                  
                  <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden flex mb-2">
                    {/* Initial capital */}
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center"
                      style={{ width: `${(params.initialCapital / statistics.capitalAtRetirement) * 100}%` }}
                    >
                      {(params.initialCapital / statistics.capitalAtRetirement) * 100 > 15 && (
                        <span className="text-xs font-medium text-white">Initial</span>
                      )}
                    </div>
                    
                    {/* Contributions */}
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center"
                      style={{ width: `${((statistics.totalInvestedAmount - params.initialCapital) / statistics.capitalAtRetirement) * 100}%` }}
                    >
                      {((statistics.totalInvestedAmount - params.initialCapital) / statistics.capitalAtRetirement) * 100 > 15 && (
                        <span className="text-xs font-medium text-white">Contrib.</span>
                      )}
                    </div>
                    
                    {/* Returns */}
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center"
                      style={{ width: `${((statistics.capitalAtRetirement - statistics.totalInvestedAmount) / statistics.capitalAtRetirement) * 100}%` }}
                    >
                      {((statistics.capitalAtRetirement - statistics.totalInvestedAmount) / statistics.capitalAtRetirement) * 100 > 15 && (
                        <span className="text-xs font-medium text-white">Returns</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Compact legend */}
                  <div className="flex text-xs justify-between">
                    <div>
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                      <span className="text-gray-600">Initial: </span>
                      <span className="font-medium">{formatDisplayValue(params.initialCapital)}</span>
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-1"></span>
                      <span className="text-gray-600">Contrib.: </span>
                      <span className="font-medium">{formatDisplayValue(statistics.totalInvestedAmount - params.initialCapital)}</span>
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                      <span className="text-gray-600">Returns: </span>
                      <span className="font-medium text-purple-700">+{Math.round(roi)}%</span>
                    </div>
                  </div>
                </div>

                {/* Returns impact - compact version */}
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 mt-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-medium text-blue-800">Returns Impact</div>
                    <div className="text-xs font-medium text-purple-700">
                      {formatDisplayValue(statistics.capitalAtRetirement - statistics.totalInvestedAmount)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Approx. {(roi / (statistics.retirementStartAge - params.currentAge)).toFixed(1)}% annual growth
                  </div>
                </div>
              </div>
            </div>
            
            {/* Inflation Impact - New dedicated tile */}
            <div className={components.container.card}>
              <div className={cx("bg-orange-50 px-4 py-3 border-b border-gray-200")}>
                <h3 className={typography.style.sectionTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-orange-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-orange-700">Inflation Impact</span>
                </h3>
                <div className="text-xs text-gray-500 -mt-1">{params.inflation.toFixed(1)}% annual inflation over time</div>
              </div>
              <div className="p-3" ref={barContainerRef}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className={cx(typography.size.sm, "text-gray-700")}>Monthly Investment</div>
                    <div className={cx(typography.size.sm, typography.weight.medium, "text-gray-700")}>
                      <span className={colors.phases.investment.text}>{formatDisplayValue(params.monthlyInvestment)}</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className="text-red-600">{formatDisplayValue(statistics.finalMonthlyInvestment)}</span>
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
                  <div className="flex flex-col mb-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <div className={cx(typography.size.sm, "text-gray-700")}>Monthly Withdrawal</div>
                      <div className={cx(typography.size.lg, typography.weight.bold, "text-green-600")}>
                        {formatDisplayValue(params.monthlyRetirementWithdrawal)}
                      </div>
                    </div>
                    
                    {params.inflationAdjustedWithdrawal && params.withdrawalMode === "amount" && (
                      <div className="flex justify-between items-center bg-orange-50 p-1.5 rounded-md border border-orange-100">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-xs font-medium text-orange-700">Inflation-adjusted at retirement start:</span>
                        </div>
                        <span className="text-sm font-bold text-orange-600">
                          {formatDisplayValue(calculateInflationAdjustedValue(
                            params.monthlyRetirementWithdrawal,
                            params.inflation,
                            statistics.calculatedRetirementStartYear - new Date().getFullYear()
                          ))}
                        </span>
                      </div>
                    )}
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
                <h3 className={typography.style.sectionTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-green-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-green-700">Retirement Details</span>
                </h3>
                <div className="text-xs text-gray-500 -mt-1">Key metrics for your retirement plan</div>
              </div>
              <div className="p-3">
                {/* Key metrics */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Withdrawal Rate */}
                  <div className="flex items-center bg-white p-2 rounded-lg border border-green-100">
                    <div className="flex-shrink-0 p-1.5 bg-green-100 rounded-md mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <div className={cx(typography.size.sm, "text-gray-600")}>Withdrawal Rate</div>
                        <div className={cx(typography.size.base, typography.weight.bold, "text-green-600")}>
                          {withdrawalRate.toFixed(1)}%
                          <span className="text-xs text-gray-500 ml-1 font-normal">
                            {withdrawalRate <= 4 ? "(Conservative)" : withdrawalRate <= 6 ? "(Moderate)" : "(High)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Retirement:Working Ratio */}
                  <div className="flex items-center bg-white p-2 rounded-lg border border-indigo-100">
                    <div className="flex-shrink-0 p-1.5 bg-indigo-100 rounded-md mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <div className={cx(typography.size.sm, "text-gray-600")}>Retirement:Working Ratio</div>
                        <div className={cx(typography.size.base, typography.weight.bold, colors.phases.retirement.text)}>
                          {(statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge)).toFixed(1)}x
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Retirement Duration */}
                  <div className="flex items-center bg-white p-2 rounded-lg border border-purple-100">
                    <div className="flex-shrink-0 p-1.5 bg-purple-100 rounded-md mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <div className={cx(typography.size.sm, "text-gray-600")}>Retirement Duration</div>
                        <div className="flex items-center">
                          <div className={cx(typography.size.base, typography.weight.bold, "text-purple-600")}>
                            {statistics.retirementDuration} years
                          </div>
                          <div className="text-xs text-gray-500 ml-1">
                            ({statistics.retirementStartAge}-{statistics.lifeExpectancy})
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insight box - replaces the progress bar */}
                  <div className="bg-gradient-to-r from-green-50 to-indigo-50 p-2 rounded-lg border border-green-100 mt-1">
                    <div className="flex">
                      <div className="flex-shrink-0 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-xs text-gray-700">
                        {/* Capital depletion scenarios */}
                        {statistics.isCapitalExhausted && (statistics.exhaustionAge < statistics.lifeExpectancy - 10) && (
                          <span className="text-red-600 font-medium">Depleted {statistics.lifeExpectancy - statistics.exhaustionAge} years before expected.</span>
                        )}
                        
                        {statistics.isCapitalExhausted && (statistics.exhaustionAge >= statistics.lifeExpectancy - 10) && (statistics.exhaustionAge < statistics.lifeExpectancy - 3) && (
                          <span>Funds last until age {statistics.exhaustionAge}.</span>
                        )}
                        
                        {statistics.isCapitalExhausted && (statistics.exhaustionAge >= statistics.lifeExpectancy - 3) && (
                          <span>Funds align with life expectancy.</span>
                        )}
                        
                        {/* Good financial health scenarios */}
                        {!statistics.isCapitalExhausted && statistics.finalCapital > statistics.capitalAtRetirement * 2 && (
                          <span className="text-green-600 font-medium">Capital grows to {Math.round(statistics.finalCapital / statistics.capitalAtRetirement * 100)}% of retirement start.</span>
                        )}
                        
                        {!statistics.isCapitalExhausted && statistics.finalCapital <= statistics.capitalAtRetirement * 2 && statistics.finalCapital > statistics.capitalAtRetirement * 0.5 && (
                          <span className="text-green-600">{formatDisplayValue(statistics.finalCapital)} remaining at end.</span>
                        )}
                        
                        {!statistics.isCapitalExhausted && statistics.finalCapital <= statistics.capitalAtRetirement * 0.5 && statistics.finalCapital > 0 && (
                          <span>{formatDisplayValue(statistics.finalCapital)} remains.</span>
                        )}
                        
                        {/* Withdrawal rate insights */}
                        {!statistics.isCapitalExhausted && withdrawalRate < 3 && (
                          <span>{withdrawalRate.toFixed(1)}% withdrawal (4% benchmark).</span>
                        )}
                        
                        {statistics.isCapitalExhausted && withdrawalRate > 6 && (
                          <span className="text-amber-600 font-medium">{withdrawalRate.toFixed(1)}% exceeds safe rate.</span>
                        )}
                        
                        {/* Retirement timing scenarios */}
                        {statistics.retirementStartAge < 55 && statistics.retirementDuration > 35 && !statistics.isCapitalExhausted && (
                          <span className="text-indigo-600 font-medium">Early retirement: {statistics.retirementDuration} years funded.</span>
                        )}
                        
                        {statistics.retirementStartAge > 65 && statistics.retirementDuration < 20 && !statistics.isCapitalExhausted && (
                          <span>{statistics.retirementDuration} retirement years funded.</span>
                        )}
                        
                        {/* Work-retirement ratio insights */}
                        {!statistics.isCapitalExhausted && (statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge) > 2) && (
                          <span className="text-purple-600">1 work year = {(statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge)).toFixed(1)} retirement years.</span>
                        )}
                        
                        {!statistics.isCapitalExhausted && (statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge) < 0.75) && (
                          <span>1 work year = {(statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge)).toFixed(1)} retirement years.</span>
                        )}
                        
                        {/* Default fallback case */}
                        {(
                          (!statistics.isCapitalExhausted && 
                           statistics.finalCapital <= statistics.capitalAtRetirement * 0.5 && 
                           withdrawalRate >= 3 && 
                           withdrawalRate <= 6 &&
                           (statistics.retirementStartAge >= 55 && statistics.retirementStartAge <= 65) &&
                           (statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge) >= 0.75) &&
                           (statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge) <= 2)
                          ) || 
                          (statistics.isCapitalExhausted && 
                           withdrawalRate <= 6
                          )
                        ) && (
                          <span>{statistics.retirementDuration} years at {withdrawalRate.toFixed(1)}%.</span>
                        )}
                      </div>
                    </div>
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
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
    }
    10% { 
      transform: scale(1.02);
      box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.25);
    }
    20% {
      transform: scale(1.01);
      box-shadow: 0 8px 20px -4px rgba(139, 92, 246, 0.2);
    }
    30% {
      transform: scale(1.03);
      box-shadow: 0 12px 30px -6px rgba(139, 92, 246, 0.3);
    }
    50% {
      transform: scale(1.01);
      box-shadow: 0 8px 20px -4px rgba(139, 92, 246, 0.2);
    }
    60% {
      transform: scale(1);
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
    }
  }

  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 1; }
    75%, 100% { transform: scale(2); opacity: 0; }
  }

  .animate-heartbeat {
    animation: heartbeat 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    animation-delay: var(--delay, 0ms);
    transform-origin: center;
  }

  .animate-float-rotate {
    animation: float-rotate 2s ease-in-out infinite;
  }

  .animate-ping-slow {
    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
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