import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SimulatorParams, Statistics, GraphDataPoint } from './retirement/types';
import ParametersSection from './retirement/ParametersSection';
import ResultsSummary from './retirement/ResultsSummary';
import CapitalEvolutionChart from './retirement/CapitalEvolutionChart';
import ScheduleDetails from './retirement/ScheduleDetails';
import Footer from './common/Footer';
import { 
  calculateFutureValue, 
  calculateWithdrawalAmount, 
  calculateCapitalNeeded,
  calculateInflationAdjustedValue,
  calculateRateBasedWithdrawal
} from '../utils/financialCalculations';

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
    compoundFrequency: 'monthly',
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
  const calculateCapitalAtRetirement = (retirementStartIndex: number, annualRate: number, inflation: number): number => {
    // Use the financial calculation utility for more accurate results
    return calculateFutureValue(
      params.initialCapital,
      annualRate,
      retirementStartIndex,
      params.monthlyInvestment,
      params.compoundFrequency
    );
  };

  const calculateWithdrawal = (capitalAtRetirement: number, retirementDuration: number, annualRate: number, inflation: number): number => {
    // Use the financial calculation utility for more accurate results
    return calculateWithdrawalAmount(
      capitalAtRetirement,
      annualRate,
      retirementDuration,
      inflation,
      params.compoundFrequency
    );
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
    
    // Constant rate calculations - convert annual rates to monthly or keep annual based on compoundFrequency
    const monthlyReturn = params.compoundFrequency === 'monthly'
      ? (Math.pow(1 + params.annualReturnRate / 100, 1/12) - 1)
      : (params.annualReturnRate / 100) / 12; // Simple division for annual compounding
    
    const monthlyInflation = (Math.pow(1 + params.inflation / 100, 1/12) - 1);
    
    // Calculate capital at retirement using financial utility with compound frequency
    let capitalAtRetirement = calculateCapitalAtRetirement(retirementStartIndex, params.annualReturnRate, params.inflation);
    
    // Main simulation
    let capital = params.initialCapital;
    let principalOnly = params.initialCapital;
    let currentMonthlyInvestment = params.monthlyInvestment;
    let totalInvested = params.initialCapital;
    let totalWithdrawn = 0;
    let isCapitalDepleted = false;
    
    // Define currentMonthlyWithdrawal using financial utility with compound frequency
    let currentMonthlyWithdrawal;
    if (params.withdrawalMode === "age") {
      currentMonthlyWithdrawal = calculateWithdrawalAmount(capitalAtRetirement, params.annualReturnRate, retirementDuration, params.inflation, params.compoundFrequency);
    } else if (params.withdrawalMode === "rate" && params.withdrawalRate) {
      // Calculate monthly withdrawal based on rate (annual rate / 12 months)
      currentMonthlyWithdrawal = calculateRateBasedWithdrawal(capitalAtRetirement, params.withdrawalRate);
    } else {
      currentMonthlyWithdrawal = params.monthlyRetirementWithdrawal;
    }

    // Generate data points for each year
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
      
      // Handle transition to retirement year
      const isTransitionYear = simulatedYear === calculatedRetirementStartYear;
      
      // Only set capital to calculated value at retirement year if we're not in the first year of simulation
      // This prevents overriding the initial capital in the first year
      if (isTransitionYear && year > 0) {
        // Instead of abruptly setting the capital, ensure a smooth transition
        // by calculating the natural growth from the previous year
        if (data.length > 0) {
          const previousYearCapital = data[data.length - 1].capital;
          // Calculate one year of growth with monthly compounding
          let naturalGrowth = previousYearCapital;
          const monthlyGrowthRate = monthlyReturn;
          
          // Apply monthly growth for 12 months
          for (let month = 0; month < 12; month++) {
            // Add monthly investment for pre-retirement months
            if (month < 6) {
              naturalGrowth += currentMonthlyInvestment;
            }
            // Apply interest
            naturalGrowth *= (1 + monthlyGrowthRate);
          }
          
          // Use the natural growth value if it's greater than the calculated retirement capital
          // This prevents any sudden drops in capital
          capital = Math.max(naturalGrowth, capitalAtRetirement);
        } else {
          capital = capitalAtRetirement;
        }
      }
      
      let capitalAtStart = capital;
      let annualInvestment = 0;
      let annualWithdrawal = 0;
      let annualInterest = 0;
      
      // Monthly calculations for the year
      if (params.compoundFrequency === 'monthly') {
        // Monthly compounding logic
        for (let month = 0; month < 12; month++) {
          if (capital <= 0) {
            capital = 0;
            principalOnly = Math.max(0, totalInvested - totalWithdrawn);
            isCapitalDepleted = true;
            break;
          }
          
          // Calculate interest for the month (compound interest)
          const interest = capital * monthlyReturn;
          annualInterest += interest;
          capital += interest;
          
          // For transition year, gradually shift from investment to withdrawal
          if (isTransitionYear) {
            // Default to mid-year (month 6) if we don't have specific birthday information
            // This creates a smoother transition by having half the year in investment phase
            // and half the year in retirement phase
            const retirementMonth = 6;
            
            if (month < retirementMonth) {
              // Still in investment phase for these months
              capital += currentMonthlyInvestment;
              annualInvestment += currentMonthlyInvestment;
              totalInvested += currentMonthlyInvestment;
            } else {
              // Switched to retirement phase
              // If using rate-based withdrawal, recalculate the monthly amount at the beginning of each month
              if (params.withdrawalMode === "rate" && params.withdrawalRate && month === 0) {
                // Recalculate monthly withdrawal based on current capital
                currentMonthlyWithdrawal = calculateRateBasedWithdrawal(capital, params.withdrawalRate);
              }
              capital -= currentMonthlyWithdrawal;
              annualWithdrawal += currentMonthlyWithdrawal;
              totalWithdrawn += currentMonthlyWithdrawal;
            }
          } else if (!inRetirementPhase) {
            // Regular investment phase
            capital += currentMonthlyInvestment;
            annualInvestment += currentMonthlyInvestment;
            totalInvested += currentMonthlyInvestment;
          } else {
            // Regular retirement phase
            // If using rate-based withdrawal, recalculate the monthly amount at the beginning of each month
            if (params.withdrawalMode === "rate" && params.withdrawalRate && month === 0) {
              // Recalculate monthly withdrawal based on current capital
              currentMonthlyWithdrawal = calculateRateBasedWithdrawal(capital, params.withdrawalRate);
            }
            capital -= currentMonthlyWithdrawal;
            annualWithdrawal += currentMonthlyWithdrawal;
            totalWithdrawn += currentMonthlyWithdrawal;
          }
          
          if (capital < 0) capital = 0;
        }
      } else {
        // Annual compounding logic
        if (capital <= 0) {
          capital = 0;
          principalOnly = Math.max(0, totalInvested - totalWithdrawn);
          isCapitalDepleted = true;
        } else {
          // For annual compounding, we add all contributions first, then apply interest once
          if (!inRetirementPhase) {
            // Investment phase - add annual investment
            const yearlyInvestment = currentMonthlyInvestment * 12;
            capital += yearlyInvestment;
            annualInvestment = yearlyInvestment;
            totalInvested += yearlyInvestment;
          } else if (isTransitionYear) {
            // Transition year - half investment, half withdrawal
            const halfYearInvestment = currentMonthlyInvestment * 6;
            const halfYearWithdrawal = currentMonthlyWithdrawal * 6;
            capital += halfYearInvestment;
            capital -= halfYearWithdrawal;
            annualInvestment = halfYearInvestment;
            annualWithdrawal = halfYearWithdrawal;
            totalInvested += halfYearInvestment;
            totalWithdrawn += halfYearWithdrawal;
          } else {
            // Retirement phase - annual withdrawal
            // If using rate-based withdrawal, recalculate the withdrawal amount annually
            if (params.withdrawalMode === "rate" && params.withdrawalRate) {
              // Recalculate monthly withdrawal based on current capital
              currentMonthlyWithdrawal = calculateRateBasedWithdrawal(capital, params.withdrawalRate);
            }
            const yearlyWithdrawal = currentMonthlyWithdrawal * 12;
            capital -= yearlyWithdrawal;
            annualWithdrawal = yearlyWithdrawal;
            totalWithdrawn += yearlyWithdrawal;
          }
          
          // Calculate annual interest all at once
          const interest = Math.max(0, capital) * (params.annualReturnRate / 100);
          annualInterest = interest;
          capital += interest;
        }
        
        if (capital < 0) capital = 0;
      }
      
      // Apply inflation adjustment at the end of each year
      if (!inRetirementPhase || isTransitionYear) {
        // Adjust monthly investment for inflation (annually)
        currentMonthlyInvestment *= (1 + params.inflation / 100);
      }
      
      if (inRetirementPhase || isTransitionYear) {
        // Adjust monthly withdrawal for inflation (annually)
        currentMonthlyWithdrawal *= (1 + params.inflation / 100);
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
    params.withdrawalMode === "rate" ? params.withdrawalRate : null,
    params.retirementInput,
    params.compoundFrequency,
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
  const calculateInflationAdjustedInvestment = useCallback((years: number): number => {
    // Use the financial calculation utility for more accurate results
    return calculateInflationAdjustedValue(
      params.monthlyInvestment,
      params.inflation,
      years
    );
  }, [params.monthlyInvestment, params.inflation]);

  // Calculate inflation-adjusted capital
  const calculateInflationAdjustedCapital = useCallback((capital: number, years: number): number => {
    // Use the financial calculation utility for more accurate results
    return calculateInflationAdjustedValue(
      capital,
      params.inflation,
      years
    );
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
    
    // Find the first year when capital reaches zero (if it does)
    const firstExhaustionPoint = isCapitalExhausted 
      ? graphData.find(point => point.capital <= 0) 
      : null;
    const exhaustionYear = isCapitalExhausted && firstExhaustionPoint 
      ? firstExhaustionPoint.year 
      : "Not exhausted";
    const exhaustionAge = isCapitalExhausted && firstExhaustionPoint 
      ? firstExhaustionPoint.age 
      : retirementStartAge;
    
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
      
      // Use the financial calculation utility for more accurate results
      return calculateCapitalNeeded(
        params.monthlyRetirementWithdrawal,
        params.annualReturnRate,
        effectiveRetirementDuration,
        params.inflation,
        params.compoundFrequency
      );
    };
    
    const totalNeededCapital = calculateNeededCapital();
    
    const retirementTimespan = calculatedRetirementStartYear - new Date().getFullYear();
    const inflationAdjustedInvestment = calculateInflationAdjustedInvestment(retirementTimespan);
    
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
    params.withdrawalMode === "rate" ? params.withdrawalRate : null,
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
    
    // Only update withdrawal amount when in age mode
    if (params.withdrawalMode === "age") {
      // Calculate capital at retirement
      const estimatedCapital = calculateFutureValue(
        params.initialCapital,
        params.annualReturnRate,
        retirementStartIndex,
        params.monthlyInvestment,
        params.compoundFrequency
      );
      
      // Calculate sustainable withdrawal amount
      const calculatedWithdrawal = calculateWithdrawalAmount(
        estimatedCapital,
        params.annualReturnRate,
        retirementDuration,
        params.inflation,
        params.compoundFrequency
      );
      
      // Update withdrawal amount if it's different from current value
      if (!isNaN(calculatedWithdrawal) && isFinite(calculatedWithdrawal) && 
          Math.abs(calculatedWithdrawal - params.monthlyRetirementWithdrawal) > 1) {
        setParams(prev => ({ ...prev, monthlyRetirementWithdrawal: Math.round(calculatedWithdrawal) }));
      }
    }
    // Add effect for rate-based withdrawal mode
    else if (params.withdrawalMode === "rate" && params.withdrawalRate) {
      // Calculate capital at retirement
      const estimatedCapital = calculateFutureValue(
        params.initialCapital,
        params.annualReturnRate,
        retirementStartIndex,
        params.monthlyInvestment,
        params.compoundFrequency
      );
      
      // Calculate monthly withdrawal based on rate
      const calculatedWithdrawal = calculateRateBasedWithdrawal(estimatedCapital, params.withdrawalRate);
      
      // Update withdrawal amount if it's different from current value
      if (!isNaN(calculatedWithdrawal) && isFinite(calculatedWithdrawal) && 
          Math.abs(calculatedWithdrawal - params.monthlyRetirementWithdrawal) > 1) {
        setParams(prev => ({ ...prev, monthlyRetirementWithdrawal: Math.round(calculatedWithdrawal) }));
      }
    }
  }, [params.withdrawalMode, params.maxAge, params.annualReturnRate, 
      params.inflation, params.currentAge, params.retirementInput, params.initialCapital, 
      params.monthlyInvestment, params.withdrawalRate, getBirthYear, getRetirementYear, params.compoundFrequency]);

  // Memoize monthly rate calculations
  const monthlyReturn = useMemo(() => {
    return Math.pow(1 + params.annualReturnRate / 100, 1/12) - 1;
  }, [params.annualReturnRate]);

  const monthlyInflation = useMemo(() => {
    return Math.pow(1 + params.inflation / 100, 1/12) - 1;
  }, [params.inflation]);

  // Memoize the simulation data to prevent unnecessary recalculations
  const simulationData = useMemo(() => {
    // Simulation logic here
    const data: GraphDataPoint[] = [];
    let capital = params.initialCapital;
    let totalInvested = params.initialCapital;
    let totalWithdrawn = 0;
    let currentMonthlyInvestment = params.monthlyInvestment;
    let currentMonthlyWithdrawal = params.monthlyRetirementWithdrawal;

    // Calculate required variables for statistics
    const birthYear = new Date().getFullYear() - params.currentAge;
    const retirementStartAge = typeof params.retirementInput === 'string' && 
      parseInt(params.retirementInput) <= 120 ? 
      parseInt(params.retirementInput) : params.currentAge + 20;
    const calculatedRetirementStartYear = birthYear + retirementStartAge;
    
    // Calculate capital at retirement
    const capitalAtRetirement = calculateCapitalAtRetirement(
      retirementStartAge - params.currentAge, 
      params.annualReturnRate, 
      params.inflation
    );
    
    // Calculate needed capital and retirement duration
    const targetMaxAge = params.maxAge;
    const retirementDuration = targetMaxAge - retirementStartAge;
    const totalNeededCapital = calculateCapitalNeeded(
      params.monthlyRetirementWithdrawal,
      params.annualReturnRate,
      retirementDuration,
      params.inflation,
      params.compoundFrequency
    );
    
    // Bar chart values
    const maxBarValue = Math.max(capitalAtRetirement, totalNeededCapital) * 1.1;
    const haveBarHeight = (capitalAtRetirement / maxBarValue) * 100;
    const needBarHeight = (totalNeededCapital / maxBarValue) * 100;
    
    // Find capital exhaustion point (if applicable)
    let exhaustionYear = null;
    let exhaustionAge = null;
    for (const point of data) {
      if (point.capital <= 0 && point.retirement === "Yes") {
        exhaustionYear = point.year;
        exhaustionAge = point.age;
        break;
      }
    }

    // Rest of your simulation logic...
    
    return {
      data,
      statistics: {
        birthYear,
        calculatedRetirementStartYear,
        retirementStartAge,
        finalCapital: capital,
        isCapitalExhausted: capital <= 0,
        exhaustionYear: exhaustionYear || 'Not exhausted',
        exhaustionAge: exhaustionAge || targetMaxAge,
        totalInvestedAmount: totalInvested,
        lifeExpectancy: targetMaxAge,
        retirementDuration: targetMaxAge - retirementStartAge,
        capitalAtRetirement,
        totalNeededCapital,
        inflationAdjustedInvestment: Math.round(currentMonthlyInvestment),
        inflationAdjustedCapital: Math.round(capital),
        maxBarValue,
        haveBarHeight,
        needBarHeight,
        finalMonthlyInvestment: Math.round(currentMonthlyInvestment),
        finalMonthlyWithdrawalValue: Math.round(currentMonthlyWithdrawal),
        effectiveRetirementDuration: retirementDuration
      }
    };
  }, [
    params.initialCapital,
    params.monthlyInvestment,
    params.monthlyRetirementWithdrawal,
    params.annualReturnRate,
    params.inflation,
    params.currentAge,
    params.retirementInput,
    params.maxAge,
    params.compoundFrequency,
    params.withdrawalMode,
    params.withdrawalRate,
    monthlyReturn,
    monthlyInflation
  ]);

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <div className="mb-6 sm:mb-8 text-center">
        <div className="title-container inline-block mb-4 px-4 py-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient">
            Secure Your Future: Financial Freedom Calculator
          </h1>
        </div>
        <p className="text-gray-800 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Plan your perfect retirement with our advanced financial planning tool. Optimize investments, track growth, and achieve your retirement goals.
        </p>
      </div>
      
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
        currentAge={params.currentAge}
      />

      <ScheduleDetails 
        graphData={graphData}
        formatAmount={formatAmount}
      />
      
      <Footer />
    </div>
  );
};

export default RetirementSimulator; 