import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SimulatorParams, Statistics, GraphDataPoint } from './retirement/types';
import ParametersSection from './retirement/ParametersSection';
import ResultsSummary from './retirement/ResultsSummary';
import CapitalEvolutionChart from './retirement/CapitalEvolutionChart';
import ScheduleDetails from './retirement/ScheduleDetails';

const RetirementSimulator = () => {
  // Initialize simulator parameters
  const [params, setParams] = useState<SimulatorParams>({
    initialCapital: 10000,
    monthlyInvestment: 500,
    annualReturnRate: 5,
    inflation: 2,
    monthlyRetirementWithdrawal: 2000,
    currentAge: 40,
    retirementInput: "65",
    currency: "USD",
    withdrawalMode: "amount",
    maxAge: 95,
  });

  // State for chart data
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);

  // Format numbers for display based on currency
  const formatAmount = useCallback((amount: number): string => {
    if (params.currency === "EUR") {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }
  }, [params.currency]);

  // Timeline calculations
  const getBirthYear = useCallback((): number => {
    const currentYear = new Date().getFullYear();
    return currentYear - params.currentAge;
  }, [params.currentAge]);

  const isRetirementInputAnAge = useCallback((): boolean => {
    const input = Number(params.retirementInput);
    return (input > 0 && input < 120 && params.retirementInput.length <= 2) || 
           !(params.retirementInput.length === 4 && params.retirementInput.startsWith('20'));
  }, [params.retirementInput]);

  const getRetirementYear = useCallback((): number => {
    if (isRetirementInputAnAge()) {
      return new Date().getFullYear() + (Number(params.retirementInput) - params.currentAge);
    } else {
      return Number(params.retirementInput);
    }
  }, [isRetirementInputAnAge, params.retirementInput, params.currentAge]);

  // Refactor calculateSimulation into smaller functions
  const calculateCapitalAtRetirement = (retirementStartIndex: number, monthlyReturn: number, monthlyInflation: number): number => {
    let simulatedCapital = params.initialCapital;
    let currentMonthlyInv = params.monthlyInvestment;
    for (let year = 0; year < retirementStartIndex; year++) {
      for (let month = 0; month < 12; month++) {
        simulatedCapital += simulatedCapital * monthlyReturn;
        simulatedCapital += currentMonthlyInv;
        currentMonthlyInv *= (1 + monthlyInflation);
      }
    }
    return simulatedCapital;
  };

  const calculateWithdrawal = (capitalAtRetirement: number, retirementDuration: number, monthlyReturn: number, monthlyInflation: number): number => {
    const adjustedMonthlyReturn = Math.max((monthlyReturn - monthlyInflation), 0.0001);
    const numberOfMonths = retirementDuration * 12;
    const denominator = 1 - Math.pow(1 + adjustedMonthlyReturn, -numberOfMonths);
    let calculatedWithdrawal;
    if (denominator <= 0 || numberOfMonths <= 0) {
      calculatedWithdrawal = capitalAtRetirement / numberOfMonths;
    } else {
      calculatedWithdrawal = capitalAtRetirement * adjustedMonthlyReturn / denominator;
    }
    return Math.max(calculatedWithdrawal, 10);
  };

  // Calculate simulation data
  const calculateSimulation = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const birthYear = getBirthYear();
    const calculatedRetirementStartYear = getRetirementYear();
    const targetMaxAge = params.withdrawalMode === "age" ? params.maxAge : 95;
    const retirementStartAge = calculatedRetirementStartYear - birthYear;
    const retirementDuration = targetMaxAge - retirementStartAge;
    const retirementStartIndex = calculatedRetirementStartYear - currentYear;
    const simulationDuration = targetMaxAge - params.currentAge;
    
    const data: GraphDataPoint[] = [];
    
    // Constant rate calculations
    const monthlyReturn = params.annualReturnRate / 100 / 12;
    const monthlyInflation = params.inflation / 100 / 12;
    const yearlyCompoundFactor = (1 + params.annualReturnRate / 100);
    
    // Calculate capital at retirement
    let capitalAtRetirement = calculateCapitalAtRetirement(retirementStartIndex, monthlyReturn, monthlyInflation);
    
    // Main simulation
    let capital = params.initialCapital;
    let principalOnly = params.initialCapital;
    let currentMonthlyInvestment = params.monthlyInvestment;
    let totalInvested = params.initialCapital;
    let totalWithdrawn = 0;
    let isCapitalDepleted = false;
    
    // Define currentMonthlyWithdrawal in the main simulation loop
    let currentMonthlyWithdrawal = params.withdrawalMode === "age"
      ? calculateWithdrawal(calculateCapitalAtRetirement(retirementStartIndex, monthlyReturn, monthlyInflation), retirementDuration, monthlyReturn, monthlyInflation)
      : params.monthlyRetirementWithdrawal;

    for (let year = 0; year <= simulationDuration; year++) {
      const simulatedYear = currentYear + year;
      const age = params.currentAge + year;
      const inRetirementPhase = simulatedYear >= calculatedRetirementStartYear;
      
      if (capital <= 0) {
        isCapitalDepleted = true;
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
          totalWithdrawn,
          targetAge: age === targetMaxAge
        });
        continue;
      }
      
      if (simulatedYear === calculatedRetirementStartYear && year > 0) {
        capital = capitalAtRetirement;
      }
      
      let capitalAtStart = capital;
      let annualInvestment = 0;
      let annualWithdrawal = 0;
      let annualInterest = 0;
      
      for (let month = 0; month < 12; month++) {
        if (capital <= 0) {
          capital = 0;
          principalOnly = Math.max(0, totalInvested - totalWithdrawn);
          isCapitalDepleted = true;
          break;
        }
        
        const interest = capital * monthlyReturn;
        annualInterest += interest;
        capital += interest;
        
        if (!inRetirementPhase) {
          capital += currentMonthlyInvestment;
          annualInvestment += currentMonthlyInvestment;
          totalInvested += currentMonthlyInvestment;
          currentMonthlyInvestment *= (1 + monthlyInflation);
        } else {
          capital -= currentMonthlyWithdrawal;
          annualWithdrawal += currentMonthlyWithdrawal;
          totalWithdrawn += currentMonthlyWithdrawal;
          currentMonthlyWithdrawal *= (1 + monthlyInflation);
        }
        
        if (capital < 0) capital = 0;
      }
      
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
        totalWithdrawn,
        targetAge: age === targetMaxAge
      });
    }
    
    return data;
  }, [
    params.initialCapital, 
    params.monthlyInvestment, 
    params.annualReturnRate, 
    params.inflation, 
    params.currentAge,
    params.withdrawalMode,
    params.withdrawalMode === "amount" ? params.monthlyRetirementWithdrawal : null,
    params.withdrawalMode === "age" ? params.maxAge : null,
    params.retirementInput,
    getBirthYear,
    getRetirementYear,
    isRetirementInputAnAge,
  ]);

  // Use memoization for simulation data
  const calculatedData = useMemo(() => {
    return calculateSimulation();
  }, [calculateSimulation]);

  // Update graph data when calculation changes
  useEffect(() => {
    setGraphData(calculatedData);
  }, [calculatedData]);

  // Calculate inflation-adjusted investment
  const calculateInflationAdjustedInvestment = useCallback((totalAmount: number, timespan: number) => {
    const avgInflationFactor = Math.pow(1 + (params.inflation / 100), timespan / 2);
    return totalAmount / avgInflationFactor;
  }, [params.inflation]);

  // Calculate inflation-adjusted capital
  const calculateInflationAdjustedCapital = useCallback((finalCapital: number, years: number) => {
    const inflationFactor = Math.pow(1 + (params.inflation / 100), years);
    return finalCapital / inflationFactor;
  }, [params.inflation]);

  // Use memoization for derived statistics
  const statistics = useMemo(() => {
    const birthYear = getBirthYear();
    const calculatedRetirementStartYear = getRetirementYear();
    const retirementStartAge = calculatedRetirementStartYear - birthYear;
    const lifeExpectancy = params.withdrawalMode === "age" ? params.maxAge : 95;
    const retirementDuration = lifeExpectancy - retirementStartAge;
    
    const finalCapital = graphData.length > 0 ? graphData[graphData.length - 1].capital : 0;
    const isCapitalExhausted = graphData.length > 0 && graphData[graphData.length - 1].capital <= 0;
    const exhaustionYear = isCapitalExhausted ? graphData[graphData.length - 1].year : "Not exhausted";
    const exhaustionAge = isCapitalExhausted ? graphData[graphData.length - 1].age : retirementStartAge;
    
    const totalInvestedAmount = params.initialCapital + (params.monthlyInvestment * 12 * (calculatedRetirementStartYear - new Date().getFullYear()));
    
    const capitalAtRetirementIndex = graphData.findIndex(item => item.year >= calculatedRetirementStartYear);
    const capitalAtRetirement = capitalAtRetirementIndex !== -1 
      ? graphData[capitalAtRetirementIndex].capital 
      : 0;
    
    // Calculate needed capital
    const calculateNeededCapital = () => {
      let effectiveRetirementDuration = retirementDuration;
      
      if (params.withdrawalMode === "amount" && isCapitalExhausted) {
        const retirementYearIndex = graphData.findIndex(item => item.retirement === "Yes");
        const exhaustionIndex = graphData.length - 1;
        
        if (retirementYearIndex !== -1) {
          effectiveRetirementDuration = exhaustionIndex - retirementYearIndex + 1;
        }
      }
      
      const numberOfMonths = effectiveRetirementDuration * 12;
      const avgInflationFactor = Math.pow(1 + (params.inflation / 100), effectiveRetirementDuration / 2);
      const inflationAdjustedMonthlyWithdrawal = params.monthlyRetirementWithdrawal * avgInflationFactor;
      
      const monthlyReturn = params.annualReturnRate / 100 / 12;
      const monthlyInflation = params.inflation / 100 / 12;
      const realMonthlyReturn = (monthlyReturn - monthlyInflation) > 0 
        ? (monthlyReturn - monthlyInflation) 
        : 0.0001;
        
      if (realMonthlyReturn <= 0 || numberOfMonths <= 0) {
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
    
    const retirementTimespan = calculatedRetirementStartYear - new Date().getFullYear();
    const inflationAdjustedInvestment = calculateInflationAdjustedInvestment(totalInvestedAmount, retirementTimespan);
    
    let inflationAdjustedCapital = 0;
    if (graphData.length > 0 && finalCapital > 0) {
      const finalYear = graphData[graphData.length - 1].year;
      const currentYear = new Date().getFullYear();
      const years = finalYear - currentYear;
      inflationAdjustedCapital = calculateInflationAdjustedCapital(finalCapital, years);
    }
    
    const maxBarValue = Math.max(capitalAtRetirement, totalNeededCapital);
    const haveBarHeight = maxBarValue > 0 ? (capitalAtRetirement / maxBarValue) * 100 : 0;
    const needBarHeight = maxBarValue > 0 ? (totalNeededCapital / maxBarValue) * 100 : 0;
    
    const getPreRetirementData = () => {
      const preRetirementYearData = graphData.find(item => item.year === calculatedRetirementStartYear - 1);
      return preRetirementYearData?.finalMonthlyInvestment || params.monthlyInvestment;
    };
    
    const finalMonthlyInvestment = graphData.length > 0 ? getPreRetirementData() : params.monthlyInvestment;
    const finalMonthlyWithdrawalValue = graphData.length > 0 
      ? graphData[graphData.length - 1].finalMonthlyWithdrawal 
      : params.monthlyRetirementWithdrawal;
    
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
      finalMonthlyWithdrawalValue,
      effectiveRetirementDuration: retirementDuration
    } as Statistics;
  }, [
    graphData, 
    params.initialCapital, 
    params.monthlyInvestment, 
    params.inflation,
    params.monthlyRetirementWithdrawal,
    params.withdrawalMode,
    params.maxAge,
    params.annualReturnRate,
    getBirthYear,
    getRetirementYear,
    calculateInflationAdjustedInvestment,
    calculateInflationAdjustedCapital
  ]);

  // Handle parameter changes
  const handleParamChange = (key: keyof SimulatorParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Define necessary variables for useEffect
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const birthYear = getBirthYear();
    const calculatedRetirementStartYear = getRetirementYear();
    const targetMaxAge = params.withdrawalMode === "age" ? params.maxAge : 95;
    const retirementStartAge = calculatedRetirementStartYear - birthYear;
    const retirementDuration = targetMaxAge - retirementStartAge;
    const retirementStartIndex = calculatedRetirementStartYear - currentYear;
    
    const monthlyReturn = params.annualReturnRate / 100 / 12;
    const monthlyInflation = params.inflation / 100 / 12;

    const currentMonthlyWithdrawal = params.withdrawalMode === "age"
      ? calculateWithdrawal(calculateCapitalAtRetirement(retirementStartIndex, monthlyReturn, monthlyInflation), retirementDuration, monthlyReturn, monthlyInflation)
      : params.monthlyRetirementWithdrawal;

    if (!isNaN(currentMonthlyWithdrawal) && isFinite(currentMonthlyWithdrawal) && currentMonthlyWithdrawal !== params.monthlyRetirementWithdrawal) {
      setParams(prev => ({ ...prev, monthlyRetirementWithdrawal: Math.round(currentMonthlyWithdrawal) }));
    }
  }, [params.withdrawalMode, params.monthlyRetirementWithdrawal, params.maxAge, params.annualReturnRate, params.inflation, params.currentAge, params.retirementInput, getBirthYear, getRetirementYear]);

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
        Retirement Investment Simulator
      </h1>
      
      <ParametersSection 
        params={params}
        statistics={statistics}
        formatAmount={formatAmount}
        onParamChange={handleParamChange}
      />

      <ResultsSummary 
        statistics={statistics}
        params={params}
        formatAmount={formatAmount}
      />

      <CapitalEvolutionChart 
        graphData={graphData}
        formatAmount={formatAmount}
        currency={params.currency}
      />

      <ScheduleDetails 
        graphData={graphData}
        formatAmount={formatAmount}
      />
    </div>
  );
};

export default RetirementSimulator; 