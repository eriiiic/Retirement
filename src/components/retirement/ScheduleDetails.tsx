import React, { useReducer, useState, useEffect } from 'react';
import { GraphDataPoint, FormatAmountFunction, SortConfig, FilterPhase } from './types';
import { useWorker } from '../../hooks/useWorker';
import { WorkerMessageType, WorkerResponse } from '../../types/worker';

interface ScheduleDetailsProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
}

interface ScheduleState {
  isVisible: boolean;
  sortConfig: SortConfig;
  filteredPhase: FilterPhase;
}

type ScheduleAction =
  | { type: 'TOGGLE_VISIBILITY' }
  | { type: 'SET_SORT'; payload: { key: keyof GraphDataPoint; direction: 'ascending' | 'descending' } }
  | { type: 'CLEAR_SORT' }
  | { type: 'SET_PHASE_FILTER'; payload: FilterPhase };

function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'TOGGLE_VISIBILITY':
      return {
        ...state,
        isVisible: !state.isVisible
      };
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
    default:
      return state;
  }
}

export const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({
  graphData,
  formatAmount,
}) => {
  const [state, dispatch] = useReducer(scheduleReducer, {
    isVisible: false,
    sortConfig: {
      key: null,
      direction: null
    },
    filteredPhase: 'all'
  });

  const [processedData, setProcessedData] = useState<GraphDataPoint[]>([]);
  const { postWorkerMessage } = useWorker('scheduleDetails');

  useEffect(() => {
    // Only process data if we have graph data and the schedule is visible
    if (graphData.length === 0) {
      setProcessedData([]);
      return;
    }

    // If the schedule is not visible, don't bother processing the data
    if (!state.isVisible && processedData.length === 0) {
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
      } else {
        console.error('Invalid worker response type:', response.type);
      }
    });
  }, [graphData, state.filteredPhase, state.sortConfig, state.isVisible, processedData.length, postWorkerMessage]);

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

  return (
    <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Schedule Details</h2>
        <div className="flex space-x-2">
          <div className="mr-4">
            <select 
              className="bg-gray-100 border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={state.filteredPhase}
              onChange={(e) => handlePhaseFilter(e.target.value as FilterPhase)}
              disabled={!state.isVisible}
            >
              <option value="all">All Phases</option>
              <option value="investment">Investment Phase</option>
              <option value="retirement">Retirement Phase</option>
            </select>
          </div>
          <button 
            className={`px-4 py-2 rounded text-white ${state.isVisible ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY' })}
          >
            {state.isVisible ? 'Hide Schedule' : 'Show Schedule'}
          </button>
        </div>
      </div>
      
      {state.isVisible && (
        <div className="overflow-x-auto">
          {processedData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('year')}
                  >
                    Year
                    {state.sortConfig.key === 'year' && (
                      <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('age')}
                  >
                    Age
                    {state.sortConfig.key === 'age' && (
                      <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('capital')}
                  >
                    Capital
                    {state.sortConfig.key === 'capital' && (
                      <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('variation')}
                  >
                    Variation
                    {state.sortConfig.key === 'variation' && (
                      <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('annualInterest')}
                  >
                    Interest
                    {state.sortConfig.key === 'annualInterest' && (
                      <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('netVariationExcludingInterest')}
                  >
                    Inv/Withdraw
                    {state.sortConfig.key === 'netVariationExcludingInterest' && (
                      <span className="ml-1">{state.sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phase
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.map((entry, index) => (
                  <tr key={index} className={entry.retirement === "Yes" ? "bg-orange-50" : ""}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                      {entry.year}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                      {entry.age}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(entry.capital)}
                    </td>
                    <td className={`px-6 py-2 whitespace-nowrap text-sm ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-green-600">
                      +{formatAmount(entry.annualInterest)}
                    </td>
                    <td className={`px-6 py-2 whitespace-nowrap text-sm ${entry.netVariationExcludingInterest >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                      {entry.retirement === "Yes" ? "Retirement" : "Investment"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Loading schedule data...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleDetails; 