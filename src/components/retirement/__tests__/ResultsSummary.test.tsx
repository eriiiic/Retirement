import React from 'react';
import { render, screen } from '@testing-library/react';
import ResultsSummary from '../ResultsSummary';
import { SimulatorParams, Statistics } from '../types';

const mockParams: SimulatorParams = {
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
};

const mockStatistics: Statistics = {
  birthYear: 1983,
  calculatedRetirementStartYear: 2048,
  retirementStartAge: 65,
  finalCapital: 1000000,
  isCapitalExhausted: false,
  exhaustionYear: "Not exhausted",
  exhaustionAge: 65,
  totalInvestedAmount: 500000,
  lifeExpectancy: 95,
  retirementDuration: 30,
  capitalAtRetirement: 800000,
  totalNeededCapital: 1200000,
  inflationAdjustedInvestment: 400000,
  inflationAdjustedCapital: 600000,
  maxBarValue: 1200000,
  haveBarHeight: 66.67,
  needBarHeight: 100,
  finalMonthlyInvestment: 500,
  finalMonthlyWithdrawalValue: 2000,
  effectiveRetirementDuration: 30
};

const mockFormatAmount = (amount: number) => `$${amount.toLocaleString()}`;

describe('ResultsSummary', () => {
  it('displays retirement summary information', () => {
    render(
      <ResultsSummary
        statistics={mockStatistics}
        params={mockParams}
        formatAmount={mockFormatAmount}
      />
    );

    expect(screen.getByText(/retirement age/i)).toBeInTheDocument();
    expect(screen.getByText(/65/)).toBeInTheDocument();
    expect(screen.getByText(/capital at retirement/i)).toBeInTheDocument();
    expect(screen.getByText(/\$800,000/)).toBeInTheDocument();
  });

  it('shows capital exhaustion warning when applicable', () => {
    const exhaustedStats = {
      ...mockStatistics,
      isCapitalExhausted: true,
      exhaustionYear: "2070",
      exhaustionAge: 87
    };

    render(
      <ResultsSummary
        statistics={exhaustedStats}
        params={mockParams}
        formatAmount={mockFormatAmount}
      />
    );

    expect(screen.getByText(/capital will be exhausted/i)).toBeInTheDocument();
    expect(screen.getByText(/87/)).toBeInTheDocument();
  });

  it('displays inflation-adjusted values', () => {
    render(
      <ResultsSummary
        statistics={mockStatistics}
        params={mockParams}
        formatAmount={mockFormatAmount}
      />
    );

    expect(screen.getByText(/inflation-adjusted/i)).toBeInTheDocument();
    expect(screen.getByText(/\$600,000/)).toBeInTheDocument();
  });
}); 