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
import { GraphDataPoint, FormatAmountFunction, Statistics, Currency } from './types';
import { colors, components, typography, cx } from '../../styles/styleGuide';
import { calculateFutureValue } from '../../utils/financialCalculations';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  statistics: Statistics;
  currency: Currency;
  currentAge: number;
  annualReturnRate: number;
  params: any;
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
    'p-4 bg-white border border-gray-200 rounded-lg',
    'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]',
    'min-w-[280px]'
  ),
  header: 'flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200',
  yearAge: 'text-sm font-medium text-gray-600',
  age: 'font-bold',
  phase: 'px-2.5 py-1 rounded text-xs font-semibold border-[1.5px]',
  mainCapital: 'text-sm font-bold mb-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
  capitalValue: 'text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
  investmentInfo: 'text-sm font-medium text-gray-600 mb-1',
  investmentValue: 'text-base font-semibold text-gray-800',
  delayedSection: 'mt-3 pt-3 border-t border-gray-200',
  delayedTitle: 'text-[11px] uppercase font-semibold text-gray-500 tracking-wider mb-2',
  delayedItem: 'flex justify-between items-center',
  delayedLabel: 'text-[11px] font-medium text-gray-500',
  delayedValue: 'text-xs font-semibold text-gray-700'
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
  const labelWidth = 100; // Assuming the label width is 100px
    return (
    <g>
      <foreignObject x={viewBox.x - labelWidth + 4} y={viewBox.y + 4} width={labelWidth} height={40}>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: color }}>
          <FontAwesomeIcon icon={icon} className="text-sm" style={{ color }} />
          <span className="text-xs font-semibold" style={{ color }}>{text}</span>
          </div>
        </foreignObject>
      </g>
    );
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

    // Get all delayed retirement values directly from the payload's raw data
    const { capitalMin, capital2Year, capital3Year, capital4Year, capitalMax } = payload[0]?.payload || {};

    // Format function that includes currency
    const formatWithCurrency = React.useCallback((amount: number | undefined) => {
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
    }, [tooltipCurrency]);

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
        <div className="space-y-3">
          <div>
            <p className={TOOLTIP_STYLES.mainCapital}>
              Capital with interests
            </p>
            <p className={TOOLTIP_STYLES.capitalValue}>
              {formatWithCurrency(mainCapital)}
            </p>
          </div>

          {/* Investment Phase Info */}
          {!isRetirementPhase && capitalInvested !== null && capitalInvested !== undefined && (
            <div>
              <p className={TOOLTIP_STYLES.investmentInfo}>
                Capital invested
              </p>
              <p className={TOOLTIP_STYLES.investmentValue}>
                {formatWithCurrency(capitalInvested)}
              </p>
            </div>
          )}

          {/* Always show Delayed Retirement Section if values exist */}
          {(capitalMin !== undefined || capital2Year !== undefined || capital3Year !== undefined || 
            capital4Year !== undefined || capitalMax !== undefined) && (
            <div className={TOOLTIP_STYLES.delayedSection}>
              <p className={TOOLTIP_STYLES.delayedTitle}>
                Delayed Retirement Scenarios
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { delay: 1, value: capitalMin, label: '+1 year delay' },
                  { delay: 2, value: capital2Year, label: '+2 years delay' },
                  { delay: 3, value: capital3Year, label: '+3 years delay' },
                  { delay: 4, value: capital4Year, label: '+4 years delay' },
                  { delay: 5, value: capitalMax, label: '+5 years delay' }
                ].filter(({ value }) => value !== undefined).map(({ delay, value, label }) => (
                  <div key={delay} className={TOOLTIP_STYLES.delayedItem}>
                    <p className={TOOLTIP_STYLES.delayedLabel}>
                      {label}
                    </p>
                    <p className={TOOLTIP_STYLES.delayedValue}>
                      {value !== undefined ? formatWithCurrency(value) : ''}
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

// Helper function for calculating delayed scenarios
const calculateDelayedScenario = (
  initialCapital: number,
  monthlyInvestment: number,
  monthlyWithdrawal: number,
  retirementYear: number,
  delayYears: number,
  currentYear: number,
  annualReturnRate: number,
  inflation: number
) => {
  let capital = initialCapital;
  let investment = monthlyInvestment;
  let withdrawal = monthlyWithdrawal;
  
  const delayedRetirementYear = retirementYear + delayYears;
  const isRetired = currentYear >= delayedRetirementYear;
  
  if (!isRetired) {
    capital = calculateFutureValue(capital, annualReturnRate, 1, investment, 'monthly');
    investment *= (1 + inflation / 100);
  } else {
    capital = calculateFutureValue(capital, annualReturnRate, 1, -withdrawal, 'monthly');
    withdrawal *= (1 + inflation / 100);
  }
  
  return { capital, investment, withdrawal };
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
    
    // Initialize scenario states
    const scenarios = {
      delay1Year: { capital: params.initialCapital, investment: params.monthlyInvestment, withdrawal: params.monthlyRetirementWithdrawal },
      delay2Year: { capital: params.initialCapital, investment: params.monthlyInvestment, withdrawal: params.monthlyRetirementWithdrawal },
      delay3Year: { capital: params.initialCapital, investment: params.monthlyInvestment, withdrawal: params.monthlyRetirementWithdrawal },
      delay4Year: { capital: params.initialCapital, investment: params.monthlyInvestment, withdrawal: params.monthlyRetirementWithdrawal },
      delay5Year: { capital: params.initialCapital, investment: params.monthlyInvestment, withdrawal: params.monthlyRetirementWithdrawal }
    };
    
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

      // Calculate scenarios using helper function
      const scenario1 = calculateDelayedScenario(
        scenarios.delay1Year.capital,
        scenarios.delay1Year.investment,
        scenarios.delay1Year.withdrawal,
        retirementYear,
        1,
        point.year,
        annualReturnRate,
        params.inflation
      );
      scenarios.delay1Year = scenario1;

      const scenario2 = calculateDelayedScenario(
        scenarios.delay2Year.capital,
        scenarios.delay2Year.investment,
        scenarios.delay2Year.withdrawal,
        retirementYear,
        2,
        point.year,
        annualReturnRate,
        params.inflation
      );
      scenarios.delay2Year = scenario2;

      const scenario3 = calculateDelayedScenario(
        scenarios.delay3Year.capital,
        scenarios.delay3Year.investment,
        scenarios.delay3Year.withdrawal,
        retirementYear,
        3,
        point.year,
        annualReturnRate,
        params.inflation
      );
      scenarios.delay3Year = scenario3;

      const scenario4 = calculateDelayedScenario(
        scenarios.delay4Year.capital,
        scenarios.delay4Year.investment,
        scenarios.delay4Year.withdrawal,
        retirementYear,
        4,
        point.year,
        annualReturnRate,
        params.inflation
      );
      scenarios.delay4Year = scenario4;

      const scenario5 = calculateDelayedScenario(
        scenarios.delay5Year.capital,
        scenarios.delay5Year.investment,
        scenarios.delay5Year.withdrawal,
        retirementYear,
        5,
        point.year,
        annualReturnRate,
        params.inflation
      );
      scenarios.delay5Year = scenario5;
      
      return {
        ...point,
        capitalMin: Math.max(0, Math.round(scenarios.delay1Year.capital)),
        capital2Year: Math.max(0, Math.round(scenarios.delay2Year.capital)),
        capital3Year: Math.max(0, Math.round(scenarios.delay3Year.capital)),
        capital4Year: Math.max(0, Math.round(scenarios.delay4Year.capital)),
        capitalMax: Math.max(0, Math.round(scenarios.delay5Year.capital))
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
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Calculate retirement phase for gradient
  const retirementStartIndex = useMemo(() => {
    return graphData.findIndex(point => point.retirement === "Yes");
  }, [graphData]);

  // Find first year when capital starts decreasing
  const firstCapitalWithdrawalDecreaseYear = useMemo(() => {
    const retirementIndex = graphData.findIndex(point => point.retirement === "Yes");
    if (retirementIndex === -1) return null;

    const decreasePoint = graphData.slice(retirementIndex).find((point, index, arr) => 
      index > 0 && point.annualWithdrawal < arr[index - 1].annualWithdrawal
    );
    return decreasePoint?.year;
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

  // Generate custom ticks for Y-axis
  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const maxVal = typeof maxYValue === 'number' ? maxYValue : 0; // Ensure maxYValue is a number
    for (let i = 0; i <= maxVal; i += 250000) {
      ticks.push(i);
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

  return (
    <div className="bg-gray-50 p-5 rounded-2xl shadow-md border border-gray-200 w-full max-w-full">
      <div className={cx("mb-6")}>
        <h3 className={cx(
          "inline-block mb-2",
          typography.size.xl,
          typography.weight.bold,
          "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        )}>
          Capital Evolution Over Time
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <span className={cx(typography.size.sm, "text-gray-600 flex-grow")}>
            Visualize your wealth growth over time, including compound interest gains.
          </span>
          <div className="inline-flex items-center gap-2">
            <span className={cx(typography.size.sm, "text-gray-600")}>Visualize delayed retirement scenarios:</span>
            <div className="inline-flex rounded-lg shadow-sm">
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
                      'px-3 py-1.5 text-xs font-semibold transition-all duration-200',
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
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
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
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
            <XAxis
              dataKey="year"
              stroke={colors.neutral[600]}
              tick={{ fill: colors.neutral[600], fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              stroke={colors.neutral[600]}
              tick={{ fill: colors.neutral[600], fontSize: 12 }}
              domain={[0, maxYValue]}
              allowDataOverflow={true}
              ticks={yAxisTicks}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend />
            
            {/* Reference line for last year before retirement */}
            <ReferenceLine
              x={statistics.calculatedRetirementStartYear - 1}
              stroke="#3B82F6"
              strokeDasharray="3 3"
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) => {
                  const vb = viewBox as { x: number; y: number; width: number; height: number };
                  return (
                  <CustomLabel
                      viewBox={{
                        x: vb.x - 5,
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
                strokeWidth={3}
              >
                <Label
                  content={({ viewBox }) => {
                    const vb = viewBox as { x: number; y: number; width: number; height: number };
                    return (
                    <CustomLabel
                        viewBox={{
                          x: vb.x - 5,
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
                strokeWidth={3}
              >
                <Label
                  content={({ viewBox }) => {
                    const vb = viewBox as { x: number; y: number; width: number; height: number };
                    return (
                    <CustomLabel
                        viewBox={{
                          x: vb.x - 5,
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

            {/* Banded area showing delayed retirement range - Updated to use selectedDelays */}
            {selectedDelays.includes(5) && chartData.some(d => d.capitalMax !== undefined) && (
              <Area
                type="monotone"
                dataKey="capitalMax"
                stroke="none"
                fill="url(#bandedAreaGradient)"
                fillOpacity={1}
                legendType="none"
                animationDuration={0}
              />
            )}
            {selectedDelays.includes(4) && chartData.some(d => d.capital4Year !== undefined) && (
              <Area
                type="monotone"
                dataKey="capital4Year"
                stroke="none"
                fill="url(#bandedAreaGradient)"
                fillOpacity={1}
                legendType="none"
                animationDuration={0}
              />
            )}
            {selectedDelays.includes(3) && chartData.some(d => d.capital3Year !== undefined) && (
              <Area
                type="monotone"
                dataKey="capital3Year"
                stroke="none"
                fill="url(#bandedAreaGradient)"
                fillOpacity={1}
                legendType="none"
                animationDuration={0}
              />
            )}
            {selectedDelays.includes(2) && chartData.some(d => d.capital2Year !== undefined) && (
              <Area
                type="monotone"
                dataKey="capital2Year"
                stroke="none"
                fill="url(#bandedAreaGradient)"
                fillOpacity={1}
                legendType="none"
                animationDuration={0}
              />
            )}
            {selectedDelays.includes(1) && chartData.some(d => d.capitalMin !== undefined) && (
              <Area
                type="monotone"
                dataKey="capitalMin"
                stroke="none"
                fill="url(#bandedAreaGradient)"
                fillOpacity={1}
                legendType="none"
                animationDuration={0}
              />
            )}

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