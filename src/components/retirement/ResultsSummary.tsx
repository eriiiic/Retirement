import React from 'react';
import { Statistics, SimulatorParams, FormatAmountFunction } from './types';

interface ResultsSummaryProps {
  statistics: Statistics;
  params: SimulatorParams;
  formatAmount: FormatAmountFunction;
}

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  statistics,
  params,
  formatAmount,
}) => {
  const { withdrawalMode } = params;

  return (
    <div className="p-4 bg-gray-50 rounded-2xl shadow mb-5">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary</h2>
      
      {/* Overview Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Overview</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statistics.finalCapital > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {statistics.finalCapital > 0 ? 'On Track' : 'At Risk'}
          </span>
        </div>
        
        <div className="mt-3 flex">
          <div className="border-r border-gray-200 pr-3 w-1/2">
            <div className="text-xs text-gray-500 mb-1">Retirement Start</div>
            <div className="text-lg font-semibold text-gray-800">{statistics.calculatedRetirementStartYear}</div>
            <div className="text-xs text-gray-500">Age {statistics.retirementStartAge}</div>
          </div>
          <div className="pl-3 w-1/2">
            <div className="text-xs text-gray-500 mb-1">Life Expectancy</div>
            <div className="text-lg font-semibold text-gray-800">Age {statistics.lifeExpectancy}</div>
            <div className="text-xs text-gray-500">{withdrawalMode === "age" ? "Target" : "Estimated"}</div>
          </div>
        </div>
        
        {/* Capital Timeline Visualization */}
        <div className="mt-4">
          <div className="h-8 w-full bg-gray-100 rounded-lg overflow-hidden flex">
            <div 
              className="h-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${statistics.retirementStartAge / statistics.lifeExpectancy * 100}%` }}
            >
              Working
            </div>
            {statistics.isCapitalExhausted && withdrawalMode === "amount" ? (
              <div 
                className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(statistics.exhaustionAge - statistics.retirementStartAge) / statistics.lifeExpectancy * 100}%` }}
              >
                Retirement
              </div>
            ) : statistics.isCapitalExhausted ? (
              <>
                <div 
                  className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(statistics.exhaustionAge - statistics.retirementStartAge) / statistics.lifeExpectancy * 100}%` }}
                >
                  Retirement
                </div>
                <div 
                  className="h-full bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(statistics.lifeExpectancy - statistics.exhaustionAge) / statistics.lifeExpectancy * 100}%` }}
                >
                  Depleted
                </div>
              </>
            ) : (
              <div 
                className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                style={{ width: `${(statistics.lifeExpectancy - statistics.retirementStartAge) / statistics.lifeExpectancy * 100}%` }}
              >
                Retirement
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Capital Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Capital</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">At Retirement</div>
            <div className="text-xl font-semibold text-blue-600">{formatAmount(statistics.capitalAtRetirement)}</div>
            <div className="text-xs text-gray-500">Age {statistics.retirementStartAge}</div>
          </div>
          
          <div className={`border rounded-xl p-3 ${statistics.finalCapital <= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Final Capital</div>
            <div className={`text-xl font-semibold ${statistics.finalCapital <= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(statistics.finalCapital)}
            </div>
            <div className="text-xs text-gray-500">
              {statistics.exhaustionYear === "Not exhausted" 
                ? `At age ${statistics.lifeExpectancy}` 
                : `Depleted at age ${statistics.exhaustionAge}`}
            </div>
          </div>
        </div>
        
        {/* Capital/Investment Comparison */}
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <div className="text-xs text-gray-500">Total Invested</div>
            <div className="text-xs font-medium text-gray-800">{formatAmount(statistics.totalInvestedAmount)}</div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500"
              style={{ width: `100%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mb-1 mt-3">
            <div className="text-xs text-gray-500">Capital at Retirement</div>
            <div className="text-xs font-medium text-gray-800">{formatAmount(statistics.capitalAtRetirement)}</div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: `${(statistics.capitalAtRetirement / statistics.totalInvestedAmount) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="text-xs text-blue-600">Investment Growth</div>
            <div className="text-xs font-medium text-blue-600">
              {formatAmount(statistics.capitalAtRetirement - statistics.totalInvestedAmount)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Monthly Amounts Card */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Amounts</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Monthly Investment</div>
            <div className="text-lg font-semibold text-blue-600">{formatAmount(params.monthlyInvestment)}</div>
            <div className="text-xs text-gray-500 mt-1">Current</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{formatAmount(statistics.finalMonthlyInvestment)}</div>
            <div className="text-xs text-gray-500">Final (inflation adjusted)</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Monthly Withdrawal</div>
            <div className="text-lg font-semibold text-purple-600">{formatAmount(params.monthlyRetirementWithdrawal)}</div>
            <div className="text-xs text-gray-500 mt-1">Current</div>
            <div className="text-sm font-medium text-gray-600 mt-1">{formatAmount(statistics.finalMonthlyWithdrawalValue)}</div>
            <div className="text-xs text-gray-500">Final (inflation adjusted)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary; 