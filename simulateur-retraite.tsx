import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RetirementSimulator = () => {
  // States for simulation parameters
  const [initialCapital, setInitialCapital] = useState(10000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(500);
  const [annualReturnRate, setAnnualReturnRate] = useState(5);
  const [inflation, setInflation] = useState(2);
  const [monthlyRetirementWithdrawal, setMonthlyRetirementWithdrawal] = useState(2000);
  const [currentAge, setCurrentAge] = useState(40);
  const [retirementInput, setRetirementInput] = useState("65");
  const [currency, setCurrency] = useState("USD");
  const [withdrawalMode, setWithdrawalMode] = useState("amount"); // "amount" or "age"
  const [maxAge, setMaxAge] = useState(95);
  
  // State for chart data and UI controls
  const [graphData, setGraphData] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showRetirementAnalysis, setShowRetirementAnalysis] = useState(false);

  // Calculate birth year from current age
  const getBirthYear = () => {
    const currentYear = new Date().getFullYear();
    return currentYear - currentAge;
  };
  
  // Determine if input is age or year
  const isRetirementInputAge = () => {
    const input = Number(retirementInput);
    // Consider it an age if it's between 1 and 120
    // Consider it a year if it's 4 digits and starts with 20
    return (input > 0 && input < 120 && retirementInput.length <= 2) || 
           !(retirementInput.length === 4 && retirementInput.startsWith('20'));
  };
  
  // Calculate actual retirement year based on input
  const getRetirementYear = () => {
    if (isRetirementInputAge()) {
      return new Date().getFullYear() + (Number(retirementInput) - currentAge);
    } else {
      return Number(retirementInput);
    }
  };
  
  // Function to calculate capital evolution
  const calculateSimulation = () => {
    const currentYear = new Date().getFullYear();
    const birthYear = getBirthYear();

    // Calculate retirement start year based on input
    const calculatedRetirementStartYear = getRetirementYear();

    // Calculate retirement duration based on max age or default
    const targetMaxAge = withdrawalMode === "age" ? maxAge : 95;
    const retirementStartAge = calculatedRetirementStartYear - birthYear;
    const retirementDuration = targetMaxAge - retirementStartAge;
    
    const retirementStartIndex = calculatedRetirementStartYear - currentYear;
    const simulationDuration = targetMaxAge - currentAge;
    
    let capital = initialCapital;
    let capitalWithoutInterest = initialCapital;
    const data = [];
    
    const monthlyReturn = annualReturnRate / 100 / 12;
    const monthlyInflation = inflation / 100 / 12;
    
    // If we're in "age" mode, we need to calculate the maximum sustainable withdrawal
    let currentMonthlyWithdrawal;
    
    if (withdrawalMode === "age") {
      // We need to estimate the maximum sustainable monthly withdrawal
      // This is a simplified approach - find the withdrawal that depletes funds at target age
      // A more sophisticated approach would use a binary search algorithm
      
      // First get the capital at retirement
      let simulatedCapital = initialCapital;
      for (let year = 0; year < retirementStartIndex; year++) {
        let currentMonthlyInvestment = monthlyInvestment;
        for (let month = 0; month < 12; month++) {
          // Compound interest
          simulatedCapital += simulatedCapital * monthlyReturn;
          // Add monthly investment
          simulatedCapital += currentMonthlyInvestment;
          // Adjust for inflation
          currentMonthlyInvestment *= (1 + monthlyInflation);
        }
      }
      
      // Now estimate sustainable withdrawal (simplified approximation)
      // PMT formula: PMT = PV * r / (1 - (1 + r)^-n)
      // Where:
      // PMT = monthly payment (withdrawal)
      // PV = present value (capital at retirement)
      // r = monthly return adjusted for inflation
      // n = number of months
      
      // Adjust monthly return for inflation
      const adjustedMonthlyReturn = (monthlyReturn - monthlyInflation) > 0 
        ? (monthlyReturn - monthlyInflation) 
        : 0.0001; // Avoid negative or zero values
      
      const numberOfMonths = retirementDuration * 12;
      
      // Calculate maximum sustainable withdrawal (simplified)
      // This is an approximation - it doesn't account for compound inflation perfectly
      const denominator = 1 - Math.pow(1 + adjustedMonthlyReturn, -numberOfMonths);
      let calculatedWithdrawal;
      
      if (denominator <= 0 || numberOfMonths <= 0) {
        // Fallback for edge cases
        calculatedWithdrawal = simulatedCapital / numberOfMonths;
      } else {
        calculatedWithdrawal = simulatedCapital * adjustedMonthlyReturn / denominator;
      }
      
      // Ensure a reasonable value and set it
      currentMonthlyWithdrawal = Math.max(calculatedWithdrawal, 10);
      
      // Update the state variable for UI display
      if (!isNaN(currentMonthlyWithdrawal) && isFinite(currentMonthlyWithdrawal)) {
        setMonthlyRetirementWithdrawal(Math.round(currentMonthlyWithdrawal));
      }
    } else {
      // In amount mode, use the specified withdrawal
      currentMonthlyWithdrawal = monthlyRetirementWithdrawal;
    }
    
    // Now proceed with the main simulation
    let currentMonthlyInvestment = monthlyInvestment;
    
    for (let year = 0; year <= simulationDuration; year++) {
      const simulatedYear = currentYear + year;
      const age = currentAge + year;
      const inRetirementPhase = simulatedYear >= calculatedRetirementStartYear;
      let capitalAtStart = capital;
      let annualInvestment = 0;
      let annualWithdrawal = 0;
      let annualInterest = 0;
      
      // Month by month calculation for the year
      for (let month = 0; month < 12; month++) {
        // Monthly compound interest
        const interest = capital * monthlyReturn;
        annualInterest += interest;
        capital += interest;
        
        // Add monthly investment or withdraw for retirement
        if (!inRetirementPhase) {
          capital += currentMonthlyInvestment;
          capitalWithoutInterest += currentMonthlyInvestment;
          annualInvestment += currentMonthlyInvestment;
          
          // Adjust investment with inflation for next month
          currentMonthlyInvestment *= (1 + monthlyInflation);
        } else if (inRetirementPhase) {
          capital -= currentMonthlyWithdrawal;
          capitalWithoutInterest -= currentMonthlyWithdrawal;
          annualWithdrawal += currentMonthlyWithdrawal;
          
          // Adjust withdrawal with inflation for next month
          currentMonthlyWithdrawal *= (1 + monthlyInflation);
        }
        
        // If capital becomes negative, set it to zero
        if (capital < 0) capital = 0;
        if (capitalWithoutInterest < 0) capitalWithoutInterest = 0;
      }
      
      const capitalVariation = capital - capitalAtStart;
      const netVariationExcludingInterest = inRetirementPhase ? -annualWithdrawal : annualInvestment;
      
      // Add year data to the chart
      data.push({
        year: simulatedYear,
        age: age,
        capital: Math.round(capital),
        capitalWithoutInterest: Math.round(capitalWithoutInterest),
        variation: Math.round(capitalVariation),
        retirement: inRetirementPhase ? "Yes" : "No",
        annualInvestment: Math.round(annualInvestment),
        annualWithdrawal: Math.round(annualWithdrawal),
        annualInterest: Math.round(annualInterest),
        netVariationExcludingInterest: Math.round(netVariationExcludingInterest),
        finalMonthlyInvestment: Math.round(currentMonthlyInvestment),
        finalMonthlyWithdrawal: Math.round(currentMonthlyWithdrawal)
      });
      
      // If capital is depleted, stop simulation
      if (capital <= 0) break;
    }
    
    setGraphData(data);
  };
  
  // Recalculate simulation whenever a parameter changes
  useEffect(() => {
    calculateSimulation();
  }, [
    initialCapital, 
    monthlyInvestment, 
    annualReturnRate, 
    inflation, 
    withdrawalMode === "amount" ? monthlyRetirementWithdrawal : null, 
    currentAge,
    retirementInput,
    withdrawalMode,
    withdrawalMode === "age" ? maxAge : null
  ]);
  
  // Format numbers for display
  const formatAmount = (amount) => {
    if (currency === "EUR") {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
  };
  
  // Calculate some statistics for the summary
  const finalCapital = graphData.length > 0 ? graphData[graphData.length - 1].capital : 0;
  
  // Calculate retirement start year and age
  const calculatedRetirementStartYear = getRetirementYear();
  const birthYear = getBirthYear();
  const retirementStartAge = calculatedRetirementStartYear - birthYear;
  
  // Calculate exhaustion year and age
  const isCapitalExhausted = graphData.length > 0 && graphData[graphData.length - 1].capital <= 0;
  const exhaustionYear = isCapitalExhausted ? graphData[graphData.length - 1].year : "Not exhausted";
  const exhaustionAge = isCapitalExhausted ? graphData[graphData.length - 1].age : null;
  
  // Calculate total invested amount (from now until retirement)
  const totalInvestedAmount = initialCapital + (monthlyInvestment * 12 * (calculatedRetirementStartYear - new Date().getFullYear()));
  
  // Calculate amount for retirement bar chart
  const lifeExpectancy = withdrawalMode === "age" ? maxAge : 95;
  const retirementDuration = lifeExpectancy - retirementStartAge;
  
  // Find capital at retirement
  const capitalAtRetirementIndex = graphData.findIndex(item => item.year >= calculatedRetirementStartYear);
  const capitalAtRetirement = capitalAtRetirementIndex !== -1 
    ? graphData[capitalAtRetirementIndex].capital 
    : 0;
  
  // Estimate needed capital (conservative approach with inflation)
  const avgInflationFactor = Math.pow(1 + (inflation / 100), retirementDuration / 2);
  const neededMonthlyWithdrawal = monthlyRetirementWithdrawal * avgInflationFactor;
  const totalNeededCapital = neededMonthlyWithdrawal * 12 * retirementDuration;
  
  // Calculate inflation-adjusted total invested amount
  const calculateInflationAdjustedInvestment = () => {
    const retirementTimespan = calculatedRetirementStartYear - new Date().getFullYear();
    // Use half the period for average adjustment (approximation for regular investments)
    const avgInflationFactor = Math.pow(1 + (inflation / 100), retirementTimespan / 2);
    return totalInvestedAmount / avgInflationFactor;
  };
  
  const inflationAdjustedInvestment = calculateInflationAdjustedInvestment();
  
  // Calculate inflation-adjusted final capital (present value)
  const calculateInflationAdjustedCapital = () => {
    if (graphData.length === 0) return 0;
    
    const finalYear = graphData[graphData.length - 1].year;
    const currentYear = new Date().getFullYear();
    const years = finalYear - currentYear;
    
    // Calculate cumulative inflation factor
    const inflationFactor = Math.pow(1 + (inflation / 100), years);
    
    // Return inflation-adjusted value (present value)
    return finalCapital / inflationFactor;
  };
  
  const inflationAdjustedCapital = calculateInflationAdjustedCapital();
  
  // Calculate max value for proportional bar charts
  const maxBarValue = Math.max(capitalAtRetirement, totalNeededCapital);
  const haveBarHeight = maxBarValue > 0 ? (capitalAtRetirement / maxBarValue) * 100 : 0;
  const needBarHeight = maxBarValue > 0 ? (totalNeededCapital / maxBarValue) * 100 : 0;
  
  // Find the final monthly investment value (right before retirement)
  const getPreRetirementData = () => {
    const preRetirementYearData = graphData.find(item => item.year === calculatedRetirementStartYear - 1);
    return preRetirementYearData?.finalMonthlyInvestment || monthlyInvestment;
  };
  
  // Get final monthly investment value
  const finalMonthlyInvestment = graphData.length > 0 ? getPreRetirementData() : monthlyInvestment;
  
  // Get final monthly withdrawal value
  const finalMonthlyWithdrawalValue = graphData.length > 0 
    ? graphData[graphData.length - 1].finalMonthlyWithdrawal 
    : monthlyRetirementWithdrawal;
  
  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Retirement Investment Simulator</h1>
      
      {/* Simulation parameters - Now full width */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Parameters</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Left column */}
          <div className="space-y-3 sm:space-y-4">
            {/* Currency selector */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <div className="flex items-center">
                <h3 className="text-sm sm:text-md font-medium text-gray-700 mr-3 sm:mr-4">Currency</h3>
                <div className="flex items-center ml-auto">
                  <span className={`mr-2 text-xs sm:text-sm ${currency === "USD" ? "font-medium" : "text-gray-500"}`}>USD ($)</span>
                  <div 
                    className="relative inline-block w-10 sm:w-12 h-5 sm:h-6 transition duration-200 ease-in-out rounded-full cursor-pointer"
                    onClick={() => setCurrency(currency === "USD" ? "EUR" : "USD")}
                  >
                    <div 
                      className={`absolute left-0 top-0 w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors duration-200 ease-in-out ${currency === "EUR" ? "bg-blue-500" : "bg-gray-300"}`}
                    ></div>
                    <div 
                      className={`absolute left-0 top-0 w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full transition-transform duration-200 ease-in-out transform shadow-md ${currency === "EUR" ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}`}
                    ></div>
                  </div>
                  <span className={`ml-2 text-xs sm:text-sm ${currency === "EUR" ? "font-medium" : "text-gray-500"}`}>EUR (€)</span>
                </div>
              </div>
            </div>
            
            {/* Initial values */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Initial Values</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-blue-50 rounded p-2">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Initial Capital
                  </label>
                  <input
                    type="text"
                    value={initialCapital.toLocaleString('en-US')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                      if (/^\d*$/.test(value)) {
                        setInitialCapital(Number(value));
                      }
                    }}
                    className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
                
                <div className="bg-blue-50 rounded p-2">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Monthly Investment
                  </label>
                  <input
                    type="text"
                    value={monthlyInvestment.toLocaleString('en-US')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                      if (/^\d*$/.test(value)) {
                        setMonthlyInvestment(Number(value));
                      }
                    }}
                    className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Market conditions */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Market Conditions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-yellow-50 rounded p-2">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Return (%/year)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={annualReturnRate}
                    onChange={(e) => setAnnualReturnRate(Number(e.target.value))}
                    className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-yellow-300 focus:border-yellow-500 focus:outline-none text-sm"
                  />
                </div>
                
                <div className="bg-yellow-50 rounded p-2">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Inflation (%/year)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inflation}
                    onChange={(e) => setInflation(Number(e.target.value))}
                    className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-yellow-300 focus:border-yellow-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-3 sm:space-y-4">
            {/* Retirement timeline */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Retirement Timeline</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-green-50 rounded p-2">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Current Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(Number(e.target.value))}
                    className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-green-300 focus:border-green-500 focus:outline-none text-sm"
                  />
                </div>
                
                <div className="bg-green-50 rounded p-2">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Retirement (age/year)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={retirementInput}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setRetirementInput(value);
                      }}
                      className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-green-300 focus:border-green-500 focus:outline-none text-sm"
                    />
                    <span className="ml-1 sm:ml-2 text-xs text-gray-500">
                      {isRetirementInputAge() ? 'age' : 'year'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Withdrawal settings */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Withdrawal Settings</h3>
              
              <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-0">Planning Mode:</label>
                <div className="flex border rounded overflow-hidden shadow-sm">
                  <button
                    type="button"
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm transition-colors duration-200 ${withdrawalMode === 'amount' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setWithdrawalMode('amount')}
                  >
                    Set Withdrawal
                  </button>
                  <button
                    type="button"
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm transition-colors duration-200 ${withdrawalMode === 'age' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    onClick={() => setWithdrawalMode('age')}
                  >
                    Set Target Age
                  </button>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded p-2">
                {withdrawalMode === 'amount' ? (
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      Monthly Withdrawal
                    </label>
                    <input
                      type="text"
                      value={monthlyRetirementWithdrawal.toLocaleString('en-US')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                        if (/^\d*$/.test(value)) {
                          setMonthlyRetirementWithdrawal(Number(value));
                        }
                      }}
                      className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      Target Max Age
                    </label>
                    <input
                      type="number"
                      min={retirementStartAge + 1}
                      max="120"
                      value={maxAge}
                      onChange={(e) => setMaxAge(Number(e.target.value))}
                      className="w-full p-1 sm:p-2 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results summary - Now full width */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Summary</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Left column */}
          <div className="space-y-3 sm:space-y-4">
            {/* Timeline section */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Timeline</h3>
              <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-1 sm:gap-y-2">
                <div className="text-xs sm:text-sm text-gray-600">Current Age:</div>
                <div className="text-xs sm:text-sm font-medium">{currentAge}</div>
                
                <div className="text-xs sm:text-sm text-gray-600">Birth Year:</div>
                <div className="text-xs sm:text-sm font-medium">{getBirthYear()}</div>
                
                <div className="text-xs sm:text-sm text-gray-600">Retirement Start:</div>
                <div className="text-xs sm:text-sm font-medium">{`${calculatedRetirementStartYear} (Age ${retirementStartAge})`}</div>
                
                <div className="text-xs sm:text-sm text-gray-600">Life Expectancy:</div>
                <div className="text-xs sm:text-sm font-medium">Age {withdrawalMode === "age" ? maxAge : "95"} {withdrawalMode === "age" ? "(Target)" : "(Est.)"}</div>
              </div>
            </div>
            
            {/* Investment section */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Investment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs sm:text-sm text-gray-600">Total Invested (Nominal):</div>
                  <div className="text-sm sm:text-md font-medium">{formatAmount(totalInvestedAmount)}</div>
                </div>
                
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs sm:text-sm text-gray-600">Total Invested (Inflation Adjusted):</div>
                  <div className="text-sm sm:text-md font-medium">{formatAmount(inflationAdjustedInvestment)}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="space-y-3 sm:space-y-4">
            {/* Capital section */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Capital</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-xs sm:text-sm text-gray-600">Capital at Retirement:</div>
                  <div className="text-sm sm:text-md font-medium">{formatAmount(capitalAtRetirement)}</div>
                </div>
                
                <div className={`p-2 rounded ${finalCapital <= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className="text-xs sm:text-sm text-gray-600">Final Capital (Nominal):</div>
                  <div className={`text-sm sm:text-md font-medium ${finalCapital <= 0 ? 'text-red-600' : ''}`}>
                    {formatAmount(finalCapital)}
                  </div>
                </div>
                
                {finalCapital > 0 && (
                  <div className="bg-green-50 p-2 rounded sm:col-span-2">
                    <div className="text-xs sm:text-sm text-gray-600">Final Capital (Today's Value - Inflation Adjusted):</div>
                    <div className="text-sm sm:text-md font-medium">{formatAmount(inflationAdjustedCapital)}</div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3">
                <div className="text-xs sm:text-sm text-gray-600">Exhaustion Year:</div>
                <div className="text-xs sm:text-sm font-medium">
                  {exhaustionYear === "Not exhausted" 
                    ? exhaustionYear 
                    : `${exhaustionYear} (Age ${exhaustionAge})`
                  }
                </div>
              </div>
            </div>
            
            {/* Monthly values section */}
            <div className="bg-white p-2 sm:p-3 rounded shadow-sm">
              <h3 className="text-sm sm:text-md font-medium text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-3">Monthly Amounts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs sm:text-sm text-gray-600">Final Monthly Investment:</div>
                  <div className="text-sm sm:text-md font-medium">{formatAmount(finalMonthlyInvestment)}</div>
                </div>
                
                <div className="bg-blue-50 p-2 rounded">
                  <div className="text-xs sm:text-sm text-gray-600">Final Monthly Withdrawal:</div>
                  <div className="text-sm sm:text-md font-medium">{formatAmount(finalMonthlyWithdrawalValue)}</div>
                </div>
                
                {withdrawalMode === "age" && (
                  <div className="bg-purple-50 p-2 rounded sm:col-span-2">
                    <div className="text-xs sm:text-sm text-gray-600">Max Monthly Withdrawal:</div>
                    <div className="text-sm sm:text-md font-medium">{formatAmount(monthlyRetirementWithdrawal)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance summary - Full width */}
        {finalCapital > 0 ? (
          <div className="mt-4 bg-green-50 p-3 border border-green-200 rounded shadow-sm">
            <p className="font-medium text-green-800">
              Your capital should last throughout your expected lifetime.
            </p>
          </div>
        ) : (
          <div className="mt-4 bg-red-50 p-3 border border-red-200 rounded shadow-sm">
            <p className="font-medium text-red-800">
              Your capital will be depleted before reaching age 95. 
              {exhaustionAge && ` Expected depletion at age ${exhaustionAge}.`}
            </p>
          </div>
        )}
      </div>
      
      {/* Retirement Funding Comparison */}
      <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Retirement Funding Analysis</h2>
          <button 
            className={`px-4 py-2 rounded text-white ${showRetirementAnalysis ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => setShowRetirementAnalysis(!showRetirementAnalysis)}
          >
            {showRetirementAnalysis ? 'Hide Analysis' : 'Show Analysis'}
          </button>
        </div>
        
        <p className="text-gray-700 mb-4">
          {withdrawalMode === 'amount' ? (
            <>
              This analysis evaluates whether your retirement strategy will likely provide sufficient 
              funds to last throughout your expected lifetime.
              {!showRetirementAnalysis && (
                <span className="ml-2 text-blue-600">
                  {capitalAtRetirement >= totalNeededCapital 
                    ? "Your strategy appears on track!" 
                    : "Your strategy may need adjustment."}
                </span>
              )}
            </>
          ) : (
            <>
              This analysis calculates the maximum monthly withdrawal amount that will make your savings 
              last until your target age of {maxAge}.
              {!showRetirementAnalysis && (
                <span className="ml-2 text-blue-600">
                  Maximum sustainable withdrawal: {formatAmount(monthlyRetirementWithdrawal)}/month
                </span>
              )}
            </>
          )}
        </p>
        
        {showRetirementAnalysis && (
          <>
            {withdrawalMode === 'amount' ? (
              // Show comparison charts only in amount mode
              <div className="flex mt-6 space-x-8">
                <div className="flex-1 flex flex-col items-center">
                  <h3 className="font-medium text-lg mb-2">You Will Have</h3>
                  <div className="w-full bg-gray-100 rounded-lg relative h-64 flex items-end justify-center p-2">
                    <div 
                      className="bg-blue-500 w-3/4 rounded-t-lg text-white flex flex-col items-center justify-end transition-all duration-500 ease-in-out"
                      style={{ height: `${haveBarHeight}%` }}
                    >
                      <span className="font-bold text-lg mb-1">{formatAmount(capitalAtRetirement)}</span>
                      <span className="mb-2 text-sm">At Retirement</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center">
                  <h3 className="font-medium text-lg mb-2">You Will Need</h3>
                  <div className="w-full bg-gray-100 rounded-lg relative h-64 flex items-end justify-center p-2">
                    <div 
                      className="bg-red-400 w-3/4 rounded-t-lg text-white flex flex-col items-center justify-end transition-all duration-500 ease-in-out"
                      style={{ height: `${needBarHeight}%` }}
                    >
                      <span className="font-bold text-lg mb-1">{formatAmount(totalNeededCapital)}</span>
                      <span className="mb-2 text-sm">For {retirementDuration} Years</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // In age mode, show explanation of target age mode instead of charts
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h3 className="font-medium mb-2">Target Age Mode</h3>
                <p>
                  In this mode, the simulator calculates the maximum monthly withdrawal amount 
                  that would allow your funds to last exactly until age {maxAge}.
                </p>
                <p className="mt-2">
                  Based on your current savings, investment strategy, and retirement age, 
                  you can withdraw up to <span className="font-bold">{formatAmount(monthlyRetirementWithdrawal)}</span> per month.
                </p>
              </div>
            )}
            
            <div 
              className={`mt-6 p-4 rounded-lg ${
                withdrawalMode === 'amount' 
                  ? (capitalAtRetirement >= totalNeededCapital ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200')
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <h3 className="font-bold mb-2">
                {withdrawalMode === 'amount'
                  ? (capitalAtRetirement >= totalNeededCapital 
                      ? "Your Retirement Strategy Appears Sufficient" 
                      : "Your Retirement Strategy May Need Adjustment")
                  : "Sustainable Withdrawal Plan"
                }
              </h3>
              <p className="text-sm">
                {withdrawalMode === 'amount'
                  ? (capitalAtRetirement >= totalNeededCapital 
                      ? `Based on your current plan, you are projected to have ${formatAmount(capitalAtRetirement)} at retirement, which exceeds the estimated ${formatAmount(totalNeededCapital)} needed to maintain your desired lifestyle to age 95.` 
                      : `Your current strategy is projected to provide ${formatAmount(capitalAtRetirement)} at retirement, which is ${formatAmount(totalNeededCapital - capitalAtRetirement)} less than the estimated ${formatAmount(totalNeededCapital)} needed to maintain your desired lifestyle to age 95. ${exhaustionAge ? `Your funds will be depleted at age ${exhaustionAge}.` : ''} Consider increasing your monthly contributions, extending your investment timeline, or adjusting your expected retirement spending.`)
                  : `This withdrawal amount is calculated using time value of money principles, accounting for your investment returns (${annualReturnRate}%), inflation (${inflation}%), and desired target age (${maxAge}). Adjusting any of these factors will change the maximum sustainable withdrawal amount.`
                }
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Chart */}
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
              formatter={(value, name) => {
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
              name="Capital without Interest"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Detailed data table */}
      <div className="mt-4 sm:mt-6 bg-white p-2 sm:p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Show Schedule</h2>
          <button 
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded text-white text-xs sm:text-sm ${showSchedule ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={() => setShowSchedule(!showSchedule)}
          >
            {showSchedule ? 'Hide Schedule' : 'Show Schedule'}
          </button>
        </div>
        
        {showSchedule && (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-1 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-2 sm:px-6 py-1 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-2 sm:px-6 py-1 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capital
                    </th>
                    <th className="px-2 sm:px-6 py-1 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-2 sm:px-6 py-1 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Interest
                    </th>
                    <th className="px-2 sm:px-6 py-1 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      I/W
                    </th>
                    <th className="px-2 sm:px-6 py-1 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phase
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {graphData.map((entry, index) => (
                    <tr key={index} className={entry.retirement === "Yes" ? "bg-orange-50" : ""}>
                      <td className="px-2 sm:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {entry.year}
                      </td>
                      <td className="px-2 sm:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {entry.age}
                      </td>
                      <td className="px-2 sm:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {formatAmount(entry.capital)}
                      </td>
                      <td className={`px-2 sm:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm ${entry.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.variation >= 0 ? '+' : ''}{formatAmount(entry.variation)}
                      </td>
                      <td className="px-2 sm:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-green-600 hidden sm:table-cell">
                        +{formatAmount(entry.annualInterest)}
                      </td>
                      <td className={`px-2 sm:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm ${entry.netVariationExcludingInterest >= 0 ? 'text-blue-600' : 'text-red-600'} hidden sm:table-cell`}>
                        {entry.netVariationExcludingInterest >= 0 ? '+' : ''}{formatAmount(entry.netVariationExcludingInterest)}
                      </td>
                      <td className="px-2 sm:px-6 py-1 sm:py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {entry.retirement === "Yes" ? "Ret." : "Inv."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetirementSimulator;
