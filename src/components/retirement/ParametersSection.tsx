import React from 'react';
import { SimulatorParams, Statistics, FormatAmountFunction } from './types';

interface ParametersSectionProps {
  params: SimulatorParams;
  statistics: Statistics;
  formatAmount: FormatAmountFunction;
  onParamChange: (key: keyof SimulatorParams, value: any) => void;
}

export const ParametersSection: React.FC<ParametersSectionProps> = ({
  params,
  statistics,
  formatAmount,
  onParamChange,
}) => {
  const {
    currency,
    initialCapital,
    monthlyInvestment,
    annualReturnRate,
    inflation,
    currentAge,
    retirementInput,
    withdrawalMode,
    monthlyRetirementWithdrawal,
    maxAge,
  } = params;

  const isRetirementInputAge = () => {
    const input = Number(retirementInput);
    return (input > 0 && input < 120 && retirementInput.length <= 2) || 
           !(retirementInput.length === 4 && retirementInput.startsWith('20'));
  };

  return (
    <div className="p-4 bg-gray-50 rounded-2xl shadow mb-5">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Parameters</h2>
      
      {/* Currency Selector */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Currency</label>
          <div className="bg-gray-200 rounded-lg p-0.5 flex">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "USD" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700'}`}
              onClick={() => onParamChange('currency', "USD")}
            >
              USD
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "EUR" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700'}`}
              onClick={() => onParamChange('currency', "EUR")}
            >
              EUR
            </button>
          </div>
        </div>
      </div>

      {/* Initial Values Group */}
      <div className="mb-5 bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Initial Values</h3>
        
        {/* Initial Capital */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-600">Initial Capital</label>
            <span className="text-xs text-blue-600 font-medium">{formatAmount(initialCapital)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000000"
            step="1000"
            value={initialCapital}
            onChange={(e) => onParamChange('initialCapital', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between items-center mt-1">
            <input
              type="text"
              value={initialCapital.toLocaleString('en-US')}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                if (/^\d*$/.test(value)) {
                  onParamChange('initialCapital', Number(value));
                }
              }}
              className="w-24 p-2 bg-gray-100 rounded-lg text-sm border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none text-right"
            />
            <span className="text-xs text-gray-500">Starting amount</span>
          </div>
        </div>

        {/* Monthly Investment */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-gray-600">Monthly Investment</label>
            <span className="text-xs text-blue-600 font-medium">{formatAmount(monthlyInvestment)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={monthlyInvestment}
            onChange={(e) => onParamChange('monthlyInvestment', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between items-center mt-1">
            <input
              type="text"
              value={monthlyInvestment.toLocaleString('en-US')}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                if (/^\d*$/.test(value)) {
                  onParamChange('monthlyInvestment', Number(value));
                }
              }}
              className="w-24 p-2 bg-gray-100 rounded-lg text-sm border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none text-right"
            />
            <span className="text-xs text-gray-500">Monthly contribution</span>
          </div>
        </div>
      </div>

      {/* Market Conditions Group */}
      <div className="mb-5 bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Market Conditions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Return Rate */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-600">Return (%)</label>
              <span className="text-xs text-blue-600 font-medium">{annualReturnRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.1"
              value={annualReturnRate}
              onChange={(e) => onParamChange('annualReturnRate', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0%</span>
              <span className="text-xs text-gray-500">15%</span>
            </div>
          </div>

          {/* Inflation */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-600">Inflation (%)</label>
              <span className="text-xs text-blue-600 font-medium">{inflation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={inflation}
              onChange={(e) => onParamChange('inflation', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0%</span>
              <span className="text-xs text-gray-500">10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Retirement Timeline Group */}
      <div className="mb-5 bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Retirement Timeline</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Current Age */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-600">Current Age</label>
              <span className="text-xs text-blue-600 font-medium">{currentAge}</span>
            </div>
            <input
              type="range"
              min="18"
              max="80"
              value={currentAge}
              onChange={(e) => onParamChange('currentAge', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">18</span>
              <span className="text-xs text-gray-500">80</span>
            </div>
          </div>

          {/* Retirement Age */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-600">Retirement Age</label>
              <span className="text-xs text-blue-600 font-medium">
                {isRetirementInputAge() ? retirementInput : `${statistics.retirementStartAge}`}
              </span>
            </div>
            <input
              type="range"
              min={currentAge + 1}
              max="90"
              value={isRetirementInputAge() ? Number(retirementInput) : statistics.retirementStartAge}
              onChange={(e) => onParamChange('retirementInput', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <input
                type="text"
                value={retirementInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  onParamChange('retirementInput', value);
                }}
                className="w-16 p-1 bg-gray-100 rounded-lg text-sm border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none text-center"
              />
              <span className="text-xs text-gray-500">
                {isRetirementInputAge() ? 'age' : 'year'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Settings Group */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Withdrawal Settings</h3>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-gray-600">Planning Mode</label>
            <div className="bg-gray-200 rounded-lg p-0.5 flex">
              <button 
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${withdrawalMode === "amount" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700'}`}
                onClick={() => onParamChange('withdrawalMode', "amount")}
              >
                Set Amount
              </button>
              <button 
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${withdrawalMode === "age" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700'}`}
                onClick={() => onParamChange('withdrawalMode', "age")}
              >
                Set Target Age
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic mb-3">
            {withdrawalMode === "amount" 
              ? "Set your monthly withdrawal amount and see how long your money will last." 
              : "Set a target age and see how much you can withdraw monthly."}
          </p>
        </div>
        
        {withdrawalMode === 'amount' ? (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-600">Monthly Withdrawal</label>
              <span className="text-xs text-blue-600 font-medium">{formatAmount(monthlyRetirementWithdrawal)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={monthlyRetirementWithdrawal}
              onChange={(e) => onParamChange('monthlyRetirementWithdrawal', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between items-center mt-1">
              <input
                type="text"
                value={monthlyRetirementWithdrawal.toLocaleString('en-US')}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                  if (/^\d*$/.test(value)) {
                    onParamChange('monthlyRetirementWithdrawal', Number(value));
                  }
                }}
                className="w-24 p-2 bg-gray-100 rounded-lg text-sm border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none text-right"
              />
              <span className="text-xs text-gray-500">Monthly withdrawal</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-600">Target Age</label>
              <span className="text-xs text-blue-600 font-medium">{maxAge}</span>
            </div>
            <input
              type="range"
              min={statistics.retirementStartAge + 1}
              max="120"
              value={maxAge}
              onChange={(e) => onParamChange('maxAge', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{statistics.retirementStartAge + 1}</span>
              <span className="text-xs text-gray-500">120</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParametersSection; 