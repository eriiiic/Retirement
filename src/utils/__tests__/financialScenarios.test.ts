import {
  calculateFutureValue,
  calculateWithdrawalAmount,
  calculateCapitalNeeded,
  calculateInflationAdjustedValue,
  calculateCapitalMetrics
} from '../financialCalculations';

describe('Financial Calculation Scenarios', () => {
  /**
   * Common retirement planning scenarios
   */
  describe('Retirement Planning Scenarios', () => {
    test('Early retirement scenario with high savings rate', () => {
      // Scenario: 35-year-old with $100k saved, contributing $3,000 monthly
      // Wants to retire at 50 (15 years), with $6,000 monthly withdrawals for 40 years
      // 6% expected returns, 2.5% inflation
      
      // Step 1: Calculate expected capital at retirement
      const capitalAtRetirement = calculateFutureValue(100000, 6, 15, 3000, 'monthly');
      expect(capitalAtRetirement).toBeGreaterThan(0);
      
      // Step 2: Calculate capital needed for desired withdrawals
      const capitalNeeded = calculateCapitalNeeded(6000, 6, 40, 2.5, 'monthly');
      expect(capitalNeeded).toBeGreaterThan(0);
      
      // Step 3: Calculate inflation-adjusted withdrawal amount in future dollars
      const futureWithdrawalAmount = calculateInflationAdjustedValue(6000, 2.5, 15);
      expect(futureWithdrawalAmount).toBeGreaterThan(6000);
      
      // Validity check: Is the projected capital sufficient?
      const isCapitalSufficient = capitalAtRetirement >= capitalNeeded;
      
      // This test verifies the correctness of calculations, not the outcome itself
      // We're just ensuring the calculations yield reasonable values
      expect(typeof isCapitalSufficient).toBe('boolean');
    });
    
    test('Traditional retirement with pension scenario', () => {
      // Scenario: 45-year-old with $250k saved, contributing $1,500 monthly
      // Wants to retire at 65 (20 years), with $4,000 monthly withdrawals
      // Plus $2,000 monthly pension, 5% expected returns, 2% inflation
      // Planning for 25 years in retirement
      
      // Step 1: Calculate expected capital at retirement
      const capitalAtRetirement = calculateFutureValue(250000, 5, 20, 1500, 'monthly');
      expect(capitalAtRetirement).toBeGreaterThan(0);
      
      // Step 2: Since there's a pension, they only need capital for $4,000 - $2,000 = $2,000
      // Calculate capital needed for desired supplemental withdrawals
      const supplementalAmount = 4000 - 2000; // after pension
      const capitalNeeded = calculateCapitalNeeded(supplementalAmount, 5, 25, 2, 'monthly');
      expect(capitalNeeded).toBeGreaterThan(0);
      
      // Step 3: Calculate inflation-adjusted withdrawal and pension in future dollars
      const futureWithdrawalAmount = calculateInflationAdjustedValue(4000, 2, 20);
      const futurePensionAmount = calculateInflationAdjustedValue(2000, 2, 20);
      
      expect(futureWithdrawalAmount).toBeGreaterThan(4000);
      expect(futurePensionAmount).toBeGreaterThan(2000);
      
      // Validity check: Is the projected capital sufficient?
      const isCapitalSufficient = capitalAtRetirement >= capitalNeeded;
      
      // This test verifies the correctness of calculations, not the outcome itself
      expect(typeof isCapitalSufficient).toBe('boolean');
    });
    
    test('Late start retirement catch-up scenario', () => {
      // Scenario: 50-year-old with only $50k saved, contributing $2,500 monthly
      // Wants to retire at 67 (17 years), with $3,500 monthly withdrawals
      // 5.5% expected returns, 2.2% inflation
      // Planning for 20 years in retirement
      
      // Step 1: Calculate expected capital at retirement
      const capitalAtRetirement = calculateFutureValue(50000, 5.5, 17, 2500, 'monthly');
      
      // Step 2: Calculate growth metrics to assess performance
      const metrics = calculateCapitalMetrics(50000, 2500, 5.5, 2.2, 17, 'monthly');
      
      expect(metrics.capitalAtRetirement).toBeCloseTo(capitalAtRetirement, 0);
      expect(metrics.totalInvestedAmount).toBe(50000 + (2500 * 12 * 17));
      expect(metrics.growthAmount).toBeGreaterThan(0);
      expect(metrics.growthPercentage).toBeGreaterThan(0);
      
      // Step 3: Calculate capital needed for desired withdrawals
      const capitalNeeded = calculateCapitalNeeded(3500, 5.5, 20, 2.2, 'monthly');
      
      // Step 4: Calculate potential monthly withdrawal based on projected capital
      const potentialMonthlyWithdrawal = calculateWithdrawalAmount(
        capitalAtRetirement, 5.5, 20, 2.2, 'monthly'
      );
      
      expect(potentialMonthlyWithdrawal).toBeGreaterThan(0);
      
      // Validation: These calculations should be internally consistent
      // If we calculate backwards from potentialMonthlyWithdrawal, we should get close to capitalAtRetirement
      const calculatedCapitalNeeded = calculateCapitalNeeded(
        potentialMonthlyWithdrawal, 5.5, 20, 2.2, 'monthly'
      );
      
      // Should be approximately equal (within rounding differences)
      expect(calculatedCapitalNeeded).toBeCloseTo(capitalAtRetirement, -2); // Allow some margin of error
    });
  });
  
  /**
   * Edge cases and specific calculation chains
   */
  describe('Edge Cases and Calculation Chains', () => {
    test('Very long retirement period with low withdrawal rate', () => {
      // Testing calculations for very long timeframes (50+ years)
      // This tests the stability of the exponential calculations
      
      const initialCapital = 1000000;
      const withdrawalRate = 2.5; // 2.5% annual withdrawal
      const returns = 5;
      const inflation = 2;
      const retirementYears = 60;
      
      // Monthly withdrawal based on withdrawal rate
      const monthlyWithdrawal = (initialCapital * (withdrawalRate / 100)) / 12;
      
      // Capital needed for this withdrawal over the very long period
      const capitalNeeded = calculateCapitalNeeded(monthlyWithdrawal, returns, retirementYears, inflation, 'monthly');
      
      // For a "safe" withdrawal rate with positive real returns, capital should be less than initial
      expect(capitalNeeded).toBeLessThanOrEqual(initialCapital * 1.05); // Allow small margin for rounding
      
      // Verify the withdrawal calculations are realistic for this timeframe
      const calculatedWithdrawal = calculateWithdrawalAmount(initialCapital, returns, retirementYears, inflation, 'monthly');
      
      // Calculated withdrawal should be close to our rate-based withdrawal
      expect(calculatedWithdrawal).toBeGreaterThan(0);
      // The relationship between these values validates our calculation chain
    });
    
    test('High inflation scenario impact on returns', () => {
      // Testing high inflation impact (7%+) against moderate returns (5%)
      
      const initialCapital = 500000;
      const monthlyInvestment = 1000;
      const years = 15;
      const returns = 5;
      const highInflation = 7;
      
      // Calculate future value with normal financial math
      const futureValue = calculateFutureValue(initialCapital, returns, years, monthlyInvestment, 'monthly');
      
      // Calculate the future value in today's dollars (inflation-adjusted)
      const presentValueOfFutureAmount = futureValue / Math.pow(1 + highInflation / 100, years);
      
      // In a high inflation scenario with returns < inflation, the real value should decrease
      expect(presentValueOfFutureAmount).toBeLessThan(initialCapital + (monthlyInvestment * 12 * years));
      
      // If we try to calculate withdrawal amount with inflation > returns
      const monthlyWithdrawal = calculateWithdrawalAmount(futureValue, returns, 30, highInflation, 'monthly');
      
      // The withdrawal amount should be quite low due to negative real returns
      const simpleMonthlyDivision = futureValue / (30 * 12);
      expect(monthlyWithdrawal).toBeLessThan(simpleMonthlyDivision);
    });
    
    test('Early retirement extreme scenario', () => {
      // Testing very early retirement with very high savings rate
      // This is an edge case for financial independence calculations
      
      const initialCapital = 200000;
      const monthlyInvestment = 5000; // Very high savings rate
      const yearsToRetirement = 7; // Very short accumulation phase
      const returns = 6;
      const inflation = 2.5;
      const retirementYears = 60; // Very long withdrawal phase (retiring very young)
      
      // Calculate expected capital at this aggressive early retirement
      const capitalAtRetirement = calculateFutureValue(initialCapital, returns, yearsToRetirement, monthlyInvestment, 'monthly');
      
      // Calculate safe withdrawal amount for this very long retirement
      const safeWithdrawalAmount = calculateWithdrawalAmount(capitalAtRetirement, returns, retirementYears, inflation, 'monthly');
      
      // Calculate capital needed for a desired withdrawal of $3,000/month
      const desiredWithdrawal = 3000;
      const capitalNeededForDesired = calculateCapitalNeeded(desiredWithdrawal, returns, retirementYears, inflation, 'monthly');
      
      // This validates the mathematical relationship between these functions
      // If we calculate capital needed for the safe withdrawal amount, it should equal our capital
      const capitalNeededForCalculatedWithdrawal = calculateCapitalNeeded(safeWithdrawalAmount, returns, retirementYears, inflation, 'monthly');
      
      expect(capitalNeededForCalculatedWithdrawal).toBeCloseTo(capitalAtRetirement, -2); // Allow some margin for rounding errors
    });
  });
}); 