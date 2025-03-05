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
import { GraphDataPoint, FormatAmountFunction, Statistics, Currency } from './types';
import { colors, components, typography, cx } from '../../styles/styleGuide';

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
}

interface LabelProps {
  viewBox: any;
  text: string;
  color: string;
}

const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  statistics,
  currency,
  currentAge
}) => {
  // Prepare data with investment phase only for capitalWithoutInterest
  const chartData = useMemo(() => {
    return graphData.map(point => ({
      ...point,
      // Only keep capitalWithoutInterest during investment phase
      capitalWithoutInterest: point.retirement === "No" ? point.capitalWithoutInterest : null
    }));
  }, [graphData]);

  // Find the first year where capital withdrawal reduces
  const firstCapitalWithdrawalDecreaseYear = useMemo(() => {
    for (let i = 1; i < graphData.length; i++) {
      if (graphData[i].retirement === "Yes" && 
          graphData[i-1].retirement === "Yes" &&
          Math.abs(graphData[i].netVariationExcludingInterest) < Math.abs(graphData[i-1].netVariationExcludingInterest)) {
        return graphData[i].year;
      }
    }
    return null;
  }, [graphData]);

  // Track label positions
  const labelPositions = useMemo(() => {
    const positions = [];
    
    // Add retirement line position
    if (statistics.calculatedRetirementStartYear) {
      positions.push({
        x: statistics.calculatedRetirementStartYear - 1,
        text: "Retired",
        width: 80 // Approximate width in pixels including icon and padding
      });
    }

    // Add withdrawal decrease line position
    if (firstCapitalWithdrawalDecreaseYear) {
      positions.push({
        x: firstCapitalWithdrawalDecreaseYear - 1,
        text: "Depleted",
        width: 85 // Approximate width in pixels including icon and padding
      });
    }

    // Add target age line position
    if (statistics.lifeExpectancy && currentAge) {
      positions.push({
        x: new Date().getFullYear() + (statistics.lifeExpectancy - currentAge),
        text: "Target",
        width: 75 // Approximate width in pixels including icon and padding
      });
    }

    return positions.sort((a, b) => a.x - b.x);
  }, [statistics, firstCapitalWithdrawalDecreaseYear, currentAge]);

  const CustomLabel = ({ viewBox, text, color }: LabelProps) => {
    const x = (viewBox?.x ?? 0) as number;
    const currentLabel = labelPositions.find(pos => pos.x === x);
    const labelIndex = labelPositions.findIndex(pos => pos.x === x);
    
    // Base offset for all labels
    let offset = 105;

    // Only adjust left labels if they're not the rightmost label
    if (labelIndex < labelPositions.length - 1) {
      const currentLabelWidth = currentLabel?.width || 80;
      const nextLabel = labelPositions[labelIndex + 1];
      const pixelsPerUnit = 8; // Approximate pixels per x-axis unit
      const distance = (nextLabel.x - x) * pixelsPerUnit;
      
      // If the distance is less than the width of both labels plus desired gap
      if (distance < (currentLabelWidth + nextLabel.width + 10)) {
        offset = currentLabelWidth + 20; // Move left label further left
      }
    }

    return (
      <g transform={`translate(${x - offset}, 35)`}>
        <foreignObject width="100" height="30">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'white',
              border: `1px solid ${color}`,
              borderRadius: '4px',
              padding: '2px 6px',
              width: 'fit-content',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              position: 'absolute',
              right: 5
            }}
          >
            <span style={{ color, fontSize: '12px', fontWeight: 500 }}>
              {text}
            </span>
          </div>
        </foreignObject>
      </g>
    );
  };

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