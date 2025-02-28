import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GraphDataPoint, FormatAmountFunction } from './types';

interface CapitalEvolutionChartProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
  currency: string;
}

export const CapitalEvolutionChart: React.FC<CapitalEvolutionChartProps> = ({
  graphData,
  formatAmount,
  currency,
}) => {
  return (
    <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Capital Evolution</h2>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={graphData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Year', position: 'insideBottomRight', offset: -10 }} 
          />
          <YAxis 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            label={{ value: `Capital (${currency === "EUR" ? "€" : "$"})`, angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === "Capital") return [`${formatAmount(value)}`, 'Capital with Interest'];
              if (name === "Capital without Interest") return [`${formatAmount(value)}`, 'Capital without Interest'];
              return [`${formatAmount(value)}`, name];
            }}
            labelFormatter={(value) => `Year: ${value}`}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="capital"
            stroke="#4f46e5"
            name="Capital"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="capitalWithoutInterest"
            stroke="#94a3b8"
            name="Principal Only (No Interest)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CapitalEvolutionChart; 