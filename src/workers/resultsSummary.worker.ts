import { WorkerMessageType } from '../types/worker';
import { handleWorkerError } from './utils';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { type, payload, messageId } = event.data;

  switch (type) {
    case WorkerMessageType.CALCULATE_SUMMARY:
      try {
        const { graphData, params } = payload;
        
        const currentYear = new Date().getFullYear();
        const calculatedRetirementStartYear = getRetirementYear(params);
        const retirementDuration = params.maxAge - (calculatedRetirementStartYear - (currentYear - params.currentAge));
        
        const finalCapital = graphData.length > 0 ? graphData[graphData.length - 1].capital : 0;
        const isCapitalExhausted = graphData.length > 0 && graphData[graphData.length - 1].capital <= 0;
        
        // Find the first year when capital reaches zero (if it does)
        const firstExhaustionPoint = isCapitalExhausted 
          ? graphData.find((point: { capital: number, year: number, age: number }) => point.capital <= 0) 
          : null;
        const exhaustionYear = isCapitalExhausted && firstExhaustionPoint 
          ? firstExhaustionPoint.year 
          : null;
        const exhaustionAge = isCapitalExhausted && firstExhaustionPoint 
          ? firstExhaustionPoint.age 
          : null;
        
        const totalInvestedAmount = params.initialCapital + (params.monthlyInvestment * 12 * (calculatedRetirementStartYear - new Date().getFullYear()));
        
        const capitalAtRetirementIndex = graphData.findIndex((item: { year: number }) => item.year >= calculatedRetirementStartYear);
        const capitalAtRetirement = capitalAtRetirementIndex !== -1 
          ? graphData[capitalAtRetirementIndex].capital 
          : 0;
        
        // Calculate needed capital (simplified version for the worker)
        const totalNeededCapital = calculateNeededCapital(params, retirementDuration);
        
        const maxBarValue = Math.max(capitalAtRetirement, totalNeededCapital) * 1.1;
        const haveBarHeight = maxBarValue > 0 ? (capitalAtRetirement / maxBarValue) * 100 : 0;
        const needBarHeight = maxBarValue > 0 ? (totalNeededCapital / maxBarValue) * 100 : 0;
        
        // Extract final monthly withdrawal from the data
        const finalMonthlyWithdrawalValue = graphData.length > 0 
          ? graphData[graphData.length - 1].finalMonthlyWithdrawal 
          : params.monthlyRetirementWithdrawal;

        ctx.postMessage({
          type: WorkerMessageType.SUMMARY_RESULT,
          data: {
            totalInvestedAmount,
            capitalAtRetirement,
            finalCapital,
            isCapitalExhausted,
            exhaustionYear,
            exhaustionAge,
            totalNeededCapital,
            haveBarHeight,
            needBarHeight,
            retirementDuration,
            finalMonthlyWithdrawalValue
          },
          messageId
        });
      } catch (error) {
        handleWorkerError(ctx, error);
      }
      break;

    default:
      ctx.postMessage({
        type: WorkerMessageType.ERROR,
        error: `Unknown message type: ${type}`,
        data: null,
        messageId
      });
  }
};

// Helper functions moved into the worker to make it self-contained
function getRetirementYear(params: any): number {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - params.currentAge;
  
  if (isRetirementInputAnAge(params.retirementInput)) {
    return currentYear + (Number(params.retirementInput) - params.currentAge);
  } else {
    return Number(params.retirementInput);
  }
}

function isRetirementInputAnAge(input: string): boolean {
  const inputNum = Number(input);
  return (inputNum > 0 && inputNum < 120 && input.length <= 2) || 
          !(input.length === 4 && input.startsWith('20'));
}

function calculateNeededCapital(params: any, retirementDuration: number): number {
  // Simple formula for needed capital
  // This is a simplified version - the actual calculation could be more complex
  const monthlyWithdrawal = params.monthlyRetirementWithdrawal;
  const annualWithdrawal = monthlyWithdrawal * 12;
  const adjustedRate = (params.annualReturnRate - params.inflation) / 100;
  
  let neededCapital;
  if (adjustedRate > 0) {
    neededCapital = annualWithdrawal * (1 - Math.pow(1 + adjustedRate, -retirementDuration)) / adjustedRate;
  } else {
    neededCapital = annualWithdrawal * retirementDuration;
  }
  
  return neededCapital;
}