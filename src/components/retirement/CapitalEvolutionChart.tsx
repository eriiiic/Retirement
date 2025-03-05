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

const CustomLabel: React.FC<LabelProps> = ({ viewBox, text, color }) => {
  const icon = getIconForLabel(text);
  return (
    <g>
      <foreignObject x={viewBox.x - 120} y={viewBox.y + 10} width={100} height={40}>
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: color }}>
          <FontAwesomeIcon icon={icon} className="text-sm" style={{ color }} />
          <span className="text-xs font-semibold" style={{ color }}>{text}</span>
        </div>
      </foreignObject>
    </g>
  );
};

const getIconForLabel = (text: string) => {
  switch (text) {
    case 'Retired':
      return faBriefcase;
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
  const [selectedDelays, setSelectedDelays] = useState<number[]>([1, 5]); // Default: show min and max

  // Calculate data for delayed retirement scenarios
  const delayedRetirementData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const retirementYear = statistics.calculatedRetirementStartYear;
    
    // Initialize delayed scenario capitals
    let delay1YearCapital = params.initialCapital;
    let delay2YearCapital = params.initialCapital;
    let delay3YearCapital = params.initialCapital;
    let delay4YearCapital = params.initialCapital;
    let delay5YearCapital = params.initialCapital;

    let delay1YearMonthlyInvestment = params.monthlyInvestment;
    let delay2YearMonthlyInvestment = params.monthlyInvestment;
    let delay3YearMonthlyInvestment = params.monthlyInvestment;
    let delay4YearMonthlyInvestment = params.monthlyInvestment;
    let delay5YearMonthlyInvestment = params.monthlyInvestment;

    let delay1YearMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    let delay2YearMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    let delay3YearMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    let delay4YearMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    let delay5YearMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    
    // Create data points for each year
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
      
      const delay1Year = retirementYear + 1;
      const delay2Year = retirementYear + 2;
      const delay3Year = retirementYear + 3;
      const delay4Year = retirementYear + 4;
      const delay5Years = retirementYear + 5;
      
      // Calculate 1-year delay scenario
      const isRetired1Year = point.year >= delay1Year;
      if (!isRetired1Year) {
        delay1YearCapital = calculateFutureValue(
          delay1YearCapital,
          annualReturnRate,
          1,
          delay1YearMonthlyInvestment,
          'monthly'
        );
        delay1YearMonthlyInvestment *= (1 + params.inflation / 100);
      } else {
        delay1YearCapital = calculateFutureValue(
          delay1YearCapital,
          annualReturnRate,
          1,
          -delay1YearMonthlyWithdrawal,
          'monthly'
        );
        delay1YearMonthlyWithdrawal *= (1 + params.inflation / 100);
      }

      // Calculate 2-year delay scenario
      const isRetired2Year = point.year >= delay2Year;
      if (!isRetired2Year) {
        delay2YearCapital = calculateFutureValue(
          delay2YearCapital,
          annualReturnRate,
          1,
          delay2YearMonthlyInvestment,
          'monthly'
        );
        delay2YearMonthlyInvestment *= (1 + params.inflation / 100);
      } else {
        delay2YearCapital = calculateFutureValue(
          delay2YearCapital,
          annualReturnRate,
          1,
          -delay2YearMonthlyWithdrawal,
          'monthly'
        );
        delay2YearMonthlyWithdrawal *= (1 + params.inflation / 100);
      }

      // Calculate 3-year delay scenario
      const isRetired3Year = point.year >= delay3Year;
      if (!isRetired3Year) {
        delay3YearCapital = calculateFutureValue(
          delay3YearCapital,
          annualReturnRate,
          1,
          delay3YearMonthlyInvestment,
          'monthly'
        );
        delay3YearMonthlyInvestment *= (1 + params.inflation / 100);
      } else {
        delay3YearCapital = calculateFutureValue(
          delay3YearCapital,
          annualReturnRate,
          1,
          -delay3YearMonthlyWithdrawal,
          'monthly'
        );
        delay3YearMonthlyWithdrawal *= (1 + params.inflation / 100);
      }

      // Calculate 4-year delay scenario
      const isRetired4Year = point.year >= delay4Year;
      if (!isRetired4Year) {
        delay4YearCapital = calculateFutureValue(
          delay4YearCapital,
          annualReturnRate,
          1,
          delay4YearMonthlyInvestment,
          'monthly'
        );
        delay4YearMonthlyInvestment *= (1 + params.inflation / 100);
      } else {
        delay4YearCapital = calculateFutureValue(
          delay4YearCapital,
          annualReturnRate,
          1,
          -delay4YearMonthlyWithdrawal,
          'monthly'
        );
        delay4YearMonthlyWithdrawal *= (1 + params.inflation / 100);
      }
      
      // Calculate 5-year delay scenario
      const isRetired5Years = point.year >= delay5Years;
      if (!isRetired5Years) {
        delay5YearCapital = calculateFutureValue(
          delay5YearCapital,
          annualReturnRate,
          1,
          delay5YearMonthlyInvestment,
          'monthly'
        );
        delay5YearMonthlyInvestment *= (1 + params.inflation / 100);
      } else {
        delay5YearCapital = calculateFutureValue(
          delay5YearCapital,
          annualReturnRate,
          1,
          -delay5YearMonthlyWithdrawal,
          'monthly'
        );
        delay5YearMonthlyWithdrawal *= (1 + params.inflation / 100);
      }
      
      return {
        ...point,
        capitalMin: Math.max(0, Math.round(delay1YearCapital)),
        capital2Year: Math.max(0, Math.round(delay2YearCapital)),
        capital3Year: Math.max(0, Math.round(delay3YearCapital)),
        capital4Year: Math.max(0, Math.round(delay4YearCapital)),
        capitalMax: Math.max(0, Math.round(delay5YearCapital))
      };
    });
  }, [
    graphData,
    statistics,
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

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const mainCapital = payload.find((p: any) => p.dataKey === 'capital')?.value || 0;
      const capitalInvested = payload.find((p: any) => p.dataKey === 'capitalWithoutInterest')?.value;
      const age = payload[0]?.payload.age || 0;
      const isRetirementPhase = payload[0]?.payload.retirement === "Yes";
      const isCapitalZero = mainCapital <= 0;

      // Get all delayed retirement values directly from the payload's raw data
      const { capitalMin, capital2Year, capital3Year, capital4Year, capitalMax } = payload[0]?.payload || {};

      // Format function that includes currency
      const formatWithCurrency = (amount: number) => {
        if (amount === undefined || amount === null) return '';
        
        // Round the amount to remove decimals
        const roundedAmount = Math.round(amount);
        
        // Format the amount based on currency locale
        let formattedAmount;
        if (currency === 'EUR') {
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
        switch (currency) {
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

      return (
        <div className={cx(
          'p-4 bg-white border border-gray-200 rounded-lg',
          'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]',
          'min-w-[280px]'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200">
            <div>
              <p className={cx('text-sm font-medium text-gray-600')}>
                Year {label} · <span className={cx(
                  'font-bold',
                  isCapitalZero ? 'text-red-600' : 'text-gray-900'
                )}>Age {age}</span>
              </p>
            </div>
            <div className={cx(
              'px-2.5 py-1 rounded text-xs font-semibold border-[1.5px]',
              isRetirementPhase 
                ? 'bg-purple-50 text-purple-800 border-purple-200' 
                : 'bg-blue-50 text-blue-800 border-blue-200'
            )}>
              {isRetirementPhase ? 'Retirement' : 'Investment'}
            </div>
          </div>

          {/* Main Capital Section */}
          <div className="space-y-3">
            <div>
              <p className={cx(
                'text-sm font-bold mb-1.5',
                'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              )}>
                Capital with interests
              </p>
              <p className={cx(
                'text-lg font-bold tracking-tight',
                'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              )}>
                {formatWithCurrency(mainCapital)}
              </p>
            </div>

            {/* Investment Phase Info */}
            {!isRetirementPhase && capitalInvested !== null && capitalInvested !== undefined && (
              <div>
                <p className={cx('text-sm font-medium text-gray-600 mb-1')}>
                  Capital invested
                </p>
                <p className={cx('text-base font-semibold text-gray-800')}>
                  {formatWithCurrency(capitalInvested)}
                </p>
              </div>
            )}

            {/* Always show Delayed Retirement Section if values exist */}
            {(capitalMin !== undefined || capital2Year !== undefined || capital3Year !== undefined || 
              capital4Year !== undefined || capitalMax !== undefined) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className={cx('text-[11px] uppercase font-semibold text-gray-500 tracking-wider mb-2')}>
                  Delayed Retirement Scenarios
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {capitalMin !== undefined && (
                    <div className="flex justify-between items-center">
                      <p className={cx('text-[11px] font-medium text-gray-500')}>
                        +1 year delay
                      </p>
                      <p className={cx('text-xs font-semibold text-gray-700')}>
                        {formatWithCurrency(capitalMin)}
                      </p>
                    </div>
                  )}
                  {capital2Year !== undefined && (
                    <div className="flex justify-between items-center">
                      <p className={cx('text-[11px] font-medium text-gray-500')}>
                        +2 years delay
                      </p>
                      <p className={cx('text-xs font-semibold text-gray-700')}>
                        {formatWithCurrency(capital2Year)}
                      </p>
                    </div>
                  )}
                  {capital3Year !== undefined && (
                    <div className="flex justify-between items-center">
                      <p className={cx('text-[11px] font-medium text-gray-500')}>
                        +3 years delay
                      </p>
                      <p className={cx('text-xs font-semibold text-gray-700')}>
                        {formatWithCurrency(capital3Year)}
                      </p>
                    </div>
                  )}
                  {capital4Year !== undefined && (
                    <div className="flex justify-between items-center">
                      <p className={cx('text-[11px] font-medium text-gray-500')}>
                        +4 years delay
                      </p>
                      <p className={cx('text-xs font-semibold text-gray-700')}>
                        {formatWithCurrency(capital4Year)}
                      </p>
                    </div>
                  )}
                  {capitalMax !== undefined && (
                    <div className="flex justify-between items-center">
                      <p className={cx('text-[11px] font-medium text-gray-500')}>
                        +5 years delay
                      </p>
                      <p className={cx('text-xs font-semibold text-gray-700')}>
                        {formatWithCurrency(capitalMax)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

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
    
    const retirementYear = statistics.calculatedRetirementStartYear;
    const retirementPoint = graphData.find(point => point.year === retirementYear);
    
    if (!retirementPoint?.capital) return 'auto';

    // Fixed maximum value based on main retirement capital + 40%
    return retirementPoint.capital * 1.4;
  }, [graphData, statistics.calculatedRetirementStartYear]);

  // Check if capital is positive at target age for each delay
  const getPositiveDelays = useMemo(() => {
    if (!graphData.length) return new Set<number>();
    
    const targetYear = new Date().getFullYear() + (statistics.lifeExpectancy - currentAge);
    const finalDataPoint = graphData.find(point => point.year === targetYear);
    
    if (!finalDataPoint) return new Set<number>();
    
    const positiveDelays = new Set<number>();
    
    if (finalDataPoint.capitalMin && finalDataPoint.capitalMin > 0) positiveDelays.add(1);
    if (finalDataPoint.capital2Year && finalDataPoint.capital2Year > 0) positiveDelays.add(2);
    if (finalDataPoint.capital3Year && finalDataPoint.capital3Year > 0) positiveDelays.add(3);
    if (finalDataPoint.capital4Year && finalDataPoint.capital4Year > 0) positiveDelays.add(4);
    if (finalDataPoint.capitalMax && finalDataPoint.capitalMax > 0) positiveDelays.add(5);
    
    return positiveDelays;
  }, [graphData, statistics.lifeExpectancy, currentAge]);

  return (
    <div className="bg-gray-50 p-5 rounded-2xl shadow-md border border-gray-200">
      <div className={cx("mb-6")}>
        <h3 className={cx(
          "inline-block mb-2",
          typography.size.xl,
          typography.weight.bold,
          "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        )}>
          Capital Evolution Over Time
        </h3>
        <p className={cx(typography.size.sm, "text-gray-600 mb-4")}>
          Visualize your wealth growth over time, including compound interest gains. The shaded areas show how delaying retirement by 1-5 years could affect your financial future.
        </p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <span className={cx(typography.size.sm, "text-gray-600")}>
            Show delayed retirement scenarios:
          </span>
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
            />
            <Tooltip content={<CustomTooltip />} />
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