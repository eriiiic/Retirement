import { useReducer, useMemo, useCallback, useState, useEffect } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { GraphDataPoint, FormatAmountFunction, Currency, ChartSeriesVisibility, DelayedRetirementPoint, SimulatorParams, CalculateDelayedCapitalFunction } from './types';
import React from 'react';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  currency: Currency;
  currentAge?: number;
  params: SimulatorParams;
  calculateDelayedCapital?: CalculateDelayedCapitalFunction;
}

type ChartAction = { type: 'TOGGLE_SERIES'; payload: keyof ChartSeriesVisibility };

interface ChartState {
  visibleSeries: ChartSeriesVisibility;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey?: string;
    color?: string;
    payload?: {
      capitalMin: number;
      capitalMax: number;
      [key: string]: any;
    };
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
  }
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
    default:
      return state;
  }
}

const CustomTooltip = React.memo<CustomTooltipProps>(({
  active,
  payload,
  label,
  currentAge,
  currentYear,
  formatAmount
}) => {
  // Only show tooltip if it's active and has valid payload data
  if (!active || !payload || payload.length === 0 || !label) {
    return null;
  }
  
  // Parse the year from the label and validate
  const year = Number(label);
  if (isNaN(year)) {
    return null;
  }
  
  // Calculate age at this year
  const yearDiff = year - currentYear;
  const ageAtThisYear = currentAge + yearDiff;
  
  // Get the main capital value and delayed retirement range
  const capitalEntry = payload.find(p => p.name === "Capital with Interest");
  const delayedEntry = payload.find(p => p.name === "Delayed Retirement Range");
  
  if (!capitalEntry) {
    return null;
  }
  
  const capitalValue = capitalEntry.value || 0;
  const isCapitalZero = capitalValue <= 0;
  
  return (
    <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200 text-sm">
      <p className="font-semibold text-gray-800">Year: {year}</p>
      <p className="text-gray-700">
        Age: <span className={isCapitalZero ? "font-bold text-red-600" : "text-gray-800"}>
          {ageAtThisYear}
        </span>
      </p>
      {/* Show main capital value */}
      <p className="font-medium" style={{ color: "#4f46e5" }}>
        Capital: {formatAmount(capitalValue)}
      </p>
      {/* Show delayed retirement range if available */}
      {delayedEntry?.payload && (
        <div className="mt-1 pt-1 border-t border-gray-100">
          <p className="font-medium text-purple-600">Delayed Retirement Range:</p>
          <p className="text-sm text-purple-600">
            Min: {formatAmount(delayedEntry.payload.capitalMin)}
          </p>
          <p className="text-sm text-purple-600">
            Max: {formatAmount(delayedEntry.payload.capitalMax)}
          </p>
        </div>
      )}
    </div>
  );
});

// Memoize the entire chart component
const MemoizedChart = React.memo<{
  data: GraphDataPoint[];
  onMouseMove: (data: any) => void;
  onMouseLeave: () => void;
  chartComponents: any;
  chartSeries: any;
  state: ChartState;
  activeTooltipData: any;
  currentAge: number;
  currentYear: number;
  formatAmount: FormatAmountFunction;
  zeroCapitalYear: number | null;
  retirementYear: number | null;
  targetAgeYear: number | null;
  gradients: React.ReactNode;
}>(({
  data,
  onMouseMove,
  onMouseLeave,
  chartComponents,
  chartSeries,
  state,
  activeTooltipData,
  currentAge,
  currentYear,
  formatAmount,
  zeroCapitalYear,
  retirementYear,
  targetAgeYear,
  gradients
}) => (
  <ResponsiveContainer width="100%" height={300}>
    <ComposedChart
      data={data}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {gradients}
      
      {chartComponents.CartesianGrid}
      {chartComponents.XAxis}
      {chartComponents.YAxis}
      
      {chartSeries.delayedBand()}
      {chartSeries.capital(state.visibleSeries.capital)}
      {chartSeries.capitalWithoutInterest(state.visibleSeries.capitalWithoutInterest)}
      
      {/* Reference lines */}
      {chartSeries.referenceLines.depletion(zeroCapitalYear)}
      {chartSeries.referenceLines.retirement(retirementYear)}
      {chartSeries.referenceLines.target(targetAgeYear)}
      
      {/* Place reference lines AFTER data series to ensure they're visible */}
      {activeTooltipData && activeTooltipData.active && (
        <Tooltip
          content={
            <CustomTooltip 
              active={activeTooltipData.active}
              payload={activeTooltipData.payload}
              label={activeTooltipData.label}
              currentAge={currentAge} 
              currentYear={currentYear} 
              formatAmount={formatAmount}
            />
          }
          position={activeTooltipData.coordinate}
          active={activeTooltipData.active}
          wrapperStyle={{ pointerEvents: 'none' }}
        />
      )}
      {chartComponents.Legend}
    </ComposedChart>
  </ResponsiveContainer>
));

export const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  currency,
  currentAge = 40,
  params,
  calculateDelayedCapital,
}) => {
  // Define label constants at component level for use throughout the component
  const LABEL_PIXEL_GAP = 2; // Reduced from 5px to 2px to make labels closer to lines
  const LABEL_WIDTH_ESTIMATE = 120; // Adjusted for shorter text
  
  // State to track window size for responsive adjustments
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Update window width on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Determine if we're on a mobile device
  const isMobile = windowWidth < 640; // Standard sm breakpoint
  
  const [state, dispatch] = useReducer(chartReducer, initialState);

  const handleSeriesToggle = (series: keyof ChartSeriesVisibility) => {
    dispatch({ type: 'TOGGLE_SERIES', payload: series });
  };

  const currentYear = new Date().getFullYear();
  
  // Find retirement year (when retirement = "Yes" first appears)
  const retirementYear = useMemo(() => {
    const retirementPoint = graphData.find(point => point.retirement === "Yes");
    return retirementPoint?.year ?? null;
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
  
  // Calculate positions for labels to avoid overlap
  const labelPositions = useMemo(() => {
    type LabelType = 'retirement' | 'depletion' | 'target';
    
    const labelData: Array<{
      type: LabelType;
      position: number;
      year: number;
      age: number;
      label: string;
      horizontalPosition?: number;
      className: string;
      rightOffset: number;
      labelWidth?: number;
    }> = [];

    if (zeroCapitalYear && zeroCapitalAge !== null) {
      labelData.push({
        type: 'depletion',
        position: getLabelPosition(zeroCapitalYear),
        year: zeroCapitalYear,
        age: zeroCapitalAge || 0,
        label: `Depleted: ${zeroCapitalAge}`,
        className: 'font-medium text-red-500',
        rightOffset: LABEL_PIXEL_GAP,
      });
    }

    if (retirementYear && retirementAge !== null) {
      labelData.push({
        type: 'retirement',
        position: getLabelPosition(retirementYear),
        year: retirementYear,
        age: retirementAge || 0,
        label: `Retire: ${retirementAge}`,
        className: 'font-medium text-blue-500',
        rightOffset: LABEL_PIXEL_GAP,
      });
    }

    if (targetAgeYear && targetAge !== null) {
      labelData.push({
        type: 'target',
        position: getLabelPosition(targetAgeYear),
        year: targetAgeYear,
        age: targetAge || 0,
        label: `Target: ${targetAge}`,
        className: 'font-medium text-green-500',
        rightOffset: LABEL_PIXEL_GAP,
      });
    }
    
    labelData.sort((a, b) => a.position - b.position);
    
    labelData.forEach(label => {
      label.horizontalPosition = label.position * 100;
      label.labelWidth = 44 + (label.label.length * 8);
    });
    
    const sortedLabelsForOverlap = [...labelData].sort((a, b) => b.position - a.position);
    
    for (let i = 0; i < sortedLabelsForOverlap.length - 1; i++) {
      const rightLabel = sortedLabelsForOverlap[i];
      const leftLabel = sortedLabelsForOverlap[i + 1];
      
      const rightLabelLine = rightLabel.horizontalPosition || 0;
      const leftLabelLine = leftLabel.horizontalPosition || 0;
      const distanceBetweenLines = rightLabelLine - leftLabelLine;
      const rightLabelWidthPercent = (rightLabel.labelWidth || 0) / 10;
      
      if (distanceBetweenLines < rightLabelWidthPercent + 1) {
        const requiredOffset = rightLabelWidthPercent + 1 - distanceBetweenLines;
        const pixelOffset = requiredOffset * 10;
        leftLabel.rightOffset = LABEL_PIXEL_GAP + pixelOffset;
      }
    }
    
    return { data: labelData };
  }, [graphData, retirementYear, zeroCapitalYear, targetAgeYear, getLabelPosition, retirementAge, zeroCapitalAge, targetAge]);

  // Calculate delayed retirement scenarios
  const [delayedRetirementData, setDelayedRetirementData] = useState<DelayedRetirementPoint[]>([]);
  
  useEffect(() => {
    if (!calculateDelayedCapital || !params) {
      return;
    }
    
    // Calculate delayed retirement scenarios
    const delayedData = calculateDelayedCapital([1, 5], graphData, params);
    setDelayedRetirementData(delayedData);
  }, [graphData, calculateDelayedCapital, params]);

  // Update maxCapital calculation to include delayed scenarios
  const maxCapital = useMemo(() => {
    const maxMainCapital = Math.max(...graphData.map(d => d.capital));
    const maxDelayedCapital = delayedRetirementData 
      ? Math.max(...delayedRetirementData.map(d => d.capitalMax))
      : 0;
    return Math.max(maxMainCapital, maxDelayedCapital) * 1.2;
  }, [graphData, delayedRetirementData]);

  // Calculate all unique years for proper x-axis domain
  const allYears = useMemo(() => {
    const years = new Set<number>();
    graphData.forEach(point => years.add(point.year));
    return Array.from(years).sort((a, b) => a - b);
  }, [graphData]);
  
  // Calculate min and max years for x-axis domain
  const minYear = useMemo(() => allYears.length > 0 ? allYears[0] : currentYear, [allYears, currentYear]);
  const maxYear = useMemo(() => allYears.length > 0 ? allYears[allYears.length - 1] : currentYear + 30, [allYears, currentYear]);

  // Use a component-level state to track tooltip visibility
  const [activeTooltipData, setActiveTooltipData] = useState<{
    active: boolean;
    payload?: any[];
    label?: string;
    coordinate?: { x: number; y: number };
  } | null>(null);

  // Optimize tooltip payload filtering
  const filterTooltipPayload = useCallback((entries: Array<{ name: string; dataKey?: string; }>) => {
    return entries.filter(entry => 
      (entry.name === "Capital with Interest" || entry.name === "Initial Investment") &&
      entry.dataKey !== undefined &&
      !entry.name.includes("Delayed")
    );
  }, []);

  // Optimize tooltip data processing
  const processTooltipData = useCallback((data: any) => {
    if (!data?.activePayload?.length || !data.activeLabel) return null;
    
    const mainPayload = filterTooltipPayload(data.activePayload);
    const uniquePayload = Array.from(new Set(mainPayload.map(entry => entry.dataKey)))
      .map(dataKey => mainPayload.find(entry => entry.dataKey === dataKey));
    
    const year = Number(data.activeLabel);
    if (!uniquePayload.length || isNaN(year)) return null;
    
    return {
      active: true,
      payload: uniquePayload,
      label: data.activeLabel,
      coordinate: data.activeCoordinate
    };
  }, [filterTooltipPayload]);

  // Optimize mouse event handlers
  const handleMouseMove = useCallback((data: any) => {
    const tooltipData = processTooltipData(data);
    setActiveTooltipData(tooltipData);
  }, [processTooltipData]);

  const handleMouseLeave = useCallback(() => {
    setActiveTooltipData(null);
  }, []);

  // Memoize tooltip component
  const tooltipContent = useMemo(() => {
    if (!activeTooltipData?.active) return null;
    
    return (
      <CustomTooltip 
        active={activeTooltipData.active}
        payload={activeTooltipData.payload}
        label={activeTooltipData.label}
        currentAge={currentAge} 
        currentYear={currentYear} 
        formatAmount={formatAmount}
      />
    );
  }, [activeTooltipData, currentAge, currentYear, formatAmount]);

  // Optimize data processing with memoization
  const processedData = useMemo(() => {
    if (!delayedRetirementData) return graphData;
    return delayedRetirementData;
  }, [delayedRetirementData, graphData]);

  // Memoize chart series with proper dependency array
  const chartSeries = useMemo(() => ({
    delayedBand: () => {
      if (!delayedRetirementData) {
        return null;
      }
      
      return (
        <>
          <Area
            type="monotone"
            dataKey="capitalMin"
            stroke="#9333ea"
            strokeWidth={1}
            fill="none"
            name="Delayed Retirement Range"
          />
          <Area
            type="monotone"
            dataKey="capitalMax"
            stroke="#9333ea"
            strokeWidth={1}
            fill="url(#delayedGradient)"
            fillOpacity={0.3}
            name="Delayed Retirement Range"
          />
        </>
      );
    },
    capital: (visible: boolean) => visible && (
      <Area
        type="monotone"
        dataKey="capital"
        stroke="#4f46e5"
        fill="url(#capitalGradient)"
        name="Capital with Interest"
        strokeWidth={4}
        dot={false}
        activeDot={{ r: 8, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
        isAnimationActive={false}
      />
    ),
    capitalWithoutInterest: (visible: boolean) => visible && (
      <Line
        type="monotone"
        dataKey="capitalWithoutInterest"
        stroke="#94a3b8"
        name="Initial Investment"
        strokeWidth={2}
        strokeDasharray="4 4"
        dot={false}
        isAnimationActive={false}
      />
    ),
    referenceLines: {
      depletion: (year: number | null) => year && (
        <ReferenceLine
          x={year}
          stroke="#ef4444"
          strokeWidth={2}
          ifOverflow="extendDomain"
          strokeDasharray="6 3"
          isFront={true}
        />
      ),
      retirement: (year: number | null) => year && (
        <ReferenceLine
          x={year}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="8 4"
          ifOverflow="extendDomain"
          isFront={true}
        />
      ),
      target: (year: number | null) => year && (
        <ReferenceLine
          x={year}
          stroke="#22c55e"
          strokeWidth={2}
          ifOverflow="extendDomain"
          isFront={true}
        />
      )
    }
  }), [delayedRetirementData]);

  // Memoize tick calculations
  const xAxisTicks = useMemo(() => {
    if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
      return [currentYear];
    }

    const ticks = new Set<number>();
    const step = isMobile ? 5 : 2;
    
    // Add min and max years
    ticks.add(minYear);
    ticks.add(maxYear);
    
    // Add important years if they exist and are within range
    [retirementYear, zeroCapitalYear, targetAgeYear].forEach(year => {
      if (year && year >= minYear && year <= maxYear) {
        ticks.add(year);
      }
    });
    
    // Add regular interval ticks
    for (let year = minYear; year <= maxYear; year += step) {
      if (ticks.size >= 50) break; // Safety limit
      ticks.add(year);
    }
    
    return Array.from(ticks).sort((a, b) => a - b);
  }, [minYear, maxYear, currentYear, retirementYear, zeroCapitalYear, targetAgeYear, isMobile]);

  const yAxisTicks = useMemo(() => {
    if (!Number.isFinite(maxCapital) || maxCapital <= 0) {
      return [0];
    }

    const maxTicks = 6;
    const roughStep = maxCapital / maxTicks;
    
    // Round to a nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    
    // Choose a nice step size
    let step;
    if (normalized <= 1) step = 1;
    else if (normalized <= 2) step = 2;
    else if (normalized <= 5) step = 5;
    else step = 10;
    step *= magnitude;
    
    const ticks: number[] = [];
    for (let i = 0; i <= maxTicks && (i * step) <= maxCapital; i++) {
      ticks.push(i * step);
    }
    
    return ticks;
  }, [maxCapital]);

  // Memoize chart components with optimized dependencies
  const chartComponents = useMemo(() => ({
    CartesianGrid: <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />,
    Legend: <Legend iconType="circle" wrapperStyle={{ paddingTop: 5, fontSize: '11px' }} />,
    XAxis: (
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
        ticks={xAxisTicks}
        label={{ 
          value: isMobile ? '' : 'Year',
          position: 'insideBottomRight', 
          offset: 0, 
          fill: '#4b5563', 
          fontSize: 12 
        }}
      />
    ),
    YAxis: (
      <YAxis 
        domain={[0, maxCapital]}
        tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
        tick={{ fill: '#4b5563', fontSize: 11 }}
        tickMargin={8}
        width={40}
        allowDataOverflow={true} 
        ticks={yAxisTicks}
      />
    )
  }), [minYear, maxYear, isMobile, maxCapital, xAxisTicks, yAxisTicks]);

  // Add gradient for delayed retirement band
  const gradients = (
    <defs>
      {/* Capital with interest gradient */}
      <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.9} />
        <stop offset="40%" stopColor="#6366f1" stopOpacity={0.6} />
        <stop offset="80%" stopColor="#818cf8" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.1} />
      </linearGradient>
      {/* Delayed retirement band gradient */}
      <linearGradient id="delayedGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9333ea" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#9333ea" stopOpacity={0.1} />
      </linearGradient>
      {/* Filter for glow effects */}
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  return (
    <div className="mt-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
      <style>
        {`
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            opacity: 0.85;
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }
        .animate-pulse {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        `}
      </style>
      
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center mb-2">
          <h2 className="text-xl font-semibold text-gradient">Capital Evolution</h2>
        </div>
        <p className="text-sm text-gray-600 mb-3 sm:mb-5">
          Track how your investments grow over time and visualize your retirement journey.
          {delayedRetirementData && (
            <span className="ml-1 text-purple-600">
              The shaded area shows potential capital growth with 1-5 years delayed retirement.
            </span>
          )}
        </p>
      </div>
      
      <div className="relative -mx-2 sm:mx-0" style={{ maxHeight: '320px', height: 'auto' }}>
        <MemoizedChart
          data={processedData}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          chartComponents={chartComponents}
          chartSeries={chartSeries}
          state={state}
          activeTooltipData={activeTooltipData}
          currentAge={currentAge}
          currentYear={currentYear}
          formatAmount={formatAmount}
          zeroCapitalYear={zeroCapitalYear}
          retirementYear={retirementYear}
          targetAgeYear={targetAgeYear}
          gradients={gradients}
        />
        
        {/* Overlay absolute positioned labels - adjust top positions for smaller chart */}
        <div className="absolute inset-0 pointer-events-none">
          {labelPositions.data.map((item) => (
            <div
              key={item.type}
              className={`absolute ${item.className} px-2 py-1 rounded-md shadow-md text-xs whitespace-nowrap backdrop-blur-sm bg-white/95 border flex items-center gap-1 font-semibold`}
              style={{
                top: '10%',
                right: `calc(${100 - item.horizontalPosition!}% + ${item.rightOffset}px)`,
                maxWidth: `${LABEL_WIDTH_ESTIMATE}px`,
                textAlign: 'right',
                borderColor: item.type === 'depletion' ? '#ef4444' : item.type === 'retirement' ? '#3b82f6' : '#22c55e',
                zIndex: 10,
              }}
            >
              {/* Icon based on label type */}
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">
                {item.type === 'depletion' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#ef4444" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                )}
                {item.type === 'retirement' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#3b82f6" className="w-4 h-4">
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                  </svg>
                )}
                {item.type === 'target' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#22c55e" className="w-4 h-4">
                    <path d="M10 1a9 9 0 100 18 9 9 0 000-18zM8 10a2 2 0 114 0 2 2 0 01-4 0z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-3a5 5 0 100-10 5 5 0 000 10z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              {item.label}
            </div>
          ))}
          
          {/* SVG for connecting lines */}
          <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
            {labelPositions.data.map((item) => {
              const lineX = `${item.horizontalPosition}%`;
              
              return (
                <line
                  key={`${item.type}-connector`}
                  x1={lineX}
                  y1="10%"
                  x2={`calc(${lineX} - ${item.rightOffset}px)`}
                  y2="10%"
                  stroke={item.type === 'depletion' ? '#ef4444' : item.type === 'retirement' ? '#3b82f6' : '#22c55e'}
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CapitalEvolutionChart; 