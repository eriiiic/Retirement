import { WorkerMessageType } from '../types/worker';
import { GraphDataPoint, SummaryResult } from '../components/retirement/types';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case WorkerMessageType.CALCULATE_SUMMARY:
      try {
        const { graphData } = payload;
        
        // Calculate summary statistics
        const summary: SummaryResult = {
          initialCapital: 0,
          finalCapital: 0,
          retirementAge: 0,
          retirementDuration: 0,
          totalContributions: 0,
          totalWithdrawals: 0,
          growthPercentage: 0,
          annualizedReturn: 0
        };
        
        if (graphData && graphData.length > 0) {
          // Get initial and final capital
          summary.initialCapital = graphData[0].capital;
          summary.finalCapital = graphData[graphData.length - 1].capital;
          
          // Find retirement age
          const retirementPoint = graphData.find((point: GraphDataPoint) => point.retirement === "Yes");
          if (retirementPoint) {
            summary.retirementAge = retirementPoint.age;
            
            // Calculate retirement duration
            const lastYear = graphData[graphData.length - 1].year;
            const retirementYear = retirementPoint.year;
            summary.retirementDuration = lastYear - retirementYear;
          }
          
          // Calculate total contributions and withdrawals
          let totalContributions = 0;
          let totalWithdrawals = 0;
          
          graphData.forEach((point: GraphDataPoint) => {
            // Use annualInvestment for contributions
            if (point.annualInvestment > 0) {
              totalContributions += point.annualInvestment;
            }
            
            // Use annualWithdrawal for withdrawals
            if (point.annualWithdrawal > 0) {
              totalWithdrawals += point.annualWithdrawal;
            }
          });
          
          summary.totalContributions = totalContributions;
          summary.totalWithdrawals = totalWithdrawals;
          
          // Calculate growth percentage
          summary.growthPercentage = ((summary.finalCapital - summary.initialCapital - totalContributions + totalWithdrawals) / 
                                     (summary.initialCapital + totalContributions)) * 100;
          
          // Calculate annualized return (simplified)
          const years = graphData.length;
          if (years > 1) {
            summary.annualizedReturn = Math.pow((summary.finalCapital / summary.initialCapital), (1 / years)) - 1;
            summary.annualizedReturn *= 100; // Convert to percentage
          }
        }
        
        ctx.postMessage({
          type: WorkerMessageType.SUMMARY_RESULT,
          data: summary
        });
      } catch (error) {
        ctx.postMessage({
          type: WorkerMessageType.ERROR,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: null
        });
      }
      break;

    default:
      ctx.postMessage({
        type: WorkerMessageType.ERROR,
        error: `Unknown message type: ${type}`,
        data: null
      });
  }
};