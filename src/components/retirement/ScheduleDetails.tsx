import { useReducer, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GraphDataPoint, FormatAmountFunction, SortConfig, FilterPhase, Currency } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';
import { FixedSizeList as List } from 'react-window';
import { calculatePhaseSummary } from '../../utils/financialCalculations';

// Add global styles for custom scrollbar
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 #f1f1f1;
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
  };
}

const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const { items, formatAmount } = data;
  const entry = items[index];
  
  return (
    <div 
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}
      className={`divide-x divide-gray-200 ${entry.retirement === "Yes" ? "bg-purple-50" : "bg-white"} ${index % 2 === 0 ? "" : "bg-opacity-60"} transition-colors duration-150 hover:bg-gray-50`}
    >
      <div style={{ width: `var(--col-year, ${COLUMN_WIDTHS.year.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 truncate">
        {entry.year}
      </div>
      <div style={{ width: `var(--col-age, ${COLUMN_WIDTHS.age.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 truncate">
        {entry.age}
      </div>
      <div style={{ width: `var(--col-capital, ${COLUMN_WIDTHS.capital.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 truncate">
        {formatAmount(entry.capital)}
      </div>
      <div style={{ width: `var(--col-variation, ${COLUMN_WIDTHS.variation.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium truncate ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
      </div>
      <div style={{ width: `var(--col-interest, ${COLUMN_WIDTHS.interest.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-indigo-600 truncate">
        +{formatAmount(entry.annualInterest)}
      </div>
      <div style={{ width: `var(--col-netvar, ${COLUMN_WIDTHS.netVariation.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium truncate ${entry.netVariationExcludingInterest >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
        {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
      </div>
      <div style={{ width: `var(--col-phase, ${COLUMN_WIDTHS.phase.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm truncate">
        <span className={`px-1 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.retirement === "Yes" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
          {entry.retirement === "Yes" ? "Ret" : "Inv"}
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
  colorClasses
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${colorClasses.borderAccent}`}>
      <div className={`py-4 px-6 ${colorClasses.bgGradient} border-b ${colorClasses.borderAccent}`}>
        <h3 className="font-semibold text-lg text-white flex justify-between items-center">
          {title}
          <span className="text-xs font-normal bg-white bg-opacity-20 rounded-full px-3 py-1">
            {years} {years === 1 ? 'year' : 'years'}
          </span>
        </h3>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4 mb-2">
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Period</p>
          <p className="text-sm font-medium">
            {startYear && endYear ? `${startYear} to ${endYear}` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Age</p>
          <p className="text-sm font-medium">
            {startAge && endAge ? `${startAge} to ${endAge}` : 'N/A'}
          </p>
        </div>
      </div>
      
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Initial Capital</p>
            <p className={`text-sm font-semibold ${colorClasses.textAccent}`}>{formatAmount(startCapital)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Final Capital</p>
            <p className={`text-sm font-semibold ${colorClasses.textAccent}`}>{formatAmount(endCapital)}</p>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Interest</p>
            <p className="text-sm font-medium text-green-600">+{formatAmount(totalInterest)}</p>
          </div>
          {totalInvestment !== undefined && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Invested</p>
              <p className="text-sm font-medium text-blue-600">+{formatAmount(totalInvestment)}</p>
            </div>
          )}
          {totalWithdrawal !== undefined && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Withdrawn</p>
              <p className="text-sm font-medium text-red-600">-{formatAmount(totalWithdrawal)}</p>
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
  const [state, dispatch] = useReducer(scheduleReducer, {
    sortConfig: {
      key: null,
      direction: null
    },
    filteredPhase: 'all',
    viewMode: 'tiles'
  });

  const [processedData, setProcessedData] = useState<GraphDataPoint[]>([]);
  const { postWorkerMessage } = useWorker('scheduleDetails');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [listHeight, setListHeight] = useState(450);

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
      setProcessedData([]);
      return;
    }

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

        // Set the filtered data
        setProcessedData(response);
        
        // Set a reasonable height for the list
        setListHeight(Math.min(500, response.length * 42));
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
      
      // Clean up listener
      return () => window.removeEventListener('resize', updateDimensions);
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
    const investmentData = processedData.filter(point => point.retirement === "No");
    const retirementData = processedData.filter(point => point.retirement === "Yes");

    return {
      investmentSummary: calculatePhaseSummary(investmentData),
      retirementSummary: calculatePhaseSummary(retirementData)
    };
  }, [processedData]);

  // Add console logs for debugging
  useEffect(() => {
    console.log("Processed Data:", processedData);
    console.log("Retirement Summary:", phaseSummaries.retirementSummary);
  }, [processedData, phaseSummaries.retirementSummary]);

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

  const renderScheduleTable = () => {
    if (!processedData.length) {
      return (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading schedule data...</h3>
          <p className="mt-1 text-sm text-gray-500">Please wait while we process your financial projections.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table Header - Wrapped in a scrollable container */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]"> {/* Minimum width to prevent squishing */}
            <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 font-medium text-xs text-gray-600 uppercase tracking-wider">
              <div 
                style={{ width: `var(--col-year, ${COLUMN_WIDTHS.year.mobile})` }}
                className="px-1 sm:px-2 md:px-3 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('year')}
              >
                Yr
                {state.sortConfig.key === 'year' && (
                  <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                )}
              </div>
              <div 
                style={{ width: `var(--col-age, ${COLUMN_WIDTHS.age.mobile})` }}
                className="px-1 sm:px-2 md:px-3 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('age')}
              >
                Age
                {state.sortConfig.key === 'age' && (
                  <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                )}
              </div>
              <div 
                style={{ width: `var(--col-capital, ${COLUMN_WIDTHS.capital.mobile})` }}
                className="px-1 sm:px-2 md:px-3 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('capital')}
              >
                <span className="hidden sm:inline">Capital</span>
                <span className="sm:hidden">Cap</span>
                {state.sortConfig.key === 'capital' && (
                  <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                )}
              </div>
              <div 
                style={{ width: `var(--col-variation, ${COLUMN_WIDTHS.variation.mobile})` }}
                className="px-1 sm:px-2 md:px-3 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('variation')}
              >
                Var
                {state.sortConfig.key === 'variation' && (
                  <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                )}
              </div>
              <div 
                style={{ width: `var(--col-interest, ${COLUMN_WIDTHS.interest.mobile})` }}
                className="px-1 sm:px-2 md:px-3 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('annualInterest')}
              >
                Int
                {state.sortConfig.key === 'annualInterest' && (
                  <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                )}
              </div>
              <div 
                style={{ width: `var(--col-netvar, ${COLUMN_WIDTHS.netVariation.mobile})` }}
                className="px-1 sm:px-2 md:px-3 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
                onClick={() => handleSort('netVariationExcludingInterest')}
              >
                <span className="hidden sm:inline">Inv/With</span>
                <span className="sm:hidden">I/W</span>
                {state.sortConfig.key === 'netVariationExcludingInterest' && (
                  <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                )}
              </div>
              <div 
                style={{ width: `var(--col-phase, ${COLUMN_WIDTHS.phase.mobile})` }}
                className="px-1 sm:px-2 md:px-3 py-3 text-left"
              >
                Ph
              </div>
            </div>
            
            {/* Show the entire schedule in a grid instead of virtualized list - removed max-height and overflow */}
            <div>
              {processedData.map((entry, index) => (
                <div 
                  key={`${entry.year}-${entry.age}`}
                  className={`flex divide-x divide-gray-200 ${entry.retirement === "Yes" ? "bg-purple-50" : "bg-white"} ${index % 2 === 0 ? "" : "bg-opacity-60"} hover:bg-gray-50`}
                >
                  <div style={{ width: `var(--col-year, ${COLUMN_WIDTHS.year.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 truncate">
                    {entry.year}
                  </div>
                  <div style={{ width: `var(--col-age, ${COLUMN_WIDTHS.age.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 truncate">
                    {entry.age}
                  </div>
                  <div style={{ width: `var(--col-capital, ${COLUMN_WIDTHS.capital.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {formatDisplayValue(entry.capital)}
                  </div>
                  <div style={{ width: `var(--col-variation, ${COLUMN_WIDTHS.variation.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium truncate ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.variation >= 0 ? '+' : ''}{formatDisplayValue(entry.variation)}
                  </div>
                  <div style={{ width: `var(--col-interest, ${COLUMN_WIDTHS.interest.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium text-indigo-600 truncate">
                    +{formatDisplayValue(entry.annualInterest)}
                  </div>
                  <div style={{ width: `var(--col-netvar, ${COLUMN_WIDTHS.netVariation.mobile})` }} className={`px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium truncate ${entry.netVariationExcludingInterest >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatDisplayValue(entry.netVariationExcludingInterest)}
                  </div>
                  <div style={{ width: `var(--col-phase, ${COLUMN_WIDTHS.phase.mobile})` }} className="px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm truncate">
                    <span className={`px-1 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.retirement === "Yes" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                      <span className="hidden sm:inline">{entry.retirement === "Yes" ? "Retire" : "Invest"}</span>
                      <span className="sm:hidden">{entry.retirement === "Yes" ? "Ret" : "Inv"}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Summary Footer */}
        <div className="border-t border-gray-200 bg-gray-50 py-3 px-6 text-xs text-gray-500">
          Showing {processedData.length} years of financial data
        </div>
      </div>
    );
  };

  const renderSummaryTiles = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Investment Phase Summary */}
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
              bgGradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
              textAccent: 'text-blue-600',
              borderAccent: 'border-blue-400',
              hoverBg: 'hover:bg-blue-50'
            }}
          />
        )}

        {/* Retirement Phase Summary */}
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
              bgGradient: 'bg-gradient-to-r from-purple-500 to-pink-600',
              textAccent: 'text-purple-600',
              borderAccent: 'border-purple-400',
              hoverBg: 'hover:bg-purple-50'
            }}
          />
        )}
      </div>
    );
  };

  // Filter buttons for full schedule view
  const renderPhaseFilterButtons = () => {
    return (
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        <span className="text-xs sm:text-sm text-gray-500 mr-1">Filter:</span>
        <button
          className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg ${state.filteredPhase === 'all' 
            ? 'bg-gray-700 text-white font-medium' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => handlePhaseFilter('all')}
        >
          All Phases
        </button>
        <button
          className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg ${state.filteredPhase === 'investment' 
            ? 'bg-blue-600 text-white font-medium' 
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          onClick={() => handlePhaseFilter('investment')}
        >
          Investment Phase
        </button>
        <button
          className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg ${state.filteredPhase === 'retirement' 
            ? 'bg-purple-600 text-white font-medium' 
            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
          onClick={() => handlePhaseFilter('retirement')}
        >
          Retirement Phase
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gradient mb-2 sm:mb-0">Schedule Details</h2>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {state.viewMode === 'full-schedule' && (
            <>
              <div className="overflow-x-auto pb-2 sm:pb-0 -mx-2 px-2">
                {renderPhaseFilterButtons()}
              </div>
              
              <button
                className="px-3 py-1 sm:px-4 sm:py-2 text-sm mt-1 sm:mt-0 rounded-lg text-white font-medium shadow-sm transition-all bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                onClick={handleShowSummary}
              >
                View Summary
              </button>
            </>
          )}
          
          {state.viewMode === 'tiles' && (
            <button
              className="px-3 py-1 sm:px-4 sm:py-2 text-sm rounded-lg text-white font-medium shadow-sm transition-all bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
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