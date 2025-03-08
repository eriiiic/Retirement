import React, { useState, useEffect, useMemo } from 'react';
import { Title, Subtitle, Card, Section, SectionTitle } from '../common/StyledComponents';
import { Helmet } from 'react-helmet';
import { isSafari } from '../../utils/browserDetection';
import Footer from '../common/Footer';
import { useTheme } from '../../context/ThemeContext';
import { cx } from '../../styles/styleGuide';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode } = useTheme();

  return (
    <div className={cx(
      "border-b py-5",
      darkMode ? "border-gray-700" : "border-gray-200"
    )}>
      <button
        className="flex justify-between items-center w-full text-left focus:outline-none group transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className={cx(
          "text-lg font-medium group-hover:text-indigo-600 transition-colors",
          darkMode ? "text-gray-100" : "text-gray-900"
        )}>
          {question}
        </h3>
        <span className={cx(
          "ml-6 flex-shrink-0 p-1.5 rounded-full transition-all",
          isOpen ? "transform rotate-180" : "",
          darkMode
            ? "bg-gray-700 group-hover:bg-indigo-900/50"
            : "bg-gray-100 group-hover:bg-indigo-100"
        )}>
          <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="mt-4">
          <div className={cx(
            "p-5 rounded-lg border prose prose-base max-w-none",
            darkMode 
              ? "bg-gray-800 border-gray-700 prose-invert prose-p:text-gray-300 prose-strong:text-white prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300" 
              : "bg-gray-50 border-indigo-100 text-gray-700"
          )}>
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

const CompoundInterestPage: React.FC = () => {
  // State for Safari detection
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  const { darkMode } = useTheme();
  
  // Detect Safari browser on component mount
  useEffect(() => {
    setIsSafariBrowser(isSafari());
  }, []);

  // State for interactive formula example
  const [principal, setPrincipal] = useState(5000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);
  const [compound, setCompound] = useState(12);

  // Section Header Component
interface SectionHeaderProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ id, title, icon, className = '' }) => {
  const { darkMode } = useTheme();
  
  return (
    <h2 id={id} className={cx(
      "text-2xl font-bold mb-4 flex items-center",
      darkMode ? "text-white" : "text-gray-900",
      className
    )}>
      <span className="bg-indigo-600 text-white p-2 rounded-full mr-3 flex items-center justify-center">
        {icon}
      </span>
      {title}
    </h2>
  );
};

  // Calculate compound interest for the interactive example
  const compoundInterest = useMemo(() => {
    // Handle edge cases
    if (principal <= 0 || rate <= 0 || years <= 0 || compound <= 0) {
      return "0.00";
    }
    
    const r = rate / 100;
    const n = compound;
    const t = years;
    const P = principal;
    
    try {
      return (P * Math.pow(1 + r/n, n*t)).toFixed(2);
    } catch (error) {
      console.error("Error calculating compound interest:", error);
      return "Error";
    }
  }, [principal, rate, years, compound]);

  // Generate data for the comparison chart
  const comparisonData = useMemo(() => {
    // Handle edge cases
    if (principal <= 0 || rate <= 0 || years < 0 || compound <= 0) {
      return [];
    }
    
    const data = [];
    try {
      for (let year = 0; year <= years; year++) {
        const simpleInterest = principal * (1 + (rate / 100) * year);
        const compoundInterest = principal * Math.pow(1 + (rate / 100) / compound, compound * year);
        data.push({
          year,
          simple: Number(simpleInterest.toFixed(2)),
          compound: Number(compoundInterest.toFixed(2)),
        });
      }
      return data;
    } catch (error) {
      console.error("Error generating comparison data:", error);
      return [];
    }
  }, [principal, rate, years, compound]);

  // Calculate investment growth over time
  const calculateGrowth = useMemo(() => {
    return (
      monthlyContribution: number,
      startAge: number,
      endAge: number,
      annualReturn: number = 7,
      stopContributionAge?: number
    ) => {
      // Handle edge cases
      if (monthlyContribution < 0 || startAge < 0 || endAge <= startAge || annualReturn < 0) {
        return [];
      }
      
      // Ensure stopContributionAge is valid
      if (stopContributionAge !== undefined && 
          (stopContributionAge < startAge || stopContributionAge > endAge)) {
        stopContributionAge = endAge;
      }
      
      const data = [];
      let total = 0;
      const monthlyRate = annualReturn / 100 / 12;
      
      try {
        for (let age = startAge; age <= endAge; age++) {
          // Add monthly contributions and growth for the year
          for (let month = 0; month < 12; month++) {
            // Only add contribution if before stopContributionAge (if specified) or before endAge
            const shouldContribute = (!stopContributionAge && age < endAge) || 
                                   (stopContributionAge && age < stopContributionAge);
            
            if (shouldContribute) {
              total = (total + monthlyContribution) * (1 + monthlyRate);
            } else {
              total = total * (1 + monthlyRate);
            }
          }
          
          // Calculate total contribution
          const contributionYears = stopContributionAge 
            ? Math.min(age - startAge + 1, stopContributionAge - startAge)
            : (age < endAge ? age - startAge + 1 : 0);
          const totalContribution = contributionYears * 12 * monthlyContribution;
          
          data.push({
            age,
            total: Number(total.toFixed(2)),
            contribution: Number(totalContribution.toFixed(2))
          });
        }
        
        return data;
      } catch (error) {
        console.error("Error calculating growth:", error);
        return [];
      }
    };
  }, []);

  // Early and late investor data for the comparison chart
  const earlyInvestorData = useMemo(() => 
    calculateGrowth(200, 25, 65, 7, 35), 
  [calculateGrowth]);
  
  const lateInvestorData = useMemo(() => 
    calculateGrowth(200, 35, 65), 
  [calculateGrowth]);

  return (
    <div className={cx(
      "max-w-6xl mx-auto px-4 py-8",
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
    )}>
      <Helmet>
        <title>Understanding Compound Interest | Financial Growth Guide</title>
        <meta name="description" content="Learn how compound interest works, calculate your potential returns, and discover strategies to maximize your long-term wealth growth." />
        
        {/* Open Graph meta tags */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Understanding Compound Interest | Financial Growth Guide" />
        <meta property="og:description" content="Learn how compound interest can transform your savings into substantial wealth and accelerate your path to financial independence." />
        <meta property="og:image" content="https://FIRECalculator.ai/blog-images/compound-interest-og-image.png" />
        <meta property="og:url" content="https://FIRECalculator.ai/compound-interest" />
        <meta property="og:site_name" content="FIRECalculator.ai" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Understanding Compound Interest | Financial Growth Guide" />
        <meta name="twitter:description" content="Learn how compound interest can transform your savings into substantial wealth and accelerate your path to financial independence." />
        <meta name="twitter:image" content="https://FIRECalculator.ai/blog-images/compound-interest-twitter-card.png" />
        
        {/* LinkedIn meta tags */}
        <meta property="linkedin:title" content="Understanding Compound Interest | Financial Growth Guide" />
        <meta property="linkedin:description" content="Learn how compound interest can transform your savings into substantial wealth and accelerate your path to financial independence." />
        <meta property="linkedin:image" content="https://FIRECalculator.ai/blog-images/compound-interest-og-image.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://FIRECalculator.ai/compound-interest" />
      </Helmet>

      {/* Page Header with Gradient Background */}
      <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
        <div className={cx(
          "py-8 px-6 relative",
          isSafariBrowser 
            ? darkMode ? "bg-indigo-800" : "bg-indigo-600" 
            : "bg-gradient-to-r from-indigo-600 to-purple-600"
        )}>
          {/* Safari-specific overlay gradient using background-image */}
          {isSafariBrowser && (
            <div className={cx(
              "absolute inset-0 opacity-90",
              darkMode 
                ? "bg-[linear-gradient(to_right,#3730a3,#6b21a8)]" 
                : "bg-[linear-gradient(to_right,#4f46e5,#9333ea)]"
            )}></div>
          )}
          <div className="mb-4 sm:mb-5 text-center relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              Understanding Compound Interest: Your Path to Financial Growth
            </h1>
            <p className="text-gray-100 text-sm sm:text-base max-w-2xl mx-auto font-medium">
              Learn how compound interest can transform your savings into substantial wealth over time, 
              and why it's considered one of the most powerful forces in financial planning.
            </p>
            <div className={cx(
              "mt-4 backdrop-blur-sm rounded-lg py-2 px-4 inline-block",
              darkMode ? "bg-black/20" : "bg-white/10"
            )}>
              <nav className="flex flex-wrap justify-center gap-3 sm:gap-5 text-sm">
                <a href="#what-is-compound-interest" className="text-white hover:text-indigo-200 font-medium transition-colors">What is Compound Interest?</a>
                <a href="#compound-formula" className="text-white hover:text-indigo-200 font-medium transition-colors">Formula</a>
                <a href="#investment-growth" className="text-white hover:text-indigo-200 font-medium transition-colors">Investment Growth</a>
                <a href="#calculator" className="text-white hover:text-indigo-200 font-medium transition-colors">Calculator</a>
                <a href="#faq" className="text-white hover:text-indigo-200 font-medium transition-colors">FAQ</a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Introduction Section */}
      <Section className={cx(
        "mb-10", 
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-indigo-50"
      )}>
        <div className={cx(
          "prose prose-lg max-w-none",
          darkMode
            ? "prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-white prose-a:text-indigo-400"
            : ""
        )}>
          <h2 id="what-is-compound-interest" className={cx(
            "text-2xl font-bold mb-4 flex items-center",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            <span className="bg-indigo-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            What is Compound Interest?
          </h2>
          
          <div className="space-y-6">
            <p className={cx(
              "text-lg leading-relaxed",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Compound interest is a fundamental financial concept where you earn returns not only on your 
              initial investment (principal) but also on the accumulated interest from previous periods. 
              Unlike simple interest, which calculates returns solely on the principal amount, compound 
              interest creates a snowball effect that can significantly accelerate wealth accumulation over time.
            </p>

            <div className={cx(
              "p-4 rounded-lg border",
              darkMode 
                ? "bg-blue-900/30 border-blue-800 text-blue-100" 
                : "bg-blue-50 border-blue-100 text-blue-800"
            )}>
              <h3 className={cx(
                "text-lg font-semibold mb-2",
                darkMode ? "text-blue-300" : "text-blue-900"
              )}>Key Difference from Simple Interest</h3>
              <p className={darkMode ? "text-blue-200" : "text-blue-800"}>
                With simple interest, a $1,000 investment earning 5% annually would gain $50 each year. 
                With compound interest, you'd earn 5% on both your original $1,000 AND on previously earned 
                interest, creating exponential growth potential.
              </p>
            </div>
            
            <div className={cx(
              "p-6 rounded-xl border mb-8 transform hover:scale-[1.02] transition-transform duration-300",
              darkMode 
                ? "bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-800" 
                : "bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200"
            )}>
              <div className="flex flex-col md:flex-row items-center">
                <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-4xl text-white">💰</span>
                  </div>
                </div>
                <div>
                  <h3 className={cx(
                    "text-xl font-bold mb-2",
                    darkMode
                      ? "text-indigo-400"
                      : "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
                  )}>
                    The Power of Compound Interest
                  </h3>
                  <blockquote className={cx(
                    "italic border-l-4 pl-4 text-lg",
                    darkMode ? "text-indigo-300 border-indigo-700" : "text-indigo-900 border-indigo-300"
                  )}>
                    "Compound interest is the eighth wonder of the world. He who understands it, earns it; 
                    he who doesn't, pays it." - Albert Einstein
                  </blockquote>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={cx(
                "p-4 rounded-lg shadow-sm border",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <h4 className={cx(
                  "font-semibold mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Where It Applies</h4>
                <ul className={cx(
                  "space-y-2",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• Investment accounts</li>
                  <li>• Retirement savings</li>
                  <li>• High-yield savings</li>
                  <li>• Dividend reinvestment</li>
                </ul>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm border",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <h4 className={cx(
                  "font-semibold mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Key Factors</h4>
                <ul className={cx(
                  "space-y-2",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• Interest rate</li>
                  <li>• Compounding frequency</li>
                  <li>• Time horizon</li>
                  <li>• Initial investment</li>
                </ul>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm border",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <h4 className={cx(
                  "font-semibold mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Benefits</h4>
                <ul className={cx(
                  "space-y-2",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• Exponential growth</li>
                  <li>• Wealth acceleration</li>
                  <li>• Passive income</li>
                  <li>• Financial freedom</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Enhanced Formula Section */}
      <Card className={cx(
        "mb-10 p-8",
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-blue-50"
      )}>
        <div id="compound-formula"></div>
        <SectionTitle className={cx(
          "text-2xl font-bold mb-4 flex items-center",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          <span className={cx(
            "p-2 rounded-full mr-3 flex items-center justify-center",
            "bg-indigo-600 text-white"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          </span>
          Understanding the Compound Interest Formula
        </SectionTitle>
        
        <div className="space-y-8">
          {/* Formula Display */}
          <div className={cx(
            "p-6 rounded-xl shadow-md border",
            darkMode ? "bg-gray-800 border-blue-900/50" : "bg-white border-blue-100"
          )}>
            <div className="text-center mb-6">
              <div className={cx(
                "p-4 rounded-lg inline-block",
                darkMode 
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800/50" 
                  : "bg-gradient-to-r from-blue-50 to-indigo-50"
              )}>
                <p className={cx(
                  "text-2xl font-mono font-bold",
                  darkMode
                    ? "text-indigo-300"
                    : "bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
                )}>
                  A = P(1 + r/n)<sup>nt</sup>
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Formula Components */}
              <div className="space-y-4">
                <h4 className={cx(
                  "font-semibold mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Formula Components:</h4>
                <ul className={cx(
                  "space-y-3",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li className="flex items-center">
                    <span className={cx(
                      "w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold mr-3",
                      darkMode ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-600"
                    )}>A</span>
                    <div>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-900"
                      )}>Final Amount</span>
                      <p className={cx(
                        "text-sm",
                        darkMode ? "text-gray-400" : "text-gray-600"
                      )}>The total value after compounding</p>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span className={cx(
                      "w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold mr-3",
                      darkMode ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-600"
                    )}>P</span>
                    <div>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-900"
                      )}>Principal</span>
                      <p className={cx(
                        "text-sm",
                        darkMode ? "text-gray-400" : "text-gray-600"
                      )}>Your initial investment amount</p>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span className={cx(
                      "w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold mr-3",
                      darkMode ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-600"
                    )}>r</span>
                    <div>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-900"
                      )}>Annual Interest Rate</span>
                      <p className={cx(
                        "text-sm",
                        darkMode ? "text-gray-400" : "text-gray-600"
                      )}>Expressed as a decimal (e.g., 5% = 0.05)</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Right Column: More Components */}
              <div className="space-y-4">
                <h4 className={cx(
                  "font-semibold mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Additional Factors:</h4>
                <ul className={cx(
                  "space-y-3",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li className="flex items-center">
                    <span className={cx(
                      "w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold mr-3",
                      darkMode ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-600"
                    )}>n</span>
                    <div>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-900"
                      )}>Compounding Frequency</span>
                      <p className={cx(
                        "text-sm",
                        darkMode ? "text-gray-400" : "text-gray-600"
                      )}>Number of times interest is compounded per year</p>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span className={cx(
                      "w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold mr-3",
                      darkMode ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-600"
                    )}>t</span>
                    <div>
                      <span className={cx(
                        "font-medium",
                        darkMode ? "text-gray-200" : "text-gray-900"
                      )}>Time</span>
                      <p className={cx(
                        "text-sm",
                        darkMode ? "text-gray-400" : "text-gray-600"
                      )}>Number of years the money is invested</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Real-World Examples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Compounding Frequencies */}
            <div className={cx(
              "p-6 rounded-xl border",
              darkMode 
                ? "bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-800/50" 
                : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"
            )}>
              <h4 className={cx(
                "font-semibold mb-4",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>Common Compounding Frequencies</h4>
              <div className="space-y-3">
                <div className={cx(
                  "p-3 rounded-lg",
                  darkMode ? "bg-gray-800" : "bg-white"
                )}>
                  <p className={cx(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    <strong className={darkMode ? "text-gray-100" : ""}>Daily (n=365):</strong> Most high-yield savings accounts
                  </p>
                </div>
                <div className={cx(
                  "p-3 rounded-lg",
                  darkMode ? "bg-gray-800" : "bg-white"
                )}>
                  <p className={cx(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    <strong className={darkMode ? "text-gray-100" : ""}>Monthly (n=12):</strong> Credit cards, many investment accounts
                  </p>
                </div>
                <div className={cx(
                  "p-3 rounded-lg",
                  darkMode ? "bg-gray-800" : "bg-white"
                )}>
                  <p className={cx(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    <strong className={darkMode ? "text-gray-100" : ""}>Quarterly (n=4):</strong> Some stock dividends and bonds
                  </p>
                </div>
                <div className={cx(
                  "p-3 rounded-lg",
                  darkMode ? "bg-gray-800" : "bg-white"
                )}>
                  <p className={cx(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    <strong className={darkMode ? "text-gray-100" : ""}>Annually (n=1):</strong> Some basic savings accounts
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Example Calculation */}
            <div className={cx(
              "p-6 rounded-xl border",
              darkMode 
                ? "bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-800/50" 
                : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
            )}>
              <h4 className={cx(
                "font-semibold mb-4",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>Example Calculation</h4>
              <div className="space-y-4">
                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-gray-800" : "bg-white"
                )}>
                  <p className={cx(
                    "font-medium mb-2",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>Initial Investment:</p>
                  <ul className={cx(
                    "text-sm space-y-1",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    <li>• Principal (P) = $1,000</li>
                    <li>• Annual Rate (r) = 5% = 0.05</li>
                    <li>• Time (t) = 3 years</li>
                    <li>• Compounding (n) = 12 (monthly)</li>
                  </ul>
                </div>
                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-gray-800" : "bg-white"
                )}>
                  <p className={cx(
                    "font-medium mb-2",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>Result:</p>
                  <p className={cx(
                    "text-sm",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    $1,000 × (1 + 0.05/12)<sup>12×3</sup> = <strong className={cx(
                      darkMode ? "text-indigo-300" : "text-indigo-700"
                    )}>${(1000 * Math.pow(1 + 0.05/12, 12 * 3)).toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className={cx(
            "p-6 rounded-xl border",
            darkMode 
              ? "bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-800/50" 
              : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
          )}>
            <h4 className={cx(
              "font-semibold mb-4",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Key Insights</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800" : "bg-white"
              )}>
                <h5 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Higher Frequency = Better Returns</h5>
                <p className={cx(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  More frequent compounding periods result in higher returns over time, though the difference becomes smaller at higher frequencies.
                </p>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800" : "bg-white"
              )}>
                <h5 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Time Amplifies Growth</h5>
                <p className={cx(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  The exponential nature of the formula means that longer time periods lead to dramatically larger final amounts.
                </p>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800" : "bg-white"
              )}>
                <h5 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Rate Impact</h5>
                <p className={cx(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Small differences in interest rates can lead to significant differences in final amounts over long periods.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Visual Comparison Section */}
      <Section className="mb-10">
        <div className="prose prose-lg max-w-none">
          <h2 id="investment-growth" className={cx(
            "text-2xl font-bold mb-4 flex items-center",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            <span className="bg-green-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </span>
            Simple vs. Compound Interest: A Visual Guide
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className={cx(
              "p-6 rounded-xl shadow-md border",
              darkMode ? "bg-gray-800 border-green-900" : "bg-white border-green-100"
            )}>
              <h3 className={cx(
                "text-xl font-semibold mb-4",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>Simple Interest</h3>
              <div className="space-y-4">
                <p className={cx(
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  With simple interest, you earn a fixed percentage only on your initial investment.
                  The growth is <span className={cx(
                    "font-semibold",
                    darkMode ? "text-green-400" : "text-green-600"
                  )}>linear</span>,
                  making it easier to calculate but less powerful over time.
                </p>
                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-green-900/30 border border-green-800" : "bg-green-50"
                )}>
                  <h4 className={cx(
                    "font-medium mb-2",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>Simple Interest Formula:</h4>
                  <p className={cx(
                    "font-mono mb-2",
                    darkMode ? "text-green-300" : "text-green-800"
                  )}>A = P(1 + rt)</p>
                  <p className={cx(
                    "text-sm",
                    darkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    Where: A = Final amount, P = Principal, r = Interest rate, t = Time in years
                  </p>
                </div>
                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-green-900/30 border border-green-800" : "bg-green-50"
                )}>
                  <p className={cx(
                    "text-sm mb-1",
                    darkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    With your current values:
                  </p>
                  <p className={cx(
                    "text-lg font-semibold",
                    darkMode ? "text-green-400" : "text-green-600"
                  )}>
                    ${principal} invested at {rate}% for {years} years = 
                    ${(principal * (1 + (rate / 100) * years)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className={cx(
              "p-6 rounded-xl shadow-md border",
              darkMode ? "bg-gray-800 border-blue-900" : "bg-white border-blue-100"
            )}>
              <h3 className={cx(
                "text-xl font-semibold mb-4",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>Compound Interest</h3>
              <div className="space-y-4">
                <p className={cx(
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  With compound interest, you earn returns on both your initial investment
                  and accumulated interest. The growth is <span className={cx(
                    "font-semibold",
                    darkMode ? "text-blue-400" : "text-blue-600"
                  )}>exponential</span>,
                  creating a powerful snowball effect over time.
                </p>
                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-blue-900/30 border border-blue-800" : "bg-blue-50"
                )}>
                  <h4 className={cx(
                    "font-medium mb-2",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>Compound Interest Formula:</h4>
                  <p className={cx(
                    "font-mono mb-2",
                    darkMode ? "text-blue-300" : "text-blue-800"
                  )}>A = P(1 + r/n)<sup>nt</sup></p>
                  <p className={cx(
                    "text-sm",
                    darkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    Where: n = Number of times interest is compounded per year
                  </p>
                </div>
                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-blue-900/30 border border-blue-800" : "bg-blue-50"
                )}>
                  <p className={cx(
                    "text-sm mb-1",
                    darkMode ? "text-gray-400" : "text-gray-600"
                  )}>
                    With your current values (compounded {
                      compound === 1 ? 'annually' : 
                      compound === 4 ? 'quarterly' : 
                      compound === 12 ? 'monthly' : 'daily'
                    }):
                  </p>
                  <p className={cx(
                    "text-lg font-semibold",
                    darkMode ? "text-blue-400" : "text-blue-600"
                  )}>
                    ${principal} invested at {rate}% for {years} years = 
                    ${compoundInterest}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={cx(
            "p-6 rounded-xl shadow-lg border mb-8",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <h3 className={cx(
              "text-xl font-semibold mb-2",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Growth Comparison Over Time</h3>
            <p className={cx(
              "mb-4",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>${principal} invested at {rate}% for {years} years - Simple: ~$13,000 vs. Compound: ~$24,634</p>
            <div className="h-[400px]" style={{ minHeight: '400px', width: '100%', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={comparisonData} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  style={{ overflow: 'visible' }}
                  aria-label="Chart comparing simple and compound interest over time"
                  role="img"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                    tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Amount ($)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 10,
                      fill: darkMode ? "#9CA3AF" : "#4B5563"
                    }}
                    tickFormatter={(value: number) => `$${value.toLocaleString()}`}
                    tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                  />
                  <Tooltip 
                    formatter={(value: number) => ['$' + value.toLocaleString(), undefined]}
                    labelFormatter={(label: string) => `Year ${label}`}
                    wrapperStyle={{ zIndex: 1000 }}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      borderColor: darkMode ? '#374151' : '#E5E7EB',
                      color: darkMode ? '#F9FAFB' : '#111827'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  <Line
                    type="monotone"
                    dataKey="simple"
                    name="Simple Interest"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                    isAnimationActive={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="compound"
                    name="Compound Interest"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-4">
              <p className={cx(
                "text-sm",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>
                Hover over the lines to see exact values at each year. Notice how the compound
                interest line curves dramatically upward while the simple interest line remains straight.
              </p>
              <div className={cx(
                "p-4 rounded-lg border",
                darkMode ? "bg-yellow-900/30 border-yellow-800" : "bg-yellow-50 border-yellow-100"
              )}>
                <h4 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Key Observations:</h4>
                <ul className={cx(
                  "list-disc pl-4 space-y-2 text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>Simple interest grows by a consistent $400 per year (with an 8% rate on $5,000)</li>
                  <li>Compound interest growth accelerates - by year 20, it's worth about <strong>$24,600</strong> compared to simple interest at just <strong>$13,000</strong></li>
                  <li>After 20 years, compound interest yields <strong>nearly 90% more</strong> than simple interest</li>
                  <li>The difference becomes more pronounced with:
                    <ul className="list-circle pl-4 mt-1 space-y-1">
                      <li>Higher interest rates (8% in this example)</li>
                      <li>Longer time periods (20 years shown)</li>
                      <li>More frequent compounding (monthly in this chart)</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className={cx(
            "p-6 rounded-xl border",
            darkMode 
              ? "bg-gradient-to-br from-blue-900/40 to-green-900/40 border-blue-800" 
              : "bg-gradient-to-br from-blue-50 to-green-50 border-blue-200"
          )}>
            <h3 className={cx(
              "text-xl font-semibold mb-4",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Real-World Applications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800" : "bg-white"
              )}>
                <h4 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Simple Interest Examples</h4>
                <ul className={cx(
                  "space-y-2 text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• Some personal loans</li>
                  <li>• Basic savings bonds</li>
                  <li>• Short-term lending between individuals</li>
                  <li>• Some car loans</li>
                </ul>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800" : "bg-white"
              )}>
                <h4 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Compound Interest Examples</h4>
                <ul className={cx(
                  "space-y-2 text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• High-yield savings accounts</li>
                  <li>• Investment portfolios</li>
                  <li>• Credit card debt</li>
                  <li>• Most mortgages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Enhanced Power of Starting Early Section */}
      <Section className={cx(
        "mb-10",
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-indigo-50"
      )}>
        <div className={cx(
          "prose prose-lg max-w-none",
          darkMode
            ? "prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-white prose-a:text-indigo-400"
            : ""
        )}>
          <h2 className={cx(
            "text-2xl font-bold mb-4 flex items-center",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            <span className="bg-purple-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            The Power of Starting Early
          </h2>

          <div className={cx(
            "p-6 rounded-xl shadow-lg border mb-8",
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          )}>
            <div className="mb-6">
              <h3 className={cx(
                "text-xl font-semibold mb-3",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>Time: Your Most Powerful Investment Tool</h3>
              <p className={cx(
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                When it comes to compound interest, time is your greatest ally. The earlier you start investing,
                the more time your money has to grow exponentially. Let's compare two investment strategies
                to demonstrate why starting early is so crucial.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className={cx(
                "p-6 rounded-xl border",
                darkMode 
                  ? "bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-800/50" 
                  : "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100"
              )}>
                <h3 className={cx(
                  "text-xl font-semibold mb-4",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Early Investor: Emily</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Starting Age:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-purple-400" : "text-purple-600"
                    )}>25</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Investment Period:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-purple-400" : "text-purple-600"
                    )}>10 years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Monthly Investment:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-purple-400" : "text-purple-600"
                    )}>$200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Total Invested:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-purple-400" : "text-purple-600"
                    )}>$24,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Annual Return:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-purple-400" : "text-purple-600"
                    )}>7%</span>
                  </div>
                  <div className={cx(
                    "mt-4 p-4 rounded-lg shadow-sm",
                    darkMode ? "bg-gray-750" : "bg-white"
                  )}>
                    <div className={cx(
                      "text-sm mb-1",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Value at Age 65:</div>
                    <div className={cx(
                      "text-2xl font-bold",
                      darkMode ? "text-purple-400" : "text-purple-600"
                    )}>
                      ${earlyInvestorData[40].total.toLocaleString()}
                    </div>
                    <div className={cx(
                      "text-sm mt-1",
                      darkMode ? "text-gray-500" : "text-gray-500"
                    )}>
                      (Invested for 10 years, then let it grow for 30 more years)
                    </div>
                  </div>
                </div>
              </div>

              <div className={cx(
                "p-6 rounded-xl border",
                darkMode 
                  ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50 border-blue-800/50" 
                  : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
              )}>
                <h3 className={cx(
                  "text-xl font-semibold mb-4",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Late Investor: Leo</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Starting Age:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-blue-400" : "text-blue-600"
                    )}>35</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Investment Period:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-blue-400" : "text-blue-600"
                    )}>30 years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Monthly Investment:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-blue-400" : "text-blue-600"
                    )}>$200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Total Invested:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-blue-400" : "text-blue-600"
                    )}>$72,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cx(
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Annual Return:</span>
                    <span className={cx(
                      "font-semibold",
                      darkMode ? "text-blue-400" : "text-blue-600"
                    )}>7%</span>
                  </div>
                  <div className={cx(
                    "mt-4 p-4 rounded-lg shadow-sm",
                    darkMode ? "bg-gray-750" : "bg-white"
                  )}>
                    <div className={cx(
                      "text-sm mb-1",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Value at Age 65:</div>
                    <div className={cx(
                      "text-2xl font-bold",
                      darkMode ? "text-blue-400" : "text-blue-600"
                    )}>
                      ${lateInvestorData[30].total.toLocaleString()}
                    </div>
                    <div className={cx(
                      "text-sm mt-1",
                      darkMode ? "text-gray-500" : "text-gray-500"
                    )}>
                      (Invested for entire 30 years)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cx(
              "p-4 rounded-lg border",
              darkMode 
                ? "bg-indigo-900/20 border-indigo-800/50" 
                : "bg-indigo-50 border-indigo-100"
            )}>
              <h3 className={cx(
                "text-xl font-semibold mb-3",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>The Power of Starting Early: Emily vs. Leo</h3>
              <p className={cx(
                "mb-4",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                This simulation demonstrates the dramatic difference between starting early versus starting late.
                Despite investing <strong className={darkMode ? "text-white" : ""}>$48,000 less</strong> in total, 
                Emily ends up with <strong className={darkMode ? "text-white" : ""}>more money</strong> at retirement 
                due to the power of compound growth over time.
              </p>
              
              <div className="h-[400px]" style={{ minHeight: '400px', width: '100%', overflow: 'hidden' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    margin={{ top: 10, right: 30, left: 20, bottom: 15 }}
                    style={{ overflow: 'visible' }}
                    aria-label="Chart comparing early and late investment strategies"
                    role="img"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis 
                      dataKey="age" 
                      type="number"
                      domain={[25, 65]} 
                      label={{ 
                        value: 'Age', 
                        position: 'insideBottom', 
                        offset: -5, 
                        fill: darkMode ? "#9CA3AF" : "#4B5563"
                      }}
                      ticks={[25, 30, 35, 40, 45, 50, 55, 60, 65]}
                      tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Portfolio Value ($)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10,
                        fill: darkMode ? "#9CA3AF" : "#4B5563"
                      }}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                      tick={{ fill: darkMode ? "#9CA3AF" : "#4B5563" }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                      labelFormatter={(label: number) => `Age ${label}`}
                      wrapperStyle={{ zIndex: 1000 }}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        color: darkMode ? '#F9FAFB' : '#111827'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                    <Line
                      data={earlyInvestorData}
                      type="monotone"
                      dataKey="total"
                      name="Emily (Early Start)"
                      stroke="#9333ea"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8 }}
                      isAnimationActive={true}
                    />
                    <Line
                      data={lateInvestorData}
                      type="monotone"
                      dataKey="total"
                      name="Leo (Late Start)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8 }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Practical Strategies */}
      <Section className={cx(
        "mb-10",
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-indigo-50"
      )}>
        <SectionTitle className={cx(
          "text-2xl font-bold mb-4 flex items-center",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          <span className={cx(
            "p-2 rounded-full mr-3 flex items-center justify-center",
            "bg-purple-600 text-white"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
          </span>
          Practical Strategies to Harness Compound Interest
        </SectionTitle>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Strategy 1 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <div className={cx(
              "rounded-full w-12 h-12 flex items-center justify-center mb-4",
              darkMode ? "bg-purple-900/40" : "bg-purple-100"
            )}>
              <span className="text-lg">🏁</span>
            </div>
            <h3 className={cx(
              "text-lg font-bold mb-2",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Start Early</h3>
            <p className={cx(
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Even small amounts invested early in life can grow substantially. Don't wait for the "perfect" time or amount – start now.
            </p>
          </Card>
          
          {/* Strategy 2 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <div className={cx(
              "rounded-full w-12 h-12 flex items-center justify-center mb-4",
              darkMode ? "bg-purple-900/40" : "bg-purple-100"
            )}>
              <span className="text-lg">🔄</span>
            </div>
            <h3 className={cx(
              "text-lg font-bold mb-2",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Reinvest Dividends</h3>
            <p className={cx(
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Reinvesting dividends and interest payments accelerates the compounding effect, significantly boosting your returns over time.
            </p>
          </Card>
          
          {/* Strategy 3 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <div className={cx(
              "rounded-full w-12 h-12 flex items-center justify-center mb-4",
              darkMode ? "bg-purple-900/40" : "bg-purple-100"
            )}>
              <span className="text-lg">📆</span>
            </div>
            <h3 className={cx(
              "text-lg font-bold mb-2",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Be Consistent</h3>
            <p className={cx(
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Regular contributions through methods like dollar-cost averaging help build wealth steadily and reduce the impact of market volatility.
            </p>
          </Card>
          
          {/* Strategy 4 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <div className={cx(
              "rounded-full w-12 h-12 flex items-center justify-center mb-4",
              darkMode ? "bg-purple-900/40" : "bg-purple-100"
            )}>
              <span className="text-lg">📈</span>
            </div>
            <h3 className={cx(
              "text-lg font-bold mb-2",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Maximize Returns</h3>
            <p className={cx(
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Even small increases in your annual return rate can have dramatic effects on long-term growth due to compounding.
            </p>
          </Card>
          
          {/* Strategy 5 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <div className={cx(
              "rounded-full w-12 h-12 flex items-center justify-center mb-4",
              darkMode ? "bg-purple-900/40" : "bg-purple-100"
            )}>
              <span className="text-lg">💸</span>
            </div>
            <h3 className={cx(
              "text-lg font-bold mb-2",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Minimize Fees</h3>
            <p className={cx(
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              High fees can significantly reduce the power of compound interest. Choose investments with low expense ratios.
            </p>
          </Card>
          
          {/* Strategy 6 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <div className={cx(
              "rounded-full w-12 h-12 flex items-center justify-center mb-4",
              darkMode ? "bg-purple-900/40" : "bg-purple-100"
            )}>
              <span className="text-lg">🏔️</span>
            </div>
            <h3 className={cx(
              "text-lg font-bold mb-2",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Be Patient</h3>
            <p className={cx(
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Compound interest works slowly at first but accelerates over time. Patience is essential to reap its full benefits.
            </p>
          </Card>
        </div>
      </Section>

      {/* Interactive Examples */}
      <Section className={cx(
        "mb-10",
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-indigo-50"
      )}>
        <SectionTitle className={cx(
          "text-2xl font-bold mb-4 flex items-center",
          darkMode ? "text-white" : "text-gray-900"
        )}>
          <span className={cx(
            "p-2 rounded-full mr-3 flex items-center justify-center",
            "bg-blue-600 text-white"
          )}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
          </span>
          Real-World Examples of Compound Interest
        </SectionTitle>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Example 1 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <h3 className={cx(
              "text-lg font-bold mb-3",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Retirement Account Growth</h3>
            <div className="mb-4">
              <p className={cx(
                "mb-2",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                If you invest $500 monthly in a retirement account with a 7% annual return:
              </p>
              <ul className={cx(
                "list-disc pl-6 space-y-1",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <li>After 10 years: <strong className={darkMode ? "text-white" : ""}>$83,141</strong></li>
                <li>After 20 years: <strong className={darkMode ? "text-white" : ""}>$246,070</strong></li>
                <li>After 30 years: <strong className={darkMode ? "text-white" : ""}>$566,764</strong></li>
                <li>After 40 years: <strong className={darkMode ? "text-white" : ""}>$1,198,261</strong></li>
              </ul>
            </div>
            <p className={cx(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              Notice how the growth accelerates dramatically in later years due to compounding.
            </p>
          </Card>
          
          {/* Example 2 */}
          <Card className={cx(
            "p-6",
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
          )}>
            <h3 className={cx(
              "text-lg font-bold mb-3",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Student Loan Debt</h3>
            <div className="mb-4">
              <p className={cx(
                "mb-2",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                A $30,000 student loan at 5% interest that isn't paid for 10 years:
              </p>
              <ul className={cx(
                "list-disc pl-6 space-y-1",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <li>Original balance: <strong className={darkMode ? "text-white" : ""}>$30,000</strong></li>
                <li>Balance after 10 years: <strong className={darkMode ? "text-white" : ""}>$48,871</strong></li>
                <li>Total interest accrued: <strong className={darkMode ? "text-white" : ""}>$18,871</strong></li>
              </ul>
            </div>
            <p className={cx(
              "text-sm",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              This illustrates how compound interest can work against you with debt.
            </p>
          </Card>
        </div>
        
        <div className={cx(
          "p-6 rounded-lg border",
          darkMode 
            ? "bg-indigo-900/30 border-indigo-800/50" 
            : "bg-indigo-50 border-indigo-100"
        )}>
          <h3 className={cx(
            "text-lg font-bold mb-3",
            darkMode ? "text-gray-100" : "text-indigo-900"
          )}>The Rule of 72</h3>
          <p className={cx(
            "mb-4",
            darkMode ? "text-gray-300" : "text-indigo-800"
          )}>
            The Rule of 72 is a simple way to estimate how long it will take for an investment to double in value.
          </p>
          <div className={cx(
            "p-4 rounded-md mb-4 inline-block",
            darkMode ? "bg-gray-800 border border-indigo-800/50" : "bg-white"
          )}>
            <p className={cx(
              "text-center font-bold text-lg",
              darkMode ? "text-indigo-300" : ""
            )}>
              Years to double = 72 ÷ Annual interest rate (%)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className={cx(
              "p-3 rounded-md text-center shadow-sm",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <p className={cx(
                "font-medium",
                darkMode ? "text-gray-300" : ""
              )}>2% return</p>
              <p className={cx(
                "text-lg font-bold",
                darkMode ? "text-indigo-400" : "text-indigo-600"
              )}>36 years</p>
            </div>
            <div className={cx(
              "p-3 rounded-md text-center shadow-sm",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <p className={cx(
                "font-medium",
                darkMode ? "text-gray-300" : ""
              )}>7% return</p>
              <p className={cx(
                "text-lg font-bold",
                darkMode ? "text-indigo-400" : "text-indigo-600"
              )}>10.3 years</p>
            </div>
            <div className={cx(
              "p-3 rounded-md text-center shadow-sm",
              darkMode ? "bg-gray-800" : "bg-white"
            )}>
              <p className={cx(
                "font-medium",
                darkMode ? "text-gray-300" : ""
              )}>10% return</p>
              <p className={cx(
                "text-lg font-bold",
                darkMode ? "text-indigo-400" : "text-indigo-600"
              )}>7.2 years</p>
            </div>
          </div>
          <p className={cx(
            "text-sm",
            darkMode ? "text-indigo-300" : "text-indigo-700"
          )}>
            As you can see, even small increases in the rate of return can dramatically decrease the time it takes for your money to double.
          </p>
        </div>
      </Section>

      {/* Enhanced Common Misconceptions and Tips Section */}
      <Section className={cx(
        "mb-10",
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-indigo-50"
      )}>
        <div className={cx(
          "prose prose-lg max-w-none p-6",
          darkMode
            ? "prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-white prose-a:text-indigo-400 prose-li:text-gray-300"
            : ""
        )}>
          <h2 className={cx(
            "text-2xl font-bold mb-4 flex items-center",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            <span className="bg-indigo-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Common Misconceptions and Smart Strategies
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Misconceptions with Detailed Explanations */}
            <div className="space-y-6">
              <div className={cx(
                "p-6 rounded-xl shadow-lg border",
                darkMode 
                  ? "bg-gray-800 border-red-900/50" 
                  : "bg-white border-red-100"
              )}>
                <h3 className={cx(
                  "text-xl font-semibold mb-6 flex items-center",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>
                  <span className={cx(
                    "mr-2",
                    darkMode ? "text-red-400" : "text-red-600"
                  )}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  Common Misconceptions
                </h3>
                
                <div className="space-y-6">
                  <div className={cx(
                    "p-4 rounded-lg",
                    darkMode 
                      ? "bg-gradient-to-r from-red-900/30 to-pink-900/30" 
                      : "bg-gradient-to-r from-red-50 to-pink-50"
                  )}>
                    <h4 className={cx(
                      "font-semibold mb-2 flex items-center",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      <span className={cx(
                        "mr-2",
                        darkMode ? "text-red-400" : "text-red-500"
                      )}>#1</span>
                      "I need a large sum to start investing"
                    </h4>
                    <div className="space-y-2">
                      <p className={cx(
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        Many people believe they need thousands of dollars to start investing effectively.
                        In reality, even small regular investments can grow significantly over time.
                      </p>
                      <div className={cx(
                        "p-3 rounded-md text-sm",
                        darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                      )}>
                        <strong className={darkMode ? "text-gray-100" : ""}>Example:</strong> $100 monthly invested at 7% annual return for 30 years 
                        could grow to approximately ${(100 * 12 * Math.pow(1 + 0.07/12, 12 * 30)).toFixed(2)}.
                      </div>
                    </div>
                  </div>

                  <div className={cx(
                    "p-4 rounded-lg",
                    darkMode 
                      ? "bg-gradient-to-r from-red-900/30 to-pink-900/30" 
                      : "bg-gradient-to-r from-red-50 to-pink-50"
                  )}>
                    <h4 className={cx(
                      "font-semibold mb-2 flex items-center",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      <span className={cx(
                        "mr-2",
                        darkMode ? "text-red-400" : "text-red-500"
                      )}>#2</span>
                      "Market timing is crucial for success"
                    </h4>
                    <div className="space-y-2">
                      <p className={cx(
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        While timing can affect returns, consistent investing over time (dollar-cost averaging) 
                        often outperforms attempts to time the market.
                      </p>
                      <div className={cx(
                        "p-3 rounded-md text-sm",
                        darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                      )}>
                        <strong className={darkMode ? "text-gray-100" : ""}>Reality:</strong> Regular investments help average out market highs and lows,
                        reducing risk and potentially improving long-term returns.
                      </div>
                    </div>
                  </div>

                  <div className={cx(
                    "p-4 rounded-lg",
                    darkMode 
                      ? "bg-gradient-to-r from-red-900/30 to-pink-900/30" 
                      : "bg-gradient-to-r from-red-50 to-pink-50"
                  )}>
                    <h4 className={cx(
                      "font-semibold mb-2 flex items-center",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      <span className={cx(
                        "mr-2",
                        darkMode ? "text-red-400" : "text-red-500"
                      )}>#3</span>
                      "Compound interest only matters for savings"
                    </h4>
                    <div className="space-y-2">
                      <p className={cx(
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        Compound interest works both ways - it can grow your wealth or increase your debt.
                        Understanding this is crucial for financial decisions.
                      </p>
                      <div className={cx(
                        "p-3 rounded-md text-sm",
                        darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                      )}>
                        <strong className={darkMode ? "text-gray-100" : ""}>Warning:</strong> Credit card debt at 20% APR can double in just 3.6 years
                        due to compound interest working against you.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Strategies with Implementation Tips */}
            <div className="space-y-6">
              <div className={cx(
                "p-6 rounded-xl shadow-lg border",
                darkMode 
                  ? "bg-gray-800 border-green-900/50" 
                  : "bg-white border-green-100"
              )}>
                <h3 className={cx(
                  "text-xl font-semibold mb-6 flex items-center",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>
                  <span className={cx(
                    "mr-2",
                    darkMode ? "text-green-400" : "text-green-600"
                  )}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Smart Investment Strategies
                </h3>
                
                <div className="space-y-6">
                  <div className={cx(
                    "p-4 rounded-lg",
                    darkMode 
                      ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30" 
                      : "bg-gradient-to-r from-green-50 to-emerald-50"
                  )}>
                    <h4 className={cx(
                      "font-semibold mb-2 flex items-center",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      <span className={cx(
                        "mr-2",
                        darkMode ? "text-green-400" : "text-green-500"
                      )}>#1</span>
                      Automate Your Investments
                    </h4>
                    <div className="space-y-2">
                      <p className={cx(
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        Set up automatic transfers to your investment accounts right after receiving your paycheck.
                      </p>
                      <div className={cx(
                        "p-3 rounded-md text-sm",
                        darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                      )}>
                        <strong className={darkMode ? "text-gray-100" : ""}>Implementation:</strong>
                        <ul className={cx(
                          "mt-1 space-y-1",
                          darkMode ? "text-gray-300" : ""
                        )}>
                          <li>• Schedule transfers on payday</li>
                          <li>• Start with 10-15% of income</li>
                          <li>• Increase with each raise</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={cx(
                    "p-4 rounded-lg",
                    darkMode 
                      ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30" 
                      : "bg-gradient-to-r from-green-50 to-emerald-50"
                  )}>
                    <h4 className={cx(
                      "font-semibold mb-2 flex items-center",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      <span className={cx(
                        "mr-2",
                        darkMode ? "text-green-400" : "text-green-500"
                      )}>#2</span>
                      Diversify Your Investments
                    </h4>
                    <div className="space-y-2">
                      <p className={cx(
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        Spread your investments across different asset classes to manage risk while 
                        maintaining growth potential.
                      </p>
                      <div className={cx(
                        "p-3 rounded-md text-sm",
                        darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                      )}>
                        <strong className={darkMode ? "text-gray-100" : ""}>Consider:</strong>
                        <ul className={cx(
                          "mt-1 space-y-1",
                          darkMode ? "text-gray-300" : ""
                        )}>
                          <li>• Index funds for broad market exposure</li>
                          <li>• Mix of stocks and bonds</li>
                          <li>• International market exposure</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={cx(
                    "p-4 rounded-lg",
                    darkMode 
                      ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30" 
                      : "bg-gradient-to-r from-green-50 to-emerald-50"
                  )}>
                    <h4 className={cx(
                      "font-semibold mb-2 flex items-center",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      <span className={cx(
                        "mr-2",
                        darkMode ? "text-green-400" : "text-green-500"
                      )}>#3</span>
                      Minimize Investment Costs
                    </h4>
                    <div className="space-y-2">
                      <p className={cx(
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        High fees can significantly reduce the power of compound interest over time.
                      </p>
                      <div className={cx(
                        "p-3 rounded-md text-sm",
                        darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                      )}>
                        <strong className={darkMode ? "text-gray-100" : ""}>Action Items:</strong>
                        <ul className={cx(
                          "mt-1 space-y-1",
                          darkMode ? "text-gray-300" : ""
                        )}>
                          <li>• Choose low-cost index funds</li>
                          <li>• Compare expense ratios</li>
                          <li>• Avoid unnecessary trading fees</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={cx(
                    "p-4 rounded-lg",
                    darkMode 
                      ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30" 
                      : "bg-gradient-to-r from-green-50 to-emerald-50"
                  )}>
                    <h4 className={cx(
                      "font-semibold mb-2 flex items-center",
                      darkMode ? "text-gray-100" : "text-gray-900"
                    )}>
                      <span className={cx(
                        "mr-2",
                        darkMode ? "text-green-400" : "text-green-500"
                      )}>#4</span>
                      Reinvest All Returns
                    </h4>
                    <div className="space-y-2">
                      <p className={cx(
                        darkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        Maximize compound growth by reinvesting dividends and interest payments instead
                        of taking them as income.
                      </p>
                      <div className={cx(
                        "p-3 rounded-md text-sm",
                        darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                      )}>
                        <strong className={darkMode ? "text-gray-100" : ""}>Setup:</strong>
                        <ul className={cx(
                          "mt-1 space-y-1",
                          darkMode ? "text-gray-300" : ""
                        )}>
                          <li>• Enable dividend reinvestment</li>
                          <li>• Automate reinvestment of interest</li>
                          <li>• Resist spending gains</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cx(
            "mt-8 p-6 rounded-xl border",
            darkMode 
              ? "bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-800/50" 
              : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100"
          )}>
            <h3 className={cx(
              "text-xl font-semibold mb-4",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Taking Action: Your Next Steps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
              )}>
                <h4 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Step 1: Start Now</h4>
                <p className={cx(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Open an investment account and set up your first automatic transfer, even if it's small.
                </p>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
              )}>
                <h4 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Step 2: Learn More</h4>
                <p className={cx(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Research different investment options and understand their risk/return profiles.
                </p>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
              )}>
                <h4 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Step 3: Stay Consistent</h4>
                <p className={cx(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Stick to your investment plan through market ups and downs.
                </p>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm",
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
              )}>
                <h4 className={cx(
                  "font-medium mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Step 4: Review & Adjust</h4>
                <p className={cx(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  Regularly review your strategy and adjust as your circumstances change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Conclusion */}
      <Section className={cx(
        "mb-10",
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-indigo-50"
      )}>
        <div className={cx(
          "prose prose-lg max-w-none p-6",
          darkMode
            ? "prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-white prose-a:text-indigo-400"
            : ""
        )}>
          <h2 className={cx(
            "text-2xl font-bold mb-4 flex items-center",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            <span className={cx(
              "p-2 rounded-full mr-3 flex items-center justify-center",
              "bg-indigo-600 text-white"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            Conclusion: The Eighth Wonder of the World
          </h2>
          
          <p className={cx(
            "mb-4",
            darkMode ? "text-gray-300" : "text-gray-700"
          )}>
            Compound interest is truly a remarkable force in personal finance. When harnessed correctly, 
            it can transform modest, consistent investments into substantial wealth over time. The key 
            lessons to remember are:
          </p>
          
          <ul className={cx(
            "list-disc pl-6 space-y-2 mb-6",
            darkMode ? "text-gray-300" : "text-gray-700"
          )}>
            <li><strong className={darkMode ? "text-white" : ""}>Start as early as possible</strong> to maximize the compounding effect</li>
            <li><strong className={darkMode ? "text-white" : ""}>Be consistent</strong> with your contributions</li>
            <li><strong className={darkMode ? "text-white" : ""}>Reinvest returns</strong> whenever possible</li>
            <li><strong className={darkMode ? "text-white" : ""}>Pay attention to fees</strong> and interest rates – small differences compound dramatically</li>
            <li><strong className={darkMode ? "text-white" : ""}>Be patient</strong> – compound interest works slowly at first but accelerates over time</li>
          </ul>
          
          <div className={cx(
            "p-4 rounded-lg border",
            darkMode 
              ? "bg-indigo-900/30 border-indigo-800/50" 
              : "bg-indigo-50 border-indigo-100"
          )}>
            <p className={cx(
              "italic",
              darkMode ? "text-indigo-300" : "text-indigo-800"
            )}>
              "By understanding and applying the principles of compound interest to your financial planning, 
              you're taking one of the most powerful steps toward achieving financial independence and a 
              secure retirement. Remember, financial success isn't just about how much you earn – it's about 
              how intelligently you put your money to work over time."
            </p>
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <div id="faq"></div>
      <Section className={cx(
        "mb-10",
        darkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-white to-indigo-50"
      )}>
        <div className={cx(
          "prose prose-lg max-w-none p-6",
          darkMode
            ? "prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-white prose-a:text-indigo-400 prose-li:text-gray-300"
            : ""
        )}>
          <SectionHeader 
            title="Frequently Asked Questions" 
            className="mb-8"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <p className={cx(
            "mb-8",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Get answers to common questions about the FIRE journey, strategies, and challenges you might face along the way.
          </p>
          
          <div className={cx(
            "rounded-lg divide-y",
            darkMode ?  "divide-gray-700" : "divide-gray-200"
          )}>
            <FAQItem 
              question="What's the difference between simple and compound interest?" 
              answer={
                <>
                  <p>The main differences between simple and compound interest are:</p>
                  <ul>
                    <li><strong>Simple interest</strong> is calculated only on the initial principal amount. If you invest $1,000 at 5% simple interest, you'll earn $50 per year regardless of how long you hold the investment.</li>
                    <li><strong>Compound interest</strong> is calculated on both the initial principal and the accumulated interest from previous periods. With the same $1,000 at 5% compound interest, you'd earn $50 in year one, but in year two you'll earn 5% on $1,050 ($52.50), and so on.</li>
                  </ul>
                  <p>This difference becomes dramatic over long periods. After 30 years, $1,000 with 5% simple interest would grow to $2,500, while with 5% compound interest it would reach approximately $4,322.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="How does compounding frequency affect returns?" 
              answer={
                <>
                  <p>Compounding frequency refers to how often interest is calculated and added to your principal. The more frequently interest compounds, the faster your money grows.</p>
                  <p>Common compounding frequencies include:</p>
                  <ul>
                    <li><strong>Annual:</strong> Interest compounds once per year</li>
                    <li><strong>Quarterly:</strong> Interest compounds four times per year</li>
                    <li><strong>Monthly:</strong> Interest compounds twelve times per year</li>
                    <li><strong>Daily:</strong> Interest compounds 365 times per year</li>
                  </ul>
                  <p>For example, $10,000 invested at 6% for 10 years would grow to:</p>
                  <ul>
                    <li>Annually: $17,908</li>
                    <li>Monthly: $18,140</li>
                    <li>Daily: $18,221</li>
                  </ul>
                  <p>The difference becomes more significant with higher interest rates and longer time periods.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="What types of investments typically provide compound returns?" 
              answer={
                <>
                  <p className={darkMode ? "text-gray-300" : ""}>Many investment vehicles offer compound returns, including:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li><strong className={darkMode ? "text-white" : ""}>Stocks and equity funds:</strong> Companies that reinvest profits or pay dividends that you reinvest</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Bonds and fixed-income funds:</strong> When interest payments are reinvested</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Certificates of Deposit (CDs):</strong> Particularly those with interest compounding options</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Savings accounts:</strong> Most compound interest daily or monthly</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Dividend-paying investments:</strong> When dividends are automatically reinvested to purchase more shares</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Real estate:</strong> Through property appreciation and rental income reinvestment</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Retirement accounts:</strong> 401(k)s, IRAs, and other tax-advantaged accounts where earnings are reinvested</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>The key to maximizing compound returns is consistent reinvestment of earnings rather than withdrawing them.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="What is the Rule of 72 and how can I use it?" 
              answer={
                <>
                  <p className={darkMode ? "text-gray-300" : ""}>The Rule of 72 is a simple mental math shortcut to estimate how long it will take for an investment to double in value, given a fixed annual rate of return.</p>
                  <p className={darkMode ? "text-gray-300" : ""}><strong className={darkMode ? "text-white" : ""}>The formula:</strong> Years to double = 72 ÷ Annual interest rate</p>
                  <p className={darkMode ? "text-gray-300" : ""}>For example:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li>At 6% return, money doubles in approximately 12 years (72 ÷ 6 = 12)</li>
                    <li>At 8% return, money doubles in approximately 9 years (72 ÷ 8 = 9)</li>
                    <li>At 10% return, money doubles in approximately 7.2 years (72 ÷ 10 = 7.2)</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>This rule works reasonably well for interest rates between 4% and 12%. You can also use it backward: if you need your money to double in 6 years, you'd need an annual return of about 12% (72 ÷ 6 = 12).</p>
                  <p className={darkMode ? "text-gray-300" : ""}>The Rule of 72 helps illustrate how small differences in return rates can dramatically impact wealth accumulation over time.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="How do dividends contribute to compound growth?" 
              answer={
                <>
                  <p className={darkMode ? "text-gray-300" : ""}>Dividends can significantly enhance compound growth when reinvested through a process called dividend reinvestment:</p>
                  <ol className={darkMode ? "text-gray-300" : ""}>
                    <li><strong className={darkMode ? "text-white" : ""}>Initial investment:</strong> You purchase shares of a dividend-paying company or fund</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Dividend payment:</strong> The company distributes a portion of profits to shareholders</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Reinvestment:</strong> Instead of taking the dividend as cash, you use it to purchase additional shares</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Compound effect:</strong> Your next dividend will be larger because you now own more shares</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Repetition:</strong> This cycle continues, accelerating your total return over time</li>
                  </ol>
                  <p className={darkMode ? "text-gray-300" : ""}>Many investors use Dividend Reinvestment Plans (DRIPs) to automatically reinvest dividends. The power comes from:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li>Increasing share count over time without additional cash investment</li>
                    <li>Dollar-cost averaging through regular reinvestment</li>
                    <li>Dividend growth if companies increase their payouts over time</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>Studies have shown that reinvested dividends have accounted for a significant portion of the stock market's total return over time.</p>
                </>
              } 
            />

            <FAQItem 
              question="What are the tax implications of compound interest?" 
              answer={
                <>
                  <p className={darkMode ? "text-gray-300" : ""}>The tax implications of compound interest vary depending on the investment vehicle and account type:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li><strong className={darkMode ? "text-white" : ""}>Taxable accounts:</strong> Interest, dividends, and capital gains are typically taxed in the year they're earned, which reduces the effective compounding rate</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Tax-deferred accounts:</strong> (Traditional 401(k)s, IRAs) Taxes are paid only when you withdraw funds, allowing full compounding of pre-tax amounts</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Tax-free accounts:</strong> (Roth 401(k)s, Roth IRAs) No taxes on qualified withdrawals, providing tax-free compounding</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>Tax considerations:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li>Interest income is typically taxed as ordinary income (potentially higher rates)</li>
                    <li>Qualified dividends and long-term capital gains usually have lower tax rates</li>
                    <li>Compounding in taxable accounts is most efficient with tax-efficient investments (index ETFs, municipal bonds, etc.)</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>Tax-advantaged accounts can dramatically increase the power of compounding by deferring or eliminating the tax drag, making them ideal vehicles for long-term compound growth.</p>
                </>
              } 
            />

            <FAQItem 
              question="How can I start investing with little money?" 
              answer={
                <>
                  <p className={darkMode ? "text-gray-300" : ""}>You can start benefiting from compound interest with almost any amount of money:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li><strong className={darkMode ? "text-white" : ""}>Micro-investing apps:</strong> Platforms like Acorns, Stash, or Robinhood allow you to start with as little as $5</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Fractional shares:</strong> Many brokerages now let you buy portions of expensive stocks</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Index ETFs:</strong> Low-cost exchange-traded funds often have no minimum investment requirements</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Employer retirement plans:</strong> Many 401(k) plans have no minimum contribution requirements</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Treasury securities:</strong> Some government bonds can be purchased for as little as $100</li>
                    <li><strong className={darkMode ? "text-white" : ""}>High-yield savings accounts:</strong> Many online banks offer accounts with no minimum balance</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>Key strategies for small investors:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li>Start with whatever you can afford—consistency matters more than amount</li>
                    <li>Automate contributions to remove the temptation to spend</li>
                    <li>Focus on low-fee investment options to maximize returns</li>
                    <li>Consider round-up services that invest your spare change</li>
                    <li>Gradually increase your contributions as your income grows</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>Remember, the magic of compound interest comes more from time in the market than initial investment size. Starting small today is far better than waiting until you have "enough" to invest.</p>
                </>
              } 
            />

            <FAQItem 
              question="How does inflation impact compound returns?" 
              answer={
                <>
                  <p className={darkMode ? "text-gray-300" : ""}>Inflation erodes the purchasing power of money over time, which affects compound returns in several ways:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li><strong className={darkMode ? "text-white" : ""}>Nominal vs. Real Returns:</strong> Your "nominal" return is the stated interest rate or investment gain, while your "real" return is the nominal return minus inflation</li>
                    <li><strong className={darkMode ? "text-white" : ""}>Example:</strong> If your investment grows at 7% but inflation is 3%, your real return is only 4%</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>The impact over time:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li>If $10,000 grows at 7% compounded annually for 30 years, it would reach about $76,123 in nominal terms</li>
                    <li>But with 3% annual inflation, the purchasing power would only be equivalent to about $31,883 in today's dollars</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>Strategies to combat inflation:</p>
                  <ul className={darkMode ? "text-gray-300" : ""}>
                    <li>Target investment returns that exceed inflation by a comfortable margin (historically, stocks have provided the best inflation-adjusted returns)</li>
                    <li>Consider inflation-protected securities like TIPS (Treasury Inflation-Protected Securities)</li>
                    <li>Include assets that historically perform well during inflation (real estate, certain commodities)</li>
                    <li>Adjust savings rates to account for inflation's impact on your target retirement amount</li>
                  </ul>
                  <p className={darkMode ? "text-gray-300" : ""}>When planning for long-term goals, always focus on real (inflation-adjusted) returns rather than nominal returns to ensure your purchasing power truly grows over time.</p>
                </>
              } 
            />
          </div>
        </div>
      </Section>

      {/* Call to Action */}
      <div className={cx(
        "mb-10 rounded-xl overflow-hidden shadow-lg",
        darkMode
          ? "bg-gradient-to-r from-indigo-900 to-purple-900 border border-indigo-800/50"
          : "bg-gradient-to-r from-indigo-600 to-purple-600"
      )}>
        <div className={cx(
          "px-6 py-12 text-center",
          darkMode ? "backdrop-blur-sm" : ""
        )}>
          <h2 className={cx(
            "text-2xl sm:text-3xl font-bold mb-4",
            darkMode ? "text-indigo-100" : "text-white"
          )}>
            Ready to Put Compound Interest to Work?
          </h2>
          <p className={cx(
            "max-w-2xl mx-auto mb-8",
            darkMode ? "text-indigo-200/90" : "text-indigo-100"
          )}>
            Use our retirement calculator to see how your savings can grow over time and build a personalized 
            plan for your financial future.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
            <a 
              href="/" 
              className={cx(
                "w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                darkMode 
                  ? "bg-indigo-100 text-indigo-900 border-transparent hover:bg-white" 
                  : "bg-white text-indigo-700 border-transparent hover:bg-indigo-50"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Try Our Retirement Calculator
            </a>
            <a 
              href="/fire" 
              className={cx(
                "w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border text-base font-medium rounded-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                darkMode 
                  ? "border-indigo-400/50 text-indigo-100 hover:bg-indigo-800/50" 
                  : "border-indigo-200 text-white hover:bg-white/10"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Explore FIRE Movement
            </a>
          </div>
        </div>
      </div>

      {/* Add basic styles for charts */}
      <style>
        {`
          .chart-container {
            min-height: 400px;
            width: 100%;
          }
          
          svg {
            display: block;
          }
        `}
      </style>
      
      {/* Add Footer Component */}
      <Footer />
    </div>
  );
};

export default CompoundInterestPage; 