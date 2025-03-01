import { useReducer, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { GraphDataPoint, FormatAmountFunction, Currency, ChartSeriesVisibility } from './types';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  currency: Currency;
  currentAge?: number;
}

type ChartAction = 
  | { type: 'TOGGLE_SERIES'; payload: keyof ChartSeriesVisibility }
  | { type: 'SET_ZOOM'; payload: number };

interface ChartState {
  visibleSeries: ChartSeriesVisibility;
  zoomLevel: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
  currentAge: number;
  currentYear: number;
  formatAmount: FormatAmountFunction;
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

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, currentAge, currentYear, formatAmount }) => {
  if (active && payload && payload.length) {
    const capitalValue = payload.find((p) => p.name === "Capital with Interest")?.value || 0;
    const isCapitalZero = capitalValue <= 0;
    
    const year = label ? parseInt(label) : currentYear;
    const yearDiff = year - currentYear;
    const ageAtThisYear = currentAge + yearDiff;
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-600 mb-2">Year: {label}</p>
        <p className="text-gray-600 mb-2">
          Age: <span className={isCapitalZero ? "font-bold text-red-600" : "text-gray-800"}>
            {ageAtThisYear}
          </span>
        </p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {formatAmount(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  currency,
  currentAge = 40,
}) => {
  const [state, dispatch] = useReducer(chartReducer, initialState);

  const handleSeriesToggle = (series: keyof ChartSeriesVisibility) => {
    dispatch({ type: 'TOGGLE_SERIES', payload: series });
  };

  const currencySymbol = currency === "EUR" ? "€" : "$";
  
  const currentYear = new Date().getFullYear();
  
  // Find retirement year (when retirement = "Yes" first appears)
  const retirementYear = useMemo(() => {
    const retirementPoint = graphData.find(point => point.retirement === "Yes");
    return retirementPoint?.year;
  }, [graphData]);
  
  // Find the first year when capital reaches zero or below
  const zeroCapitalYear = useMemo(() => {
    // Skip first point and find first occurrence where capital is <= 0
    // We also check if the previous point had capital > 0 to find the exact transition point
    for (let i = 1; i < graphData.length; i++) {
      if (graphData[i].capital <= 0 && graphData[i-1].capital > 0) {
        return graphData[i].year;
      }
    }
    return null; // Capital never reaches zero
  }, [graphData]);
  
  // Find the target age year (maximum year in the data)
  const targetAgeYear = useMemo(() => {
    if (graphData.length === 0) return null;
    return graphData[graphData.length - 1].year;
  }, [graphData]);
  
  // Calculate ages for the reference points
  const retirementAge = retirementYear 
    ? currentAge + (retirementYear - currentYear)
    : null;
    
  const zeroCapitalAge = zeroCapitalYear 
    ? currentAge + (zeroCapitalYear - currentYear)
    : null;
    
  const targetAge = targetAgeYear 
    ? currentAge + (targetAgeYear - currentYear)
    : null;

  // Find the position of each reference line in the chart for more precise positioning
  const getLabelPosition = useCallback((year: number | null): number => {
    if (!year || graphData.length === 0) return 0;
    const index = graphData.findIndex(point => point.year === year);
    return index >= 0 ? index / (graphData.length - 1) : 0;
  }, [graphData]);

  return (
    <div className="mt-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gradient mb-2 sm:mb-0">Capital Evolution</h2>
        <p className="text-sm text-gray-600 mb-5">Track how your investments grow over time and visualize your retirement journey.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-inner p-4 border border-gray-100">
        <div className="relative">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={graphData}
              margin={{ top: 10, right: 30, left: 35, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis 
                dataKey="year" 
                label={{ 
                  value: 'Year', 
                  position: 'insideBottomRight', 
                  offset: -15,
                  style: { 
                    fontWeight: 600,
                    fill: '#4b5563',
                    fontSize: '16px'
                  }
                }}
                tick={{ fill: '#4b5563' }}
                tickMargin={12}
              />
              <YAxis 
                tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                label={{ 
                  value: `Capital (${currencySymbol})`, 
                  angle: -90, 
                  position: 'outside',
                  style: {
                    fontWeight: 600,
                    fill: '#4b5563',
                    fontSize: '16px',
                    textAnchor: 'middle'
                  },
                  dx: -35
                }}
                tick={{ fill: '#4b5563' }}
                tickMargin={12}
              />
              <Tooltip 
                content={<CustomTooltip currentAge={currentAge} currentYear={currentYear} formatAmount={formatAmount} />}
              />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ paddingTop: 10 }}
              />
              
              {/* Capital depletion line (red) */}
              {zeroCapitalYear && (
                <ReferenceLine
                  x={zeroCapitalYear}
                  stroke="#ef4444"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              )}
              
              {/* Retirement age line (blue dashed) */}
              {retirementYear && (
                <ReferenceLine
                  x={retirementYear}
                  stroke="#4f46e5"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                />
              )}
              
              {/* Target age line (green) */}
              {targetAgeYear && (
                <ReferenceLine
                  x={targetAgeYear}
                  stroke="#16a34a"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              )}
              
              {state.visibleSeries.capital && (
                <Line
                  type="monotone"
                  dataKey="capital"
                  stroke="#4f46e5"
                  name="Capital with Interest"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 8, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
              {state.visibleSeries.capitalWithoutInterest && (
                <Line
                  type="monotone"
                  dataKey="capitalWithoutInterest"
                  stroke="#94a3b8"
                  name="Initial Investment"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#94a3b8', stroke: '#ffffff', strokeWidth: 2 }}
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
          
          {/* Overlay absolute positioned labels for better visibility */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Zero capital age label (red) */}
            {zeroCapitalYear && zeroCapitalAge && (
              <div 
                className="absolute flex items-center justify-end"
                style={{ 
                  right: `calc(100% - ${getLabelPosition(zeroCapitalYear) * 100}%)`, 
                  top: '15%',
                  transform: 'translateY(-50%)'
                }}
              >
                <div className="bg-red-500 text-white font-bold py-1 px-3 rounded-lg shadow-md mr-2">
                  Age {zeroCapitalAge}
                </div>
              </div>
            )}
            
            {/* Retirement age label (blue) */}
            {retirementYear && retirementAge && (
              <div 
                className="absolute flex items-center justify-end"
                style={{ 
                  right: `calc(100% - ${getLabelPosition(retirementYear) * 100}%)`, 
                  top: '10%',
                  transform: 'translateY(-50%)'
                }}
              >
                <div className="bg-indigo-600 text-white font-bold py-1 px-3 rounded-lg shadow-md mr-2">
                  Age {retirementAge}
                </div>
              </div>
            )}
            
            {/* Target age label (green) */}
            {targetAgeYear && targetAge && (
              <div 
                className="absolute flex items-center justify-end"
                style={{ 
                  right: `calc(100% - ${getLabelPosition(targetAgeYear) * 100}%)`, 
                  top: '20%',
                  transform: 'translateY(-50%)'
                }}
              >
                <div className="bg-green-600 text-white font-bold py-1 px-3 rounded-lg shadow-md mr-2">
                  Age {targetAge}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapitalEvolutionChart; 