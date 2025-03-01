import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ParametersSection from '../ParametersSection';
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

describe('ParametersSection', () => {
  it('renders all input fields', () => {
    render(
      <ParametersSection
        params={mockParams}
        statistics={mockStatistics}
        formatAmount={mockFormatAmount}
        onParamChange={() => {}}
      />
    );
    
    expect(screen.getByLabelText(/initial capital/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly investment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annual return rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inflation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current age/i)).toBeInTheDocument();
  });

  it('calls onParamChange when input values change', () => {
    const mockOnParamChange = jest.fn();
    render(
      <ParametersSection
        params={mockParams}
        statistics={mockStatistics}
        formatAmount={mockFormatAmount}
        onParamChange={mockOnParamChange}
      />
    );

    const initialCapitalInput = screen.getByLabelText(/initial capital/i);
    fireEvent.change(initialCapitalInput, { target: { value: '20000' } });
    
    expect(mockOnParamChange).toHaveBeenCalledWith('initialCapital', 20000);
  });

  it('displays currency in the correct format', () => {
    render(
      <ParametersSection
        params={mockParams}
        statistics={mockStatistics}
        formatAmount={mockFormatAmount}
        onParamChange={() => {}}
      />
    );

    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();
  });
}); 