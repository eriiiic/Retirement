# Financial Calculations Library

This document provides a comprehensive reference for all financial calculations used in the Retirement Simulator application. All calculations are centralized in the `financialCalculations.ts` file to ensure consistency across components.

## Core Financial Functions

### 1. Future Value Calculation

**Function**: `calculateFutureValue`  
**Purpose**: Calculates the future value of an investment with regular contributions  
**Parameters**:
- `principal`: Initial investment amount
- `annualRate`: Annual interest rate (percentage)
- `years`: Number of years
- `monthlyContribution`: Monthly contribution amount
- `compoundFrequency`: Frequency of compounding ('monthly' or 'annual')

### 2. Withdrawal Amount Calculation

**Function**: `calculateWithdrawalAmount`  
**Purpose**: Calculates sustainable monthly withdrawal amount from a principal  
**Parameters**:
- `principal`: Capital amount
- `annualRate`: Annual interest rate (percentage)
- `years`: Number of years
- `inflation`: Annual inflation rate (percentage)
- `compoundFrequency`: Frequency of compounding ('monthly' or 'annual')

### 3. Capital Needed Calculation

**Function**: `calculateCapitalNeeded`  
**Purpose**: Calculates the capital needed to sustain a specific monthly withdrawal  
**Parameters**:
- `monthlyWithdrawal`: Desired monthly withdrawal amount
- `annualRate`: Annual interest rate (percentage)
- `years`: Number of years
- `inflation`: Annual inflation rate (percentage)
- `compoundFrequency`: Frequency of compounding ('monthly' or 'annual')

### 4. Inflation Adjusted Value

**Function**: `calculateInflationAdjustedValue`  
**Purpose**: Calculates the inflation-adjusted value of an amount after a certain period  
**Parameters**:
- `currentValue`: Current monetary value
- `inflationRate`: Annual inflation rate (percentage)
- `years`: Number of years

### 5. Present Value Calculation

**Function**: `calculatePresentValue`  
**Purpose**: Calculates the present value of a future amount  
**Parameters**:
- `futureValue`: Future monetary value
- `annualRate`: Annual interest rate (percentage)
- `years`: Number of years

### 6. Rate-Based Withdrawal

**Function**: `calculateRateBasedWithdrawal`  
**Purpose**: Calculates monthly withdrawal amount based on a percentage of capital  
**Parameters**:
- `capital`: Capital amount
- `withdrawalRate`: Annual withdrawal rate (percentage)

### 7. Effective Retirement Duration

**Function**: `calculateEffectiveRetirementDuration`  
**Purpose**: Calculates the actual duration of retirement based on when capital is exhausted  
**Parameters**:
- `graphData`: Time series data of capital evolution
- `defaultDuration`: Default retirement duration in years

### 19. Inflation-Adjusted Investment

**Function**: `calculateInflationAdjustedInvestment`  
**Purpose**: Calculates the inflation-adjusted value of a monthly investment  
**Parameters**:
- `monthlyInvestment`: Monthly investment amount
- `inflationRate`: Annual inflation rate (percentage)
- `years`: Number of years

### 20. Inflation-Adjusted Capital

**Function**: `calculateInflationAdjustedCapital`  
**Purpose**: Calculates the inflation-adjusted value of capital  
**Parameters**:
- `capital`: Capital amount
- `inflationRate`: Annual inflation rate (percentage)
- `years`: Number of years

### 21. Optimal Withdrawal Rate

**Function**: `calculateOptimalWithdrawalRate`  
**Purpose**: Calculates the optimal withdrawal rate to make retirement funds last until a target age  
**Parameters**:
- `capitalAtRetirement`: Capital amount at retirement
- `annualReturnRate`: Annual return rate (percentage)
- `retirementStartAge`: Age at retirement start
- `targetAge`: Target age for funds to last until (default: 95)
- `conservativeMultiplier`: Adjustment factor for conservative return estimate (default: 0.7)

### 22. Return Improvement Impact

**Function**: `calculateReturnImprovementImpact`  
**Purpose**: Calculates the impact of improving the investment return rate  
**Parameters**:
- `monthlyInvestment`: Monthly investment amount
- `yearsToRetirement`: Number of years until retirement
- `currentReturnRate`: Current annual return rate (percentage)
- `improvedReturnRate`: Improved annual return rate (percentage, default: currentReturnRate + 0.5%)

### 23. Additional Investment Impact

**Function**: `calculateAdditionalInvestmentImpact`  
**Purpose**: Calculates the impact of increasing the monthly investment amount  
**Parameters**:
- `currentMonthlyInvestment`: Current monthly investment amount
- `increaseRate`: Rate of increase (as decimal, e.g., 0.2 for 20%)
- `yearsToRetirement`: Number of years until retirement
- `annualReturnRate`: Annual return rate (percentage)

### 27. Effective Withdrawal Amount

**Function**: `calculateEffectiveWithdrawalAmount`  
**Purpose**: Calculates effective withdrawal amount with inflation adjustment if needed  
**Parameters**:
- `monthlyRetirementWithdrawal`: Monthly withdrawal amount
- `inflationAdjustedWithdrawal`: Whether withdrawal is adjusted for inflation
- `withdrawalMode`: Withdrawal mode ('amount', 'rate', or 'age')
- `inflation`: Annual inflation rate (percentage)
- `yearsUntilRetirement`: Years until retirement

### 28. Withdrawal Reduction

**Function**: `calculateWithdrawalReduction`  
**Purpose**: Calculates recommended withdrawal reduction to make capital last until target age  
**Parameters**:
- `capitalAtRetirement`: Capital amount at retirement
- `currentMonthlyWithdrawal`: Current monthly withdrawal amount
- `annualReturnRate`: Annual return rate (percentage)
- `retirementStartAge`: Age at retirement start
- `targetAge`: Target age for funds to last until (default: 95)
- `conservativeMultiplier`: Adjustment factor for conservative return estimate (default: 0.7)

### 34. Comprehensive Retirement Risk Assessment

**Function**: `calculateRetirementRisk`  
**Purpose**: Calculates a detailed risk assessment for retirement planning based on multiple factors  
**Parameters**:
- `capitalAtRetirement`: Capital amount at retirement
- `totalNeededCapital`: Total capital needed for retirement
- `monthlyRetirementWithdrawal`: Monthly withdrawal amount during retirement
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)
- `retirementStartAge`: Age at retirement start
- `currentAge`: Current age
- `lifeExpectancy`: Expected life expectancy
- `monthlyInvestment`: Current monthly investment amount
- `targetAge`: Target age for capital to last (default: 95)

**Returns**:
- `riskLevel`: Assessment level ('Low', 'Moderate', 'Significant', 'High', or 'Critical')
- `riskScore`: Numerical risk score (0-10)
- `factors`: Detailed breakdown of individual risk factors
- `description`: Descriptive assessment of the risk level
- `recommendationPriority`: Priority level for recommendations
- `primaryRecommendation`: Main action recommendation
- `secondaryRecommendations`: Additional recommendations

**Risk Levels**:
- **Low Risk** - Minimal potential for negative consequences. Your retirement plan is solid with established controls.
- **Moderate Risk** - Some potential for adverse outcomes, but generally manageable with standard precautions.
- **Significant Risk** - Notable potential for negative consequences requiring active management and monitoring.
- **High Risk** - Substantial potential for serious negative outcomes. Requires comprehensive mitigation strategies.
- **Critical Risk** - Extreme potential for severe consequences. Demands immediate attention and extensive adjustments.

## Analysis Functions

### 8. Capital Metrics

**Function**: `calculateCapitalMetrics`  
**Purpose**: Calculates key metrics about capital growth  
**Parameters**:
- `initialCapital`: Starting capital amount
- `monthlyInvestment`: Monthly investment amount
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)
- `years`: Number of years
- `compoundFrequency`: Frequency of compounding ('monthly' or 'annual')

### 9. Delayed Retirement Scenario

**Function**: `calculateDelayedScenario`  
**Purpose**: Calculates impact of delaying retirement  
**Parameters**:
- `initialCapital`: Starting capital amount
- `monthlyInvestment`: Monthly investment amount
- `monthlyWithdrawal`: Monthly withdrawal amount
- `retirementYear`: Planned retirement year
- `delayYears`: Years to delay retirement
- `currentYear`: Current year
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)

### 10. Time to Retirement

**Function**: `calculateTimeToRetirement`  
**Purpose**: Calculates time left until retirement date  
**Parameters**:
- `retirementYear`: Planned retirement year

### 11. Phase Summary

**Function**: `calculatePhaseSummary`  
**Purpose**: Summarizes financial stats for a specific phase (accumulation or withdrawal)  
**Parameters**:
- `data`: Array of time series data points

### 12. Years Until Exhaustion

**Function**: `calculateYearsUntilExhaustion`  
**Purpose**: Estimates number of years until capital is exhausted  
**Parameters**:
- `capital`: Current capital amount
- `annualWithdrawal`: Annual withdrawal amount
- `annualReturnRate`: Annual return rate (percentage)
- `conservativeMultiplier`: Adjustment factor for conservative estimate
- `maxYears`: Maximum years to consider

### 13. Delayed Retirement Impact

**Function**: `calculateDelayedRetirementImpact`  
**Purpose**: Calculates detailed impact of delaying retirement  
**Parameters**:
- `initialCapital`: Starting capital amount
- `monthlyInvestment`: Monthly investment amount
- `monthlyWithdrawal`: Monthly withdrawal amount
- `retirementYear`: Planned retirement year
- `delayYears`: Years to delay retirement
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)
- `currentYear`: Current year

### 14. Recommended Investment

**Function**: `calculateRecommendedInvestment`  
**Purpose**: Calculates recommended investment amount to meet retirement goals  
**Parameters**:
- `currentMonthlyInvestment`: Current monthly investment amount
- `capitalAtRetirement`: Projected capital at retirement
- `totalNeededCapital`: Total capital needed for retirement
- `yearsUntilRetirement`: Years until retirement
- `annualReturnRate`: Annual return rate (percentage)
- `monthlyRetirementWithdrawal`: Monthly withdrawal amount during retirement
- `targetAge`: Target age for retirement planning
- `currentAge`: Current age
- `retirementStartAge`: Age when retirement begins

## Utility Functions

### 15. Internal Rate of Return (IRR)

**Function**: `calculateIRR`  
**Purpose**: Calculates the internal rate of return for a series of cash flows  
**Parameters**:
- `cashFlows`: Array of cash flow values

### 16. Chart Value Formatting

**Function**: `formatChartValue`  
**Purpose**: Formats large monetary values for display on charts  
**Parameters**:
- `value`: Numerical value to format

### 17. Retirement Index Finder

**Function**: `findRetirementStartIndex`  
**Purpose**: Finds the index where retirement phase begins in time series data  
**Parameters**:
- `graphData`: Array of time series data points

### 18. Capital Withdrawal Decrease Year

**Function**: `findCapitalWithdrawalDecreaseYear`  
**Purpose**: Finds the year when capital begins to decrease during withdrawal phase  
**Parameters**:
- `graphData`: Array of time series data points

### 24. Exhaustion Age

**Function**: `calculateExhaustionAge`  
**Purpose**: Calculates the age when retirement capital is exhausted with inflation consideration  
**Parameters**:
- `startingCapital`: Starting capital amount
- `monthlyWithdrawal`: Monthly withdrawal amount
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)
- `retirementStartAge`: Age at retirement start
- `conservativeMultiplier`: Adjustment factor for conservative return estimate (default: 0.7)

### 25. Additional Years

**Function**: `calculateAdditionalYears`  
**Purpose**: Calculates additional years of retirement funding based on additional capital  
**Parameters**:
- `monthlyWithdrawal`: Monthly withdrawal amount
- `additionalCapital`: Additional capital amount

### 26. Delay Impact on Longevity

**Function**: `calculateDelayImpactOnLongevity`  
**Purpose**: Calculates if delaying retirement would allow capital to last until target age  
**Parameters**:
- `initialCapital`: Initial capital amount
- `monthlyInvestment`: Monthly investment amount
- `monthlyWithdrawal`: Monthly withdrawal amount
- `retirementYear`: Planned retirement year
- `delayYears`: Years to delay retirement
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)
- `retirementStartAge`: Original retirement start age
- `targetAge`: Target age for capital to last until (default: 95)
- `conservativeMultiplier`: Adjustment factor for conservative return estimate (default: 0.7)

### 29. Optimal Delay Years

**Function**: `calculateOptimalDelayYears`  
**Purpose**: Calculates the optimal number of years to delay retirement to sustain capital until target age  
**Parameters**:
- `initialCapital`: Initial capital amount
- `monthlyInvestment`: Monthly investment amount
- `monthlyWithdrawal`: Monthly withdrawal amount
- `retirementYear`: Planned retirement year
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)
- `currentAge`: Current age
- `currentYear`: Current year (default: current year)
- `withdrawalMode`: Withdrawal mode ('amount', 'rate', or 'age')
- `maxAge`: Maximum age for planning (default: 95)
- `riskLevel`: Risk level ('High', 'Medium', or 'Low')

### 30. Suggested Withdrawal

**Function**: `calculateSuggestedWithdrawal`  
**Purpose**: Calculates suggested withdrawal rate and monthly withdrawal amount  
**Parameters**:
- `currentMonthlyWithdrawal`: Current monthly withdrawal amount
- `currentWithdrawalRate`: Current withdrawal rate (percentage)
- `safeWithdrawalRate`: Safe withdrawal rate (percentage)

### 31. Optimal Retirement Age Assessment

**Function**: `calculateOptimalAssessment`  
**Purpose**: Assesses retirement age optimization opportunities  
**Parameters**:
- `retirementStartAge`: Retirement start age
- `currentAge`: Current age
- `capitalAtRetirement`: Capital amount at retirement
- `totalNeededCapital`: Total capital needed for retirement
- `effectiveMonthlyWithdrawal`: Effective monthly withdrawal amount

### 32. Investment Impact

**Function**: `calculateInvestmentImpact`  
**Purpose**: Calculates detailed investment impact on retirement capital and funding duration  
**Parameters**:
- `monthlyInvestment`: Current monthly investment amount
- `investmentIncrease`: Investment increase details with totalBenefit
- `capitalAtRetirement`: Capital amount at retirement
- `totalNeededCapital`: Total capital needed for retirement
- `effectiveMonthlyWithdrawal`: Effective monthly withdrawal amount
- `annualReturnRate`: Annual return rate (percentage)
- `inflation`: Annual inflation rate (percentage)
- `retirementStartAge`: Age at retirement start

### 33. Ideal Withdrawal (4% Rule)

**Function**: `calculateIdealWithdrawal`  
**Purpose**: Calculates ideal withdrawal amounts based on the 4% safe withdrawal rule  
**Parameters**:
- `capitalAtRetirement`: Capital amount at retirement
- `safeWithdrawalRatePercentage`: Safe withdrawal rate percentage (default: 4%)

## Usage Guidelines

1. **Always import from the centralized file**:
   ```typescript
   import { 
     calculateFutureValue, 
     calculateWithdrawalAmount
   } from '../utils/financialCalculations';
   ```

2. **Pass parameters between components**:
   Components should exchange parameters and results, not perform calculations.

3. **For new calculations**:
   Add them to the centralized file to ensure consistency and reusability.

4. **Updating calculations**:
   When updating a calculation, it only needs to be changed in one place.

5. **Avoid duplicating logic**:
   If a calculation exists in the centralized file, use it rather than reimplementing it.

6. **Handle undefined parameters**:
   When using these functions in components, provide defaults for optional parameters:
   ```typescript
   const inflationRate = inflation ?? 2; // Default to 2% if inflation is undefined
   ```

7. **Share calculation results between components**:
   Calculate values once in a parent component and pass the results to child components.
   This ensures all components display the same values for the same data.
   ```typescript
   // In parent component
   const withdrawalReduction = calculateWithdrawalReduction(...);
   
   // Pass to child components
   <ChildComponentA withdrawalReduction={withdrawalReduction} />
   <ChildComponentB withdrawalReduction={withdrawalReduction} />
   ```

## Component Integration

These calculations are used across multiple components in the application:

- **RetirementSimulator**: Main component that uses various calculations to simulate retirement scenarios
- **Analyses**: Uses analysis functions to provide retirement planning insights
- **RiskAssessmentCard**: Assesses retirement risks using withdrawal rate and exhaustion calculations
- **WithdrawalStrategyCard**: Calculates optimal withdrawal strategies
- **InvestmentIncreaseCard**: Analyzes the impact of increasing investment amounts
- **RetirementDelayCard**: Evaluates the impact of delaying retirement
- **CapitalEvolutionChart**: Visualizes capital growth and withdrawal over time 
- **RetirementRiskPanel**: Displays comprehensive risk assessment using multiple risk factors 