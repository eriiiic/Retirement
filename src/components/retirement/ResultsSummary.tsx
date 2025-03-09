import { useReducer, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction, TimelineWidths, CapitalComparison, StatusInfo, WithdrawalMode, GraphDataPoint, Currency } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';
import FormulaModal from './FormulaModal';
import { calculateInflationAdjustedValue, calculateTimeToRetirement, calculateEffectiveRetirementDuration, findRetirementStartIndex, calculateRetirementRisk } from '../../utils/financialCalculations';
import { DynamicWidthContainer } from '../../components/common/StyledComponents';
import { useTheme } from '../../context/ThemeContext';

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
  const { darkMode } = useTheme();
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
  
  // Countdown to retirement
  useEffect(() => {
    // Replace the calculateTimeLeft function with the imported function
    const calculateTimeLeft = () => {
      return calculateTimeToRetirement(statistics.calculatedRetirementStartYear);
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
  }, [statistics.calculatedRetirementStartYear]);

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

  // Calculate comprehensive risk assessment
  const riskAssessment = useMemo(() => {
    return calculateRetirementRisk(
      statistics.capitalAtRetirement,
      statistics.totalNeededCapital,
      params.monthlyRetirementWithdrawal,
      params.annualReturnRate,
      params.inflation || 2,
      statistics.retirementStartAge,
      params.currentAge,
      statistics.lifeExpectancy,
      params.monthlyInvestment
    );
  }, [
    statistics.capitalAtRetirement,
    statistics.totalNeededCapital,
    params.monthlyRetirementWithdrawal,
    params.annualReturnRate,
    params.inflation,
    statistics.retirementStartAge,
    params.currentAge,
    statistics.lifeExpectancy,
    params.monthlyInvestment
  ]);
  
  // Transform riskLevel to match the expected 'High' | 'Medium' | 'Low' format
  const legacyRiskLevel = useMemo(() => {
    switch(riskAssessment.riskLevel) {
      case 'Critical':
      case 'High':
        return 'High';
      case 'Significant':
      case 'Moderate':
        return 'Medium';
      case 'Low':
        return 'Low';
      default:
        return 'Medium';
    }
  }, [riskAssessment.riskLevel]);
  
  // Update status info based on risk assessment
  useEffect(() => {
    dispatch({
      type: 'UPDATE_STATUS',
      payload: {
        isOnTrack: legacyRiskLevel !== 'High',
        statusText: legacyRiskLevel === 'High' ? 'At Risk' : legacyRiskLevel === 'Medium' ? 'On Track (with caution)' : 'On Track',
        statusClass: legacyRiskLevel === 'High' ? 'at-risk' : legacyRiskLevel === 'Medium' ? 'caution' : 'on-track',
        message: riskAssessment.description
      }
    });
  }, [riskAssessment, legacyRiskLevel]);

  return (
    <>
      <div className={cx(
        "p-4 rounded-2xl shadow-md border",
        darkMode 
          ? "bg-gray-900 border-gray-700" 
          : "bg-gray-50 border-gray-200"
      )}>
        {/* Header with status indicator */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-2 sm:mb-0">
              <h2 className={cx(
                typography.weight.semibold, 
                "text-xl mb-1 sm:mb-0", 
                components.header.withIcon,
                darkMode ? "text-gradient-dark" : typography.style.gradient
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                  components.icon.sizes.sm, 
                  darkMode ? "text-indigo-400" : components.icon.colors.indigo, 
                  components.icon.spacings.right.sm
                )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className={darkMode ? "text-white" : ""}>Retirement Summary</span>
              </h2>
              <p className={cx(
                "sm:pl-7",
                darkMode ? "text-gray-400" : typography.style.subtitle
              )}>Analysis of your financial journey</p>
            </div>
            
            <div className={cx(components.layout.flex.responsive.col, "items-end sm:items-center", spacing.gap.sm)}>
              <div className={cx(
                "w-auto flex items-center gap-2 shadow-sm rounded-lg",
                darkMode 
                  ? (status.isOnTrack 
                      ? "bg-green-900/50 text-green-300 border border-green-700 ring-1 ring-green-600/50" 
                      : "bg-red-900/50 text-red-300 border border-red-700 ring-1 ring-red-600/50 animate-pulse")
                  : (status.isOnTrack 
                      ? "bg-green-100 text-green-800 border border-green-200" 
                      : "bg-red-100 text-red-800 border border-red-200 animate-pulse"),
                spacing.padding.alert
              )}>
                {status.isOnTrack ? (
                  <svg className={cx(
                    "h-5 w-5",
                    darkMode ? "text-green-300" : "text-green-600"
                  )} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className={cx(
                    "h-5 w-5",
                    darkMode ? "text-red-300" : "text-red-600"
                  )} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                )}
                <div>
                  <div className={cx(
                    "text-sm font-medium",
                    darkMode 
                      ? (status.isOnTrack ? "text-green-200" : "text-red-200") 
                      : (status.isOnTrack ? "text-green-700" : "text-red-700")
                  )}>
                    {status.statusText}
                  </div>
                  <div className={cx(
                    "text-xs hidden sm:block",
                    darkMode 
                      ? (status.isOnTrack ? "text-green-300/90" : "text-red-300/90") 
                      : (status.isOnTrack ? "text-green-700" : "text-red-700")
                  )}>
                    {status.message}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsFormulaModalOpen(true)}
                className={cx(
                  spacing.padding.button,
                  "transition-all duration-200 rounded-lg flex items-center relative group",
                  darkMode 
                    ? "bg-gray-900/90 bg-gradient-to-r from-indigo-950/20 to-gray-900/90 hover:from-indigo-900/30 hover:to-indigo-950/20 border border-indigo-800/40 hover:border-indigo-700/60 shadow-sm hover:shadow text-indigo-300" 
                    : cx(components.button.icon, "hover:bg-gray-100")
                )}
              >
                {darkMode && (
                  <div className="absolute inset-0 rounded-lg bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
                )}
                <svg className={cx(
                  "h-5 w-5 mr-2 relative z-10",
                  darkMode ? "text-indigo-300 group-hover:text-indigo-200" : components.icon.colors.indigo
                )} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <div className="text-left relative z-10">
                  <div className={cx(
                    typography.weight.semibold, 
                    typography.responsive.text.xs,
                    darkMode ? "text-indigo-200 group-hover:text-indigo-100" : colors.text.indigo[800]
                  )}>Formulas</div>
                  <div className={cx(
                    typography.size.xs, 
                    typography.responsive.hidden.mobileOnly,
                    darkMode ? "text-indigo-300/70 group-hover:text-indigo-200/90" : colors.text.indigo[700]
                  )}>View financial equations used</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="pt-2">

          {/* Countdown Timer - Only shown when on track */}
          {status.isOnTrack && !statistics.isCapitalExhausted && (
            <div className={cx(
              "p-0.5 rounded-xl mb-4 shadow-lg transition-all duration-300",
              darkMode 
                ? "bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-700 shadow-purple-900/50" 
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-purple-900/30 hover:shadow-purple-800/40"
            )}>
              <div className={cx(
                "backdrop-blur-sm rounded-lg p-4",
                darkMode 
                  ? "bg-gradient-to-b from-gray-900/95 to-gray-800/95" 
                  : "bg-gradient-to-b from-indigo-900/95 to-purple-900/95"
              )}>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center">
                    <div className="relative mr-3">
                      <div className={cx(
                        "absolute inset-0 rounded-full animate-ping-slow",
                        darkMode ? "bg-pink-600/30" : "bg-pink-400/30"
                      )}></div>
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
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-20 group-hover:opacity-50 blur-lg group-hover:blur transition-all duration-700"></div>
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


          {/* Timeline visualization */}
          <div className="mb-0">
            <div className={cx(components.dataViz.timeline, "mb-3")}>
              <DynamicWidthContainer 
                width={workingWidth} 
                className={cx(colors.phases.investment.bg, "flex flex-col justify-center px-3")}
              >
                <div className={cx(typography.size.sm, colors.text.white, typography.weight.medium)}>
                  {statistics.retirementStartAge - params.currentAge} years
                </div>
                <div className={cx(typography.size.xs, colors.phases.investment.textLight)}>Working Phase</div>
                <div className={cx(typography.size.xs, colors.phases.investment.textLight)}>
                  {new Date().getFullYear()}—{statistics.calculatedRetirementStartYear}
                </div>
              </DynamicWidthContainer>
              
              <DynamicWidthContainer 
                width={retirementWidth} 
                className={cx(colors.phases.success.bg, "flex flex-col justify-center px-3")}
              >
                <div className={cx(typography.size.sm, colors.text.white, typography.weight.medium)}>
                  {statistics.isCapitalExhausted 
                    ? statistics.exhaustionAge - statistics.retirementStartAge
                    : statistics.lifeExpectancy - statistics.retirementStartAge} years
                </div>
                <div className={cx(typography.size.xs, "text-green-100")}>Retirement Phase</div>
                <div className={cx(typography.size.xs, "text-green-100")}>
                  {statistics.calculatedRetirementStartYear}—
                  {statistics.isCapitalExhausted 
                    ? statistics.calculatedRetirementStartYear + (statistics.exhaustionAge - statistics.retirementStartAge)
                    : new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}
                </div>
              </DynamicWidthContainer>
              
              {timelineWidths.depleted > 0 && (
                <DynamicWidthContainer 
                  width={depletedWidth} 
                  className={cx(colors.phases.depleted.bg, "flex flex-col justify-center px-3")}
                >
                  <div className={cx(typography.size.sm, colors.text.white, typography.weight.medium)}>
                    {statistics.lifeExpectancy - statistics.exhaustionAge} years
                  </div>
                  <div className={cx(typography.size.xs, colors.phases.depleted.textLight)}>Depleted Phase</div>
                  <div className={cx(typography.size.xs, colors.phases.depleted.textLight)}>
                    {statistics.calculatedRetirementStartYear + (statistics.exhaustionAge - statistics.retirementStartAge)}—
                    {new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}
                  </div>
                </DynamicWidthContainer>
              )}
            </div>
            

          </div>

          {/* Key milestones grid */}
          <div className={cx(
            "grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 mb-4",
            darkMode ? "opacity-95" : ""
          )}>
            <div className={cx(
              "rounded-lg px-3 py-2 border flex items-center",
              darkMode 
                ? "bg-blue-900/30 border-blue-700/70" 
                : "bg-blue-50 border-gray-200"
            )}>
              <div className={cx(
                "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2",
                darkMode ? "bg-blue-800" : "bg-blue-100"
              )}>
                <span className={cx(
                  "text-sm sm:text-base font-bold",
                  darkMode ? "text-blue-300" : "text-blue-700"
                )}>{params.currentAge}</span>
              </div>
              <div>
                <div className={cx(
                  "text-xs font-medium flex items-center",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-3 w-3 mr-1",
                    darkMode ? "text-blue-400" : "text-blue-600"
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Starting Age
                </div>
                <div className={cx(
                  "text-xs sm:text-sm font-semibold ml-4",
                  darkMode ? "text-gray-200" : "text-gray-800"
                )}>{new Date().getFullYear()}</div>
              </div>
            </div>
            
            <div className={cx(
              "rounded-lg px-3 py-2 border flex items-center",
              darkMode 
                ? "bg-indigo-900/30 border-indigo-700" 
                : "bg-indigo-50 border-indigo-100"
            )}>
              <div className={cx(
                "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2",
                darkMode ? "bg-indigo-800" : "bg-indigo-100"
              )}>
                <span className={cx(
                  "text-sm sm:text-base font-bold",
                  darkMode ? "text-indigo-300" : "text-indigo-700"
                )}>{statistics.retirementStartAge}</span>
              </div>
              <div>
                <div className={cx(
                  "text-xs font-medium flex items-center",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-3 w-3 mr-1",
                    darkMode ? "text-indigo-400" : "text-indigo-600"
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Retirement Begins
                </div>
                <div className={cx(
                  "text-xs sm:text-sm font-semibold ml-4",
                  darkMode ? "text-gray-200" : "text-gray-800"
                )}>{statistics.calculatedRetirementStartYear}</div>
                {params.autoCalculateRetirementAge && (
                  <div className={cx(
                    "text-xs italic mt-0.5 ml-4",
                    darkMode ? "text-purple-300" : "text-purple-700"
                  )}>
                    Auto-calculated for financial independence
                  </div>
                )}
              </div>
            </div>
            
            {statistics.isCapitalExhausted ? (
              <div className={cx(
                "rounded-lg px-3 py-2 border flex items-center",
                darkMode 
                  ? "bg-red-900/30 border-red-700" 
                  : "bg-red-50 border-red-100"
              )}>
                <div className={cx(
                  "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2",
                  darkMode ? "bg-red-800" : "bg-red-100"
                )}>
                  <span className={cx(
                    "text-sm sm:text-base font-bold",
                    darkMode ? "text-red-300" : "text-red-700"
                  )}>{statistics.exhaustionAge}</span>
                </div>
                <div>
                  <div className={cx(
                    "text-xs font-medium flex items-center",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                      "h-3 w-3 mr-1",
                      darkMode ? "text-red-400" : "text-red-600"
                    )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Funds Depleted
                  </div>
                  <div className={cx(
                    "text-xs sm:text-sm font-semibold ml-4",
                    darkMode ? "text-red-300" : "text-red-700"
                  )}>{statistics.exhaustionYear}</div>
                </div>
              </div>
            ) : (
              <div className={cx(
                "rounded-lg px-3 py-2 border flex items-center",
                darkMode 
                  ? "bg-emerald-900/30 border-emerald-700" 
                  : "bg-emerald-50 border-emerald-100"
              )}>
                <div className={cx(
                  "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2",
                  darkMode ? "bg-emerald-800" : "bg-emerald-100"
                )}>
                  <span className={cx(
                    "text-sm sm:text-base font-bold",
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  )}>✓</span>
                </div>
                <div>
                  <div className={cx(
                    "text-xs font-medium flex items-center",
                    darkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                      "h-3 w-3 mr-1",
                      darkMode ? "text-emerald-400" : "text-emerald-600"
                    )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Funds Remaining
                  </div>
                  <div className={cx(
                    "text-xs sm:text-sm font-semibold ml-4",
                    darkMode ? "text-emerald-300" : "text-emerald-700"
                  )}>{formatDisplayValue(statistics.finalCapital)}</div>
                </div>
              </div>
            )}
            
            <div className={cx(
              "rounded-lg px-3 py-2 border flex items-center",
              darkMode 
                ? "bg-purple-900/30 border-purple-700" 
                : "bg-purple-50 border-purple-100"
            )}>
              <div className={cx(
                "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-1 sm:mr-2",
                darkMode ? "bg-purple-800" : "bg-purple-100"
              )}>
                <span className={cx(
                  "text-sm sm:text-base font-bold",
                  darkMode ? "text-purple-300" : "text-purple-700"
                )}>{statistics.lifeExpectancy}</span>
              </div>
              <div>
                <div className={cx(
                  "text-xs font-medium flex items-center",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-3 w-3 mr-1",
                    darkMode ? "text-purple-400" : "text-purple-600"
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Life Expectancy
                </div>
                <div className={cx(
                  "text-xs sm:text-sm font-semibold ml-4",
                  darkMode ? "text-gray-200" : "text-gray-800"
                )}>{new Date().getFullYear() + (statistics.lifeExpectancy - params.currentAge)}</div>
              </div>
            </div>
          </div>



          {/* Financial details */}
          <div className={cx(
            "grid grid-cols-1 md:grid-cols-3 gap-4",
            darkMode ? "opacity-95" : ""
          )}>
            {/* Capital Section */}
            <div className={cx(
              darkMode 
                ? "bg-transparent border border-blue-800/50 shadow-lg shadow-blue-900/10 rounded-xl" 
                : components.container.card
            )}>
              <div className={cx(
                "px-4 py-3 border-b rounded-t-xl",
                darkMode 
                  ? "bg-gradient-to-r from-blue-900/50 to-blue-800/20 border-blue-800/50" 
                  : "bg-blue-50 border-gray-200"
              )}>
                <h3 className={typography.style.sectionTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-3.5 w-3.5 mr-1.5 inline",
                    darkMode ? "text-blue-300" : "text-blue-500"
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={cx(
                    darkMode ? "text-blue-200 font-medium" : "text-blue-700"
                  )}>Capital</span>
                </h3>
                <div className={cx(
                  "text-xs -mt-1",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>Overview of your investment growth</div>
              </div>
              
              <div className={cx(
                "p-3 rounded-b-xl",
                darkMode ? "bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-900/95" : ""
              )}>
                {/* Capital summary at the top - more compact */}
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className={cx(
                    "p-2 rounded-lg border text-center",
                    darkMode 
                      ? "bg-blue-900/30 border-blue-700/50 shadow-sm" 
                      : "bg-white border-blue-100"
                  )}>
                    <div className={cx(
                      "text-xs",
                      darkMode ? "text-blue-300" : "text-gray-500"
                    )}>At Retirement</div>
                    <div className={cx(
                      "text-sm font-semibold",
                      darkMode ? "text-green-300" : "text-green-600"
                    )}>
                      {formatDisplayValue(statistics.capitalAtRetirement)}
                    </div>
                  </div>
                  
                  <div className={cx(
                    "p-2 rounded-lg border text-center",
                    darkMode 
                      ? "bg-blue-900/30 border-blue-700/50 shadow-sm" 
                      : "bg-white border-blue-100"
                  )}>
                    <div className={cx(
                      "text-xs",
                      darkMode ? "text-blue-300" : "text-gray-500"
                    )}>Capital at {statistics.lifeExpectancy}</div>
                    <div className={cx(
                      "text-sm font-semibold",
                      statistics.finalCapital > 0 
                        ? (darkMode ? "text-green-300" : "text-green-600") 
                        : (darkMode ? "text-red-300" : "text-red-600")
                    )}>
                      {formatDisplayValue(statistics.finalCapital)}
                    </div>
                  </div>
                </div>
                
                {/* Capital breakdown - compact visualization */}
                <div className="mb-4">
                  <div className={cx(
                    "text-xs font-medium mb-1",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>Capital Breakdown</div>
                  
                  <div className={cx(
                    "h-8 w-full rounded-lg overflow-hidden flex mb-2",
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  )}>
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
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Initial: </span>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-800"
                      )}>{formatDisplayValue(params.initialCapital)}</span>
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-1"></span>
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Contrib.: </span>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-800"
                      )}>{formatDisplayValue(statistics.totalInvestedAmount - params.initialCapital)}</span>
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Returns: </span>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-800"
                      )}>+{Math.round(roi)}%</span>
                    </div>
                  </div>
                </div>

                {/* Returns impact - compact version */}
                <div className={cx(
                  "rounded-lg p-2 border mt-2",
                  darkMode 
                    ? "bg-blue-900/30 border-blue-800/70" 
                    : "bg-blue-50 border-blue-100"
                )}>
                  <div className="flex justify-between items-center">
                    <div className={cx(
                      "text-xs font-medium",
                      darkMode ? "text-blue-300" : "text-blue-800"
                    )}>Returns Impact</div>
                    <div className={cx(
                      "text-xs font-medium",
                      darkMode ? "text-purple-300" : "text-purple-700"
                    )}>
                      {formatDisplayValue(statistics.capitalAtRetirement - statistics.totalInvestedAmount)}
                    </div>
                  </div>
                  <div className={cx(
                    "text-xs mt-1",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    Approx. {(roi / (statistics.retirementStartAge - params.currentAge)).toFixed(1)}% annual growth
                  </div>
                </div>
              </div>
            </div>
            
            {/* Inflation Impact - New dedicated tile */}
            <div className={cx(
              components.container.card,
              darkMode ? "!bg-transparent border-orange-800/50 shadow-lg shadow-orange-900/10 rounded-xl" : ""
            )}>
              <div className={cx(
                "px-4 py-3 border-b rounded-t-xl",
                darkMode 
                  ? "bg-gradient-to-r from-orange-900/50 to-orange-800/20 border-orange-800/50" 
                  : "bg-orange-50 border-gray-200"
              )}>
                <h3 className={typography.style.sectionTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-3.5 w-3.5 mr-1.5 inline",
                    darkMode ? "text-orange-300" : "text-orange-500"
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className={cx(
                    darkMode ? "text-orange-200 font-medium" : "text-orange-700"
                  )}>Inflation Impact</span>
                </h3>
                <div className={cx(
                  "text-xs -mt-1",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>{params.inflation.toFixed(1)}% annual inflation over time</div>
              </div>
              <div className={cx(
                "p-3 rounded-b-xl",
                darkMode ? "bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-900/95" : ""
              )} ref={barContainerRef}>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className={cx(
                      typography.size.sm, 
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>Monthly Investment</div>
                    <div className={cx(
                      typography.size.sm, 
                      typography.weight.medium, 
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      <span className={colors.phases.investment.text}>{formatDisplayValue(params.monthlyInvestment)}</span>
                      <span className="mx-1 text-gray-400">→</span>
                      <span className={darkMode ? "text-red-400" : "text-red-600"}>{formatDisplayValue(statistics.finalMonthlyInvestment)}</span>
                    </div>
                  </div>
                  <div className={cx(
                    "h-8 w-full rounded-lg overflow-hidden border relative",
                    darkMode 
                      ? "bg-orange-900/10 border-orange-700/30" 
                      : "bg-gray-100 border-gray-200"
                  )}>
                    <div 
                      className={cx(
                        "h-full flex items-center justify-end px-2",
                        darkMode
                          ? "bg-gradient-to-r from-purple-600/90 to-purple-500/90"
                          : "bg-gradient-to-r from-purple-500 to-purple-600"
                      )}
                      style={{ width: `${(params.monthlyInvestment / statistics.finalMonthlyInvestment) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">Today</span>
                    </div>
                    {showInvestmentFutureText && (
                      <div className="absolute top-0 right-2 h-full flex items-center">
                        <span className={cx(
                          "text-xs font-medium",
                          darkMode ? "text-orange-300" : "text-gray-800"
                        )}>Future Value</span>
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
                      <div className={cx(
                        typography.size.sm,
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>Monthly Withdrawal</div>
                      <div className={cx(
                        typography.size.lg, 
                        typography.weight.bold,
                        darkMode ? "text-green-400" : "text-green-600"
                      )}>
                        {formatDisplayValue(params.monthlyRetirementWithdrawal)}
                      </div>
                    </div>
                    
                    {params.inflationAdjustedWithdrawal && params.withdrawalMode === "amount" && (
                      <div className={cx(
                        "flex justify-between items-center p-1.5 rounded-md border",
                        darkMode 
                          ? "bg-orange-900/20 border-orange-800" 
                          : "bg-orange-50 border-orange-100"
                      )}>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                            "h-3.5 w-3.5 mr-1",
                            darkMode ? "text-orange-400" : "text-orange-500"
                          )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className={cx(
                            "text-xs font-medium",
                            darkMode ? "text-orange-300" : "text-orange-700"
                          )}>Inflation-adjusted at retirement start:</span>
                        </div>
                        <span className={cx(
                          "text-sm font-bold",
                          darkMode ? "text-orange-300" : "text-orange-600"
                        )}>
                          {formatDisplayValue(calculateInflationAdjustedValue(
                            params.monthlyRetirementWithdrawal,
                            params.inflation,
                            statistics.calculatedRetirementStartYear - new Date().getFullYear()
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={cx(
                    "h-8 w-full rounded-lg overflow-hidden border relative",
                    darkMode 
                      ? "bg-orange-900/10 border-orange-700/30" 
                      : "bg-gray-100 border-gray-200"
                  )}>
                    <div 
                      className={cx(
                        "h-full flex items-center justify-end px-2",
                        darkMode
                          ? "bg-gradient-to-r from-purple-600/90 to-purple-500/90"
                          : "bg-gradient-to-r from-purple-500 to-purple-600"
                      )}
                      style={{ width: `${(params.monthlyRetirementWithdrawal / statistics.finalMonthlyWithdrawalValue) * 100}%` }}
                    >
                      <span className="text-xs font-medium text-white">Today</span>
                    </div>
                    {showWithdrawalFutureText && (
                      <div className="absolute top-0 right-2 h-full flex items-center">
                        <span className={cx(
                          "text-xs font-medium",
                          darkMode ? "text-orange-300" : "text-gray-800"
                        )}>Future Value</span>
                      </div>
                    )}
                  </div>
                  <div className={cx(
                    "text-xs mt-1",
                    darkMode ? "text-gray-400" : "text-gray-500"
                  )}>
                    Your purchasing power will decrease by {((statistics.finalMonthlyWithdrawalValue / params.monthlyRetirementWithdrawal - 1) * 100).toFixed(0)}% due to inflation
                  </div>
                </div>
              </div>
            </div>
            
            {/* Retirement Details */}
            <div className={cx(
              components.container.card,
              darkMode ? "!bg-transparent border-green-800/50 shadow-lg shadow-green-900/10 rounded-xl" : ""
            )}>
              <div className={cx(
                "px-4 py-3 border-b rounded-t-xl",
                darkMode 
                  ? "bg-gradient-to-r from-green-900/50 to-green-800/20 border-green-800/50" 
                  : "bg-green-50 border-gray-200"
              )}>
                <h3 className={typography.style.sectionTitle}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                    "h-3.5 w-3.5 mr-1.5 inline",
                    darkMode ? "text-green-300" : "text-green-500"
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className={cx(
                    darkMode ? "text-green-200 font-medium" : "text-green-700"
                  )}>Retirement Details</span>
                </h3>
                <div className={cx(
                  "text-xs -mt-1",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>Key metrics for your retirement plan</div>
              </div>
              <div className={cx(
                "p-3 rounded-b-xl",
                darkMode ? "bg-gradient-to-b from-gray-900 via-gray-900/98 to-gray-900/95" : ""
              )}>
                {/* Key metrics */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Withdrawal Rate */}
                  <div className={cx(
                    "flex items-center p-2 rounded-lg border",
                    darkMode 
                      ? "bg-green-900/20 border-green-700/40 shadow-sm" 
                      : "bg-white border-green-100"
                  )}>
                    <div className={cx(
                      "flex-shrink-0 p-1.5 rounded-md mr-2",
                      darkMode ? "bg-green-800/70" : "bg-green-100"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-4 w-4",
                        darkMode ? "text-green-300" : "text-green-600"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <div className={cx(
                          typography.size.sm,
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>Withdrawal Rate</div>
                        <div className={cx(
                          typography.size.base, 
                          typography.weight.bold,
                          darkMode ? "text-green-400" : "text-green-600"
                        )}>
                          {withdrawalRate.toFixed(1)}%
                          <span className={cx(
                            "text-xs ml-1 font-normal",
                            darkMode ? "text-gray-400" : "text-gray-500"
                          )}>
                            {withdrawalRate <= 4 ? "(Conservative)" : withdrawalRate <= 6 ? "(Moderate)" : "(High)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Retirement:Working Ratio */}
                  <div className={cx(
                    "flex items-center p-2 rounded-lg border",
                    darkMode 
                      ? "bg-indigo-900/20 border-indigo-700/40 shadow-sm" 
                      : "bg-white border-indigo-100"
                  )}>
                    <div className={cx(
                      "flex-shrink-0 p-1.5 rounded-md mr-2",
                      darkMode ? "bg-indigo-800/70" : "bg-indigo-100"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-4 w-4",
                        darkMode ? "text-indigo-300" : "text-indigo-600"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <div className={cx(
                          typography.size.sm,
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>Retirement:Working Ratio</div>
                        <div className={cx(
                          typography.size.base, 
                          typography.weight.bold, 
                          darkMode ? "text-indigo-300" : colors.phases.retirement.text
                        )}>
                          {(statistics.retirementDuration / (statistics.retirementStartAge - params.currentAge)).toFixed(1)}x
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Retirement Duration */}
                  <div className={cx(
                    "flex items-center p-2 rounded-lg border",
                    darkMode 
                      ? "bg-purple-900/20 border-purple-700/40 shadow-sm" 
                      : "bg-white border-purple-100"
                  )}>
                    <div className={cx(
                      "flex-shrink-0 p-1.5 rounded-md mr-2",
                      darkMode ? "bg-purple-800/70" : "bg-purple-100"
                    )}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                        "h-4 w-4",
                        darkMode ? "text-purple-300" : "text-purple-600"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <div className={cx(
                          typography.size.sm,
                          darkMode ? "text-gray-300" : "text-gray-600"
                        )}>Retirement Duration</div>
                        <div className="flex items-center">
                          <div className={cx(
                            typography.size.base, 
                            typography.weight.bold,
                            darkMode ? "text-purple-300" : "text-purple-600"
                          )}>
                            {statistics.retirementDuration} years
                          </div>
                          <div className={cx(
                            "text-xs ml-1",
                            darkMode ? "text-gray-400" : "text-gray-500"
                          )}>
                            ({statistics.retirementStartAge}-{statistics.lifeExpectancy})
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insight box - replaces the progress bar */}
                  <div className={cx(
                    "p-2 rounded-lg border mt-1",
                    darkMode 
                      ? "bg-gradient-to-r from-green-900/20 to-indigo-900/20 border-green-700/30 shadow-sm" 
                      : "bg-gradient-to-r from-green-50 to-indigo-50 border-green-100"
                  )}>
                    <div className="flex items-start">
                      <div className={cx(
                        "flex-shrink-0 p-1 rounded-full mr-2",
                        darkMode ? "bg-blue-800/70" : "bg-blue-100"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={cx(
                          "h-3 w-3",
                          darkMode ? "text-blue-300" : "text-blue-600"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className={cx(
                        "text-xs",
                        darkMode ? "text-gray-200" : "text-gray-700"
                      )}>
                        {statistics.isCapitalExhausted ? (
                          <>You are projected to run out of funds at age {statistics.exhaustionAge}. Consider increasing your savings, reducing your planned withdrawal, or exploring ways to boost your return rate.</>
                        ) : (
                          <>Your retirement plan appears sustainable. You're projected to maintain positive capital through your expected lifetime, with an estimated {formatDisplayValue(statistics.finalCapital)} remaining at age {statistics.lifeExpectancy}.</>
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
      
      {/* Add FormulaModal here */}
      <FormulaModal 
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />
    </>
  );
};

export default ResultsSummary; 