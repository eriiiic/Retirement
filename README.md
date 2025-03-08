# Retraite - Advanced Retirement Planning Simulator

A comprehensive retirement planning tool that helps users visualize and optimize their financial journey through retirement. This application provides detailed simulations, interactive charts, and financial analysis tools to help users plan for their retirement effectively.

## Key Features

- **Comprehensive Retirement Simulation**: Calculate retirement readiness with sophisticated financial models
- **Interactive Capital Evolution Charts**: Visualize your retirement journey with detailed charts
- **Expert Financial Analysis**: Get insights into your retirement plan with advanced metrics
- **Detailed Year-by-Year Schedule**: See a complete breakdown of your financial journey
- **PDF Report Generation**: Export professional-quality reports with detailed financial analysis
- **Customizable Parameters**: Fine-tune over a dozen retirement parameters
- **FIRE Blog & Resources**: Access educational content about Financial Independence/Retire Early
- **Compound Interest Calculator**: Specialized tool for understanding investment growth
- **Mobile-Responsive Design**: Fully functional on desktop and mobile devices
- **Performance Optimized**: Fast calculations using web workers and memoization

## Project Structure

```
src/
├── components/
│   ├── common/                # Reusable UI components
│   │   ├── Footer.tsx         # Site footer
│   │   ├── Header.tsx         # Site header and navigation
│   │   ├── Metric.tsx         # Metric display component
│   │   ├── Modal.tsx          # Modal dialog component
│   │   └── StyledComponents.tsx # Shared styled components
│   ├── blog/                  # Blog components and content
│   │   ├── BlogPage.tsx       # Blog listing page
│   │   ├── BlogPostDetail.tsx # Individual blog post display
│   │   ├── CompoundInterestPage.tsx # Compound interest calculator
│   │   ├── blogData.ts        # Blog metadata
│   │   ├── blogPost-*.ts      # Individual blog post content
│   │   └── utils/             # Blog-specific utilities
│   ├── retirement/            # Retirement simulator components
│   │   ├── analyses/          # Analysis components
│   │   ├── ParametersSection.tsx # User input parameters
│   │   ├── ResultsSummary.tsx # Summary of retirement calculations
│   │   ├── ScheduleDetails.tsx # Year-by-year breakdown
│   │   ├── CapitalEvolutionChart.tsx # Main capital chart
│   │   ├── Analyses.tsx       # Advanced financial analyses
│   │   ├── FormulaModal.tsx   # Explanation of formulas
│   │   └── types.ts           # Type definitions for retirement data
│   └── RetirementSimulator.tsx # Main simulator component
├── hooks/                     # Custom React hooks
│   └── useWorker.ts           # Web worker pooling implementation
├── styles/                    # Styling utilities and configuration
│   └── styleGuide.ts          # Centralized styling system
├── utils/                     # Utility functions
│   ├── financialCalculations.ts # Core financial algorithms
│   ├── formatters.ts          # Formatting helpers
│   ├── modernPdfGenerator.ts  # PDF report generation
│   └── pdfGenerator.ts        # Legacy PDF generator
├── workers/                   # Web Workers for performance
│   ├── resultsSummary.worker.ts # Worker for calculation summaries
│   ├── scheduleDetails.worker.ts # Worker for schedule generation
│   └── utils.ts               # Shared worker utilities
└── types/                     # TypeScript type definitions
    └── worker.ts              # Worker-related type definitions
```

## Technical Features

### 1. Advanced Financial Calculations

- **Comprehensive Financial Functions**: Over 15 specialized functions for retirement calculations
- **Modern Financial Algorithms**: Uses specialized financial math libraries for accuracy
- **Inflation Modeling**: Accounts for inflation impacts on both investments and withdrawals
- **Multiple Withdrawal Strategies**: Supports fixed amount, percentage-based, and inflation-adjusted withdrawals
- **Scenario Comparisons**: Analyze different retirement scenarios side-by-side

### 2. Performance Optimizations

#### Worker Pooling System
The application utilizes a sophisticated Web Worker pooling system for compute-intensive operations:

- **Dynamic Worker Management**: Workers are created on demand and pooled for reuse
- **Resource Efficiency**: Maintains an optimal number of workers based on active component usage
- **Automatic Cleanup**: Workers are terminated after a period of inactivity to conserve resources
- **Message Routing**: Supports multiple simultaneous calculation requests with callback routing

#### Calculation Optimizations
- **Memoization**: Prevents redundant processing of expensive calculations
- **Chunked Processing**: Breaks large calculations into smaller chunks for better UI responsiveness
- **Lazy Evaluation**: Calculations are performed only when needed and results are cached

### 3. Interactive Visualization

- **Dynamic Charts**: Responsive charts that update as parameters change
- **Interactive Elements**: Hover states and tooltips for detailed information
- **Visual Analysis Tools**: Color-coded indicators for retirement readiness
- **Responsive Layouts**: Charts and visualizations adapt to different screen sizes

### 4. Report Generation

- **Professional PDF Reports**: Generate detailed retirement reports for saving or printing
- **Custom Graphics**: Includes charts, gauges, and visual indicators
- **Risk Assessment**: Includes sensitivity analysis and risk factors
- **Actionable Insights**: Provides specific recommendations based on the user's financial situation

### 5. Educational Content

- **FIRE Blog**: Articles on Financial Independence and Early Retirement
- **Financial Concepts**: Detailed explanations of key retirement planning concepts
- **Interactive Calculators**: Tools to explore compound interest and other financial concepts

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

### Building for Production

```bash
# Create optimized production build
npm run build

# Test the production build locally
npm run serve-build
```

## Deployment

This project includes automated deployment scripts for various environments. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 