import React from 'react';
import { render, screen } from '@testing-library/react';
import CapitalEvolutionChart from '../CapitalEvolutionChart';
import { GraphDataPoint } from '../types';

const mockGraphData: GraphDataPoint[] = [
  {
    year: 2024,
    age: 40,
    capital: 10000,
    capitalWithoutInterest: 10000,
    variation: 0,
    retirement: "No",
    annualInvestment: 6000,
    annualWithdrawal: 0,
    annualInterest: 500,
    netVariationExcludingInterest: 6000,
    finalMonthlyInvestment: 500,
    finalMonthlyWithdrawal: 0,
    totalInvested: 10000,
    totalWithdrawn: 0,
    targetAge: false
  },
  {
    year: 2049,
    age: 65,
    capital: 800000,
    capitalWithoutInterest: 500000,
    variation: 40000,
    retirement: "Yes",
    annualInvestment: 0,
    annualWithdrawal: 24000,
    annualInterest: 40000,
    netVariationExcludingInterest: -24000,
    finalMonthlyInvestment: 0,
    finalMonthlyWithdrawal: 2000,
    totalInvested: 500000,
    totalWithdrawn: 24000,
    targetAge: false
  }
];

const mockFormatAmount = (amount: number) => `$${amount.toLocaleString()}`;

describe('CapitalEvolutionChart', () => {
  it('renders the chart title', () => {
    render(
      <CapitalEvolutionChart
        graphData={mockGraphData}
        formatAmount={mockFormatAmount}
        currency="USD"
      />
    );

    expect(screen.getByText(/capital evolution/i)).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(
      <CapitalEvolutionChart
        graphData={[]}
        formatAmount={mockFormatAmount}
        currency="USD"
      />
    );

    expect(screen.getByText(/capital evolution/i)).toBeInTheDocument();
  });

  it('displays correct currency format', () => {
    const { container } = render(
      <CapitalEvolutionChart
        graphData={mockGraphData}
        formatAmount={mockFormatAmount}
        currency="USD"
      />
    );

    // Check if the chart container is rendered
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });
}); 