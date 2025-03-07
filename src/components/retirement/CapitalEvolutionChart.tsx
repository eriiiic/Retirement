import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faTriangleExclamation, faBullseye } from '@fortawesome/free-solid-svg-icons';
import { GraphDataPoint, FormatAmountFunction, Statistics, Currency, SimulatorParams } from './types';
import { colors, components, typography, cx } from '../../styles/styleGuide';
import { 
  calculateFutureValue, 
  calculateDelayedScenario, 
  formatChartValue, 
  findRetirementStartIndex, 
  findCapitalWithdrawalDecreaseYear,
  calculateDelayedRetirementImpact
} from '../../utils/financialCalculations';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  statistics: Statistics;
  currency: Currency;
  currentAge: number;
  annualReturnRate: number;
  params: SimulatorParams;
}

interface LabelProps {
  viewBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: string;
  color: string;
}

interface TooltipPayload {
  dataKey: string;
  value: number;
  payload: GraphDataPoint & {
    capitalMin?: number;
    capital2Year?: number;
    capital3Year?: number;
    capital4Year?: number;
    capitalMax?: number;
    currency: Currency;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

// Constants
const DEFAULT_SELECTED_DELAYS = [1, 5];

// CSS Classes
const TOOLTIP_STYLES = {
  container: cx(
    'p-3 sm:p-4 bg-white border border-gray-200 rounded-lg',
    'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]',
    'min-w-[240px] sm:min-w-[280px] max-w-[90vw] sm:max-w-[320px]'
  ),
  header: 'flex items-center justify-between mb-2 sm:mb-3 pb-2 border-b border-gray-200',
  yearAge: 'text-xs sm:text-sm font-medium text-gray-600',
  age: 'font-bold',
  phase: 'px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-xs font-semibold border-[1.5px]',
  mainCapital: 'text-xs sm:text-sm font-bold mb-1 sm:mb-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
  capitalValue: 'text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
  investmentInfo: 'text-xs sm:text-sm font-medium text-gray-600 mb-1',
  investmentValue: 'text-sm sm:text-base font-semibold text-gray-800',
  delayedSection: 'mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200',
  delayedTitle: 'text-[10px] sm:text-[11px] uppercase font-semibold text-gray-500 tracking-wider mb-1 sm:mb-2',
  delayedItem: 'flex justify-between items-center',
  delayedLabel: 'text-[10px] sm:text-[11px] font-medium text-gray-500',
  delayedValue: 'text-[10px] sm:text-xs font-semibold text-gray-700'
};

// Chart Configuration
const CHART_CONFIG = {
  HEIGHT: 400,
  MARGINS: { top: 20, right: 30, left: 20, bottom: 5 },
  STROKE_WIDTHS: {
    MAIN: 3,
    REFERENCE: 2,
  },
};

const CustomLabel: React.FC<LabelProps> = ({ viewBox, text, color }) => {
  const icon = getIconForLabel(text);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
  const labelWidth = isSmallScreen ? 70 : 100; // Smaller width on mobile
  
  return (
    <g>
      <foreignObject x={viewBox.x - labelWidth + 4} y={viewBox.y + 4} width={labelWidth} height={40}>
        <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm sm:shadow-md" 
            style={{ 
              borderWidth: isSmallScreen ? 1 : 2, 
              borderStyle: 'solid', 
              borderColor: color,
              fontSize: isSmallScreen ? '9px' : '12px'
            }}>
          <FontAwesomeIcon icon={icon} className="text-[9px] sm:text-sm" style={{ color }} />
          <span className="text-[9px] sm:text-xs font-semibold whitespace-nowrap" style={{ color }}>{text}</span>
        </div>
      </foreignObject>
    </g>
  );
};

// Move formatWithCurrency outside the component
const formatWithCurrency = (amount: number | undefined, tooltipCurrency: Currency) => {
  if (amount === undefined || amount === null) return '';
  
  // Round the amount to remove decimals
  const roundedAmount = Math.round(amount);
  
  // Format the amount based on currency locale
  let formattedAmount;
  if (tooltipCurrency === 'EUR') {
    // Use European formatting (spaces for thousands)
    formattedAmount = roundedAmount.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    });
  } else {
    // Use standard formatting for other currencies
    formattedAmount = roundedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true
    });
  }
  
  // Add currency symbol based on currency type
  switch (tooltipCurrency) {
    case 'USD':
      return `$ ${formattedAmount}`;
    case 'EUR':
      return `${formattedAmount} €`;
    case 'GBP':
      return `£ ${formattedAmount}`;
    case 'JPY':
      return `¥ ${formattedAmount}`;
    default:
      return formattedAmount;
  }
};

// Move CustomTooltip outside the main component
const CustomTooltip: React.FC<CustomTooltipProps & { currency: Currency }> = React.memo(({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    const mainCapital = payload.find((p) => p.dataKey === 'capital')?.value || 0;
    const capitalInvested = payload.find((p) => p.dataKey === 'capitalWithoutInterest')?.value;
    const age = payload[0]?.payload.age || 0;
    const isRetirementPhase = payload[0]?.payload.retirement === "Yes";
    const isCapitalZero = mainCapital <= 0;
    const tooltipCurrency = payload[0]?.payload.currency as Currency || currency;
    
    // For smaller screens, only show selected delayed scenarios to save space
    const { capitalMin, capital2Year, capital3Year, capital4Year, capitalMax } = payload[0]?.payload || {};
    const isMobile = window.innerWidth < 640; // Detect mobile screen
    
    return (
      <div className={TOOLTIP_STYLES.container}>
        {/* Header */}
        <div className={TOOLTIP_STYLES.header}>
          <div>
            <p className={TOOLTIP_STYLES.yearAge}>
              Year {label} · <span className={cx(TOOLTIP_STYLES.age, isCapitalZero ? 'text-red-600' : 'text-gray-900')}>Age {age}</span>
            </p>
          </div>
          <div className={cx(TOOLTIP_STYLES.phase, isRetirementPhase ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-blue-50 text-blue-800 border-blue-200')}>
            {isRetirementPhase ? 'Retirement' : 'Investment'}
          </div>
        </div>

        {/* Main Capital Section */}
        <div className="space-y-2 sm:space-y-3">
          <div>
            <p className={TOOLTIP_STYLES.mainCapital}>
              Capital with interests
            </p>
            <p className={TOOLTIP_STYLES.capitalValue}>
              {formatWithCurrency(mainCapital, tooltipCurrency)}
            </p>
          </div>

          {/* Investment Phase Info - Only show on non-mobile or if retirement phase */}
          {(!isMobile || !isRetirementPhase) && capitalInvested !== null && capitalInvested !== undefined && (
            <div>
              <p className={TOOLTIP_STYLES.investmentInfo}>
                Capital invested
              </p>
              <p className={TOOLTIP_STYLES.investmentValue}>
                {formatWithCurrency(capitalInvested, tooltipCurrency)}
              </p>
            </div>
          )}

          {/* Delayed Retirement Section - Simplified for mobile */}
          {(capitalMin !== undefined || capital2Year !== undefined || capital3Year !== undefined || 
            capital4Year !== undefined || capitalMax !== undefined) && (
            <div className={TOOLTIP_STYLES.delayedSection}>
              <p className={TOOLTIP_STYLES.delayedTitle}>
                {isMobile ? "Delayed Scenarios" : "Delayed Retirement Scenarios"}
              </p>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { delay: 1, value: capitalMin, label: '+1 year' },
                  { delay: 2, value: capital2Year, label: '+2 years' },
                  { delay: 3, value: capital3Year, label: '+3 years' },
                  { delay: 5, value: capitalMax, label: '+5 years' }
                ].filter(({ value, delay }) => {
                  // On mobile, only show a subset of values
                  if (isMobile) {
                    return (delay === 1 || delay === 5) && value !== undefined;
                  }
                  return value !== undefined;
                }).map(({ delay, value, label }) => (
                  <div key={delay} className={TOOLTIP_STYLES.delayedItem}>
                    <p className={TOOLTIP_STYLES.delayedLabel}>
                      {label}
                    </p>
                    <p className={TOOLTIP_STYLES.delayedValue}>
                      {value !== undefined ? formatWithCurrency(value, tooltipCurrency) : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
});

const getIconForLabel = (text: string) => {
  switch (text) {
    case 'Depleted':
      return faTriangleExclamation;
    case 'Target':
      return faBullseye;
    default:
      return faBriefcase;
  }
};

const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  statistics,
  currency,
  currentAge,
  annualReturnRate,
  params
}) => {
  const [selectedDelays, setSelectedDelays] = useState<number[]>(DEFAULT_SELECTED_DELAYS);

  const targetYear = useMemo(() => 
    new Date().getFullYear() + (statistics.lifeExpectancy - currentAge),
    [statistics.lifeExpectancy, currentAge]
  );

  // Calculate data for delayed retirement scenarios
  const delayedRetirementData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const retirementYear = statistics.calculatedRetirementStartYear;
    
    // Initialize scenario states - use an array instead of separate objects
    const scenarios = Array.from({ length: 5 }, () => ({
      capital: params.initialCapital,
      investment: params.monthlyInvestment,
      withdrawal: params.monthlyRetirementWithdrawal
    }));
    
    return graphData.map((point, index) => {
      const yearIndex = point.year - currentYear;
      
      if (yearIndex < 0) {
        return {
          ...point,
          capitalMin: point.capital,
          capital2Year: point.capital,
          capital3Year: point.capital,
          capital4Year: point.capital,
          capitalMax: point.capital
        };
      }

      // Calculate all scenarios in a loop instead of separate calculations
      // Note: We're using calculateDelayedScenario directly here instead of calculateDelayedRetirementImpact
      // because we need to track the capital value at each year for the chart, not just the final values.
      // However, the calculation methodology is identical to what's used in calculateDelayedRetirementImpact.
      const delayValues = [];
      for (let i = 0; i < 5; i++) {
        const delayYears = i + 1;
        const scenario = calculateDelayedScenario(
          scenarios[i].capital,
          scenarios[i].investment,
          scenarios[i].withdrawal,
          retirementYear,
          delayYears,
          point.year,
          annualReturnRate,
          params.inflation
        );
        scenarios[i] = scenario;
        delayValues.push(Math.max(0, Math.round(scenario.capital)));
      }
      
      return {
        ...point,
        capitalMin: delayValues[0],
        capital2Year: delayValues[1],
        capital3Year: delayValues[2],
        capital4Year: delayValues[3],
        capitalMax: delayValues[4]
      };
    });
  }, [
    graphData,
    statistics.calculatedRetirementStartYear,
    annualReturnRate,
    params.initialCapital,
    params.monthlyInvestment,
    params.monthlyRetirementWithdrawal,
    params.inflation
  ]);

  // Prepare data with investment phase only for capitalWithoutInterest
  const chartData = useMemo(() => {
    return delayedRetirementData.map(point => ({
      ...point,
      // Only keep capitalWithoutInterest during investment phase and set to null during retirement
      capitalWithoutInterest: point.retirement === "No" ? point.capitalWithoutInterest : null
    }));
  }, [delayedRetirementData]);

  // Format Y-axis ticks
  const formatYAxis = (value: number): string => {
    return formatChartValue(value);
  };

  // Calculate retirement phase for gradient
  const retirementStartIndex = useMemo(() => {
    return findRetirementStartIndex(graphData);
  }, [graphData]);

  // Find first year when capital starts decreasing
  const firstCapitalWithdrawalDecreaseYear = useMemo(() => {
    return findCapitalWithdrawalDecreaseYear(graphData);
  }, [graphData]);

  // Get max Y value for chart
  const maxYValue = useMemo(() => {
    if (!graphData.length) return 'auto';
    
    // Find the main capital value at retirement year
    const retirementYear = statistics.calculatedRetirementStartYear;
    const retirementPoint = graphData.find(point => point.year === retirementYear);
    
    if (!retirementPoint?.capital) return 'auto';

    // Calculate the absolute maximum cap (retirement capital + 40%)
    const maxAllowedValue = retirementPoint.capital * 1.4;

    // Find the current maximum value across all visible data
    const currentMaxValue = Math.max(
      ...chartData.map(point => {
        const values = [point.capital];
        // Only include delayed retirement values if they are selected
        if (selectedDelays.includes(1) && point.capitalMin !== undefined) values.push(point.capitalMin);
        if (selectedDelays.includes(2) && point.capital2Year !== undefined) values.push(point.capital2Year);
        if (selectedDelays.includes(3) && point.capital3Year !== undefined) values.push(point.capital3Year);
        if (selectedDelays.includes(4) && point.capital4Year !== undefined) values.push(point.capital4Year);
        if (selectedDelays.includes(5) && point.capitalMax !== undefined) values.push(point.capitalMax);
        return Math.max(...values);
      })
    );

    // Add 10% padding to the current maximum for better visualization
    const paddedCurrentMax = currentMaxValue * 1.1;

    // Return the smaller of the padded current maximum or the absolute cap
    return Math.min(paddedCurrentMax, maxAllowedValue);
  }, [graphData, statistics.calculatedRetirementStartYear, chartData, selectedDelays]);

  // Generate custom ticks for Y-axis with mobile optimization
  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const maxVal = typeof maxYValue === 'number' ? maxYValue : 0; // Ensure maxYValue is a number
    
    // Check if we're on a small screen
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    
    // Use larger intervals on mobile screens to show fewer ticks
    const interval = isSmallScreen ? 500000 : 250000;
    
    for (let i = 0; i <= maxVal; i += interval) {
      ticks.push(i);
    }
    
    // For mobile, we might want to limit the number of ticks further
    if (isSmallScreen && ticks.length > 5) {
      // Keep only every other tick to reduce density
      return ticks.filter((_, index) => index % 2 === 0);
    }
    
    return ticks;
  }, [maxYValue]);

  const getPositiveDelays = useMemo(() => {
    if (!graphData.length) return new Set<number>();
    const finalDataPoint = chartData.find(point => point.year === targetYear);
    
    if (!finalDataPoint) return new Set<number>();
    
    const positiveDelays = new Set<number>();
    
    if (finalDataPoint.capitalMin > 0) positiveDelays.add(1);
    if (finalDataPoint.capital2Year > 0) positiveDelays.add(2);
    if (finalDataPoint.capital3Year > 0) positiveDelays.add(3);
    if (finalDataPoint.capital4Year > 0) positiveDelays.add(4);
    if (finalDataPoint.capitalMax > 0) positiveDelays.add(5);
    
    return positiveDelays;
  }, [chartData, targetYear]);

  // Helper function to render delayed retirement scenario areas
  const renderDelayedScenarioAreas = () => {
    const areas = [];
    // Render in reverse order to ensure proper layering (5 to 1)
    for (let i = 5; i >= 1; i--) {
      if (selectedDelays.includes(i)) {
        const dataKey = i === 5 
          ? "capitalMax" 
          : i === 4 
            ? "capital4Year" 
            : i === 3 
              ? "capital3Year" 
              : i === 2 
                ? "capital2Year" 
                : "capitalMin";
                
        if (chartData.some(d => d[dataKey] !== undefined)) {
          areas.push(
            <Area
              key={`delay-${i}`}
              type="monotone"
              dataKey={dataKey}
              stroke="none"
              fill="url(#bandedAreaGradient)"
              fillOpacity={1}
              legendType="none"
              animationDuration={0}
            />
          );
        }
      }
    }
    return areas;
  };

  // Helper function to render reference lines
  const renderReferenceLines = () => {
    // Helper to determine if we're on a small screen
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
    const strokeWidth = isSmallScreen ? 1.5 : 2;
    const labelPosition = isSmallScreen ? -3 : -5;
    
    return (
      <>
        {/* Reference line for last year before retirement */}
        <ReferenceLine
          x={statistics.calculatedRetirementStartYear - 1}
          stroke="#3B82F6"
          strokeDasharray={isSmallScreen ? "2 2" : "3 3"}
          strokeWidth={strokeWidth}
        >
          <Label
            content={({ viewBox }) => {
              const vb = viewBox as { x: number; y: number; width: number; height: number };
              return (
                <CustomLabel
                  viewBox={{
                    x: vb.x + labelPosition,
                    y: vb.y,
                    width: vb.width,
                    height: vb.height
                  }}
                  text="Retired"
                  color="#3B82F6"
                />
              );
            }}
          />
        </ReferenceLine>

        {/* Reference line for capital withdrawal decrease */}
        {firstCapitalWithdrawalDecreaseYear && (
          <ReferenceLine
            x={firstCapitalWithdrawalDecreaseYear - 1}
            stroke="#EF4444"
            strokeWidth={strokeWidth}
          >
            <Label
              content={({ viewBox }) => {
                const vb = viewBox as { x: number; y: number; width: number; height: number };
                return (
                  <CustomLabel
                    viewBox={{
                      x: vb.x + labelPosition,
                      y: vb.y,
                      width: vb.width,
                      height: vb.height
                    }}
                    text="Depleted"
                    color="#EF4444"
                  />
                );
              }}
            />
          </ReferenceLine>
        )}

        {/* Reference line for target age */}
        {statistics.lifeExpectancy && currentAge && (
          <ReferenceLine
            x={new Date().getFullYear() + (statistics.lifeExpectancy - currentAge)}
            stroke="#22C55E"
            strokeWidth={strokeWidth}
          >
            <Label
              content={({ viewBox }) => {
                const vb = viewBox as { x: number; y: number; width: number; height: number };
                return (
                  <CustomLabel
                    viewBox={{
                      x: vb.x + labelPosition,
                      y: vb.y,
                      width: vb.width,
                      height: vb.height
                    }}
                    text="Target"
                    color="#22C55E"
                  />
                );
              }}
            />
          </ReferenceLine>
        )}
      </>
    );
  };

  // Helper function to render gradient definitions 
  const renderGradientDefs = () => {
    return (
      <defs>
        <linearGradient id="capitalGradient" x1="0" y1="0" x2="1" y2="0">
          <stop
            offset={`${(retirementStartIndex / graphData.length) * 100}%`}
            stopColor={colors.primary[600]}
          />
          <stop
            offset={`${(retirementStartIndex / graphData.length) * 100}%`}
            stopColor={colors.secondary[600]}
          />
        </linearGradient>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={colors.primary[500]}
            stopOpacity={0.25}
          />
          <stop
            offset="100%"
            stopColor={colors.primary[500]}
            stopOpacity={0.05}
          />
        </linearGradient>
        <linearGradient id="bandedAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={colors.secondary[500]}
            stopOpacity={0.08}
          />
          <stop
            offset="100%"
            stopColor={colors.secondary[500]}
            stopOpacity={0.01}
          />
        </linearGradient>
      </defs>
    );
  };

  return (
    <div className="bg-gray-50 p-4 rounded-2xl shadow-md border border-gray-200 w-full max-w-full">
      {/* Header with title and scenario selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
        <div className="flex-1 w-full">
          <h2 className="text-xl font-semibold text-gradient mb-1 sm:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Capital Evolution
          </h2>
          <p className={cx(typography.style.subtitle, "sm:pl-7")}>Visualize your wealth growth over time, including compound interest gains.</p>
        </div>
        
        <div className="w-full sm:w-auto">
          <p className="text-xs text-gray-600 font-medium mb-1 sm:hidden">Delayed retirement scenarios:</p>
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className={cx(typography.size.sm, "text-gray-600 hidden sm:inline")}>Delayed retirement:</span>
            <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto rounded-lg shadow-sm">
              {[1, 2, 3, 4, 5].map((delay, index) => {
                const isPositive = getPositiveDelays.has(delay);
                return (
                  <button
                    key={delay}
                    onClick={() => {
                      setSelectedDelays(prev => 
                        prev.includes(delay) 
                          ? prev.filter(d => d !== delay)
                          : [...prev, delay].sort()
                      );
                    }}
                    className={cx(
                      'flex-1 sm:flex-none px-2 sm:px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                      'border-y border-r first:border-l first:rounded-l-lg last:rounded-r-lg',
                      selectedDelays.includes(delay)
                        ? isPositive
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-transparent'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
                      index > 0 && selectedDelays.includes(delay) && selectedDelays.includes(delay - 1) && '-ml-[1px]'
                    )}
                  >
                    +{delay}y
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 5, bottom: 5, ...{ sm: { top: 20, right: 30, left: 20, bottom: 5 } } }}
          >
            {renderGradientDefs()}
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
            <XAxis
              dataKey="year"
              stroke={colors.neutral[600]}
              tick={{ fill: colors.neutral[600], fontSize: 10 }}
              tickMargin={5}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke={colors.neutral[600]}
              tick={{ fill: colors.neutral[600], fontSize: 10 }}
              domain={[0, maxYValue]}
              allowDataOverflow={true}
              ticks={yAxisTicks}
              width={30}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: '10px' }} />
            
            {renderReferenceLines()}
            {renderDelayedScenarioAreas()}

            <Area
              type="monotone"
              dataKey="capital"
              name="Capital with interests"
              stroke="url(#capitalGradient)"
              strokeWidth={3}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{ r: 6, fill: colors.primary[600] }}
              animationDuration={0}
            />
            <Area
              type="monotone"
              dataKey="capitalWithoutInterest"
              name="Capital invested"
              stroke={colors.neutral[400]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              fill="none"
              activeDot={{ r: 6, fill: colors.neutral[600] }}
              connectNulls={false}
              animationDuration={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CapitalEvolutionChart; 