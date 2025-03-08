import React, { useState, useEffect, useRef, useReducer, useMemo, useCallback } from 'react';
import { SimulatorParams, Statistics, GraphDataPoint, Currency, FormatAmountFunction, SortConfig, FilterPhase } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';
import { calculatePhaseSummary } from '../../utils/financialCalculations';
import { useTheme } from '../../context/ThemeContext';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';
import { TbSortAscending, TbSortDescending } from 'react-icons/tb';

// Define scrollbar styles
const scrollbarStyles = `
  .schedule-custom-scrollbar::-webkit-scrollbar {
    height: 8px;
    width: 8px;
  }
  
  .schedule-custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  .schedule-custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  .schedule-custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  .dark .schedule-custom-scrollbar::-webkit-scrollbar-track {
    background: #1f2937;
  }
  
  .dark .schedule-custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4B5563;
  }
  
  .dark .schedule-custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6B7280;
  }
`;

interface ScheduleDetailsProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  currency: Currency;
}

interface ScheduleState {
  sortConfig: SortConfig;
  filteredPhase: FilterPhase;
  viewMode: 'tiles' | 'full-schedule';
}

type ScheduleAction =
  | { type: 'SET_SORT'; payload: { key: keyof GraphDataPoint; direction: 'ascending' | 'descending' } }
  | { type: 'CLEAR_SORT' }
  | { type: 'SET_PHASE_FILTER'; payload: FilterPhase }
  | { type: 'SET_VIEW_MODE'; payload: 'tiles' | 'full-schedule' };

function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'SET_SORT':
      return {
        ...state,
        sortConfig: {
          key: action.payload.key,
          direction: action.payload.direction
        }
      };
    case 'CLEAR_SORT':
      return {
        ...state,
        sortConfig: {
          key: null,
          direction: null
        }
      };
    case 'SET_PHASE_FILTER':
      return {
        ...state,
        filteredPhase: action.payload
      };
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
        ...(action.payload === 'tiles' ? { filteredPhase: 'all' } : {})
      };
    default:
      return state;
  }
}

// Column width constants to ensure consistency
const COLUMN_WIDTHS = {
  year: {
    mobile: '8%',
    desktop: '8%'
  },
  age: {
    mobile: '6%',
    desktop: '7%'
  },
  capital: {
    mobile: '18%',
    desktop: '16%'
  },
  variation: {
    mobile: '16%',
    desktop: '15%'
  },
  interest: {
    mobile: '16%',
    desktop: '15%'
  },
  netVariation: {
    mobile: '18%',
    desktop: '15%'
  },
  phase: {
    mobile: '10%',
    desktop: '12%'
  }
};

// Row renderer component for virtualized list
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: GraphDataPoint[];
    formatAmount: FormatAmountFunction;
    darkMode: boolean;
  };
}

const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const { items, formatAmount, darkMode } = data;
  const entry = items[index];
  
  return (
    <div 
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}
      className={`divide-x ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} ${
        entry.retirement === "Yes" 
          ? darkMode ? "bg-purple-900 bg-opacity-20" : "bg-purple-50" 
          : darkMode ? "bg-gray-800" : "bg-white"
      } ${
        index % 2 === 0 
          ? "" 
          : darkMode ? "bg-opacity-90" : "bg-opacity-60"
      } transition-colors duration-150 ${
        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
      }`}
    >
      <div style={{ width: `var(--col-year, ${COLUMN_WIDTHS.year.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>
        {entry.year}
      </div>
      <div style={{ width: `var(--col-age, ${COLUMN_WIDTHS.age.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>
        {entry.age}
      </div>
      <div style={{ width: `var(--col-capital, ${COLUMN_WIDTHS.capital.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>
        {formatAmount(entry.capital)}
      </div>
      <div style={{ width: `var(--col-variation, ${COLUMN_WIDTHS.variation.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium truncate ${entry.variation >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
        {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
      </div>
      <div style={{ width: `var(--col-interest, ${COLUMN_WIDTHS.interest.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} truncate`}>
        +{formatAmount(entry.annualInterest)}
      </div>
      <div style={{ width: `var(--col-netvar, ${COLUMN_WIDTHS.netVariation.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium truncate ${entry.netVariationExcludingInterest >= 0 ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
        {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
      </div>
      <div style={{ width: `var(--col-phase, ${COLUMN_WIDTHS.phase.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm truncate">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          entry.retirement === "Yes" 
            ? darkMode 
              ? "bg-gradient-to-r from-purple-900 to-fuchsia-900 text-purple-200 border border-purple-700" 
              : "bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800 border border-purple-200" 
            : darkMode 
              ? "bg-gradient-to-r from-blue-900 to-cyan-900 text-blue-200 border border-blue-700" 
              : "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200"
        }`}>
          {entry.retirement === "Yes" ? "Retirement" : "Investment"}
        </span>
      </div>
    </div>
  );
};

// Summary tile component for each phase - removed onClick and clickable text
interface PhaseSummaryTileProps {
  title: string;
  years: number;
  startYear?: number;
  endYear?: number;
  startAge?: number;
  endAge?: number;
  startCapital: number;
  endCapital: number;
  totalInterest: number;
  totalInvestment?: number;
  totalWithdrawal?: number;
  formatAmount: FormatAmountFunction;
  colorClasses: {
    bgGradient: string;
    textAccent: string;
    borderAccent: string;
    hoverBg: string;
  };
  darkMode: boolean;
}

const PhaseSummaryTile: React.FC<PhaseSummaryTileProps> = ({
  title,
  years,
  startYear,
  endYear,
  startAge,
  endAge,
  startCapital,
  endCapital,
  totalInterest,
  totalInvestment,
  totalWithdrawal,
  formatAmount,
  colorClasses,
  darkMode
}) => {
  // Calculate growth percentage 
  const capitalGrowth = endCapital - startCapital;
  const growthPercentage = startCapital > 0 ? (capitalGrowth / startCapital) * 100 : 0;
  
  return (
    <div className={`h-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-md border overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${colorClasses.borderAccent}`}>
      <div className={`py-4 px-6 ${colorClasses.bgGradient} relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 w-20 h-20 opacity-20 rotate-45 -mt-10 -mr-10 rounded-lg bg-white"></div>
        <div className="absolute left-0 bottom-0 w-16 h-16 opacity-10 -rotate-45 -mb-8 -ml-8 rounded-lg bg-white"></div>
        
        <h3 className="font-bold text-lg text-white flex justify-between items-center relative z-10">
          {title}
          <span className="text-xs font-normal bg-white bg-opacity-30 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
            {years} {years === 1 ? 'year' : 'years'}
          </span>
        </h3>
      </div>
      
      <div className="p-5 grid grid-cols-2 gap-4 mb-1">
        <div className="bg-opacity-10 rounded-lg p-2 border border-opacity-10 border-gray-300">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium mb-1`}>Time Period</p>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {startYear && endYear ? `${startYear} - ${endYear}` : 'N/A'}
          </p>
        </div>
        <div className="bg-opacity-10 rounded-lg p-2 border border-opacity-10 border-gray-300">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium mb-1`}>Age Range</p>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
            {startAge && endAge ? `${startAge} - ${endAge}` : 'N/A'}
          </p>
        </div>
      </div>
      
      <div className={`px-5 py-4 ${darkMode ? 'bg-gray-800/60' : 'bg-gray-50/80'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <p className={`text-sm font-semibold ${colorClasses.textAccent}`}>Capital Evolution</p>
          <p className={`text-sm font-bold px-2 py-0.5 rounded ${capitalGrowth >= 0 ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700')}`}>
            {capitalGrowth >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
          </p>
        </div>
        
        <div className="relative h-1 w-full bg-gray-300 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
          <div 
            className={`h-full ${capitalGrowth >= 0 ? 'bg-gradient-to-r from-green-500 to-green-300' : 'bg-gradient-to-r from-red-500 to-red-300'}`}
            style={{ width: `${Math.min(100, Math.abs(growthPercentage))}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="w-1/2">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium`}>Initial</p>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{formatAmount(startCapital)}</p>
          </div>
          <div className="w-1/2 text-right">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium`}>Final</p>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{formatAmount(endCapital)}</p>
          </div>
        </div>
      </div>
      
      <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-indigo-400' : 'bg-indigo-600'} mr-2`}></div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium`}>Interest Earned</p>
            </div>
            <p className={`text-sm font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>+{formatAmount(totalInterest)}</p>
          </div>
          
          {totalInvestment !== undefined && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-600'} mr-2`}></div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium`}>Total Invested</p>
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>+{formatAmount(totalInvestment)}</p>
            </div>
          )}
          
          {totalWithdrawal !== undefined && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-red-400' : 'bg-red-600'} mr-2`}></div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase font-medium`}>Total Withdrawn</p>
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>-{formatAmount(totalWithdrawal)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({
  graphData,
  formatAmount,
  currency
}) => {
  const { darkMode } = useTheme();
  const [state, dispatch] = useReducer(scheduleReducer, {
    sortConfig: {
      key: null,
      direction: null
    },
    filteredPhase: 'all',
    viewMode: 'tiles'
  });

  const { postWorkerMessage } = useWorker('scheduleDetails');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Add scrollbar styles once when component mounts
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = scrollbarStyles;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Process data when needed
  useEffect(() => {
    // Only process data if we have graph data
    if (graphData.length === 0) {
      return;
    }
    
    // Post message to worker for data processing
    postWorkerMessage(
      WorkerMessageType.FILTER_AND_SORT_DATA,
      {
        graphData,
        filteredPhase: state.filteredPhase,
        sortConfig: state.sortConfig
      },
      (response) => {
        if (response.error) {
          console.error('Worker error:', response.error);
          return;
        }
      }
    );
  }, [graphData, state.filteredPhase, state.sortConfig, postWorkerMessage]);

  // Update container width when visible
  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      
      // Initial update
      updateDimensions();
      
      // Add resize listener
      window.addEventListener('resize', updateDimensions);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, []);

  // Add CSS variables for responsive column widths based on screen size
  useEffect(() => {
    const setCssVars = () => {
      const root = document.documentElement;
      const isMobile = window.innerWidth < 640; // sm breakpoint in Tailwind
      
      root.style.setProperty('--col-year', isMobile ? COLUMN_WIDTHS.year.mobile : COLUMN_WIDTHS.year.desktop);
      root.style.setProperty('--col-age', isMobile ? COLUMN_WIDTHS.age.mobile : COLUMN_WIDTHS.age.desktop);
      root.style.setProperty('--col-capital', isMobile ? COLUMN_WIDTHS.capital.mobile : COLUMN_WIDTHS.capital.desktop);
      root.style.setProperty('--col-variation', isMobile ? COLUMN_WIDTHS.variation.mobile : COLUMN_WIDTHS.variation.desktop);
      root.style.setProperty('--col-interest', isMobile ? COLUMN_WIDTHS.interest.mobile : COLUMN_WIDTHS.interest.desktop);
      root.style.setProperty('--col-netvar', isMobile ? COLUMN_WIDTHS.netVariation.mobile : COLUMN_WIDTHS.netVariation.desktop);
      root.style.setProperty('--col-phase', isMobile ? COLUMN_WIDTHS.phase.mobile : COLUMN_WIDTHS.phase.desktop);
    };
    
    setCssVars();
    window.addEventListener('resize', setCssVars);
    
    return () => window.removeEventListener('resize', setCssVars);
  }, []);

  // Calculate phase summaries
  const phaseSummaries = useMemo(() => {
    const investmentData = graphData.filter(point => point.retirement === "No");
    const retirementData = graphData.filter(point => point.retirement === "Yes");

    return {
      investmentSummary: calculatePhaseSummary(investmentData),
      retirementSummary: calculatePhaseSummary(retirementData)
    };
  }, [graphData]);

  // Add console logs for debugging
  useEffect(() => {
    console.log("Processed Data:", graphData);
    console.log("Retirement Summary:", phaseSummaries.retirementSummary);
  }, [graphData, phaseSummaries.retirementSummary]);

  const handleSort = (key: keyof GraphDataPoint) => {
    const direction = 
      state.sortConfig.key === key && state.sortConfig.direction === 'ascending' 
        ? 'descending' 
        : 'ascending';
    
    dispatch({ 
      type: 'SET_SORT', 
      payload: { key, direction } 
    });
  };

  const handlePhaseFilter = (phase: FilterPhase) => {
    dispatch({ type: 'SET_PHASE_FILTER', payload: phase });
  };
  
  const handleShowFullSchedule = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'full-schedule' });
  };
  
  const handleShowSummary = () => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'tiles' });
  };

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

  // Add useMemo to filter data directly in the component based on the filter selection
  const filteredData = useMemo(() => {
    if (state.filteredPhase === 'all') {
      return graphData;
    } else if (state.filteredPhase === 'investment') {
      return graphData.filter(item => item.retirement === "No");
    } else {
      return graphData.filter(item => item.retirement === "Yes");
    }
  }, [graphData, state.filteredPhase]);

  const renderScheduleTable = () => {
    if (!graphData.length) {
      return (
        <div className={cx(
          "text-center py-12 rounded-xl",
          darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500"
        )}>
          <svg className={cx(
            "mx-auto h-12 w-12", 
            darkMode ? "text-gray-600" : "text-gray-400"
          )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className={cx(
            "mt-2 text-sm font-medium",
            darkMode ? "text-gray-200" : "text-gray-900" 
          )}>Loading schedule data...</h3>
          <p className={cx(
            "mt-1 text-sm",
            darkMode ? "text-gray-400" : "text-gray-500"
          )}>Please wait while we process your financial projections.</p>
        </div>
      );
    }
    
    return (
      <div className="w-full max-w-full overflow-x-auto rounded-lg">
        <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} sticky top-0 z-10 shadow-sm`}>
            <tr>
              <th 
                scope="col" 
                className={`px-3 py-4 text-left font-medium cursor-pointer group relative ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                onClick={() => handleSort('year')}
                title="Sort by Year"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-semibold">Year</span>
                  {state.sortConfig.key === 'year' && (
                    <span className="ml-1 text-blue-500">
                      {state.sortConfig.direction === 'ascending' 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                      }
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </th>
              <th 
                scope="col" 
                className={`px-3 py-4 text-left font-medium cursor-pointer group relative ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                onClick={() => handleSort('age')}
                title="Sort by Age"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-semibold">Age</span>
                  {state.sortConfig.key === 'age' && (
                    <span className="ml-1 text-blue-500">
                      {state.sortConfig.direction === 'ascending' 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                      }
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </th>
              <th 
                scope="col" 
                className={`px-3 py-4 text-left font-medium cursor-pointer group relative ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                onClick={() => handleSort('capital')}
                title="Sort by Capital amount"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-semibold">Capital</span>
                  {state.sortConfig.key === 'capital' && (
                    <span className="ml-1 text-blue-500">
                      {state.sortConfig.direction === 'ascending' 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                      }
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </th>
              <th 
                scope="col" 
                className={`px-3 py-4 text-left font-medium cursor-pointer group relative ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                onClick={() => handleSort('variation')}
                title="Sort by annual variation"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-semibold">Variation</span>
                  {state.sortConfig.key === 'variation' && (
                    <span className="ml-1 text-blue-500">
                      {state.sortConfig.direction === 'ascending' 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                      }
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </th>
              <th 
                scope="col" 
                className={`px-3 py-4 text-left font-medium cursor-pointer group relative ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                onClick={() => handleSort('annualInterest')}
                title="Sort by annual interest earned"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-semibold">Interest</span>
                  {state.sortConfig.key === 'annualInterest' && (
                    <span className="ml-1 text-blue-500">
                      {state.sortConfig.direction === 'ascending' 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                      }
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </th>
              <th 
                scope="col" 
                className={`px-3 py-4 text-left font-medium cursor-pointer group relative ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                onClick={() => handleSort('netVariationExcludingInterest')}
                title="Sort by investment or withdrawal amount"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-semibold truncate" title="Investment or Withdrawal">Inv/Withdrawal</span>
                  {state.sortConfig.key === 'netVariationExcludingInterest' && (
                    <span className="ml-1 text-blue-500">
                      {state.sortConfig.direction === 'ascending' 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                      }
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </th>
              <th 
                scope="col" 
                className={`px-3 py-4 text-left font-medium relative group ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                title="Current phase of financial journey"
              >
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-xs uppercase tracking-wider font-semibold">Phase</span>
                </div>
                <div className="absolute inset-x-0 h-0.5 bottom-0 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </th>
            </tr>
          </thead>
          <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
            {filteredData.map((entry, idx) => (
              <tr key={idx} className={`${
                entry.retirement === "Yes" 
                  ? darkMode ? "bg-purple-900 bg-opacity-20" : "bg-purple-50" 
                  : darkMode ? "" : ""
                } ${
                  idx % 2 === 0 
                    ? "" 
                    : darkMode ? "bg-opacity-90" : "bg-opacity-60"
                } hover:bg-opacity-80 transition-colors`}>
                <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                  {entry.year}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm">
                  {entry.age}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-medium">
                  {formatAmount(entry.capital)}
                </td>
                <td className={`px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-medium 
                  ${entry.variation >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
                </td>
                <td className={`px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  +{formatAmount(entry.annualInterest)}
                </td>
                <td className={`px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-medium 
                  ${entry.netVariationExcludingInterest >= 0 ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    entry.retirement === "Yes" 
                      ? darkMode 
                        ? "bg-gradient-to-r from-purple-900 to-fuchsia-900 text-purple-200 border border-purple-700" 
                        : "bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800 border border-purple-200" 
                      : darkMode 
                        ? "bg-gradient-to-r from-blue-900 to-cyan-900 text-blue-200 border border-blue-700" 
                        : "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200"
                  }`}>
                    {entry.retirement === "Yes" ? "Retirement" : "Investment"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSummaryTiles = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Investment Phase Tile */}
        {phaseSummaries.investmentSummary && (
          <PhaseSummaryTile
            title="Investment Phase"
            years={phaseSummaries.investmentSummary.years}
            startYear={phaseSummaries.investmentSummary.startYear}
            endYear={phaseSummaries.investmentSummary.endYear}
            startAge={phaseSummaries.investmentSummary.startAge}
            endAge={phaseSummaries.investmentSummary.endAge}
            startCapital={phaseSummaries.investmentSummary.startCapital}
            endCapital={phaseSummaries.investmentSummary.endCapital}
            totalInterest={phaseSummaries.investmentSummary.totalInterest}
            totalInvestment={phaseSummaries.investmentSummary.totalInvestment}
            formatAmount={formatDisplayValue}
            colorClasses={{
              bgGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
              textAccent: "text-blue-600",
              borderAccent: darkMode ? "border-blue-800" : "border-blue-200",
              hoverBg: "hover:bg-blue-50"
            }}
            darkMode={darkMode}
          />
        )}
        
        {/* Retirement Phase Tile */}
        {phaseSummaries.retirementSummary && (
          <PhaseSummaryTile
            title="Retirement Phase"
            years={phaseSummaries.retirementSummary.years}
            startYear={phaseSummaries.retirementSummary.startYear}
            endYear={phaseSummaries.retirementSummary.endYear}
            startAge={phaseSummaries.retirementSummary.startAge}
            endAge={phaseSummaries.retirementSummary.endAge}
            startCapital={phaseSummaries.retirementSummary.startCapital}
            endCapital={phaseSummaries.retirementSummary.endCapital}
            totalInterest={phaseSummaries.retirementSummary.totalInterest}
            totalWithdrawal={phaseSummaries.retirementSummary.totalWithdrawal}
            formatAmount={formatDisplayValue}
            colorClasses={{
              bgGradient: "bg-gradient-to-r from-purple-500 to-pink-600",
              textAccent: "text-purple-600",
              borderAccent: darkMode ? "border-purple-800" : "border-purple-200",
              hoverBg: "hover:bg-purple-50"
            }}
            darkMode={darkMode}
          />
        )}
      </div>
    );
  };

  // Updated renderPhaseFilterButtons function with distinct colors for unselected states
  const renderPhaseFilterButtons = () => {
    return (
      <div className={`inline-flex rounded-md shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} p-1`}>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            state.filteredPhase === 'all'
              ? darkMode 
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-inner' 
                : 'bg-white text-gray-700 shadow-sm'
              : darkMode 
                ? 'text-gray-100 hover:bg-gray-800/70 border border-gray-700' 
                : 'text-gray-700 hover:bg-gray-100 border border-gray-300/50'
          }`}
          onClick={() => handlePhaseFilter('all')}
        >
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>All Phases ({graphData.length})</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            state.filteredPhase === 'investment'
              ? darkMode 
                ? 'bg-gradient-to-r from-blue-900 to-cyan-900 text-blue-100 shadow-inner' 
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 shadow-sm'
              : darkMode 
                ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 border border-blue-900/50' 
                : 'text-blue-700 hover:bg-blue-50 border border-blue-200/80'
          }`}
          onClick={() => handlePhaseFilter('investment')}
        >
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Investment ({graphData.filter(item => item.retirement === "No").length})</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            state.filteredPhase === 'retirement'
              ? darkMode 
                ? 'bg-gradient-to-r from-purple-900 to-fuchsia-900 text-purple-100 shadow-inner' 
                : 'bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border border-purple-200 shadow-sm'
              : darkMode 
                ? 'text-purple-300 hover:text-purple-200 hover:bg-purple-900/30 border border-purple-900/50' 
                : 'text-purple-700 hover:bg-purple-50 border border-purple-200/80'
          }`}
          onClick={() => handlePhaseFilter('retirement')}
        >
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>Retirement ({graphData.filter(item => item.retirement === "Yes").length})</span>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className={cx(
      "p-4 sm:p-6 rounded-2xl shadow-md border",
      darkMode 
        ? "bg-gray-900 border-gray-700" 
        : "bg-gray-50 border-gray-200"
    )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="mb-2 sm:mb-0">
          <h2 className={cx(
            "text-xl mb-1 sm:mb-0", 
            components.header.withIcon,
            typography.weight.semibold,
            darkMode ? "text-gray-100" : typography.style.gradient
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className={cx(
              components.icon.sizes.sm, 
              components.icon.spacings.right.sm,
              darkMode ? "text-indigo-400" : components.icon.colors.indigo
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Details
          </h2>
          <p className={cx(
            typography.style.subtitle, 
            "sm:pl-7",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>Year-by-year breakdown of your financial journey</p>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {state.viewMode === 'full-schedule' && (
            <>
              <div className="overflow-x-auto pb-2 sm:pb-0 -mx-2 px-2">
                {renderPhaseFilterButtons()}
              </div>
              
              <button
                className={cx(
                  "px-3 py-1 sm:px-4 sm:py-2 text-sm mt-1 sm:mt-0 rounded-lg text-white font-medium shadow-sm transition-all",
                  darkMode 
                    ? "bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-800 hover:to-blue-900"
                    : "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                )}
                onClick={handleShowSummary}
              >
                View Summary
              </button>
            </>
          )}
          
          {state.viewMode === 'tiles' && (
            <button
              className={cx(
                "px-4 py-2 sm:px-6 sm:py-3 text-base rounded-lg text-white font-bold shadow-md transition-all animate-pulse",
                darkMode 
                  ? "bg-gradient-to-r from-green-700 to-emerald-800 hover:from-green-800 hover:to-emerald-900"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              )}
              onClick={handleShowFullSchedule}
            >
              View Full Schedule
            </button>
          )}
        </div>
      </div>
      
      <div ref={containerRef}>
        {state.viewMode === 'tiles' ? renderSummaryTiles() : renderScheduleTable()}
      </div>
    </div>
  );
};

export default ScheduleDetails; 