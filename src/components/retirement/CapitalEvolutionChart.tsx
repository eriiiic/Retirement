import { useReducer, useMemo, useCallback, useState, useEffect } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { GraphDataPoint, FormatAmountFunction, Currency, ChartSeriesVisibility, SimulatorParams } from './types';
import React from 'react';
import { Title, Subtitle, Card } from '../common/StyledComponents';
import { colors, spacing, cx, typography } from '../../styles/styleGuide';
import { CHART_CONFIG } from './chartConfig';
import { CHART_ANIMATIONS } from './chartAnimations';
import { calculateFutureValue } from '../../utils/financialCalculations';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  currency: Currency;
  currentAge?: number;
  params: SimulatorParams;
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

// Extract CustomTooltip to a separate component
const CustomTooltip = React.memo<CustomTooltipProps>(({
  active,
  payload,
  label,
  currentAge,
  currentYear,
  formatAmount
}) => {
  if (!active || !payload || payload.length === 0 || !label) {
    return null;
  }
  
  const year = Number(label);
  if (isNaN(year)) {
    return null;
  }
  
  const yearDiff = year - currentYear;
  const ageAtThisYear = currentAge + yearDiff;
  
  const capitalEntry = payload.find(p => p.name === "Capital with Interest");
  const delayedMin = payload.find(p => p.dataKey === "min");
  const delayedMax = payload.find(p => p.dataKey === "max");
  
  if (!capitalEntry) {
    return null;
  }
  
  const capitalValue = capitalEntry.value || 0;
  const isCapitalZero = capitalValue <= 0;
  
  return (
    <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200 text-sm">
      <div className="mb-2 pb-2 border-b border-gray-100">
        <p className="font-semibold text-gray-800">
          Year: {year}
        </p>
        <p className="text-gray-700">
          Age: <span className={cx(
            'font-bold',
            isCapitalZero ? 'text-red-600' : 'text-gray-800'
          )}>
            {ageAtThisYear}
          </span>
        </p>
      </div>
      
      <p className="text-blue-600 font-bold mb-2">
        Capital: {formatAmount(capitalValue)}
      </p>
      
      {delayedMin && delayedMax && (
        <div className="text-xs pt-2 border-t border-gray-100">
          <p className="text-gray-600 font-medium mb-1">Delayed Retirement Range:</p>
          <p className="text-indigo-600">
            1 Year: {formatAmount(delayedMin.value)}
          </p>
          <p className="text-indigo-600">
            5 Years: {formatAmount(delayedMax.value)}
          </p>
        </div>
      )}
    </div>
  );
});

// Add new interfaces for better type safety
interface ChartComponents {
  CartesianGrid: React.ReactNode;
  Legend: React.ReactNode;
  XAxis: React.ReactNode;
  YAxis: React.ReactNode;
}

interface ChartSeries {
  capital: (visible: boolean) => React.ReactNode;
  capitalWithoutInterest: (visible: boolean) => React.ReactNode;
  delayedRetirement1Year: (data: GraphDataPoint[]) => React.ReactNode;
  delayedRetirement5Years: (data: GraphDataPoint[]) => React.ReactNode;
  delayedBand: (minData: GraphDataPoint[], maxData: GraphDataPoint[]) => React.ReactNode;
  referenceLines: {
    depletion: (year: number | null) => React.ReactNode;
    retirement: (year: number | null) => React.ReactNode;
    target: (year: number | null) => React.ReactNode;
  };
}

interface TooltipData {
  active: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey?: string;
  }>;
  label?: string;
  coordinate?: { x: number; y: number };
}

interface MemoizedChartProps {
  data: GraphDataPoint[];
  onMouseMove: (data: any) => void;
  onMouseLeave: () => void;
  chartComponents: ChartComponents;
  chartSeries: ChartSeries;
  state: ChartState;
  activeTooltipData: TooltipData | null;
  currentAge: number;
  currentYear: number;
  formatAmount: FormatAmountFunction;
  zeroCapitalYear: number | null;
  retirementYear: number | null;
  targetAgeYear: number | null;
  gradients: React.ReactNode;
  params: SimulatorParams;
}

// Update MemoizedChart with new type
const MemoizedChart = React.memo<MemoizedChartProps>(({
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
  gradients,
  params
}) => {
  // Calculate delayed retirement data
  const delayedData1Year = useMemo(() => 
    calculateDelayedRetirementData(data, 1, params),
  [data, params]);

  const delayedData5Years = useMemo(() => 
    calculateDelayedRetirementData(data, 5, params),
  [data, params]);

  // Add comprehensive diagnostic logging to verify delayed retirement calculations
  useEffect(() => {
    if (!retirementYear || !data.length) return;
    
    console.group("🔍 Delayed Retirement Verification");
    console.log("----------------------------------------");
    console.log("Original retirement year:", retirementYear);
    
    // Find original retirement index and important values
    const origRetirementIdx = data.findIndex(point => point.retirement === "Yes");
    if (origRetirementIdx >= 0) {
      const origRetirement = data[origRetirementIdx];
      console.log("Original retirement point:", {
        index: origRetirementIdx,
        year: origRetirement.year,
        capital: origRetirement.capital,
        annualWithdrawal: origRetirement.annualWithdrawal,
        isRetired: origRetirement.retirement === "Yes"
      });
      
      // Verify 1-year delay
      const delay1YearIdx = delayedData1Year.findIndex(point => point.retirement === "Yes");
      if (delay1YearIdx >= 0) {
        const delay1YearPoint = delayedData1Year[delay1YearIdx];
        const expectedYear = origRetirement.year + 1;
        const yearCorrect = delay1YearPoint.year === expectedYear;
        
        console.log("1-year delayed retirement point:", {
          index: delay1YearIdx,
          year: delay1YearPoint.year,
          expectedYear,
          yearAlignmentCorrect: yearCorrect ? "✅" : "❌",
          capital: delay1YearPoint.capital,
          annualWithdrawal: delay1YearPoint.annualWithdrawal,
          isFullWithdrawal: delay1YearPoint.annualWithdrawal === Math.round(params.monthlyRetirementWithdrawal * 12)
        });
        
        // Check the "should-be-investing" year (original retirement year)
        const investmentYearIdx = delayedData1Year.findIndex(p => p.year === origRetirement.year);
        if (investmentYearIdx >= 0) {
          const investmentYear = delayedData1Year[investmentYearIdx];
          console.log("Original retirement year (now investment year in 1-year delay):", {
            year: investmentYear.year,
            isInvestment: investmentYear.retirement === "No" ? "✅" : "❌",
            annualInvestment: investmentYear.annualInvestment,
            annualWithdrawal: investmentYear.annualWithdrawal
          });
        }
      }
      
      // Verify 5-year delay
      const delay5YearIdx = delayedData5Years.findIndex(point => point.retirement === "Yes");
      if (delay5YearIdx >= 0) {
        const delay5YearPoint = delayedData5Years[delay5YearIdx];
        const expectedYear = origRetirement.year + 5;
        const yearCorrect = delay5YearPoint.year === expectedYear;
        
        console.log("5-year delayed retirement point:", {
          index: delay5YearIdx,
          year: delay5YearPoint.year,
          expectedYear,
          yearAlignmentCorrect: yearCorrect ? "✅" : "❌",
          capital: delay5YearPoint.capital,
          annualWithdrawal: delay5YearPoint.annualWithdrawal,
          isFullWithdrawal: delay5YearPoint.annualWithdrawal === Math.round(params.monthlyRetirementWithdrawal * 12)
        });
        
        // Check a middle year that should be investment (original year + 2)
        const midYearIdx = delayedData5Years.findIndex(p => p.year === origRetirement.year + 2);
        if (midYearIdx >= 0) {
          const midYear = delayedData5Years[midYearIdx];
          console.log("Mid-delay year check (original year + 2):", {
            year: midYear.year,
            isInvestment: midYear.retirement === "No" ? "✅" : "❌",
            annualInvestment: midYear.annualInvestment,
            annualWithdrawal: midYear.annualWithdrawal
          });
        }
      }
    }
    
    console.log("----------------------------------------");
    console.groupEnd();
    
    // Add detailed debugging for the delayed retirement data
    console.group("🔍 Delayed Retirement Data Samples");
    console.log("1-year delay, first 3 elements:", delayedData1Year.slice(0, 3));
    console.log("5-year delay, first 3 elements:", delayedData5Years.slice(0, 3));
    
    // Check if the banded data is being properly created
    const yearToDelayed1Capital = new Map<number, number>();
    const yearToDelayed5Capital = new Map<number, number>();
    
    delayedData1Year.forEach(point => {
      yearToDelayed1Capital.set(point.year, point.capital);
    });
    
    delayedData5Years.forEach(point => {
      yearToDelayed5Capital.set(point.year, point.capital);
    });
    
    const uniqueYears = new Set<number>([
      ...delayedData1Year.map(p => p.year),
      ...delayedData5Years.map(p => p.year)
    ]);
    
    console.log("Number of unique years:", uniqueYears.size);
    console.log("Sample years:", Array.from(uniqueYears).slice(0, 5));
    
    // Check if there are significant capital differences between 1-year and 5-year delays
    const sampleYear = delayedData1Year[10]?.year;
    if (sampleYear) {
      const capital1Year = yearToDelayed1Capital.get(sampleYear);
      const capital5Year = yearToDelayed5Capital.get(sampleYear);
      console.log(`Capital in year ${sampleYear}:`, {
        '1-year delay': capital1Year,
        '5-year delay': capital5Year,
        'difference': (capital5Year || 0) - (capital1Year || 0)
      });
    }
    
    console.groupEnd();
  }, [data, delayedData1Year, delayedData5Years, retirementYear, params.monthlyRetirementWithdrawal]);

  // Calculate capital with interest using calculateFutureValue
  const capitalWithInterest = useMemo(() => {
    const yearsToRetirement = retirementYear ? retirementYear - currentYear : 0;
    const capitalAtRetirement = calculateFutureValue(
      params.initialCapital,
      params.annualReturnRate,
      yearsToRetirement,
      params.monthlyInvestment,
      params.compoundFrequency
    );

    // Correct the calculation of the withdrawal for the first year of retirement
    const firstYearWithdrawal = params.monthlyRetirementWithdrawal * 12;

    // Adjust capital for the first year of retirement
    const adjustedCapital = capitalAtRetirement - firstYearWithdrawal;

    // Add console logs for debugging
    console.log("Years to Retirement:", yearsToRetirement);
    console.log("Capital at Retirement:", capitalAtRetirement);
    console.log("First Year Withdrawal:", firstYearWithdrawal);
    console.log("Adjusted Capital:", adjustedCapital);

    return adjustedCapital;
  }, [params, retirementYear, currentYear]);

  // Add a custom method to generate the banded data for delayed retirement
  const generateDelayedBandData = useCallback(() => {
    // New interface for delayed retirement data points
    interface BandedDelayedRetirementPoint {
      year: number;
      lowerCapital: number; // Lower of 1-year and 5-year capital
      upperCapital: number; // Higher of 1-year and 5-year capital
    }
    
    // Create mappings for each scenario by year
    const yearToDelayed1Capital = new Map<number, number>();
    const yearToDelayed5Capital = new Map<number, number>();
    
    // Populate the mappings
    delayedData1Year.forEach(point => {
      yearToDelayed1Capital.set(point.year, point.capital);
    });
    
    delayedData5Years.forEach(point => {
      yearToDelayed5Capital.set(point.year, point.capital);
    });
    
    // Get all unique years from both datasets
    const uniqueYears = new Set<number>();
    delayedData1Year.forEach(p => uniqueYears.add(p.year));
    delayedData5Years.forEach(p => uniqueYears.add(p.year));
    
    // Create the combined data structure
    const bandedData: BandedDelayedRetirementPoint[] = Array.from(uniqueYears)
      .sort((a, b) => a - b)
      .map(year => {
        const capital1Year = yearToDelayed1Capital.get(year) || 0;
        const capital5Year = yearToDelayed5Capital.get(year) || 0;
        
        return {
          year,
          lowerCapital: Math.min(capital1Year, capital5Year),
          upperCapital: Math.max(capital1Year, capital5Year)
        };
      });
      
    return bandedData;
  }, [delayedData1Year, delayedData5Years]);
  
  // Get the banded data
  const delayedBandData = useMemo(() => generateDelayedBandData(), [generateDelayedBandData]);

  // Enhanced method to render the delayed retirement visualization
  const renderDelayedRetirementChart = useCallback(() => {
    // Create custom data for the banded area
    interface BandedPoint {
      year: number;
      min: number;
      max: number;
    }
    
    // Create maps for easier data access
    const year1Map = new Map<number, number>();
    const year5Map = new Map<number, number>();
    
    delayedData1Year.forEach(point => year1Map.set(point.year, point.capital));
    delayedData5Years.forEach(point => year5Map.set(point.year, point.capital));
    
    // Get all years from both datasets
    const allYears = new Set<number>();
    delayedData1Year.forEach(p => allYears.add(p.year));
    delayedData5Years.forEach(p => allYears.add(p.year));
    
    // Create banded data array
    const bandedData: BandedPoint[] = Array.from(allYears)
      .sort((a, b) => a - b)
      .map(year => {
        // Get capital values for this year from both datasets
        const cap1 = year1Map.get(year) || 0;
        const cap5 = year5Map.get(year) || 0;
        
        return {
          year,
          min: Math.min(cap1, cap5),
          max: Math.max(cap1, cap5)
        };
      });
    
    return (
      <g clipPath="url(#delayedDataClip)" style={{ pointerEvents: 'none' }}>
        {/* Banded area between min and max capital values */}
        <Area
          type="monotone"
          data={bandedData}
          dataKey="max"
          stroke="none"
          fill={colors.status.info}
          fillOpacity={0.15}
          name="Delayed Retirement Range"
          isAnimationActive={false}
          tooltipType="none"
        />
        
        <Area
          type="monotone"
          data={bandedData}
          dataKey="min"
          stroke="none"
          fill={colors.status.info}
          fillOpacity={0}
          name=" "
          isAnimationActive={false}
          tooltipType="none"
        />
        
        {/* Individual lines for each delay scenario */}
        <Line
          type="monotone"
          data={delayedData5Years}
          dataKey="capital"
          stroke={colors.status.info}
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          name="Delayed 5 Years"
          isAnimationActive={false}
          activeDot={false}
          tooltipType="none"
        />
        
        <Line
          type="monotone"
          data={delayedData1Year}
          dataKey="capital"
          stroke={colors.status.info}
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          name="Delayed 1 Year"
          isAnimationActive={false}
          activeDot={false}
          tooltipType="none"
        />
      </g>
    );
  }, [delayedData1Year, delayedData5Years, colors.status.info]);

  return (
    <ResponsiveContainer width="100%" height={600}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, bottom: 35, left: 30 }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {gradients}
        
        {chartComponents.CartesianGrid}
        {chartComponents.XAxis}
        {chartComponents.YAxis}
        
        {/* Reference lines - render first so they're in the background */}
        {chartSeries.referenceLines.depletion(zeroCapitalYear)}
        {chartSeries.referenceLines.retirement(retirementYear)}
        {chartSeries.referenceLines.target(targetAgeYear)}
        
        {/* Delayed retirement visualization - middle layer */}
        <defs>
          {/* Add clipPath to ensure delayed data doesn't interfere with tooltips */}
          <clipPath id="delayedDataClip">
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
        </defs>
        <g clipPath="url(#delayedDataClip)">
          {/* Bounded area between delayed retirement scenarios - render with lower z-index */}
          {chartSeries.delayedBand(delayedData1Year, delayedData5Years)}
        </g>

        {/* Use our enhanced method for rendering the delayed retirement visualization */}
        {renderDelayedRetirementChart()}
        
        {/* Main series - render on top for better tooltip interaction */}
        {chartSeries.capital(state.visibleSeries.capital)}
        {chartSeries.capitalWithoutInterest(state.visibleSeries.capitalWithoutInterest)}
        
        {/* Enhanced tooltip with proper filtering */}
        <Tooltip
          cursor={{ 
            strokeDasharray: '3 3', 
            strokeOpacity: activeTooltipData?.payload?.some(entry => 
              entry.name?.includes("Delayed") || entry.name?.includes("Range")
            ) ? 0 : 0.8, // Hide cursor for delayed retirement data
            stroke: '#808080'
          }}
          content={
            <CustomTooltip 
              active={activeTooltipData?.active && 
                // Only show tooltip if it's not for delayed retirement data
                activeTooltipData.payload?.every(entry => 
                  !entry.name?.includes("Delayed") && 
                  !entry.name?.includes("Range")
                )}
              payload={activeTooltipData?.payload?.filter(entry => 
                (entry.name === "Capital with Interest" || 
                entry.name === "Initial Investment")
              )}
              label={activeTooltipData?.label}
              currentAge={currentAge} 
              currentYear={currentYear} 
              formatAmount={formatAmount}
            />
          }
          position={activeTooltipData?.coordinate}
          wrapperStyle={{ pointerEvents: 'none' }}
        />
        
        {/* Add cursor="default" to disable tooltips for delayed retirement data */}
        <Tooltip 
          cursor={{ 
            strokeDasharray: '3 3', 
            strokeOpacity: activeTooltipData?.payload?.some(entry => 
              entry.name?.includes("Delayed") || entry.name?.includes("Range")
            ) ? 0 : 0.8, // Hide cursor for delayed retirement data
            stroke: '#808080'
          }}
        />
        
        {chartComponents.Legend}
      </ComposedChart>
    </ResponsiveContainer>
  );
});

// Extract ChartLabel component
interface ChartLabelProps {
  type: 'depletion' | 'retirement' | 'target';
  label: string;
  rightOffset: number;
  horizontalPosition: number;
}

const ChartLabel = React.memo<ChartLabelProps>(({
  type,
  label,
  rightOffset,
  horizontalPosition
}) => {
  const getLabelColor = () => {
    switch (type) {
      case 'depletion':
        return colors.status.error;
      case 'retirement':
        return colors.status.info;
      case 'target':
        return colors.status.success;
      default:
        return colors.neutral[500];
    }
  };

  const getLabelIcon = () => {
    switch (type) {
      case 'depletion':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={colors.status.error} className="w-4 h-4">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
      case 'retirement':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={colors.status.info} className="w-4 h-4">
            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
          </svg>
        );
      case 'target':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={colors.status.success} className="w-4 h-4">
            <path d="M10 1a9 9 0 100 18 9 9 0 000-18zM8 10a2 2 0 114 0 2 2 0 01-4 0z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-3a5 5 0 100-10 5 5 0 000 10z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div
      className={cx(
        'absolute px-2 py-1 rounded-md shadow-md text-xs whitespace-nowrap backdrop-blur-sm bg-white/95 border flex items-center gap-1 font-semibold',
        `text-${getLabelColor()}`
      )}
      style={{
        top: '10%',
        right: `calc(${100 - horizontalPosition}% + ${rightOffset}px)`,
        maxWidth: '120px',
        textAlign: 'right',
        borderColor: getLabelColor(),
        zIndex: 10,
      }}
    >
      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">
        {getLabelIcon()}
      </span>
      {label}
    </div>
  );
});

// Extract ChartConnector component
interface ChartConnectorProps {
  type: 'depletion' | 'retirement' | 'target';
  horizontalPosition: number;
  rightOffset: number;
}

const ChartConnector = React.memo<ChartConnectorProps>(({
  type,
  horizontalPosition,
  rightOffset
}) => {
  const getConnectorColor = () => {
    switch (type) {
      case 'depletion':
        return colors.status.error;
      case 'retirement':
        return colors.status.info;
      case 'target':
        return colors.status.success;
      default:
        return colors.neutral[500];
    }
  };

  const lineX = `${horizontalPosition}%`;
  
  return (
    <line
      x1={lineX}
      y1="10%"
      x2={`calc(${lineX} - ${rightOffset}px)`}
      y2="10%"
      stroke={getConnectorColor()}
      strokeWidth="1.5"
      strokeDasharray="2,2"
    />
  );
});

// Add new helper function to calculate delayed retirement data
/**
 * Calculate capital evolution data for delayed retirement scenarios.
 * 
 * This function precisely simulates what happens when retirement is delayed by exactly
 * 1 or 5 calendar years, ensuring perfect calendar alignment with the original data.
 * 
 * The calculation preserves original data for years before the original retirement,
 * then applies the full investment period during the delay, and finally applies
 * full withdrawal periods after the new retirement date.
 * 
 * @param originalData Original graph data points
 * @param delayYears Number of years to delay retirement (typically 1 or 5)
 * @param params Simulator parameters
 * @returns Updated data with precisely delayed retirement
 */
const calculateDelayedRetirementData = (originalData: GraphDataPoint[], delayYears: number, params: SimulatorParams): GraphDataPoint[] => {
  // Create a complete copy of the original data as our starting point
  const delayedData = JSON.parse(JSON.stringify(originalData)) as GraphDataPoint[];
  
  // Find the original retirement year and index
  const originalRetirementIndex = originalData.findIndex(point => point.retirement === "Yes");
  if (originalRetirementIndex === -1) return delayedData; // No retirement point found
  
  const originalRetirementYear = originalData[originalRetirementIndex].year;
  const newRetirementYear = originalRetirementYear + delayYears;
  
  // Log key information for debugging
  console.log(`[Delay ${delayYears} years] Original retirement year: ${originalRetirementYear}, New retirement year: ${newRetirementYear}`);
  
  // Keep track of the adjusted capital
  let adjustedCapital = originalData[originalRetirementIndex].capital;

  // Get the monthly/annual rates
  const annualRateDecimal = params.annualReturnRate / 100;
  const monthlyReturn = params.compoundFrequency === 'monthly'
    ? (Math.pow(1 + annualRateDecimal, 1/12) - 1)
    : annualRateDecimal / 12;
  
  // Process each data point with year-based logic to ensure calendar consistency
  for (let i = 0; i < delayedData.length; i++) {
    const currentYear = delayedData[i].year;
    
    // For years before the original retirement, keep the original data
    if (currentYear < originalRetirementYear) {
      // No changes needed - keep original data
      continue;
    }
    
    // For years in the delay period, recalculate with continued investment
    if (currentYear >= originalRetirementYear && currentYear < newRetirementYear) {
      // Update retirement status during delay period
      delayedData[i].retirement = "No";
      
      // Calculate capital with continued investments
      if (params.compoundFrequency === 'monthly') {
        // Reset to match the previous year's ending capital if this is the start of a new year
        if (i > 0 && i === originalRetirementIndex) {
          adjustedCapital = delayedData[i-1].capital;
        }
        
        // Calculate monthly accrual for a full year
        let yearlyInterest = 0;
        for (let month = 0; month < 12; month++) {
          const monthlyInterest = adjustedCapital * monthlyReturn;
          yearlyInterest += monthlyInterest;
          adjustedCapital += monthlyInterest + params.monthlyInvestment;
        }
        
        // Update data point
        delayedData[i].capital = Math.round(adjustedCapital);
        delayedData[i].annualInvestment = Math.round(params.monthlyInvestment * 12);
        delayedData[i].annualWithdrawal = 0;
        delayedData[i].annualInterest = Math.round(yearlyInterest);
      } else {
        // Annual compounding
        // Reset to match the previous year's ending capital if this is the start of a new year
        if (i > 0 && i === originalRetirementIndex) {
          adjustedCapital = delayedData[i-1].capital;
        }
        
        // Add yearly investment
        const yearlyInvestment = params.monthlyInvestment * 12;
        adjustedCapital += yearlyInvestment;
        
        // Apply annual interest
        const yearlyInterest = adjustedCapital * annualRateDecimal;
        adjustedCapital += yearlyInterest;
        
        // Update data point
        delayedData[i].capital = Math.round(adjustedCapital);
        delayedData[i].annualInvestment = Math.round(yearlyInvestment);
        delayedData[i].annualWithdrawal = 0;
        delayedData[i].annualInterest = Math.round(yearlyInterest);
      }
      
      // Calculate variation
      if (i > 0) {
        delayedData[i].variation = delayedData[i].capital - delayedData[i-1].capital;
      }
    }
    
    // For years after the new retirement date
    if (currentYear >= newRetirementYear) {
      // Update retirement status after delay period
      delayedData[i].retirement = "Yes";
      
      // Calculate capital with withdrawals instead of investments
      if (params.compoundFrequency === 'monthly') {
        // For the first year of delayed retirement, we may need to reset the capital
        if (currentYear === newRetirementYear) {
          // Find the previous year to continue from its capital value
          const prevYearIndex = i - 1;
          if (prevYearIndex >= 0) {
            adjustedCapital = delayedData[prevYearIndex].capital;
          }
        }
        
        // Calculate monthly accrual for a full year
        let yearlyInterest = 0;
        for (let month = 0; month < 12; month++) {
          const monthlyInterest = adjustedCapital * monthlyReturn;
          yearlyInterest += monthlyInterest;
          adjustedCapital += monthlyInterest - params.monthlyRetirementWithdrawal;
        }
        
        // Ensure capital doesn't go negative
        adjustedCapital = Math.max(0, adjustedCapital);
        
        // Update data point
        delayedData[i].capital = Math.round(adjustedCapital);
        delayedData[i].annualInvestment = 0;
        delayedData[i].annualWithdrawal = Math.round(params.monthlyRetirementWithdrawal * 12);
        delayedData[i].annualInterest = Math.round(yearlyInterest);
      } else {
        // Annual compounding
        // For the first year of delayed retirement, we may need to reset the capital
        if (currentYear === newRetirementYear) {
          // Find the previous year to continue from its capital value
          const prevYearIndex = i - 1;
          if (prevYearIndex >= 0) {
            adjustedCapital = delayedData[prevYearIndex].capital;
          }
        }
        
        // Subtract yearly withdrawal
        const yearlyWithdrawal = params.monthlyRetirementWithdrawal * 12;
        adjustedCapital -= yearlyWithdrawal;
        
        // Apply annual interest
        const yearlyInterest = Math.max(0, adjustedCapital) * annualRateDecimal;
        adjustedCapital += yearlyInterest;
        
        // Ensure capital doesn't go negative
        adjustedCapital = Math.max(0, adjustedCapital);
        
        // Update data point
        delayedData[i].capital = Math.round(adjustedCapital);
        delayedData[i].annualInvestment = 0;
        delayedData[i].annualWithdrawal = Math.round(yearlyWithdrawal);
        delayedData[i].annualInterest = Math.round(yearlyInterest);
      }
      
      // Calculate variation
      if (i > 0) {
        delayedData[i].variation = delayedData[i].capital - delayedData[i-1].capital;
      }
    }
  }
  
  // After all calculations, verify the retirement transition years
  const newRetirementIndex = delayedData.findIndex(point => point.retirement === "Yes");
  if (newRetirementIndex >= 0) {
    console.log(`[Delay ${delayYears} years] First retirement point at index ${newRetirementIndex}, year ${delayedData[newRetirementIndex].year}`);
    console.log(`[Delay ${delayYears} years] Annual withdrawal for first retirement year: ${delayedData[newRetirementIndex].annualWithdrawal}`);
  }
  
  return delayedData;
};

export const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  currency,
  currentAge = 40,
  params,
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
  const isMobile = windowWidth < CHART_CONFIG.MOBILE_BREAKPOINT;
  
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

  // Use a component-level state to track tooltip visibility
  const [activeTooltipData, setActiveTooltipData] = useState<{
    active: boolean;
    payload?: any[];
    label?: string;
    coordinate?: { x: number; y: number };
  } | null>(null);

  // Enhanced tooltip payload filtering to prevent conflicts with delayed retirement data
  const filterTooltipPayload = useCallback((entries: Array<{ name: string; dataKey?: string; value: any; }>) => {
    // Only keep the main capital series and initial investment series
    return entries.filter(entry => 
      (entry.name === "Capital with Interest" || entry.name === "Initial Investment") &&
      !entry.name.includes("Delayed") &&
      !entry.name.includes("Range") &&
      entry.dataKey !== undefined
    );
  }, []);
  
  // Optimize tooltip data processing with better handling of delayed retirement data
  const processTooltipData = useCallback((data: any) => {
    if (!data?.activePayload?.length || !data.activeLabel) return null;
    
    // Check if we're hovering over delayed retirement data
    const isHoveringDelayedData = data.activePayload.some((entry: any) => 
      entry.name?.includes("Delayed") || 
      entry.name?.includes("Range")
    );
    
    // If hovering over delayed data, don't show a tooltip
    if (isHoveringDelayedData) return null;
    
    // Apply filtering to show only main capital series
    const mainPayload = filterTooltipPayload(data.activePayload);
    
    // Ensure we're getting unique entries by dataKey
    const uniquePayload = Array.from(
      new Set(mainPayload.map(entry => entry.dataKey))
    ).map(dataKey => 
      mainPayload.find(entry => entry.dataKey === dataKey)
    );
    
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

  // Calculate maxCapital including bounded chart data
  const maxCapital = useMemo((): number => {
    // Get max from main capital data
    const mainMax = Math.max(...graphData.map(d => d.capital));
    
    // Calculate delayed retirement data
    const delayedData1Year = calculateDelayedRetirementData(graphData, 1, params);
    const delayedData5Years = calculateDelayedRetirementData(graphData, 5, params);
    
    // Get max from delayed retirement data
    const delayedMax1 = Math.max(...delayedData1Year.map(d => d.capital));
    const delayedMax5 = Math.max(...delayedData5Years.map(d => d.capital));
    
    // Use the highest value among all datasets and add 10% padding
    return Math.max(mainMax, delayedMax1, delayedMax5) * 1.1;
  }, [graphData, params]);

  // Update y-axis ticks calculation
  const yAxisTicks = useMemo(() => {
    if (!Number.isFinite(maxCapital) || maxCapital <= 0) {
      return [0];
    }

    // Calculate nice round numbers for ticks
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxCapital / 6))); // Target ~6 ticks
    const roundedMax = Math.ceil(maxCapital / magnitude) * magnitude;
    const step = magnitude;
    
    const ticks: number[] = [];
    for (let tick = 0; tick <= roundedMax; tick += step) {
      ticks.push(tick);
    }
    
    return ticks;
  }, [maxCapital]);

  // Memoize chart series with proper dependency array
  const chartSeries = useMemo(() => ({
    capital: (visible: boolean) => visible && (
      <Area
        type="monotone"
        dataKey="capital"
        stroke={colors.primary[600]}
        fill="url(#capitalGradient)"
        name="Capital with Interest"
        strokeWidth={CHART_CONFIG.SERIES.CAPITAL.STROKE_WIDTH}
        dot={false}
        activeDot={{ 
          r: CHART_CONFIG.SERIES.CAPITAL.DOT_RADIUS, 
          fill: colors.primary[600], 
          stroke: CHART_CONFIG.SERIES.CAPITAL.DOT_STROKE_COLOR, 
          strokeWidth: CHART_CONFIG.SERIES.CAPITAL.DOT_STROKE_WIDTH 
        }}
        isAnimationActive={false}
      />
    ),
    capitalWithoutInterest: (visible: boolean) => visible && (
      <Line
        type="monotone"
        dataKey="capitalWithoutInterest"
        stroke={colors.neutral[400]}
        name="Initial Investment"
        strokeWidth={CHART_CONFIG.SERIES.DELAYED.STROKE_WIDTH}
        strokeDasharray="4 4"
        dot={false}
        isAnimationActive={false}
      />
    ),
    delayedRetirement1Year: (data: GraphDataPoint[]) => (
      <Line
        type="monotone"
        data={data}
        dataKey="capital"
        stroke={colors.status.info}
        name="Delayed 1 Year"
        strokeWidth={1}
        strokeDasharray="4 4"
        dot={false}
        isAnimationActive={false}
        opacity={0.6}
        activeDot={false}
        tooltipType="none"
      />
    ),
    delayedRetirement5Years: (data: GraphDataPoint[]) => (
      <Line
        type="monotone"
        data={data}
        dataKey="capital"
        stroke={colors.status.info}
        name="Delayed 5 Years"
        strokeWidth={1}
        strokeDasharray="4 4"
        dot={false}
        isAnimationActive={false}
        opacity={0.6}
        activeDot={false}
        tooltipType="none"
      />
    ),
    delayedBand: (minData: GraphDataPoint[], maxData: GraphDataPoint[]) => {
      // Create combined data for the bounded area with proper typing
      interface BandedDelayedPoint extends GraphDataPoint {
        min: number;
        max: number;
      }
      
      const bandedData = minData.map((point, index): BandedDelayedPoint => ({
        ...point,
        min: point.capital,
        max: maxData[index]?.capital || point.capital
      }));
      
      return (
        <>
          <Area
            type="monotone"
            data={bandedData}
            dataKey="max"
            fill={colors.status.info}
            fillOpacity={0.1}
            stroke="none"
            name="Delayed Retirement Range"
            isAnimationActive={false}
            activeDot={false}
            tooltipType="none"
          />
          <Area
            type="monotone"
            data={bandedData}
            dataKey="min"
            fill={colors.status.info}
            fillOpacity={0}
            stroke="none"
            name=" "
            isAnimationActive={false}
            activeDot={false}
            tooltipType="none"
          />
        </>
      );
    },
    referenceLines: {
      depletion: (year: number | null) => year && (
        <ReferenceLine
          x={year}
          stroke={colors.status.error}
          strokeWidth={CHART_CONFIG.SERIES.REFERENCE_LINE.STROKE_WIDTH}
          ifOverflow="extendDomain"
          strokeDasharray={CHART_CONFIG.SERIES.REFERENCE_LINE.DASH_ARRAY.DEPLETION}
          isFront={true}
        />
      ),
      retirement: (year: number | null) => year && (
        <ReferenceLine
          x={year}
          stroke={colors.status.info}
          strokeWidth={CHART_CONFIG.SERIES.REFERENCE_LINE.STROKE_WIDTH}
          ifOverflow="extendDomain"
          strokeDasharray={CHART_CONFIG.SERIES.REFERENCE_LINE.DASH_ARRAY.RETIREMENT}
          isFront={true}
        />
      ),
      target: (year: number | null) => year && (
        <ReferenceLine
          x={year}
          stroke={colors.status.success}
          strokeWidth={CHART_CONFIG.SERIES.REFERENCE_LINE.STROKE_WIDTH}
          ifOverflow="extendDomain"
          isFront={true}
        />
      )
    }
  }), []);

  // Update tick calculations to handle null values
  const xAxisTicks = useMemo(() => {
    // Get the current year as fallback
    const startYear = currentYear;
    const endYear = currentYear + 30;

    const ticks = new Set<number>();
    const step = isMobile ? 10 : 2;
    
    // Add min and max years
    ticks.add(startYear);
    ticks.add(endYear);
    
    // Add important years if they exist
    if (isMobile) {
      if (retirementYear) {
        ticks.add(retirementYear);
      }
    } else {
      [retirementYear, zeroCapitalYear, targetAgeYear].forEach(year => {
        if (year) {
          ticks.add(year);
        }
      });
    }
    
    // Add regular interval ticks
    for (let year = startYear; year <= endYear; year += step) {
      if (ticks.size >= (isMobile ? 6 : 50)) break;
      ticks.add(year);
    }
    
    return Array.from(ticks).sort((a, b) => a - b);
  }, [currentYear, retirementYear, zeroCapitalYear, targetAgeYear, isMobile]);

  // Memoize chart components with optimized dependencies
  const chartComponents = useMemo(() => ({
    CartesianGrid: <CartesianGrid 
      strokeDasharray={CHART_CONFIG.GRID.DASH_ARRAY} 
      stroke={CHART_CONFIG.GRID.STROKE} 
    />,
    Legend: <Legend 
      iconType="circle" 
      wrapperStyle={{ 
        paddingTop: CHART_CONFIG.LEGEND.PADDING_TOP, 
        fontSize: CHART_CONFIG.LEGEND.FONT_SIZE 
      }} 
    />,
    XAxis: (
      <XAxis 
        dataKey="year" 
        tick={{ 
          fill: colors.neutral[600], 
          fontSize: isMobile ? CHART_CONFIG.AXIS.FONT_SIZE.MOBILE : CHART_CONFIG.AXIS.FONT_SIZE.DESKTOP 
        }}
        tickMargin={2}
        domain={['dataMin', 'dataMax']}
        type="number"
        allowDecimals={false}
        tickFormatter={(value) => `${value}`}
        allowDataOverflow={false}
        interval={0}
        ticks={graphData.map(d => d.year).filter((_, i) => i % (isMobile ? 3 : 2) === 0)}
        angle={-45}
        textAnchor="end"
        height={35}
        dy={0}
        dx={-2}
      />
    ),
    YAxis: (
      <YAxis 
        domain={[0, maxCapital]}
        tickFormatter={(value: number) => {
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
          }
          return `${(value / 1000).toFixed(0)}k`;
        }}
        tick={{ 
          fill: colors.neutral[600], 
          fontSize: CHART_CONFIG.AXIS.FONT_SIZE.DESKTOP 
        }}
        tickMargin={CHART_CONFIG.AXIS.TICK_MARGIN.DESKTOP}
        width={CHART_CONFIG.AXIS.Y_WIDTH}
        allowDataOverflow={false}
        ticks={yAxisTicks}
      />
    )
  }), [currentYear, isMobile, maxCapital, xAxisTicks, yAxisTicks]);

  // Update gradients to remove delayed gradient
  const gradients = (
    <defs>
      {/* Capital with interest gradient */}
      <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={colors.primary[600]} stopOpacity={0.9} />
        <stop offset="40%" stopColor={colors.primary[500]} stopOpacity={0.6} />
        <stop offset="80%" stopColor={colors.primary[400]} stopOpacity={0.3} />
        <stop offset="100%" stopColor={colors.primary[300]} stopOpacity={0.1} />
      </linearGradient>
      {/* Filter for glow effects */}
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  // Update dynamic height calculation with additional space for labels
  const chartHeight = useMemo(() => {
    const maxValue = Math.max(...graphData.map(d => d.capital));
    // Base height is 350, increase by 75px for every 500k in value, max at 650px
    // Increased base and max height to provide more space for labels
    return Math.min(650, Math.max(350, 350 + Math.floor(maxValue / 500000) * 75));
  }, [graphData]);

  return (
    <Card className={cx(
      spacing.margin.xl,
      'bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-10 overflow-visible'
    )}>
      <style>
        {CHART_ANIMATIONS.PULSE_SUBTLE}
      </style>
      
      <div className={cx(spacing.margin.md, 'sm:mb-10')}>
        {/* Header section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gradient mb-3">Capital Evolution</h2>
          <p className={typography.style.subtitle}>
            Track how your investments grow over time and visualize your retirement journey.
          </p>
        </div>
      </div>
      
      <div className="relative -mx-2 sm:mx-0 overflow-visible pb-32" style={{ 
        maxHeight: `${chartHeight + 120}px`,
        height: 'auto',
        marginBottom: '60px'
      }}>
        <MemoizedChart
          data={graphData}
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
          params={params}
        />
        
        {/* Overlay absolute positioned labels with improved positioning */}
        <div className="absolute inset-0 top-0 bottom-8 pointer-events-none" style={{ zIndex: 10 }}>
          {labelPositions.data.map((item) => (
            <ChartLabel
              key={item.type}
              type={item.type}
              label={item.label}
              rightOffset={item.rightOffset}
              horizontalPosition={item.horizontalPosition!}
            />
          ))}
          
          <svg className="absolute inset-0 top-0 bottom-8 pointer-events-none" style={{ overflow: 'visible' }}>
            {labelPositions.data.map((item) => (
              <ChartConnector
                key={`${item.type}-connector`}
                type={item.type}
                horizontalPosition={item.horizontalPosition!}
                rightOffset={item.rightOffset}
              />
            ))}
          </svg>
        </div>
      </div>
    </Card>
  );
};

export default CapitalEvolutionChart; 