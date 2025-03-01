# Retraite - Retirement Planning Simulator

A comprehensive retirement planning tool that helps users visualize and optimize their financial journey through retirement.

## Features

- **Retirement Simulation**: Calculate retirement readiness based on various financial parameters
- **Capital Evolution**: Visualize how your investments grow over time
- **Detailed Schedule**: Year-by-year breakdown of your financial journey
- **Customizable Parameters**: Adjust retirement age, investment returns, inflation, and more
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   └── StyledComponents.tsx
│   └── retirement/          # Retirement simulator components
│       ├── CapitalEvolutionChart.tsx
│       ├── ParametersSection.tsx
│       ├── ResultsSummary.tsx
│       ├── RetirementSimulator.tsx
│       ├── ScheduleDetails.tsx
│       └── types.ts
├── hooks/                   # Custom React hooks
│   └── useWorker.ts
├── styles/                  # Styling utilities and configuration
│   ├── styleGuide.ts
│   └── README.md
├── utils/                   # Utility functions
│   └── financialCalculations.ts
├── workers/                 # Web Workers for performance
│   ├── capitalEvolution.worker.ts
│   ├── resultsSummary.worker.ts
│   └── scheduleDetails.worker.ts
└── types/                   # TypeScript type definitions
    └── worker.ts
```

## Technical Optimizations

### 1. Worker Pooling

The application utilizes Web Workers for compute-intensive operations. Worker instances are pooled for performance, reducing the overhead of creating and terminating workers:

- `useWorker.ts`: Implements a worker pool that maintains worker instances and tracks their usage
- Each worker type (capitalEvolution, scheduleDetails, resultsSummary) has its own pool
- Workers are kept alive as long as at least one component is using them

### 2. Financial Calculation Optimization

- Centralized financial calculations in `financialCalculations.ts`
- Memoization of expensive calculations to prevent redundant processing
- Organized and reusable calculation functions that are shared across the application

### 3. UI Performance

- Component-level optimizations with React.memo and useCallback
- Efficient rendering patterns for data-heavy components
- Virtualized lists for large datasets
- Optimized slider implementation with cross-browser compatibility

## Style Guide

The application uses a comprehensive style guide to ensure consistency:

- **Typography**: Standardized text sizes, weights, and styles
- **Colors**: Cohesive color palette for the application
- **Components**: Reusable styled components
- **Layout**: Consistent spacing and container styles

See [Style Guide Documentation](src/styles/README.md) for details.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/retraite.git
cd retraite

# Install dependencies
npm install

# Start the development server
npm start
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 