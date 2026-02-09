# FIRECalculator.ai - Advanced Retirement & FIRE Planning Simulator

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://FIRECalculator.ai)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive AI-powered retirement planning tool that helps users visualize and optimize their financial journey to Financial Independence and Early Retirement (FIRE).

![FIRECalculator Preview](public/blog-images/home-og-image.png)

## ✨ Features

### Core Calculator
- **Retirement Simulation** - Model your path to financial independence with sophisticated algorithms
- **Interactive Charts** - Real-time capital evolution visualization with Recharts
- **Multiple Withdrawal Strategies** - Fixed amount, percentage-based, or inflation-adjusted
- **PDF Reports** - Export professional financial reports

### Educational Content
- **FIRE Blog** - Articles on Financial Independence and Early Retirement
- **Compound Interest Calculator** - Interactive tool for understanding investment growth
- **Financial Glossary** - Key retirement planning concepts explained

### User Experience
- **Dark Mode** - Full dark/light theme support
- **Persistent Settings** - Parameters saved to localStorage
- **Mobile Responsive** - Works on all devices
- **Multi-Currency** - USD, EUR, GBP, JPY support

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript |
| **Styling** | TailwindCSS, CSS Modules |
| **Charts** | Recharts |
| **PDF** | jsPDF, jspdf-autotable |
| **Routing** | React Router v6 |
| **Build** | Create React App (react-app-rewired) |
| **Performance** | Web Workers, React.lazy(), Code Splitting |

## 📁 Project Structure

```
src/
├── components/
│   ├── common/           # Reusable UI (Header, Footer, SliderInput, etc.)
│   ├── blog/             # Blog pages and content
│   ├── retirement/       # Calculator components
│   └── RetirementSimulator.tsx
├── hooks/
│   ├── useLocalStorage.ts   # Persistent state hook
│   └── useWorker.ts         # Web Worker pool
├── utils/
│   ├── financialCalculations.ts  # Core financial algorithms
│   └── modernPdfGenerator.ts     # PDF report generation
├── styles/
│   ├── styleGuide.ts     # Design system tokens
│   └── components.css    # Component styles
├── workers/              # Web Workers for calculations
└── context/
    └── ThemeContext.tsx  # Dark mode provider
```

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/eriiiic/Retirement.git
cd Retirement

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🌐 Deployment

The app is deployed on **Cloudflare Pages** with automatic builds from the `WEBPROD` branch.

```bash
# Push to trigger deployment
git push origin WEBPROD
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📊 Performance Features

- **Code Splitting** - Routes lazy-loaded with React.lazy()
- **Web Workers** - Heavy calculations run off main thread
- **Memoization** - Expensive calculations cached with useMemo
- **Optimized Rendering** - React.memo and useCallback patterns

## 🔍 SEO Features

- Meta tags (Open Graph, Twitter Cards)
- Structured data (JSON-LD)
- Sitemap.xml
- robots.txt
- Canonical URLs
- Google Analytics

## 📝 Recent Updates

### Phase 1-4 Refactoring (Feb 2024)
- ✅ Technical debt cleanup
- ✅ Reusable component library (SliderInput, MonetaryInput, etc.)
- ✅ localStorage persistence
- ✅ Toast notification system
- ✅ Code splitting with React.lazy()

## 🤝 Contributing

Contributions are welcome! Please read the contribution guidelines first.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Live at:** [https://FIRECalculator.ai](https://FIRECalculator.ai)