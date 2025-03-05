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
  ResponsiveContainer
} from 'recharts';
import { GraphDataPoint, FormatAmountFunction, Statistics } from './types';
import { colors, components, typography, cx } from '../../styles/styleGuide';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  statistics: Statistics;
}

const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  statistics
}) => {
  // Prepare data with investment phase only for capitalWithoutInterest
  const chartData = useMemo(() => {
    return graphData.map(point => ({
      ...point,
      // Only keep capitalWithoutInterest during investment phase
      capitalWithoutInterest: point.retirement === "No" ? point.capitalWithoutInterest : null
    }));
  }, [graphData]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isCapitalZero = (payload[0]?.value || 0) <= 0;
      const age = payload[0]?.payload.age || 0;
      const isRetirementPhase = payload[0]?.payload.retirement === "Yes";

      return (
        <div className={cx(
          components.container.card,
          'p-3 bg-white/95 backdrop-blur-sm border border-gray-100 shadow-sm'
        )}>
          <p className={cx(typography.style.label)}>
            Year {label}
          </p>
          <p className={cx(
            typography.weight.bold,
            isCapitalZero ? 'text-red-600' : typography.style.value,
            'mb-2'
          )}>
            Age {age}
          </p>
          <div className="space-y-2">
            <p className="flex flex-col">
              <span className={cx(
                typography.weight.bold,
                'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              )}>Capital with interests</span>
              <span className={cx(
                typography.weight.bold,
                'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
              )}>
                {formatAmount(payload[0]?.value || 0)}
              </span>
            </p>
            {!isRetirementPhase && payload[1]?.value !== null && (
              <p className="flex flex-col">
                <span className={cx(typography.style.label)}>Capital invested</span>
                <span className={cx(typography.style.value, 'text-gray-700')}>
                  {formatAmount(payload[1]?.value || 0)}
                </span>
              </p>
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
          Visualize how your capital grows over time, comparing the total amount including interest earnings with your invested capital during the investment phase.
        </p>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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