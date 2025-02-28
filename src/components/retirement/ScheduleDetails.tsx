import React, { useState } from 'react';
import { GraphDataPoint, FormatAmountFunction } from './types';

interface ScheduleDetailsProps {
  graphData: GraphDataPoint[];
  formatAmount: FormatAmountFunction;
}

export const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({
  graphData,
  formatAmount,
}) => {
  const [showSchedule, setShowSchedule] = useState(false);

  return (
    <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Schedule Details</h2>
        <button 
          className={`px-4 py-2 rounded text-white ${showSchedule ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={() => setShowSchedule(!showSchedule)}
        >
          {showSchedule ? 'Hide Schedule' : 'Show Schedule'}
        </button>
      </div>
      
      {showSchedule && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capital
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inv/Withdraw
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phase
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {graphData.map((entry, index) => (
                <tr key={index} className={entry.retirement === "Yes" ? "bg-orange-50" : ""}>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                    {entry.year}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                    {entry.age}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(entry.capital)}
                  </td>
                  <td className={`px-6 py-2 whitespace-nowrap text-sm ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-green-600">
                    +{formatAmount(entry.annualInterest)}
                  </td>
                  <td className={`px-6 py-2 whitespace-nowrap text-sm ${entry.netVariationExcludingInterest >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                    {entry.retirement === "Yes" ? "Retirement" : "Investment"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScheduleDetails; 