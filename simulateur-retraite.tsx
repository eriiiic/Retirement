import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  
  // Format numbers for display based on currency
  const formatAmount = useCallback((amount) => {
    if (currency === "EUR") {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
  }, [currency]);
  
  // Timeline calculations
  const getBirthYear = useCallback(() => {
    const currentYear = new Date().getFullYear();
    return currentYear - currentAge;
  }, [currentAge]);
  
  const isRetirementInputAge = useCallback(() => {
    const input = Number(retirementInput);
    return (input > 0 && input < 120 && retirementInput.length <= 2) || 
           !(retirementInput.length === 4 && retirementInput.startsWith('20'));
  }, [retirementInput]);
  
  const getRetirementYear = useCallback(() => {
    if (isRetirementInputAge()) {
      return new Date().getFullYear() + (Number(retirementInput) - currentAge);
    } else {
      return Number(retirementInput);
    }
  }, [isRetirementInputAge, retirementInput, currentAge]);
  
  // Calculate simulation data
  const calculateSimulation = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const birthYear = getBirthYear();
    const calculatedRetirementStartYear = getRetirementYear();
    const targetMaxAge = withdrawalMode === "age" ? maxAge : 95;
    const retirementStartAge = calculatedRetirementStartYear - birthYear;
    const retirementDuration = targetMaxAge - retirementStartAge;
    const retirementStartIndex = calculatedRetirementStartYear - currentYear;
    const simulationDuration = targetMaxAge - currentAge;
    
    const data = [];
    
    // Constant rate calculations
    const monthlyReturn = annualReturnRate / 100 / 12;
    const monthlyInflation = inflation / 100 / 12;
    const yearlyCompoundFactor = (1 + annualReturnRate / 100);
    
    // Calculate capital at retirement (for age mode)
    let currentMonthlyWithdrawal;
    let capitalAtRetirement = 0;
    
    // Calculate capital at retirement (optimized)
    if (inflation === 0) {
      // Without inflation, use future value formula directly
      const effectiveYears = retirementStartIndex;
      capitalAtRetirement = initialCapital * Math.pow(yearlyCompoundFactor, effectiveYears);
      
      // Add contributions with compound interest
      const annualInvestment = monthlyInvestment * 12;
      if (annualReturnRate !== 0) {
        capitalAtRetirement += annualInvestment * (Math.pow(yearlyCompoundFactor, effectiveYears) - 1) / (annualReturnRate / 100);
      } else {
        capitalAtRetirement += annualInvestment * effectiveYears;
      }
    } else {
      // With inflation, simulate monthly
      let simulatedCapital = initialCapital;
      let currentMonthlyInv = monthlyInvestment;
      
      for (let year = 0; year < retirementStartIndex; year++) {
        for (let month = 0; month < 12; month++) {
          simulatedCapital += simulatedCapital * monthlyReturn;
          simulatedCapital += currentMonthlyInv;
          currentMonthlyInv *= (1 + monthlyInflation);
        }
      }
      
      capitalAtRetirement = simulatedCapital;
    }
    
    // Calculate sustainable withdrawal amount in age mode
    if (withdrawalMode === "age") {
      const adjustedMonthlyReturn = Math.max((monthlyReturn - monthlyInflation), 0.0001);
      const numberOfMonths = retirementDuration * 12;
      const denominator = 1 - Math.pow(1 + adjustedMonthlyReturn, -numberOfMonths);
      
      let calculatedWithdrawal;
      if (denominator <= 0 || numberOfMonths <= 0) {
        calculatedWithdrawal = capitalAtRetirement / numberOfMonths;
      } else {
        calculatedWithdrawal = capitalAtRetirement * adjustedMonthlyReturn / denominator;
      }
      
      currentMonthlyWithdrawal = Math.max(calculatedWithdrawal, 10);
      
      if (!isNaN(currentMonthlyWithdrawal) && isFinite(currentMonthlyWithdrawal)) {
        setMonthlyRetirementWithdrawal(Math.round(currentMonthlyWithdrawal));
      }
    } else {
      currentMonthlyWithdrawal = monthlyRetirementWithdrawal;
    }
    
    // Main simulation
    let capital = initialCapital;
    // Start with initial capital for both versions
    let principalOnly = initialCapital; // Tracks only the principal (no interest)
    let currentMonthlyInvestment = monthlyInvestment;
    let totalInvested = initialCapital; // Track total money invested
    let totalWithdrawn = 0; // Track total withdrawals
    
    for (let year = 0; year <= simulationDuration; year++) {
      const simulatedYear = currentYear + year;
      const age = currentAge + year;
      const inRetirementPhase = simulatedYear >= calculatedRetirementStartYear;
      
      // Fast path: If capital is already zero, just add zero data points
      if (capital <= 0) {
        data.push({
          year: simulatedYear,
          age: age,
          capital: 0,
          capitalWithoutInterest: 0,
          variation: 0,
          retirement: inRetirementPhase ? "Yes" : "No",
          annualInvestment: 0,
          annualWithdrawal: 0,
          annualInterest: 0,
          netVariationExcludingInterest: 0,
          finalMonthlyInvestment: Math.round(currentMonthlyInvestment),
          finalMonthlyWithdrawal: Math.round(currentMonthlyWithdrawal),
          totalInvested,
          totalWithdrawn
        });
        continue;
      }
      
      // If we're at retirement exactly, update the capital but process the year normally
      if (simulatedYear === calculatedRetirementStartYear && year > 0) {
        // Update capital to the calculated retirement capital
        const capitalAtStart = capital;
        capital = capitalAtRetirement;
        
        // Don't continue - we need to process this year with withdrawals
      }
      
      let capitalAtStart = capital;
      let annualInvestment = 0;
      let annualWithdrawal = 0;
      let annualInterest = 0;
      
      // Monthly simulation - this provides accurate results with inflation changes
      for (let month = 0; month < 12; month++) {
        // Early termination check
        if (capital <= 0) {
          capital = 0;
          principalOnly = Math.max(0, totalInvested - totalWithdrawn);
          break;
        }
        
        // Monthly interest (only applied to the interest-bearing capital)
        const interest = capital * monthlyReturn;
        annualInterest += interest;
        capital += interest;
        
        if (!inRetirementPhase) {
          // Add investment to both capitals
          capital += currentMonthlyInvestment;
          annualInvestment += currentMonthlyInvestment;
          totalInvested += currentMonthlyInvestment;
          
          // Update monthly investment for inflation
          currentMonthlyInvestment *= (1 + monthlyInflation);
        } else {
          // Withdraw from both capitals
          capital -= currentMonthlyWithdrawal;
          annualWithdrawal += currentMonthlyWithdrawal;
          totalWithdrawn += currentMonthlyWithdrawal;
          
          // Update monthly withdrawal for inflation
          currentMonthlyWithdrawal *= (1 + monthlyInflation);
        }
        
        if (capital < 0) capital = 0;
      }
      
      // Calculate the principal-only capital (initial + investments - withdrawals)
      principalOnly = Math.max(0, totalInvested - totalWithdrawn);
      
      const capitalVariation = capital - capitalAtStart;
      const netVariationExcludingInterest = inRetirementPhase ? -annualWithdrawal : annualInvestment;
      
      data.push({
        year: simulatedYear,
        age: age,
        capital: Math.round(capital),
        capitalWithoutInterest: Math.round(principalOnly),
        variation: Math.round(capitalVariation),
        retirement: inRetirementPhase ? "Yes" : "No",
        annualInvestment: Math.round(annualInvestment),
        annualWithdrawal: Math.round(annualWithdrawal),
        annualInterest: Math.round(annualInterest),
        netVariationExcludingInterest: Math.round(netVariationExcludingInterest),
        finalMonthlyInvestment: Math.round(currentMonthlyInvestment),
        finalMonthlyWithdrawal: Math.round(currentMonthlyWithdrawal),
        totalInvested,
        totalWithdrawn
      });
      
      if (capital <= 0) break;
    }
    
    return data;
  }, [
    initialCapital, 
    monthlyInvestment, 
    annualReturnRate, 
    inflation, 
    currentAge,
    withdrawalMode,
    withdrawalMode === "amount" ? monthlyRetirementWithdrawal : null,
    withdrawalMode === "age" ? maxAge : null,
    retirementInput,
    getBirthYear,
    getRetirementYear,
    isRetirementInputAge,
    setMonthlyRetirementWithdrawal
  ]);
  
  // Calculate inflation-adjusted investment
  const calculateInflationAdjustedInvestment = useCallback((totalAmount, timespan) => {
    const avgInflationFactor = Math.pow(1 + (inflation / 100), timespan / 2);
    return totalAmount / avgInflationFactor;
  }, [inflation]);
  
  // Calculate inflation-adjusted capital
  const calculateInflationAdjustedCapital = useCallback((finalCapital, years) => {
    const inflationFactor = Math.pow(1 + (inflation / 100), years);
    return finalCapital / inflationFactor;
  }, [inflation]);
  
  // Use memoization for simulation data
  const calculatedData = useMemo(() => {
    return calculateSimulation();
  }, [calculateSimulation]);
  
  // Update graph data when calculation changes
  useEffect(() => {
    setGraphData(calculatedData);
  }, [calculatedData]);
  
  // Use memoization for derived statistics
  const statistics = useMemo(() => {
    // Basic timeline calculations
    const birthYear = getBirthYear();
    const calculatedRetirementStartYear = getRetirementYear();
    const retirementStartAge = calculatedRetirementStartYear - birthYear;
    const lifeExpectancy = withdrawalMode === "age" ? maxAge : 95;
    const retirementDuration = lifeExpectancy - retirementStartAge;
    
    // Capital calculations
    const finalCapital = graphData.length > 0 ? graphData[graphData.length - 1].capital : 0;
    const isCapitalExhausted = graphData.length > 0 && graphData[graphData.length - 1].capital <= 0;
    const exhaustionYear = isCapitalExhausted ? graphData[graphData.length - 1].year : "Not exhausted";
    const exhaustionAge = isCapitalExhausted ? graphData[graphData.length - 1].age : null;
    
    // Investment calculations
    const totalInvestedAmount = initialCapital + (monthlyInvestment * 12 * (calculatedRetirementStartYear - new Date().getFullYear()));
    
    // Find capital at retirement
    const capitalAtRetirementIndex = graphData.findIndex(item => item.year >= calculatedRetirementStartYear);
    const capitalAtRetirement = capitalAtRetirementIndex !== -1 
      ? graphData[capitalAtRetirementIndex].capital 
      : 0;
    
    // Estimate needed capital using Present Value of Annuity formula
    // This accounts for interest earned during retirement
    const calculateNeededCapital = () => {
      // Determine retirement duration
      let effectiveRetirementDuration = retirementDuration;
      
      // For amount mode with capital depletion, use the actual depletion timespan
      if (withdrawalMode === "amount" && isCapitalExhausted) {
        const retirementYearIndex = graphData.findIndex(item => item.retirement === "Yes");
        const exhaustionIndex = graphData.length - 1;
        
        if (retirementYearIndex !== -1) {
          effectiveRetirementDuration = exhaustionIndex - retirementYearIndex + 1;
        }
      }
      
      // Number of months in retirement
      const numberOfMonths = effectiveRetirementDuration * 12;
      
      // Account for inflation on withdrawals (use average inflation adjustment)
      const avgInflationFactor = Math.pow(1 + (inflation / 100), effectiveRetirementDuration / 2);
      const inflationAdjustedMonthlyWithdrawal = monthlyRetirementWithdrawal * avgInflationFactor;
      
      // Calculate real monthly return rate (adjusted for inflation)
      const monthlyReturn = annualReturnRate / 100 / 12;
      const monthlyInflation = inflation / 100 / 12;
      const realMonthlyReturn = (monthlyReturn - monthlyInflation) > 0 
        ? (monthlyReturn - monthlyInflation) 
        : 0.0001; // Avoid negative or zero rates
        
      // Use Present Value of Annuity formula: PV = PMT * (1 - (1+r)^-n) / r
      // This gives the amount needed today to fund the withdrawals, accounting for interest
      if (realMonthlyReturn <= 0 || numberOfMonths <= 0) {
        // Fallback for edge cases - simple multiplication
        return inflationAdjustedMonthlyWithdrawal * numberOfMonths;
      } else {
        const denominator = 1 - Math.pow(1 + realMonthlyReturn, -numberOfMonths);
        if (denominator <= 0) {
          return inflationAdjustedMonthlyWithdrawal * numberOfMonths;
        }
        return inflationAdjustedMonthlyWithdrawal * denominator / realMonthlyReturn;
      }
    };
    
    const totalNeededCapital = calculateNeededCapital();
    
    // Inflation-adjusted values
    const retirementTimespan = calculatedRetirementStartYear - new Date().getFullYear();
    const inflationAdjustedInvestment = calculateInflationAdjustedInvestment(totalInvestedAmount, retirementTimespan);
    
    let inflationAdjustedCapital = 0;
    if (graphData.length > 0 && finalCapital > 0) {
      const finalYear = graphData[graphData.length - 1].year;
      const currentYear = new Date().getFullYear();
      const years = finalYear - currentYear;
      inflationAdjustedCapital = calculateInflationAdjustedCapital(finalCapital, years);
    }
    
    // Chart values
    const maxBarValue = Math.max(capitalAtRetirement, totalNeededCapital);
    const haveBarHeight = maxBarValue > 0 ? (capitalAtRetirement / maxBarValue) * 100 : 0;
    const needBarHeight = maxBarValue > 0 ? (totalNeededCapital / maxBarValue) * 100 : 0;
    
    // Monthly values
    const getPreRetirementData = () => {
      const preRetirementYearData = graphData.find(item => item.year === calculatedRetirementStartYear - 1);
      return preRetirementYearData?.finalMonthlyInvestment || monthlyInvestment;
    };
    
    const finalMonthlyInvestment = graphData.length > 0 ? getPreRetirementData() : monthlyInvestment;
    const finalMonthlyWithdrawalValue = graphData.length > 0 
      ? graphData[graphData.length - 1].finalMonthlyWithdrawal 
      : monthlyRetirementWithdrawal;
    
    return {
      birthYear,
      calculatedRetirementStartYear,
      retirementStartAge,
      finalCapital,
      isCapitalExhausted,
      exhaustionYear,
      exhaustionAge,
      totalInvestedAmount,
      lifeExpectancy,
      retirementDuration,
      capitalAtRetirement,
      totalNeededCapital,
      inflationAdjustedInvestment,
      inflationAdjustedCapital,
      maxBarValue,
      haveBarHeight,
      needBarHeight,
      finalMonthlyInvestment,
      finalMonthlyWithdrawalValue
    };
  }, [
    graphData, 
    initialCapital, 
    monthlyInvestment, 
    inflation, 
    monthlyRetirementWithdrawal,
    withdrawalMode,
    maxAge,
    calculateInflationAdjustedInvestment,
    calculateInflationAdjustedCapital,
    getBirthYear,
    getRetirementYear
  ]);
  
  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Retirement Investment Simulator</h1>
      
      {/* Parameters section - iOS Style */}
      <div className="p-4 bg-gray-50 rounded-2xl shadow mb-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Parameters</h2>
        
        {/* Currency Selector - iOS Style */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Currency</label>
            <div className="bg-gray-200 rounded-lg p-0.5 flex">
              <button 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "USD" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700'}`}
                onClick={() => setCurrency("USD")}
              >
                USD
              </button>
              <button 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${currency === "EUR" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700'}`}
                onClick={() => setCurrency("EUR")}
              >
                EUR
              </button>
            </div>
          </div>
        </div>
        
        {/* Initial Values Group */}
        <div className="mb-5 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Initial Values</h3>
          
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
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between items-center mt-1">
              <input
                type="text"
                value={initialCapital.toLocaleString('en-US')}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                  if (/^\d*$/.test(value)) {
                    setInitialCapital(Number(value));
                  }
                }}
                className="w-24 p-2 bg-gray-100 rounded-lg text-sm border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none text-right"
              />
              <span className="text-xs text-gray-500">Starting amount</span>
            </div>
          </div>
          
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
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between items-center mt-1">
              <input
                type="text"
                value={monthlyInvestment.toLocaleString('en-US')}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                  if (/^\d*$/.test(value)) {
                    setMonthlyInvestment(Number(value));
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
                onChange={(e) => setAnnualReturnRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">0%</span>
                <span className="text-xs text-gray-500">15%</span>
              </div>
            </div>
            
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
                onChange={(e) => setInflation(Number(e.target.value))}
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
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">18</span>
                <span className="text-xs text-gray-500">80</span>
              </div>
            </div>
            
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
                onChange={(e) => setRetirementInput(e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-1">
                <input
                  type="text"
                  value={retirementInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setRetirementInput(value);
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
                  onClick={() => setWithdrawalMode("amount")}
                >
                  Set Amount
                </button>
                <button 
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${withdrawalMode === "age" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-700'}`}
                  onClick={() => setWithdrawalMode("age")}
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
                onChange={(e) => setMonthlyRetirementWithdrawal(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between items-center mt-1">
                <input
                  type="text"
                  value={monthlyRetirementWithdrawal.toLocaleString('en-US')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '').replace(/,/g, '');
                    if (/^\d*$/.test(value)) {
                      setMonthlyRetirementWithdrawal(Number(value));
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
                onChange={(e) => setMaxAge(Number(e.target.value))}
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
      
      {/* Results summary - iOS Style */}
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
              {statistics.isCapitalExhausted ? (
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
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <div>Age {currentAge}</div>
              <div>Age {statistics.lifeExpectancy}</div>
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
        <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Amounts</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Monthly Investment</div>
              <div className="text-lg font-semibold text-blue-600">{formatAmount(monthlyInvestment)}</div>
              <div className="text-xs text-gray-500 mt-1">Current</div>
              <div className="text-sm font-medium text-gray-600 mt-1">{formatAmount(statistics.finalMonthlyInvestment)}</div>
              <div className="text-xs text-gray-500">Final (inflation adjusted)</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Monthly Withdrawal</div>
              <div className="text-lg font-semibold text-purple-600">{formatAmount(monthlyRetirementWithdrawal)}</div>
              <div className="text-xs text-gray-500 mt-1">Current</div>
              <div className="text-sm font-medium text-gray-600 mt-1">{formatAmount(statistics.finalMonthlyWithdrawalValue)}</div>
              <div className="text-xs text-gray-500">Final (inflation adjusted)</div>
            </div>
          </div>
        </div>
        
        {/* Analysis Card */}
        {statistics.finalCapital > 0 ? (
          <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800 mb-2">Your Plan Is On Track</h3>
                <p className="text-xs text-green-700">
                  Based on your current investment strategy, your capital should last throughout your expected lifetime until age {statistics.lifeExpectancy}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 rounded-xl shadow-sm p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0 mr-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-2">Adjustment Needed</h3>
                <p className="text-xs text-red-700">
                  Your capital will be depleted by age {statistics.exhaustionAge}, before reaching your life expectancy of {statistics.lifeExpectancy}. Consider increasing your savings, adjusting your retirement age, or reducing your planned withdrawals.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Retirement Funding Analysis - iOS Style */}
      <div className="p-4 bg-gray-50 rounded-2xl shadow mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Retirement Funding Analysis</h2>
          <button 
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${showRetirementAnalysis ? 'bg-gray-300 text-gray-700' : 'bg-blue-500 text-white'}`}
            onClick={() => setShowRetirementAnalysis(!showRetirementAnalysis)}
          >
            {showRetirementAnalysis ? 'Hide Details' : 'View Details'}
          </button>
        </div>
        
        {/* Mode Description */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
            <h3 className="text-sm font-semibold text-gray-800">Planning Strategy</h3>
          </div>
          
          {withdrawalMode === 'amount' ? (
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3 bg-blue-100 rounded-full p-2">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  You've set a monthly withdrawal amount of <span className="font-semibold text-blue-600">{formatAmount(monthlyRetirementWithdrawal)}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {!showRetirementAnalysis && (
                    <span>
                      {statistics.capitalAtRetirement >= statistics.totalNeededCapital 
                        ? "Your strategy appears on track for your lifetime." 
                        : "Your strategy may need adjustment to last your lifetime."}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3 bg-purple-100 rounded-full p-2">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  You've set a target age of <span className="font-semibold text-purple-600">{maxAge}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {!showRetirementAnalysis && (
                    <span>
                      With your current plan, you can withdraw up to <span className="font-semibold">{formatAmount(monthlyRetirementWithdrawal)}</span> monthly.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {showRetirementAnalysis && (
          <>
            {withdrawalMode === 'amount' ? (
              // Capital Comparison Card - iOS Style
              <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Capital Analysis</h3>
                
                <div className="flex mb-6">
                  <div className="w-1/2 px-2">
                    <div className="bg-blue-50 rounded-xl p-3 h-full flex flex-col items-center justify-center">
                      <div className="text-xs text-gray-500 mb-2">You Will Have</div>
                      <div className="text-xl font-semibold text-blue-600">{formatAmount(statistics.capitalAtRetirement)}</div>
                      <div className="text-xs text-gray-500 mt-1">At Retirement</div>
                      <div className="mt-3 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <div 
                          className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold"
                          style={{ 
                            transform: `scale(${Math.min(statistics.capitalAtRetirement / statistics.totalNeededCapital, 1)})`,
                            transition: 'transform 0.3s ease-in-out'
                          }}
                        >
                          {Math.round(statistics.capitalAtRetirement / statistics.totalNeededCapital * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-1/2 px-2">
                    <div className="bg-gray-50 rounded-xl p-3 h-full flex flex-col items-center justify-center">
                      <div className="text-xs text-gray-500 mb-2">Required Capital</div>
                      <div className="text-xl font-semibold text-gray-700">{formatAmount(statistics.totalNeededCapital)}</div>
                      <div className="text-xs text-gray-500 mt-1">For {statistics.effectiveRetirementDuration || statistics.retirementDuration} Years</div>
                      <div className="mt-3 w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">
                          100%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Capital Sufficiency Bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Capital Sufficiency</span>
                    <span className="text-xs font-medium text-gray-700">
                      {Math.min(Math.round(statistics.capitalAtRetirement / statistics.totalNeededCapital * 100), 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${statistics.capitalAtRetirement >= statistics.totalNeededCapital ? 'bg-green-500' : 'bg-orange-500'}`} 
                      style={{ width: `${Math.min(statistics.capitalAtRetirement / statistics.totalNeededCapital * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              // Target Age Mode Explanation - iOS Style
              <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Monthly Withdrawal Analysis</h3>
                
                <div className="bg-purple-50 p-4 rounded-xl mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        In this mode, the simulator calculates the maximum monthly withdrawal amount 
                        that would allow your funds to last exactly until age {maxAge}.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Sustainable Withdrawal */}
                <div className="rounded-xl bg-white border border-purple-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-purple-800">Sustainable Monthly Withdrawal</h4>
                    <div className="text-lg font-bold text-purple-700">{formatAmount(monthlyRetirementWithdrawal)}</div>
                  </div>
                  
                  <div className="flex items-start space-x-2 mt-2">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600">
                      This calculation uses time value of money principles, accounting for your investment 
                      returns ({annualReturnRate}%), inflation ({inflation}%), and target age ({maxAge}).
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Conclusion/Recommendation Card - iOS Style */}
            <div 
              className={`rounded-xl shadow-sm p-4 ${
                withdrawalMode === 'amount' 
                  ? (statistics.capitalAtRetirement >= statistics.totalNeededCapital ? 'bg-green-50 border border-green-100' : 'bg-orange-50 border border-orange-100')
                  : 'bg-blue-50 border border-blue-100'
              }`}
            >
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                {withdrawalMode === 'amount'
                  ? (statistics.capitalAtRetirement >= statistics.totalNeededCapital 
                      ? (
                        <>
                          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-green-800">Your Retirement Strategy Appears Sufficient</span>
                        </>
                      ) 
                      : (
                        <>
                          <svg className="h-5 w-5 text-orange-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-orange-800">Your Retirement Strategy May Need Adjustment</span>
                        </>
                      ))
                  : (
                    <>
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-800">Sustainable Withdrawal Plan</span>
                    </>
                  )
                }
              </h3>
              
              <p className="text-sm">
                {withdrawalMode === 'amount'
                  ? (statistics.capitalAtRetirement >= statistics.totalNeededCapital 
                      ? `Based on your current plan, you are projected to have ${formatAmount(statistics.capitalAtRetirement)} at retirement, which exceeds the estimated ${formatAmount(statistics.totalNeededCapital)} needed to maintain your desired lifestyle to age ${statistics.lifeExpectancy}.` 
                      : `Your current strategy is projected to provide ${formatAmount(statistics.capitalAtRetirement)} at retirement, which is ${formatAmount(statistics.totalNeededCapital - statistics.capitalAtRetirement)} less than the estimated ${formatAmount(statistics.totalNeededCapital)} needed to maintain your desired lifestyle to age ${statistics.lifeExpectancy}. ${statistics.exhaustionAge ? `Your funds will be depleted at age ${statistics.exhaustionAge}.` : ''} Consider increasing your monthly contributions, extending your investment timeline, or adjusting your expected retirement spending.`)
                  : `This withdrawal amount is calculated using time value of money principles, accounting for your investment returns (${annualReturnRate}%), inflation (${inflation}%), and desired target age (${maxAge}). Adjusting any of these factors will change the maximum sustainable withdrawal amount.`
                }
              </p>
              
              {withdrawalMode === 'amount' && statistics.capitalAtRetirement < statistics.totalNeededCapital && (
                <div className="mt-3 bg-white rounded-lg p-3">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">Recommended Actions</h4>
                  <ul className="text-xs text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <svg className="h-4 w-4 text-orange-500 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Increase your monthly investment by {formatAmount(Math.ceil((statistics.totalNeededCapital - statistics.capitalAtRetirement) / (12 * (statistics.calculatedRetirementStartYear - new Date().getFullYear()))))}.</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-4 w-4 text-orange-500 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Delay retirement by {Math.ceil((statistics.totalNeededCapital - statistics.capitalAtRetirement) / (12 * monthlyInvestment))} months.</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-4 w-4 text-orange-500 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Reduce monthly withdrawal needs by {formatAmount(Math.ceil((statistics.totalNeededCapital - statistics.capitalAtRetirement) / (12 * statistics.retirementDuration)))}.</span>
                    </li>
                  </ul>
                </div>
              )}
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
              name="Principal Only (No Interest)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Data table */}
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
    </div>
  );
};

export default RetirementSimulator;
