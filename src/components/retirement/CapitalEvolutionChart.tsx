import React, { useMemo } from 'react';
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

type ViewBoxType = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

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
  viewBox: any;
  text: string;
  color: string;
}

const CustomLabel: React.FC<LabelProps> = ({ viewBox, text, color }) => {
  const icon = getIconForLabel(text);
  return (
    <g>
      <foreignObject x={viewBox.x - 120} y={viewBox.y - 15} width={100} height={30}>
        <div className="flex items-center gap-2 bg-white border-2 rounded-lg px-3 py-1.5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]">
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
  // Calculate data for delayed retirement scenarios
  const delayedRetirementData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const retirementYear = statistics.calculatedRetirementStartYear;
    
    // Initialize delayed scenario capitals
    let delay1YearCapital = params.initialCapital;
    let delay5YearCapital = params.initialCapital;
    let delay1YearMonthlyInvestment = params.monthlyInvestment;
    let delay5YearMonthlyInvestment = params.monthlyInvestment;
    let delay1YearMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    let delay5YearMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    
    // Create data points for each year
    return graphData.map((point, index) => {
      const yearIndex = point.year - currentYear;
      
      if (yearIndex < 0) {
        return { ...point, capitalMin: point.capital, capitalMax: point.capital };
      }
      
      const delay1Year = retirementYear + 1;
      const delay5Years = retirementYear + 5;
      
      // Calculate 1-year delay scenario
      const isRetired1Year = point.year >= delay1Year;
      if (!isRetired1Year) {
        // Still in investment phase
        delay1YearCapital = calculateFutureValue(
          delay1YearCapital,
          annualReturnRate,
          1,
          delay1YearMonthlyInvestment,
          'monthly'
        );
        delay1YearMonthlyInvestment *= (1 + params.inflation / 100);
      } else {
        // In retirement phase
        delay1YearCapital = calculateFutureValue(
          delay1YearCapital,
          annualReturnRate,
          1,
          -delay1YearMonthlyWithdrawal,
          'monthly'
        );
        delay1YearMonthlyWithdrawal *= (1 + params.inflation / 100);
      }
      
      // Calculate 5-year delay scenario
      const isRetired5Years = point.year >= delay5Years;
      if (!isRetired5Years) {
        // Still in investment phase
        delay5YearCapital = calculateFutureValue(
          delay5YearCapital,
          annualReturnRate,
          1,
          delay5YearMonthlyInvestment,
          'monthly'
        );
        delay5YearMonthlyInvestment *= (1 + params.inflation / 100);
      } else {
        // In retirement phase
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
      const delay1Year = payload.find((p: any) => p.dataKey === 'capitalMin')?.value;
      const delay5Years = payload.find((p: any) => p.dataKey === 'capitalMax')?.value;
      const isCapitalZero = mainCapital <= 0;
      const age = payload[0]?.payload.age || 0;
      const isRetirementPhase = payload[0]?.payload.retirement === "Yes";
      const showDelayedValues = isRetirementPhase || payload[0]?.payload.year === statistics.calculatedRetirementStartYear;

      return (
        <div className={cx(
          'p-3 bg-white border border-gray-200 rounded-lg',
          'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]',
          'min-w-[240px]'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-200">
            <div>
              <p className={cx('text-xs font-medium text-gray-600')}>
                Year {label} · <span className={cx(
                  'font-bold',
                  isCapitalZero ? 'text-red-600' : 'text-gray-900'
                )}>Age {age}</span>
              </p>
            </div>
            <div className={cx(
              'px-2 py-0.5 rounded text-[11px] font-semibold border-[1.5px]',
              isRetirementPhase 
                ? 'bg-purple-50 text-purple-800 border-purple-200' 
                : 'bg-blue-50 text-blue-800 border-blue-200'
            )}>
              {isRetirementPhase ? 'Retirement' : 'Investment'}
            </div>
          </div>

          {/* Main Capital Section */}
          <div className="space-y-2.5">
            <div>
              <p className={cx(
                'text-xs font-bold mb-1',
                'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              )}>
                Capital with interests
              </p>
              <p className={cx(
                'text-sm font-bold tracking-tight',
                'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              )}>
                {formatAmount(mainCapital)}
              </p>
            </div>

            {/* Investment Phase Info */}
            {!isRetirementPhase && capitalInvested !== null && capitalInvested !== undefined && (
              <div>
                <p className={cx('text-xs font-medium text-gray-600 mb-1')}>
                  Capital invested
                </p>
                <p className={cx('text-sm font-semibold text-gray-800')}>
                  {formatAmount(capitalInvested)}
                </p>
              </div>
            )}

            {/* Delayed Retirement Section */}
            {showDelayedValues && delay1Year !== undefined && delay5Years !== undefined && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={cx('text-xs font-medium text-gray-600 mb-1')}>
                      +1 year delay
                    </p>
                    <p className={cx('text-sm font-semibold text-gray-800')}>
                      {formatAmount(delay1Year)}
                    </p>
                  </div>
                  <div>
                    <p className={cx('text-xs font-medium text-gray-600 mb-1')}>
                      +5 years delay
                    </p>
                    <p className={cx('text-sm font-semibold text-gray-800')}>
                      {formatAmount(delay5Years)}
                    </p>
                  </div>
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
        <p className={cx(typography.size.sm, "text-gray-600")}>
          Visualize how your capital grows over time, comparing the total amount including interest earnings with your invested capital during the investment phase. The shaded area shows potential growth with delayed retirement (1-5 years).
        </p>
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
                  stopOpacity={0.4}
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
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={colors.secondary[500]}
                  stopOpacity={0.05}
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
                content={(props) => (
                  <CustomLabel
                    viewBox={props.viewBox}
                    text="Retired"
                    color="#3B82F6"
                  />
                )}
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
                  content={(props) => (
                    <CustomLabel
                      viewBox={props.viewBox}
                      text="Depleted"
                      color="#EF4444"
                    />
                  )}
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
                  content={(props) => (
                    <CustomLabel
                      viewBox={props.viewBox}
                      text="Target"
                      color="#22C55E"
                    />
                  )}
                />
              </ReferenceLine>
            )}

            {/* Banded area showing delayed retirement range */}
            <Area
              type="monotone"
              dataKey="capitalMax"
              stroke="none"
              fill="url(#bandedAreaGradient)"
              fillOpacity={1}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="capitalMin"
              stroke="none"
              fill="url(#bandedAreaGradient)"
              fillOpacity={1}
              legendType="none"
            />

            <Area
              type="monotone"
              dataKey="capital"
              name="Capital with interests"
              stroke="url(#capitalGradient)"
              strokeWidth={3}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{ r: 6, fill: colors.primary[600] }}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CapitalEvolutionChart; 