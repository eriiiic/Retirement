import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RetirementSimulator from '../RetirementSimulator';

describe('RetirementSimulator', () => {
  it('renders without crashing', () => {
    render(<RetirementSimulator />);
    expect(screen.getByText('Retirement Investment Simulator')).toBeInTheDocument();
  });

  it('updates monthly investment when input changes', () => {
    render(<RetirementSimulator />);
    const input = screen.getByLabelText(/monthly investment/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1000' } });
    expect(input.value).toBe('1000');
  });

  it('updates retirement age when input changes', () => {
    render(<RetirementSimulator />);
    const input = screen.getByLabelText(/retirement age/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '70' } });
    expect(input.value).toBe('70');
  });

  it('switches currency between USD and EUR', () => {
    render(<RetirementSimulator />);
    const currencySelect = screen.getByLabelText(/currency/i) as HTMLSelectElement;
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });
    expect(currencySelect.value).toBe('EUR');
  });
}); 