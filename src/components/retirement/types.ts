export interface GraphDataPoint {
  year: number;
  age: number;
  capital: number;
  capitalWithoutInterest: number;
  variation: number;
  retirement: string;
  annualInvestment: number;
  annualWithdrawal: number;
  annualInterest: number;
  netVariationExcludingInterest: number;
  finalMonthlyInvestment: number;
  finalMonthlyWithdrawal: number;
  totalInvested: number;
  totalWithdrawn: number;
  targetAge: boolean;
}

export interface Statistics {
  birthYear: number;
  calculatedRetirementStartYear: number;
  retirementStartAge: number;
  finalCapital: number;
  isCapitalExhausted: boolean;
  exhaustionYear: string | number;
  exhaustionAge: number;
  totalInvestedAmount: number;
  lifeExpectancy: number;
  retirementDuration: number;
  capitalAtRetirement: number;
  totalNeededCapital: number;
  inflationAdjustedInvestment: number;
  inflationAdjustedCapital: number;
  maxBarValue: number;
  haveBarHeight: number;
  needBarHeight: number;
  finalMonthlyInvestment: number;
  finalMonthlyWithdrawalValue: number;
  effectiveRetirementDuration?: number;
}

export interface SimulatorParams {
  initialCapital: number;
  monthlyInvestment: number;
  annualReturnRate: number;
  inflation: number;
  monthlyRetirementWithdrawal: number;
  currentAge: number;
  retirementInput: string;
  currency: string;
  withdrawalMode: "amount" | "age";
  maxAge: number;
}

export interface FormatAmountFunction {
  (amount: number): string;
} 