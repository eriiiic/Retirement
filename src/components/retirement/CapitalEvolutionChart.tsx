import React, { useReducer } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { GraphDataPoint, FormatAmountFunction, Currency, ChartSeriesVisibility } from './types';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  currency: Currency;
}

type ChartAction = 
  | { type: 'TOGGLE_SERIES'; payload: keyof ChartSeriesVisibility }
  | { type: 'SET_ZOOM'; payload: number };

interface ChartState {
  visibleSeries: ChartSeriesVisibility;
  zoomLevel: number;
}

const initialState: ChartState = {
  visibleSeries: {
    capital: true,
    capitalWithoutInterest: true
  },
  zoomLevel: 100
};

function chartReducer(state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case 'TOGGLE_SERIES':
      return {
        ...state,
        visibleSeries: {
          ...state.visibleSeries,
          [action.payload]: !state.visibleSeries[action.payload]
        }
      };
    case 'SET_ZOOM':
      return {
        ...state,
        zoomLevel: action.payload
      };
    default:
      return state;
  }
}

export const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  currency,
}) => {
  const [state, dispatch] = useReducer(chartReducer, initialState);

  const handleSeriesToggle = (series: keyof ChartSeriesVisibility) => {
    dispatch({ type: 'TOGGLE_SERIES', payload: series });
  };

  const currencySymbol = currency === "EUR" ? "€" : "$";

  return (
    <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Capital Evolution</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded ${state.visibleSeries.capital ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => handleSeriesToggle('capital')}
          >
            Capital
          </button>
          <button
            className={`px-3 py-1 text-sm rounded ${state.visibleSeries.capitalWithoutInterest ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => handleSeriesToggle('capitalWithoutInterest')}
          >
            Principal Only
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={graphData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Year', position: 'insideBottomRight', offset: -10 }} 
          />
          <YAxis 
            tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
            label={{ value: `Capital (${currencySymbol})`, angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === "Capital") return [`${formatAmount(value)}`, 'Capital with Interest'];
              if (name === "Principal Only") return [`${formatAmount(value)}`, 'Capital without Interest'];
              return [`${formatAmount(value)}`, name];
            }}
            labelFormatter={(value: any) => `Year: ${value}`}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
          />
          <Legend />
          {state.visibleSeries.capital && (
            <Line
              type="monotone"
              dataKey="capital"
              stroke="#4f46e5"
              name="Capital"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
            />
          )}
          {state.visibleSeries.capitalWithoutInterest && (
            <Line
              type="monotone"
              dataKey="capitalWithoutInterest"
              stroke="#94a3b8"
              name="Principal Only"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CapitalEvolutionChart; 