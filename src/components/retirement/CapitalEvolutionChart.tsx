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
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_ALL_DELAYED_RETIREMENT'; payload: boolean };

interface ChartState {
  visibleSeries: ChartSeriesVisibility;
  zoomLevel: number;
  showDelayedRetirement: boolean;
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
  zoomLevel: 100,
  showDelayedRetirement: true
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
    case 'TOGGLE_ALL_DELAYED_RETIREMENT':
      return {
        ...state,
        showDelayedRetirement: action.payload
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
  
  const handleToggleAllDelayedRetirement = () => {
    dispatch({ type: 'TOGGLE_ALL_DELAYED_RETIREMENT', payload: !state.showDelayedRetirement });
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
  
  // Calculate delayed retirement simulations
  const delayedRetirementData = useMemo(() => {
    if (!retirementYear || graphData.length === 0) return {};
    
    const retirementIndex = graphData.findIndex(point => point.year === retirementYear);
    if (retirementIndex < 0 || retirementIndex === 0) return {}; // Ensure we have a pre-retirement year
    
    const results: Record<number, Array<{year: number, capital: number}>> = {};
    
    // Generate simulations for 1-4 years of delayed retirement
    [1, 2, 3, 4].forEach(delayYears => {
      const simulation = [];
      
      // Find the data at original retirement year
      const capitalAtOriginalRetirement = graphData[retirementIndex].capital;
      
      // Start from the year BEFORE retirement
      const preRetirementIndex = retirementIndex - 1;
      
      // Find monthly investment amount before retirement
      const monthlyInvestmentBeforeRetirement = graphData[preRetirementIndex].finalMonthlyInvestment;
      
      // Find annual return rate from the params reflected in the data
      const annualReturnRate = 
        graphData[retirementIndex].annualInterest / Math.max(1, graphData[preRetirementIndex].capital) || 0.07;
      
      let simulatedCapital = graphData[preRetirementIndex].capital;
      
      // Add all years from the beginning until pre-retirement year
      for (let i = 0; i <= preRetirementIndex; i++) {
        simulation.push({
          year: graphData[i].year,
          capital: graphData[i].capital
        });
      }
      
      let currentYear = graphData[preRetirementIndex].year;
      
      // Continue investing for the delay period (1-4 years)
      for (let year = 0; year <= delayYears; year++) {
        currentYear++;
        
        // Apply growth (compound interest) to the existing capital
        simulatedCapital = simulatedCapital * (1 + annualReturnRate);
        
        // Add continued monthly investments for the year
        simulatedCapital += (monthlyInvestmentBeforeRetirement * 12);
        
        // Add to simulation
        simulation.push({
          year: currentYear,
          capital: Math.round(simulatedCapital)
        });
      }
      
      // Now simulate the withdrawal phase, starting from the delayed retirement year
      const newRetirementYear = retirementYear + delayYears;
      const newRetirementIndex = graphData.findIndex(point => point.year >= newRetirementYear);
      
      if (newRetirementIndex >= 0 && newRetirementIndex < graphData.length) {
        // Get the remaining years from the original data
        const remainingYears = graphData.length - newRetirementIndex;
        
        // Find the original withdrawal rate
        const monthlyWithdrawalAfterRetirement = 
          graphData[retirementIndex].finalMonthlyWithdrawal || 0;
        
        // Simulate withdrawal years
        for (let i = 1; i <= remainingYears; i++) {
          currentYear++;
          
          // Simulate a year of withdrawals with growth
          simulatedCapital = simulatedCapital * (1 + annualReturnRate) - (monthlyWithdrawalAfterRetirement * 12);
          
          // Add to simulation
          simulation.push({
            year: currentYear,
            capital: Math.round(Math.max(0, simulatedCapital))
          });
        }
      }
      
      results[delayYears] = simulation;
    });
    
    return results;
  }, [graphData, retirementYear]);

  // Calculate max capital for Y-axis
  const maxCapital = useMemo(() => {
    // Find the exact retirement index and capital at that point
    const retirementIndex = graphData.findIndex(point => point.retirement === "Yes");
    
    if (state.showDelayedRetirement && retirementIndex >= 0) {
      // When delayed simulations are shown, use fixed limit based on original retirement capital
      const capitalAtOriginalRetirement = graphData[retirementIndex].capital;
      console.log("Y-axis limit:", capitalAtOriginalRetirement + 750000);
      return capitalAtOriginalRetirement + 750000;
    } else {
      // When delayed simulations are hidden, use the max value from the main chart
      const maxValue = Math.max(...graphData.map(d => d.capital));
      return maxValue + 200000; // Add a small buffer
    }
  }, [graphData, state.showDelayedRetirement]);

  // Calculate all unique years for proper x-axis domain
  const allYears = useMemo(() => {
    const years = new Set<number>();
    
    // Add years from main graph data
    graphData.forEach(point => years.add(point.year));
    
    // Add years from all delayed retirement simulations
    Object.values(delayedRetirementData).forEach(simulation => {
      simulation.forEach(point => years.add(point.year));
    });
    
    return Array.from(years).sort((a, b) => a - b);
  }, [graphData, delayedRetirementData]);
  
  // Calculate min and max years for x-axis domain
  const minYear = useMemo(() => allYears.length > 0 ? allYears[0] : currentYear, [allYears, currentYear]);
  const maxYear = useMemo(() => allYears.length > 0 ? allYears[allYears.length - 1] : currentYear + 30, [allYears, currentYear]);

  return (
    <div className="mt-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center mb-2">
          <h2 className="text-xl font-semibold text-gradient">Capital Evolution</h2>
          {/* Button exactly aligned with title, using same gradient colors */}
          <button
            onClick={handleToggleAllDelayedRetirement}
            className={`flex items-center ml-4 gap-1.5 px-3 py-0.5 text-sm rounded-md ${
              state.showDelayedRetirement 
                ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-sm' 
                : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {state.showDelayedRetirement ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Hide Delayed Retirement
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Show Delayed Retirement
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3 sm:mb-5">Track how your investments grow over time and visualize your retirement journey.</p>
      </div>
      
      <div className="relative -mx-2 sm:mx-0">
        <ResponsiveContainer width="100%" height={380}>
          <LineChart
            data={graphData}
            margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#4b5563', fontSize: 11 }}
              tickMargin={8}
              domain={[minYear, maxYear]}
              type="number"
              allowDecimals={false}
              tickFormatter={(value) => `${value}`}
              allowDataOverflow={false}
              interval={0}
              ticks={(() => {
                const ticks = [];
                for (let year = minYear; year <= maxYear; year += 2) {
                  ticks.push(year);
                }
                return ticks;
              })()}
              label={{ value: 'Year', position: 'insideBottomRight', offset: 0, fill: '#4b5563', fontSize: 12 }}
            />
            <YAxis 
              domain={[0, maxCapital]}
              tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fill: '#4b5563', fontSize: 11 }}
              tickMargin={8}
              width={40}
              ticks={(() => {
                const ticks = [];
                for (let value = 0; value <= maxCapital; value += 250000) {
                  ticks.push(value);
                }
                return ticks;
              })()}
            />
            <Tooltip 
              content={<CustomTooltip currentAge={currentAge} currentYear={currentYear} formatAmount={formatAmount} />}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ paddingTop: 5, fontSize: '11px' }}
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
            
            {/* Delayed retirement simulations */}
            {state.showDelayedRetirement && delayedRetirementData[1] && (
              <Line
                type="monotone"
                data={delayedRetirementData[1]}
                dataKey="capital"
                stroke="#10b981"
                name="Work 1 More Year"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
            
            {state.showDelayedRetirement && delayedRetirementData[2] && (
              <Line
                type="monotone"
                data={delayedRetirementData[2]}
                dataKey="capital"
                stroke="#3b82f6"
                name="Work 2 More Years"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
            
            {state.showDelayedRetirement && delayedRetirementData[3] && (
              <Line
                type="monotone"
                data={delayedRetirementData[3]}
                dataKey="capital"
                stroke="#8b5cf6"
                name="Work 3 More Years"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
            
            {state.showDelayedRetirement && delayedRetirementData[4] && (
              <Line
                type="monotone"
                data={delayedRetirementData[4]}
                dataKey="capital"
                stroke="#ec4899"
                name="Work 4 More Years"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2 }}
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
  );
};

export default CapitalEvolutionChart; 