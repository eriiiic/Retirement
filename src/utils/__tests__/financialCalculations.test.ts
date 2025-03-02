import * as financial from 'financial';
import {
  calculateFutureValue,
  calculateWithdrawalAmount,
  calculateCapitalNeeded,
  calculateIRR,
  calculateInflationAdjustedValue,
  calculatePresentValue,
  calculateRateBasedWithdrawal,
  calculateCapitalMetrics
} from '../financialCalculations';

// Mock the financial library
jest.mock('financial', () => ({
  irr: jest.fn()
}));

describe('Financial Calculations', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('calculateFutureValue', () => {
    test('calculates future value with monthly compounding correctly', () => {
      // Typical scenario: $10,000 initial, $500 monthly, 5% return for 25 years
      const result = calculateFutureValue(10000, 5, 25, 500, 'monthly');
      // Expected value calculated with standard financial formula
      expect(result).toBeCloseTo(348834.33, 0); // Allow some rounding differences
    });

    test('calculates future value with annual compounding correctly', () => {
      const result = calculateFutureValue(10000, 5, 25, 500, 'annual');
      expect(result).toBeCloseTo(336254.74, 0);
    });

    test('handles zero interest rate', () => {
      const result = calculateFutureValue(10000, 0, 10, 500, 'monthly');
      // Initial $10,000 + (120 months × $500) = $70,000
      expect(result).toBeCloseTo(70000, 0);
    });

    test('handles zero contributions', () => {
      const result = calculateFutureValue(10000, 5, 10, 0, 'monthly');
      // Only initial amount grows: $10,000 × (1 + 0.05/12)^120
      expect(result).toBeCloseTo(16470.09, 0);
    });

    test('handles zero initial capital', () => {
      const result = calculateFutureValue(0, 5, 10, 500, 'monthly');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(77641.46, 0);
    });

    test('handles negative interest rates', () => {
      const result = calculateFutureValue(10000, -2, 5, 500, 'monthly');
      // With negative returns, should be less than total contributions
      const totalContributions = 10000 + (5 * 12 * 500);
      expect(result).toBeLessThan(totalContributions);
    });
  });

  describe('calculateWithdrawalAmount', () => {
    test('calculates monthly withdrawal correctly with monthly compounding', () => {
      // $1,000,000 capital, 5% return, 2% inflation, 30 year retirement
      const result = calculateWithdrawalAmount(1000000, 5, 30, 2, 'monthly');
      expect(result).toBeCloseTo(3630.78, 0);
    });

    test('calculates monthly withdrawal correctly with annual compounding', () => {
      const result = calculateWithdrawalAmount(1000000, 5, 30, 2, 'annual');
      expect(result).toBeCloseTo(3608.40, 0);
    });

    test('handles inflation equal to return rate', () => {
      // When inflation equals return rate, should be simple division
      const result = calculateWithdrawalAmount(1000000, 5, 30, 5, 'monthly');
      // $1,000,000 / (30 * 12) months
      expect(result).toBeCloseTo(2777.78, 0);
    });

    test('handles inflation greater than return rate', () => {
      const result = calculateWithdrawalAmount(1000000, 3, 30, 5, 'monthly');
      // Should be less than simple division due to negative real return
      expect(result).toBeLessThan(2777.78);
    });

    test('handles zero retirement duration', () => {
      // Edge case: should return Infinity or a very large number
      const result = calculateWithdrawalAmount(1000000, 5, 0, 2, 'monthly');
      // Different implementations may handle this edge case differently
      // Could be Infinity or a very large number
      expect(result).toBeGreaterThan(1000000);
    });
  });

  describe('calculateCapitalNeeded', () => {
    test('calculates capital needed correctly with monthly compounding', () => {
      // $4,000 monthly withdrawal, 5% return, 2% inflation, 30 year retirement
      const result = calculateCapitalNeeded(4000, 5, 30, 2, 'monthly');
      expect(result).toBeCloseTo(1101962.33, 0);
    });

    test('calculates capital needed correctly with annual compounding', () => {
      const result = calculateCapitalNeeded(4000, 5, 30, 2, 'annual');
      expect(result).toBeCloseTo(1108518.94, 0);
    });

    test('handles zero withdrawal', () => {
      const result = calculateCapitalNeeded(0, 5, 30, 2, 'monthly');
      expect(result).toBeCloseTo(0, 0);
    });

    test('handles inflation equal to return rate', () => {
      // $4,000 monthly for 30 years with inflation = return rate
      const result = calculateCapitalNeeded(4000, 5, 30, 5, 'monthly');
      // Simple multiplication: $4,000 * 12 * 30
      expect(result).toBeCloseTo(1440000, 0);
    });

    test('handles inflation greater than return rate', () => {
      const result = calculateCapitalNeeded(4000, 3, 30, 5, 'monthly');
      // Should be more than simple multiplication due to negative real return
      expect(result).toBeGreaterThan(1440000);
    });
  });

  describe('calculateIRR', () => {
    test('calls financial.irr with correct parameters', () => {
      // Mock return value for IRR calculation
      (financial.irr as jest.Mock).mockReturnValue(0.07);
      
      const cashFlows = [-10000, 1000, 2000, 3000, 5000];
      const result = calculateIRR(cashFlows);
      
      expect(financial.irr).toHaveBeenCalledWith(cashFlows);
      expect(result).toBe(7); // 0.07 * 100 = 7%
    });
  });

  describe('calculateInflationAdjustedValue', () => {
    test('calculates inflation-adjusted value correctly', () => {
      // $1,000 in today's money, 2% inflation, 25 years
      const result = calculateInflationAdjustedValue(1000, 2, 25);
      expect(result).toBeCloseTo(1641.22, 0);
    });

    test('handles zero inflation', () => {
      const result = calculateInflationAdjustedValue(1000, 0, 25);
      expect(result).toBe(1000);
    });

    test('handles zero years', () => {
      const result = calculateInflationAdjustedValue(1000, 2, 0);
      expect(result).toBe(1000);
    });

    test('handles negative inflation (deflation)', () => {
      const result = calculateInflationAdjustedValue(1000, -2, 25);
      expect(result).toBeLessThan(1000);
    });
  });

  describe('calculatePresentValue', () => {
    test('calculates present value correctly', () => {
      // $1,000,000 in 25 years, 5% return
      const result = calculatePresentValue(1000000, 5, 25);
      expect(result).toBeCloseTo(295303.35, 0);
    });

    test('handles zero interest rate', () => {
      const result = calculatePresentValue(1000, 0, 10);
      expect(result).toBe(1000);
    });

    test('handles zero years', () => {
      const result = calculatePresentValue(1000, 5, 0);
      expect(result).toBe(1000);
    });

    test('handles negative interest rates', () => {
      const result = calculatePresentValue(1000, -2, 10);
      expect(result).toBeGreaterThan(1000);
    });
  });

  describe('calculateRateBasedWithdrawal', () => {
    test('calculates rate-based withdrawal correctly', () => {
      // $1,000,000 capital, 4% withdrawal rate
      const result = calculateRateBasedWithdrawal(1000000, 4);
      // (1,000,000 * 0.04) / 12 = 3,333.33
      expect(result).toBeCloseTo(3333.33, 0);
    });

    test('handles zero capital', () => {
      const result = calculateRateBasedWithdrawal(0, 4);
      expect(result).toBe(0);
    });

    test('handles zero withdrawal rate', () => {
      const result = calculateRateBasedWithdrawal(1000000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateCapitalMetrics', () => {
    test('calculates all capital metrics correctly', () => {
      const result = calculateCapitalMetrics(10000, 500, 5, 2, 25, 'monthly');
      
      expect(result.capitalAtRetirement).toBeCloseTo(348834.33, 0);
      expect(result.totalInvestedAmount).toBe(160000); // 10000 + (500 * 12 * 25)
      expect(result.growthAmount).toBeCloseTo(188834.33, 0);
      expect(result.growthPercentage).toBeCloseTo(118.02, 0);
    });

    test('handles zero interest rate', () => {
      const result = calculateCapitalMetrics(10000, 500, 0, 0, 10, 'monthly');
      
      expect(result.capitalAtRetirement).toBe(70000);
      expect(result.totalInvestedAmount).toBe(70000);
      expect(result.growthAmount).toBe(0);
      expect(result.growthPercentage).toBe(0);
    });

    test('handles zero contributions', () => {
      const result = calculateCapitalMetrics(10000, 0, 5, 2, 10, 'monthly');
      
      expect(result.capitalAtRetirement).toBeCloseTo(16470.09, 0);
      expect(result.totalInvestedAmount).toBe(10000);
      expect(result.growthAmount).toBeCloseTo(6470.09, 0);
      expect(result.growthPercentage).toBeCloseTo(64.70, 0);
    });

    test('handles negative interest rates', () => {
      const result = calculateCapitalMetrics(10000, 500, -2, 2, 5, 'monthly');
      
      expect(result.totalInvestedAmount).toBe(40000); // 10000 + (500 * 12 * 5)
      expect(result.capitalAtRetirement).toBeLessThan(result.totalInvestedAmount);
      expect(result.growthAmount).toBeLessThan(0);
      expect(result.growthPercentage).toBeLessThan(0);
    });
  });
}); 