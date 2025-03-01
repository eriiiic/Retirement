import React, { useReducer, useState, useEffect, useRef, useMemo } from 'react';
import { GraphDataPoint, FormatAmountFunction, SortConfig, FilterPhase } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';
import { FixedSizeList as List } from 'react-window';

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
  year: '12%',
  age: '12%',
  capital: '15%',
  variation: '15%',
  interest: '15%',
  netVariation: '15%',
  phase: '16%'
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
      <div style={{ width: COLUMN_WIDTHS.year }} className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 truncate">
        {entry.year}
      </div>
      <div style={{ width: COLUMN_WIDTHS.age }} className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 truncate">
        {entry.age}
      </div>
      <div style={{ width: COLUMN_WIDTHS.capital }} className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
        {formatAmount(entry.capital)}
      </div>
      <div style={{ width: COLUMN_WIDTHS.variation }} className={`px-6 py-2 whitespace-nowrap text-sm font-medium truncate ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
      </div>
      <div style={{ width: COLUMN_WIDTHS.interest }} className="px-6 py-2 whitespace-nowrap text-sm font-medium text-indigo-600 truncate">
        +{formatAmount(entry.annualInterest)}
      </div>
      <div style={{ width: COLUMN_WIDTHS.netVariation }} className={`px-6 py-2 whitespace-nowrap text-sm font-medium truncate ${entry.netVariationExcludingInterest >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
        {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
      </div>
      <div style={{ width: COLUMN_WIDTHS.phase }} className="px-6 py-2 whitespace-nowrap text-sm truncate">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.retirement === "Yes" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
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

    postWorkerMessage({
      type: WorkerMessageType.FILTER_AND_SORT_DATA,
      payload: {
        graphData,
        filteredPhase: state.filteredPhase,
        sortConfig: state.sortConfig
      }
    }, (response: WorkerResponse) => {
      if (response.type === WorkerMessageType.ERROR) {
        console.error('Worker error:', response.error);
        return;
      }

      if (response.type === WorkerMessageType.FILTERED_SORTED_DATA_RESULT && response.data) {
        setProcessedData(response.data);
        
        // Set a reasonable height for the list
        setListHeight(Math.min(500, response.data.length * 42));
      } else {
        console.error('Invalid worker response type:', response.type);
      }
    });
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

  // Compute summary data for each phase
  const { investmentSummary, retirementSummary } = useMemo(() => {
    if (!processedData.length) {
      return {
        investmentSummary: null,
        retirementSummary: null
      };
    }

    const investmentData = processedData.filter(entry => entry.retirement === "No");
    const retirementData = processedData.filter(entry => entry.retirement === "Yes");

    const calculatePhaseSummary = (data: GraphDataPoint[]) => {
      if (!data.length) return null;
      
      const firstEntry = data[0];
      const lastEntry = data[data.length - 1];
      
      const totalInterest = data.reduce((sum, entry) => sum + entry.annualInterest, 0);
      const totalInvestment = data.reduce((sum, entry) => sum + entry.annualInvestment, 0);
      const totalWithdrawal = data.reduce((sum, entry) => sum + entry.annualWithdrawal, 0);
      
      return {
        years: data.length,
        startYear: firstEntry.year,
        endYear: lastEntry.year,
        startAge: firstEntry.age,
        endAge: lastEntry.age,
        startCapital: firstEntry.capital - firstEntry.variation,
        endCapital: lastEntry.capital,
        totalInterest,
        totalInvestment,
        totalWithdrawal
      };
    };

    return {
      investmentSummary: calculatePhaseSummary(investmentData),
      retirementSummary: calculatePhaseSummary(retirementData)
    };
  }, [processedData]);

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
        {/* Table Header */}
        <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 font-medium text-xs text-gray-600 uppercase tracking-wider">
          <div 
            style={{ width: COLUMN_WIDTHS.year }}
            className="px-6 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={() => handleSort('year')}
          >
            Year
            {state.sortConfig.key === 'year' && (
              <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            style={{ width: COLUMN_WIDTHS.age }}
            className="px-6 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={() => handleSort('age')}
          >
            Age
            {state.sortConfig.key === 'age' && (
              <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            style={{ width: COLUMN_WIDTHS.capital }}
            className="px-6 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={() => handleSort('capital')}
          >
            Capital
            {state.sortConfig.key === 'capital' && (
              <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            style={{ width: COLUMN_WIDTHS.variation }}
            className="px-6 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={() => handleSort('variation')}
          >
            Variation
            {state.sortConfig.key === 'variation' && (
              <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            style={{ width: COLUMN_WIDTHS.interest }}
            className="px-6 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={() => handleSort('annualInterest')}
          >
            Interest
            {state.sortConfig.key === 'annualInterest' && (
              <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            style={{ width: COLUMN_WIDTHS.netVariation }}
            className="px-6 py-3 text-left cursor-pointer hover:text-indigo-700 transition-colors"
            onClick={() => handleSort('netVariationExcludingInterest')}
          >
            Inv/Withdraw
            {state.sortConfig.key === 'netVariationExcludingInterest' && (
              <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            style={{ width: COLUMN_WIDTHS.phase }}
            className="px-6 py-3 text-left"
          >
            Phase
          </div>
        </div>
        
        {/* Show the entire schedule in a grid instead of virtualized list - removed max-height and overflow */}
        <div>
          {processedData.map((entry, index) => (
            <div 
              key={`${entry.year}-${entry.age}`}
              className={`flex divide-x divide-gray-200 ${entry.retirement === "Yes" ? "bg-purple-50" : "bg-white"} ${index % 2 === 0 ? "" : "bg-opacity-60"} hover:bg-gray-50`}
            >
              <div style={{ width: COLUMN_WIDTHS.year }} className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 truncate">
                {entry.year}
              </div>
              <div style={{ width: COLUMN_WIDTHS.age }} className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 truncate">
                {entry.age}
              </div>
              <div style={{ width: COLUMN_WIDTHS.capital }} className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
                {formatAmount(entry.capital)}
              </div>
              <div style={{ width: COLUMN_WIDTHS.variation }} className={`px-6 py-2 whitespace-nowrap text-sm font-medium truncate ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
              </div>
              <div style={{ width: COLUMN_WIDTHS.interest }} className="px-6 py-2 whitespace-nowrap text-sm font-medium text-indigo-600 truncate">
                +{formatAmount(entry.annualInterest)}
              </div>
              <div style={{ width: COLUMN_WIDTHS.netVariation }} className={`px-6 py-2 whitespace-nowrap text-sm font-medium truncate ${entry.netVariationExcludingInterest >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
              </div>
              <div style={{ width: COLUMN_WIDTHS.phase }} className="px-6 py-2 whitespace-nowrap text-sm truncate">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.retirement === "Yes" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                  {entry.retirement === "Yes" ? "Retirement" : "Investment"}
                </span>
              </div>
            </div>
          ))}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Investment Phase Summary */}
        {investmentSummary && (
          <PhaseSummaryTile
            title="Investment Phase"
            years={investmentSummary.years}
            startYear={investmentSummary.startYear}
            endYear={investmentSummary.endYear}
            startAge={investmentSummary.startAge}
            endAge={investmentSummary.endAge}
            startCapital={investmentSummary.startCapital}
            endCapital={investmentSummary.endCapital}
            totalInterest={investmentSummary.totalInterest}
            totalInvestment={investmentSummary.totalInvestment}
            formatAmount={formatAmount}
            colorClasses={{
              bgGradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
              textAccent: 'text-blue-600',
              borderAccent: 'border-blue-400',
              hoverBg: 'hover:bg-blue-50'
            }}
          />
        )}

        {/* Retirement Phase Summary */}
        {retirementSummary && (
          <PhaseSummaryTile
            title="Retirement Phase"
            years={retirementSummary.years}
            startYear={retirementSummary.startYear}
            endYear={retirementSummary.endYear}
            startAge={retirementSummary.startAge}
            endAge={retirementSummary.endAge}
            startCapital={retirementSummary.startCapital}
            endCapital={retirementSummary.endCapital}
            totalInterest={retirementSummary.totalInterest}
            totalWithdrawal={retirementSummary.totalWithdrawal}
            formatAmount={formatAmount}
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
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500 mr-1">Filter:</span>
        <button
          className={`px-3 py-2 text-sm rounded-lg ${state.filteredPhase === 'all' 
            ? 'bg-gray-700 text-white font-medium' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => handlePhaseFilter('all')}
        >
          All Phases
        </button>
        <button
          className={`px-3 py-2 text-sm rounded-lg ${state.filteredPhase === 'investment' 
            ? 'bg-blue-600 text-white font-medium' 
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          onClick={() => handlePhaseFilter('investment')}
        >
          Investment Phase
        </button>
        <button
          className={`px-3 py-2 text-sm rounded-lg ${state.filteredPhase === 'retirement' 
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
    <div className="mt-8 bg-gray-50 p-6 rounded-2xl shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gradient mb-2 sm:mb-0">Schedule Details</h2>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {state.viewMode === 'full-schedule' && (
            <>
              {renderPhaseFilterButtons()}
              
              <button
                className="px-4 py-2 mt-3 sm:mt-0 rounded-lg text-white font-medium shadow-sm transition-all bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                onClick={handleShowSummary}
              >
                View Summary
              </button>
            </>
          )}
          
          {state.viewMode === 'tiles' && (
            <button
              className="px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
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