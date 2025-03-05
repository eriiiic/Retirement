import { useState, useEffect, useMemo, useCallback } from 'react';
import { SimulatorParams, Statistics, GraphDataPoint } from './retirement/types';
import ParametersSection from './retirement/ParametersSection';
import ResultsSummary from './retirement/ResultsSummary';
import Analyses from './retirement/Analyses';
import ScheduleDetails from './retirement/ScheduleDetails';
import CapitalEvolutionChart from './retirement/CapitalEvolutionChart';
import Footer from './common/Footer';
import { 
  calculateFutureValue, 
  calculateWithdrawalAmount, 
  calculateCapitalNeeded,
  calculateInflationAdjustedValue,
  calculateRateBasedWithdrawal
} from '../utils/financialCalculations';
import { colors, components, typography, spacing, cx } from '../styles/styleGuide';

const RetirementSimulator = () => {
  // Initialize simulator parameters
  const [params, setParams] = useState<SimulatorParams>({
    initialCapital: 250000,
    monthlyInvestment: 500,
    annualReturnRate: 7,
    inflation: 2,
    monthlyRetirementWithdrawal: 3000,
    currentAge: 46,
    retirementInput: "60",
    currency: "USD",
    withdrawalMode: "amount",
    maxAge: 95,
    compoundFrequency: 'monthly',
    autoCalculateRetirementAge: false,
  });

  // State for chart data
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  
  // Memoize currentYear to avoid multiple Date instantiations
  const currentYear = useMemo(() => new Date().getFullYear(), []);

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
    return currentYear - params.currentAge;
  }, [currentYear, params.currentAge]);

  const isRetirementInputAnAge = useCallback((): boolean => {
    const input = Number(params.retirementInput);
    return (input > 0 && input < 120 && params.retirementInput.length <= 2) || 
           !(params.retirementInput.length === 4 && params.retirementInput.startsWith('20'));
  }, [params.retirementInput]);

  const getRetirementYear = useCallback((): number => {
    if (isRetirementInputAnAge()) {
      return currentYear + (Number(params.retirementInput) - params.currentAge);
    } else {
      return Number(params.retirementInput);
    }
  }, [currentYear, isRetirementInputAnAge, params.retirementInput, params.currentAge]);

  // Memoize common rate calculations
  const monthlyReturn = useMemo(() => {
    return Math.pow(1 + params.annualReturnRate / 100, 1/12) - 1;
  }, [params.annualReturnRate]);

  const monthlyInflation = useMemo(() => {
    return Math.pow(1 + params.inflation / 100, 1/12) - 1;
  }, [params.inflation]);
  
  // Utility to check capital exhaustion
  const isCapitalExhausted = useCallback((dataPoints: GraphDataPoint[]): boolean => {
    return dataPoints.length > 0 && dataPoints[dataPoints.length - 1].capital <= 0;
  }, []);

  // Utility to get pre-retirement investment amount
  const getPreRetirementData = useCallback((calculatedRetirementStartYear: number): number => {
    const preRetirementYearData = graphData.find(item => item.year === calculatedRetirementStartYear - 1);
    return preRetirementYearData?.finalMonthlyInvestment || params.monthlyInvestment;
  }, [graphData, params.monthlyInvestment]);

  // Refactor calculateSimulation into smaller functions
  const calculateCapitalAtRetirement = useCallback((retirementStartIndex: number): number => {
    return calculateFutureValue(
      params.initialCapital,
      params.annualReturnRate,
      retirementStartIndex,
      params.monthlyInvestment,
      params.compoundFrequency
    );
  }, [
    params.initialCapital,
    params.annualReturnRate,
    params.monthlyInvestment,
    params.compoundFrequency
  ]);

  const calculateWithdrawal = useCallback((capitalAtRetirement: number, retirementDuration: number): number => {
    return calculateWithdrawalAmount(
      capitalAtRetirement,
      params.annualReturnRate,
      retirementDuration,
      params.inflation,
      params.compoundFrequency
    );
  }, [
    params.annualReturnRate,
    params.inflation,
    params.compoundFrequency
  ]);

  // Calculate simulation data
  const calculateSimulation = useCallback(() => {
    const birthYear = getBirthYear();
    const calculatedRetirementStartYear = getRetirementYear();
    const targetMaxAge = params.withdrawalMode === "age" ? params.maxAge : 95;
    const retirementStartAge = calculatedRetirementStartYear - birthYear;
    const retirementDuration = targetMaxAge - retirementStartAge;
    const retirementStartIndex = calculatedRetirementStartYear - currentYear;
    const simulationDuration = targetMaxAge - params.currentAge;
    
    const data: GraphDataPoint[] = [];
    
    // Calculate capital at retirement using financial utility with compound frequency
    let capitalAtRetirement = calculateCapitalAtRetirement(retirementStartIndex);
    
    // Main simulation
    let capital = params.initialCapital;
    let principalOnly = params.initialCapital;
    let currentMonthlyInvestment = params.monthlyInvestment;
    let totalInvested = params.initialCapital;
    let totalWithdrawn = 0;
    let isCapitalDepleted = false;
    
    // Define currentMonthlyWithdrawal
    let currentMonthlyWithdrawal;
    if (params.withdrawalMode === "age") {
      currentMonthlyWithdrawal = calculateWithdrawal(capitalAtRetirement, retirementDuration);
    } else if (params.withdrawalMode === "rate" && params.withdrawalRate) {
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
            // If using rate-based withdrawal, recalculate the monthly amount at the beginning of each month
            if (params.withdrawalMode === "rate" && params.withdrawalRate && month === 0) {
              currentMonthlyWithdrawal = calculateRateBasedWithdrawal(capital, params.withdrawalRate);
            }
            capital -= currentMonthlyWithdrawal;
            annualWithdrawal += currentMonthlyWithdrawal;
            totalWithdrawn += currentMonthlyWithdrawal;
          } else if (!inRetirementPhase) {
            // Regular investment phase
            capital += currentMonthlyInvestment;
            annualInvestment += currentMonthlyInvestment;
            totalInvested += currentMonthlyInvestment;
          } else {
            // Regular retirement phase
            // If using rate-based withdrawal, recalculate the monthly amount at the beginning of each month
            if (params.withdrawalMode === "rate" && params.withdrawalRate && month === 0) {
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
            // Transition year - now treat as full retirement year
            if (params.withdrawalMode === "rate" && params.withdrawalRate) {
              currentMonthlyWithdrawal = calculateRateBasedWithdrawal(capital, params.withdrawalRate);
            }
            const yearlyWithdrawal = currentMonthlyWithdrawal * 12;
            capital -= yearlyWithdrawal;
            annualInvestment = 0;
            annualWithdrawal = yearlyWithdrawal;
            totalWithdrawn += yearlyWithdrawal;
          } else {
            // Retirement phase - annual withdrawal
            if (params.withdrawalMode === "rate" && params.withdrawalRate) {
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
    params.compoundFrequency,
    currentYear,
    getBirthYear,
    getRetirementYear,
    calculateCapitalAtRetirement,
    calculateWithdrawal,
    monthlyReturn
  ]);

  // Use memoization for simulation data
  const calculatedData = useMemo(() => calculateSimulation(), [calculateSimulation]);

  // Update graph data when calculation changes
  useEffect(() => {
    setGraphData(calculatedData);
  }, [calculatedData]);

  // Calculate inflation-adjusted investment
  const calculateInflationAdjustedInvestment = useCallback((years: number): number => {
    return calculateInflationAdjustedValue(
      params.monthlyInvestment,
      params.inflation,
      years
    );
  }, [params.monthlyInvestment, params.inflation]);

  // Calculate inflation-adjusted capital
  const calculateInflationAdjustedCapital = useCallback((capital: number, years: number): number => {
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
    const capitalExhausted = isCapitalExhausted(graphData);
    
    // Find the first year when capital reaches zero (if it does)
    const firstExhaustionPoint = capitalExhausted 
      ? graphData.find(point => point.capital <= 0) 
      : null;
    const exhaustionYear = capitalExhausted && firstExhaustionPoint 
      ? firstExhaustionPoint.year 
      : "Not exhausted";
    const exhaustionAge = capitalExhausted && firstExhaustionPoint 
      ? firstExhaustionPoint.age 
      : retirementStartAge;
    
    const totalInvestedAmount = params.initialCapital + (params.monthlyInvestment * 12 * (calculatedRetirementStartYear - currentYear));
    
    const capitalAtRetirementIndex = graphData.findIndex(item => item.year >= calculatedRetirementStartYear);
    const capitalAtRetirement = capitalAtRetirementIndex !== -1 
      ? graphData[capitalAtRetirementIndex].capital 
      : 0;
    
    // Calculate needed capital
    const calculateNeededCapital = () => {
      let effectiveRetirementDuration = retirementDuration;
      
      if (params.withdrawalMode === "amount" && capitalExhausted) {
        const retirementYearIndex = graphData.findIndex(item => item.retirement === "Yes");
        const exhaustionIndex = graphData.length - 1;
        
        if (retirementYearIndex !== -1) {
          effectiveRetirementDuration = exhaustionIndex - retirementYearIndex + 1;
        }
      }
      
      return calculateCapitalNeeded(
        params.monthlyRetirementWithdrawal,
        params.annualReturnRate,
        effectiveRetirementDuration,
        params.inflation,
        params.compoundFrequency
      );
    };
    
    const totalNeededCapital = calculateNeededCapital();
    
    const retirementTimespan = calculatedRetirementStartYear - currentYear;
    const inflationAdjustedInvestment = calculateInflationAdjustedInvestment(retirementTimespan);
    
    let inflationAdjustedCapital = 0;
    if (graphData.length > 0 && finalCapital > 0) {
      const finalYear = graphData[graphData.length - 1].year;
      const years = finalYear - currentYear;
      inflationAdjustedCapital = calculateInflationAdjustedCapital(finalCapital, years);
    }
    
    const maxBarValue = Math.max(capitalAtRetirement, totalNeededCapital);
    const haveBarHeight = maxBarValue > 0 ? (capitalAtRetirement / maxBarValue) * 100 : 0;
    const needBarHeight = maxBarValue > 0 ? (totalNeededCapital / maxBarValue) * 100 : 0;
    
    const finalMonthlyInvestment = graphData.length > 0 ? getPreRetirementData(calculatedRetirementStartYear) : params.monthlyInvestment;
    const finalMonthlyWithdrawalValue = graphData.length > 0 
      ? graphData[graphData.length - 1].finalMonthlyWithdrawal 
      : params.monthlyRetirementWithdrawal;
    
    return {
      birthYear,
      calculatedRetirementStartYear,
      retirementStartAge,
      finalCapital,
      isCapitalExhausted: capitalExhausted,
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
    params.compoundFrequency,
    currentYear,
    getBirthYear,
    getRetirementYear,
    calculateInflationAdjustedInvestment,
    calculateInflationAdjustedCapital,
    isCapitalExhausted,
    getPreRetirementData
  ]);

  // Handle parameter changes
  const handleParamChange = (key: keyof SimulatorParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Update withdrawal amount when in age/rate mode or when relevant parameters change
  useEffect(() => {
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
  }, [
    params.withdrawalMode, 
    params.maxAge, 
    params.annualReturnRate, 
    params.inflation, 
    params.currentAge, 
    params.retirementInput, 
    params.initialCapital, 
    params.monthlyInvestment, 
    params.withdrawalRate, 
    params.compoundFrequency,
    params.monthlyRetirementWithdrawal,
    currentYear,
    getBirthYear, 
    getRetirementYear
  ]);

  return (
    <div className={cx(components.container.card, "p-3 sm:p-6 max-w-6xl mx-auto mt-0")}>
      <div className={cx("mb-6 sm:mb-8 text-center mt-0")}>
        <div className={cx("inline-block mb-4 px-4 py-2 bg-gray-100/70 rounded-lg shadow-sm mt-0")}>
          <h1 className={cx(typography.size["3xl"], typography.weight.bold, "text-gradient mt-0")}>
            AI-Powered Retirement & Investment Calculator
          </h1>
        </div>
        <p className={cx(typography.size.sm, "text-gray-800 max-w-2xl mx-auto mt-0", typography.weight.medium)}>
          Leverage advanced AI algorithms to plan your financial future with precision. Calculate how compound interest grows your investments with intelligent projections.
        </p>
      </div>
      
      <section className={cx("pt-0 pb-3 sm:pb-6 max-w-6xl mx-auto mb-0 mt-0")}>
        <ParametersSection 
          params={params}
          statistics={statistics}
          formatAmount={formatAmount}
          onParamChange={handleParamChange}
          graphData={graphData}
        />
      </section>

      <section className={cx("pt-0 pb-3 sm:pb-6 max-w-6xl mx-auto mb-0 mt-0")}>
        <ResultsSummary
          statistics={statistics}
          params={params}
          formatAmount={formatAmount}
          currency={params.currency}
        />
      </section>
      
      <section className={cx("pt-0 pb-3 sm:pb-6 max-w-6xl mx-auto mb-0 mt-0")}>
        {graphData.length > 0 && statistics && (
          <CapitalEvolutionChart
            graphData={graphData}
            formatAmount={formatAmount}
            statistics={statistics}
            currency={params.currency}
            currentAge={params.currentAge}
            annualReturnRate={params.annualReturnRate}
            params={params}
          />
        )}
      </section>

      <section className={cx("pt-0 pb-3 sm:pb-6 max-w-6xl mx-auto mb-0 mt-0")}>
        <Analyses
          statistics={statistics}
          params={params}
          formatAmount={formatAmount}
          currency={params.currency}
        />
      </section>

      <section className={cx("pt-0 pb-3 sm:pb-6 max-w-6xl mx-auto mb-0 mt-0")}>
        <ScheduleDetails 
          graphData={graphData}
          formatAmount={formatAmount}
          currency={params.currency}
        />
      </section>
      
      <Footer />
    </div>
  );
};

export default RetirementSimulator; 