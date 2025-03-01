/**
 * Data point for the retirement graph visualization
 */
export interface GraphDataPoint {
  /** Calendar year */
  year: number;
  /** Person's age in this year */
  age: number;
  /** Total capital at the end of this year */
  capital: number;
  /** Capital without interest (principal only) */
  capitalWithoutInterest: number;
  /** Year-over-year capital variation */
  variation: number;
  /** Whether this is a retirement year ("Yes" or "No") */
  retirement: "Yes" | "No";
  /** Total investment for this year */
  annualInvestment: number;
  /** Total withdrawal for this year */
  annualWithdrawal: number;
  /** Interest earned during this year */
  annualInterest: number;
  /** Net variation excluding interest (investments - withdrawals) */
  netVariationExcludingInterest: number;
  /** Monthly investment amount adjusted for inflation */
  finalMonthlyInvestment: number;
  /** Monthly withdrawal amount adjusted for inflation */
  finalMonthlyWithdrawal: number;
  /** Cumulative amount invested up to this year */
  totalInvested: number;
  /** Cumulative amount withdrawn up to this year */
  totalWithdrawn: number;
  /** Whether this year is the target age */
  targetAge: boolean;
}

/**
 * Retirement simulation statistics
 */
export interface Statistics {
  /** Birth year calculated from current age */
  birthYear: number;
  /** Year when retirement starts */
  calculatedRetirementStartYear: number;
  /** Age when retirement starts */
  retirementStartAge: number;
  /** Capital at the end of simulation */
  finalCapital: number;
  /** Whether capital is exhausted before life expectancy */
  isCapitalExhausted: boolean;
  /** Year when capital is exhausted (or "Not exhausted") */
  exhaustionYear: string | number;
  /** Age when capital is exhausted */
  exhaustionAge: number;
  /** Total amount invested over lifetime */
  totalInvestedAmount: number;
  /** Expected life expectancy */
  lifeExpectancy: number;
  /** Duration of retirement in years */
  retirementDuration: number;
  /** Capital at the start of retirement */
  capitalAtRetirement: number;
  /** Total capital needed for retirement */
  totalNeededCapital: number;
  /** Investment amount adjusted for inflation */
  inflationAdjustedInvestment: number;
  /** Capital adjusted for inflation */
  inflationAdjustedCapital: number;
  /** Maximum value for bar chart */
  maxBarValue: number;
  /** Height of "have" bar in visualization */
  haveBarHeight: number;
  /** Height of "need" bar in visualization */
  needBarHeight: number;
  /** Final monthly investment amount adjusted for inflation */
  finalMonthlyInvestment: number;
  /** Final monthly withdrawal amount adjusted for inflation */
  finalMonthlyWithdrawalValue: number;
  /** Effective duration of retirement (may differ from planned) */
  effectiveRetirementDuration?: number;
}

/**
 * Currency type
 */
export type Currency = "USD" | "EUR";

/**
 * Withdrawal mode type
 */
export type WithdrawalMode = "amount" | "age" | "rate";

/**
 * Compound frequency type
 */
export type CompoundFrequency = "monthly" | "annual";

/**
 * Retirement simulator parameters
 */
export interface SimulatorParams {
  /** Initial capital amount */
  initialCapital: number;
  /** Monthly investment amount */
  monthlyInvestment: number;
  /** Annual return rate percentage */
  annualReturnRate: number;
  /** Annual inflation rate percentage */
  inflation: number;
  /** Monthly withdrawal amount during retirement */
  monthlyRetirementWithdrawal: number;
  /** Current age */
  currentAge: number;
  /** Retirement age or year input (as string to handle both) */
  retirementInput: string;
  /** Currency for display (USD or EUR) */
  currency: Currency;
  /** Withdrawal planning mode */
  withdrawalMode: WithdrawalMode;
  /** Maximum age for planning */
  maxAge: number;
  /** Interest compounding frequency */
  compoundFrequency: CompoundFrequency;
  /** Withdrawal rate percentage (for rate mode) */
  withdrawalRate?: number;
}

/**
 * Function to format monetary amounts
 */
export interface FormatAmountFunction {
  (amount: number): string;
}

/**
 * Chart series visibility state
 */
export interface ChartSeriesVisibility {
  capital: boolean;
  capitalWithoutInterest: boolean;
}

/**
 * Timeline widths for visualization
 */
export interface TimelineWidths {
  working: number;
  retirement: number;
  depleted: number;
}

/**
 * Capital comparison data
 */
export interface CapitalComparison {
  invested: number;
  atRetirement: number;
  returnPercentage?: number;
}

/**
 * Status information
 */
export interface StatusInfo {
  isOnTrack: boolean;
  statusText?: string;
  statusClass?: string;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  key: keyof GraphDataPoint | null;
  direction: 'ascending' | 'descending' | null;
}

/**
 * Filter phase options
 */
export type FilterPhase = 'all' | 'investment' | 'retirement';

/**
 * Summary result data for retirement simulation
 */
export interface SummaryResult {
  /** Initial capital at the start of simulation */
  initialCapital: number;
  /** Final capital at the end of simulation */
  finalCapital: number;
  /** Age at retirement */
  retirementAge: number;
  /** Duration of retirement in years */
  retirementDuration: number;
  /** Total contributions over lifetime */
  totalContributions: number;
  /** Total withdrawals over lifetime */
  totalWithdrawals: number;
  /** Overall growth percentage */
  growthPercentage: number;
  /** Annualized return percentage */
  annualizedReturn: number;
} 