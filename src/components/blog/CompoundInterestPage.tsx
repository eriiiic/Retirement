import React, { useState, useEffect, useMemo } from 'react';
import { Title, Subtitle, Card, Section, SectionTitle } from '../common/StyledComponents';
import { Helmet } from 'react-helmet';
import { isSafari } from '../../utils/browserDetection';
import Footer from '../common/Footer';

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

  return (
    <div className="border-b border-gray-200 py-5">
      <button
        className="flex justify-between items-center w-full text-left focus:outline-none group transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
          {question}
        </h3>
        <span className={`ml-6 flex-shrink-0 p-1.5 rounded-full bg-gray-100 group-hover:bg-indigo-100 transition-all ${isOpen ? 'transform rotate-180' : ''}`}>
          <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="mt-4 prose prose-indigo">
          <div className="text-base text-gray-700 bg-gray-50 p-5 rounded-lg border border-indigo-100">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

const CompoundInterestPage: React.FC = () => {
  // State for interactive formula example
  const [principal, setPrincipal] = useState(5000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);
  const [compound, setCompound] = useState(12);

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
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50">
      <Helmet>
        <title>Understanding Compound Interest | Retirement Planning Guide</title>
        <meta name="description" content="Learn how compound interest works, calculate your potential returns, and discover strategies to maximize your long-term wealth growth." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content="Understanding Compound Interest | Financial Growth Guide" />
        <meta property="og:description" content="Learn how compound interest can transform your savings into substantial wealth and accelerate your path to financial independence." />
        <meta property="og:image" content="https://yourdomain.com/images/compound-interest-social-card.jpg" />
        <meta property="og:url" content="https://yourdomain.com/compound-interest" />
        <meta property="og:site_name" content="Retirement Planner" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Understanding Compound Interest | Financial Growth Guide" />
        <meta name="twitter:description" content="Learn how compound interest can transform your savings into substantial wealth and accelerate your path to financial independence." />
        <meta name="twitter:image" content="https://yourdomain.com/images/compound-interest-social-card.jpg" />
        
        {/* LinkedIn */}
        <meta property="linkedin:title" content="Understanding Compound Interest | Financial Growth Guide" />
        <meta property="linkedin:description" content="Learn how compound interest can transform your savings into substantial wealth and accelerate your path to financial independence." />
        <meta property="linkedin:image" content="https://yourdomain.com/images/compound-interest-social-card.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://yourdomain.com/compound-interest" />
      </Helmet>

      {/* Page Header with Gradient Background */}
      <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
        <div className={`py-12 px-6 ${isSafari() ? 'bg-indigo-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Understanding Compound Interest: Your Path to Financial Growth
            </h1>
            <p className="text-gray-100 text-sm sm:text-base max-w-2xl mx-auto font-medium">
              Learn how compound interest can transform your savings into substantial wealth over time, 
              and why it's considered one of the most powerful forces in financial planning.
            </p>
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg py-3 px-4 inline-block">
              <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
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
      <Section className="mb-10 bg-gradient-to-br from-white to-indigo-50">
        <div className="prose prose-lg max-w-none">
          <h2 id="what-is-compound-interest" className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-indigo-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            What is Compound Interest?
          </h2>
          
          <div className="space-y-6">
            <p className="text-gray-700 text-lg leading-relaxed">
              Compound interest is a fundamental financial concept where you earn returns not only on your 
              initial investment (principal) but also on the accumulated interest from previous periods. 
              Unlike simple interest, which calculates returns solely on the principal amount, compound 
              interest creates a snowball effect that can significantly accelerate wealth accumulation over time.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Key Difference from Simple Interest</h3>
              <p className="text-blue-800">
                With simple interest, a $1,000 investment earning 5% annually would gain $50 each year. 
                With compound interest, you'd earn 5% on both your original $1,000 AND on previously earned 
                interest, creating exponential growth potential.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-6 rounded-xl border border-indigo-200 mb-8 transform hover:scale-[1.02] transition-transform duration-300">
              <div className="flex flex-col md:flex-row items-center">
                <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-4xl text-white">💰</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
                    The Power of Compound Interest
                  </h3>
                  <blockquote className="text-indigo-900 italic border-l-4 border-indigo-300 pl-4 text-lg">
                    "Compound interest is the eighth wonder of the world. He who understands it, earns it; 
                    he who doesn't, pays it." - Albert Einstein
                  </blockquote>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Where It Applies</h4>
                <ul className="text-gray-700 space-y-2">
                  <li>• Investment accounts</li>
                  <li>• Retirement savings</li>
                  <li>• High-yield savings</li>
                  <li>• Dividend reinvestment</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Key Factors</h4>
                <ul className="text-gray-700 space-y-2">
                  <li>• Initial investment amount</li>
                  <li>• Interest rate</li>
                  <li>• Compounding frequency</li>
                  <li>• Time period</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                <ul className="text-gray-700 space-y-2">
                  <li>• Exponential growth</li>
                  <li>• Passive income potential</li>
                  <li>• Long-term wealth building</li>
                  <li>• Inflation protection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Enhanced Formula Section */}
      <Card className={`mb-10 p-8 bg-gradient-to-br from-white to-blue-50`}>
        <div id="compound-formula"></div>
        <SectionTitle className="mb-6 flex items-center">
          <span className="bg-blue-600 text-white p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </span>
          Understanding the Compound Interest Formula
        </SectionTitle>
        
        <div className="space-y-8">
          {/* Formula Display */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg inline-block">
                <p className="text-2xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  A = P(1 + r/n)<sup>nt</sup>
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Formula Components */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-2">Formula Components:</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-mono font-bold text-blue-600 mr-3">A</span>
                    <div>
                      <span className="font-medium">Final Amount</span>
                      <p className="text-sm text-gray-600">The total value after compounding</p>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-mono font-bold text-blue-600 mr-3">P</span>
                    <div>
                      <span className="font-medium">Principal</span>
                      <p className="text-sm text-gray-600">Your initial investment amount</p>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-mono font-bold text-blue-600 mr-3">r</span>
                    <div>
                      <span className="font-medium">Annual Interest Rate</span>
                      <p className="text-sm text-gray-600">Expressed as a decimal (e.g., 5% = 0.05)</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Right Column: More Components */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-2">Additional Factors:</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-mono font-bold text-blue-600 mr-3">n</span>
                    <div>
                      <span className="font-medium">Compounding Frequency</span>
                      <p className="text-sm text-gray-600">Number of times interest is compounded per year</p>
                    </div>
                  </li>
                  <li className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-mono font-bold text-blue-600 mr-3">t</span>
                    <div>
                      <span className="font-medium">Time</span>
                      <p className="text-sm text-gray-600">Number of years the money is invested</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Real-World Examples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Compounding Frequencies */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-gray-900 mb-4">Common Compounding Frequencies</h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Daily (n=365):</strong> Most high-yield savings accounts
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Monthly (n=12):</strong> Credit cards, many investment accounts
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Quarterly (n=4):</strong> Some stock dividends and bonds
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Annually (n=1):</strong> Some basic savings accounts
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Example Calculation */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
              <h4 className="font-semibold text-gray-900 mb-4">Example Calculation</h4>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">Initial Investment:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Principal (P) = $1,000</li>
                    <li>• Annual Rate (r) = 5% = 0.05</li>
                    <li>• Time (t) = 3 years</li>
                    <li>• Compounding (n) = 12 (monthly)</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">Result:</p>
                  <p className="text-sm text-gray-700">
                    $1,000 × (1 + 0.05/12)<sup>12×3</sup> = <strong>${(1000 * Math.pow(1 + 0.05/12, 12 * 3)).toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
            <h4 className="font-semibold text-gray-900 mb-4">Key Insights</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h5 className="font-medium text-gray-900 mb-2">Higher Frequency = Better Returns</h5>
                <p className="text-sm text-gray-700">
                  More frequent compounding periods result in higher returns over time, though the difference becomes smaller at higher frequencies.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h5 className="font-medium text-gray-900 mb-2">Time Amplifies Growth</h5>
                <p className="text-sm text-gray-700">
                  The exponential nature of the formula means that longer time periods lead to dramatically larger final amounts.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h5 className="font-medium text-gray-900 mb-2">Rate Impact</h5>
                <p className="text-sm text-gray-700">
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
          <h2 id="investment-growth" className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-green-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </span>
            Simple vs. Compound Interest: A Visual Guide
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-green-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Simple Interest</h3>
              <div className="space-y-4">
                <p className="text-gray-700">
                  With simple interest, you earn a fixed percentage only on your initial investment.
                  The growth is <span className="font-semibold text-green-600">linear</span>,
                  making it easier to calculate but less powerful over time.
                </p>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Simple Interest Formula:</h4>
                  <p className="font-mono text-green-800 mb-2">A = P(1 + rt)</p>
                  <p className="text-sm text-gray-600">
                    Where: A = Final amount, P = Principal, r = Interest rate, t = Time in years
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    With your current values:
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    ${principal} invested at {rate}% for {years} years = 
                    ${(principal * (1 + (rate / 100) * years)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Compound Interest</h3>
              <div className="space-y-4">
                <p className="text-gray-700">
                  With compound interest, you earn returns on both your initial investment
                  and accumulated interest. The growth is <span className="font-semibold text-blue-600">exponential</span>,
                  creating a powerful snowball effect over time.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Compound Interest Formula:</h4>
                  <p className="font-mono text-blue-800 mb-2">A = P(1 + r/n)<sup>nt</sup></p>
                  <p className="text-sm text-gray-600">
                    Where: n = Number of times interest is compounded per year
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    With your current values (compounded {
                      compound === 1 ? 'annually' : 
                      compound === 4 ? 'quarterly' : 
                      compound === 12 ? 'monthly' : 'daily'
                    }):
                  </p>
                  <p className="text-lg font-semibold text-blue-600">
                    ${principal} invested at {rate}% for {years} years = 
                    ${compoundInterest}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Growth Comparison Over Time</h3>
            <p className="text-gray-700 mb-4">${principal} invested at {rate}% for {years} years - Simple: ~$13,000 vs. Compound: ~$24,634</p>
            <div className="h-[400px]" style={{ minHeight: '400px', width: '100%', overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={comparisonData} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  style={{ overflow: 'visible' }}
                  aria-label="Chart comparing simple and compound interest over time"
                  role="img"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Amount ($)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 10
                    }}
                    tickFormatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => ['$' + value.toLocaleString(), undefined]}
                    labelFormatter={(label: string) => `Year ${label}`}
                    wrapperStyle={{ zIndex: 1000 }}
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
              <p className="text-sm text-gray-600">
                Hover over the lines to see exact values at each year. Notice how the compound
                interest line curves dramatically upward while the simple interest line remains straight.
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h4 className="font-medium text-gray-900 mb-2">Key Observations:</h4>
                <ul className="list-disc pl-4 space-y-2 text-sm text-gray-700">
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

          <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-World Applications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Simple Interest Examples</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Some personal loans</li>
                  <li>• Basic savings bonds</li>
                  <li>• Short-term lending between individuals</li>
                  <li>• Some car loans</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Compound Interest Examples</h4>
                <ul className="space-y-2 text-sm text-gray-700">
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
      <Section className="mb-10">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            The Power of Starting Early
          </h2>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Time: Your Most Powerful Investment Tool</h3>
              <p className="text-gray-700">
                When it comes to compound interest, time is your greatest ally. The earlier you start investing,
                the more time your money has to grow exponentially. Let's compare two investment strategies
                to demonstrate why starting early is so crucial.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Early Investor: Emily</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Starting Age:</span>
                    <span className="font-semibold text-purple-600">25</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Investment Period:</span>
                    <span className="font-semibold text-purple-600">10 years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Investment:</span>
                    <span className="font-semibold text-purple-600">$200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Invested:</span>
                    <span className="font-semibold text-purple-600">$24,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Annual Return:</span>
                    <span className="font-semibold text-purple-600">7%</span>
                  </div>
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Value at Age 65:</div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${earlyInvestorData[40].total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      (Invested for 10 years, then let it grow for 30 more years)
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Late Investor: Leo</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Starting Age:</span>
                    <span className="font-semibold text-blue-600">35</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Investment Period:</span>
                    <span className="font-semibold text-blue-600">30 years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Investment:</span>
                    <span className="font-semibold text-blue-600">$200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Invested:</span>
                    <span className="font-semibold text-blue-600">$72,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Annual Return:</span>
                    <span className="font-semibold text-blue-600">7%</span>
                  </div>
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Value at Age 65:</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${lateInvestorData[30].total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      (Investing continuously until retirement)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">The Power of Starting Early: Emily vs. Leo</h3>
              <p className="text-gray-700">
                This simulation demonstrates the dramatic difference between starting early versus starting late:
              </p>
              
              <div className="h-[400px]" style={{ minHeight: '400px', width: '100%', overflow: 'hidden' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    margin={{ top: 10, right: 30, left: 20, bottom: 15 }}
                    style={{ overflow: 'visible' }}
                    aria-label="Chart comparing early and late investment strategies"
                    role="img"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="age" 
                      type="number"
                      domain={[25, 65]} 
                      label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                      ticks={[25, 30, 35, 40, 45, 50, 55, 60, 65]}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Portfolio Value ($)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10
                      }}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                      labelFormatter={(label: number) => `Age ${label}`}
                      wrapperStyle={{ zIndex: 1000 }}
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
      <Section className="mb-10">
        <SectionTitle className="mb-4">Practical Strategies to Harness Compound Interest</SectionTitle>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Strategy 1 */}
          <Card className="p-6">
            <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-lg">🏁</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Start Early</h3>
            <p className="text-gray-700">
              Even small amounts invested early in life can grow substantially. Don't wait for the "perfect" time or amount – start now.
            </p>
          </Card>
          
          {/* Strategy 2 */}
          <Card className="p-6">
            <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-lg">🔄</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reinvest Dividends</h3>
            <p className="text-gray-700">
              Reinvesting dividends and interest payments accelerates the compounding effect, significantly boosting your returns over time.
            </p>
          </Card>
          
          {/* Strategy 3 */}
          <Card className="p-6">
            <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-lg">📆</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Be Consistent</h3>
            <p className="text-gray-700">
              Regular contributions through methods like dollar-cost averaging help build wealth steadily and reduce the impact of market volatility.
            </p>
          </Card>
          
          {/* Strategy 4 */}
          <Card className="p-6">
            <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-lg">📈</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Maximize Returns</h3>
            <p className="text-gray-700">
              Even small increases in your annual return rate can have dramatic effects on long-term growth due to compounding.
            </p>
          </Card>
          
          {/* Strategy 5 */}
          <Card className="p-6">
            <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-lg">💸</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Minimize Fees</h3>
            <p className="text-gray-700">
              High fees can significantly reduce the power of compound interest. Choose investments with low expense ratios.
            </p>
          </Card>
          
          {/* Strategy 6 */}
          <Card className="p-6">
            <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
              <span className="text-lg">🏔️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Be Patient</h3>
            <p className="text-gray-700">
              Compound interest works slowly at first but accelerates over time. Patience is essential to reap its full benefits.
            </p>
          </Card>
        </div>
      </Section>

      {/* Interactive Examples */}
      <Section className="mb-10">
        <SectionTitle className="mb-4">Real-World Examples of Compound Interest</SectionTitle>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Example 1 */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Retirement Account Growth</h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                If you invest $500 monthly in a retirement account with a 7% annual return:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>After 10 years: <strong>$83,141</strong></li>
                <li>After 20 years: <strong>$246,070</strong></li>
                <li>After 30 years: <strong>$566,764</strong></li>
                <li>After 40 years: <strong>$1,198,261</strong></li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Notice how the growth accelerates dramatically in later years due to compounding.
            </p>
          </Card>
          
          {/* Example 2 */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Student Loan Debt</h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                A $30,000 student loan at 5% interest that isn't paid for 10 years:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Original balance: <strong>$30,000</strong></li>
                <li>Balance after 10 years: <strong>$48,871</strong></li>
                <li>Total interest accrued: <strong>$18,871</strong></li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              This illustrates how compound interest can work against you with debt.
            </p>
          </Card>
        </div>
        
        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
          <h3 className="text-lg font-bold text-indigo-900 mb-3">The Rule of 72</h3>
          <p className="text-indigo-800 mb-4">
            The Rule of 72 is a simple way to estimate how long it will take for an investment to double in value.
          </p>
          <div className="bg-white p-4 rounded-md mb-4 inline-block">
            <p className="text-center font-bold text-lg">
              Years to double = 72 ÷ Annual interest rate (%)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded-md text-center shadow-sm">
              <p className="font-medium">2% return</p>
              <p className="text-lg font-bold text-indigo-600">36 years</p>
            </div>
            <div className="bg-white p-3 rounded-md text-center shadow-sm">
              <p className="font-medium">7% return</p>
              <p className="text-lg font-bold text-indigo-600">10.3 years</p>
            </div>
            <div className="bg-white p-3 rounded-md text-center shadow-sm">
              <p className="font-medium">10% return</p>
              <p className="text-lg font-bold text-indigo-600">7.2 years</p>
            </div>
          </div>
          <p className="text-sm text-indigo-700">
            As you can see, even small increases in the rate of return can dramatically decrease the time it takes for your money to double.
          </p>
        </div>
      </Section>

      {/* Enhanced Common Misconceptions and Tips Section */}
      <Section className="mb-10">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-red-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            Common Misconceptions and Smart Strategies
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Misconceptions with Detailed Explanations */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  Common Misconceptions
                </h3>
                
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="text-red-500 mr-2">#1</span>
                      "I need a large sum to start investing"
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        Many people believe they need thousands of dollars to start investing effectively.
                        In reality, even small regular investments can grow significantly over time.
                      </p>
                      <div className="bg-white p-3 rounded-md text-sm">
                        <strong>Example:</strong> $100 monthly invested at 7% annual return for 30 years 
                        could grow to approximately ${(100 * 12 * Math.pow(1 + 0.07/12, 12 * 30)).toFixed(2)}.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="text-red-500 mr-2">#2</span>
                      "Market timing is crucial for success"
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        While timing can affect returns, consistent investing over time (dollar-cost averaging) 
                        often outperforms attempts to time the market.
                      </p>
                      <div className="bg-white p-3 rounded-md text-sm">
                        <strong>Reality:</strong> Regular investments help average out market highs and lows,
                        reducing risk and potentially improving long-term returns.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="text-red-500 mr-2">#3</span>
                      "Compound interest only matters for savings"
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        Compound interest works both ways - it can grow your wealth or increase your debt.
                        Understanding this is crucial for financial decisions.
                      </p>
                      <div className="bg-white p-3 rounded-md text-sm">
                        <strong>Warning:</strong> Credit card debt at 20% APR can double in just 3.6 years
                        due to compound interest working against you.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Strategies with Implementation Tips */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-green-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="text-green-600 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Smart Investment Strategies
                </h3>
                
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="text-green-500 mr-2">#1</span>
                      Automate Your Investments
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        Set up automatic transfers to your investment accounts right after receiving your paycheck.
                      </p>
                      <div className="bg-white p-3 rounded-md text-sm">
                        <strong>Implementation:</strong>
                        <ul className="mt-1 space-y-1">
                          <li>• Schedule transfers on payday</li>
                          <li>• Start with 10-15% of income</li>
                          <li>• Increase with each raise</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="text-green-500 mr-2">#2</span>
                      Diversify Your Investments
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        Spread your investments across different asset classes to manage risk while 
                        maintaining growth potential.
                      </p>
                      <div className="bg-white p-3 rounded-md text-sm">
                        <strong>Consider:</strong>
                        <ul className="mt-1 space-y-1">
                          <li>• Index funds for broad market exposure</li>
                          <li>• Mix of stocks and bonds</li>
                          <li>• International market exposure</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="text-green-500 mr-2">#3</span>
                      Minimize Investment Costs
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        High fees can significantly reduce the power of compound interest over time.
                      </p>
                      <div className="bg-white p-3 rounded-md text-sm">
                        <strong>Action Items:</strong>
                        <ul className="mt-1 space-y-1">
                          <li>• Choose low-cost index funds</li>
                          <li>• Compare expense ratios</li>
                          <li>• Avoid unnecessary trading fees</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <span className="text-green-500 mr-2">#4</span>
                      Reinvest All Returns
                    </h4>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        Maximize compound growth by reinvesting dividends and interest payments instead
                        of taking them as income.
                      </p>
                      <div className="bg-white p-3 rounded-md text-sm">
                        <strong>Setup:</strong>
                        <ul className="mt-1 space-y-1">
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

          <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Taking Action: Your Next Steps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Step 1: Start Now</h4>
                <p className="text-sm text-gray-700">
                  Open an investment account and set up your first automatic transfer, even if it's small.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Step 2: Learn More</h4>
                <p className="text-sm text-gray-700">
                  Research different investment options and understand their risk/return profiles.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Step 3: Stay Consistent</h4>
                <p className="text-sm text-gray-700">
                  Stick to your investment plan through market ups and downs.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">Step 4: Review & Adjust</h4>
                <p className="text-sm text-gray-700">
                  Regularly review your strategy and adjust as your circumstances change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Conclusion */}
      <Section className="mb-10">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusion: The Eighth Wonder of the World</h2>
          
          <p className="text-gray-700 mb-4">
            Compound interest is truly a remarkable force in personal finance. When harnessed correctly, 
            it can transform modest, consistent investments into substantial wealth over time. The key 
            lessons to remember are:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
            <li><strong>Start as early as possible</strong> to maximize the compounding effect</li>
            <li><strong>Be consistent</strong> with your contributions</li>
            <li><strong>Reinvest returns</strong> whenever possible</li>
            <li><strong>Pay attention to fees</strong> and interest rates – small differences compound dramatically</li>
            <li><strong>Be patient</strong> – compound interest works slowly at first but accelerates over time</li>
          </ul>
          
          <p className="text-gray-700">
            By understanding and applying the principles of compound interest to your financial planning, 
            you're taking one of the most powerful steps toward achieving financial independence and a 
            secure retirement. Remember, financial success isn't just about how much you earn – it's about 
            how intelligently you put your money to work over time.
          </p>
        </div>
      </Section>

      {/* FAQ Section */}
      <div id="faq"></div>
      <Section className="mb-10 bg-white rounded-xl shadow-md">
        <div className="prose prose-lg max-w-none p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-indigo-600 text-white p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Frequently Asked Questions
          </h2>
          
          <p className="text-gray-600 mb-8">
            Get answers to common questions about compound interest, investments, and strategies to maximize your returns.
          </p>
          
          <div className="bg-white rounded-lg divide-y divide-gray-200 border border-gray-100">
            <FAQItem 
              question="What's the difference between simple and compound interest?" 
              answer={
                <>
                  <p>The main differences between simple and compound interest are:</p>
                  <ul>
                    <li><strong>Simple interest</strong> is calculated only on the initial principal amount. If you invest $1,000 at 5% simple interest, you'll earn $50 per year regardless of how long you hold the investment.</li>
                    <li><strong>Compound interest</strong> is calculated on both the initial principal and the accumulated interest from previous periods. With the same $1,000 at 5% compound interest, you'll earn $50 in year one, but in year two you'll earn 5% on $1,050 ($52.50), and so on.</li>
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
                    <li>$17,908 with annual compounding</li>
                    <li>$18,140 with quarterly compounding</li>
                    <li>$18,194 with monthly compounding</li>
                    <li>$18,221 with daily compounding</li>
                  </ul>
                  <p>The difference becomes more significant with higher interest rates and longer time periods.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="What types of investments typically provide compound returns?" 
              answer={
                <>
                  <p>Many investment vehicles offer compound returns, including:</p>
                  <ul>
                    <li><strong>Stocks and equity funds:</strong> Companies that reinvest profits or pay dividends that you reinvest</li>
                    <li><strong>Bonds and fixed-income funds:</strong> When interest payments are reinvested</li>
                    <li><strong>Certificates of Deposit (CDs):</strong> Particularly those with interest compounding options</li>
                    <li><strong>Savings accounts:</strong> Most compound interest daily or monthly</li>
                    <li><strong>Dividend-paying investments:</strong> When dividends are automatically reinvested to purchase more shares</li>
                    <li><strong>Real estate:</strong> Through property appreciation and rental income reinvestment</li>
                    <li><strong>Retirement accounts:</strong> 401(k)s, IRAs, and other tax-advantaged accounts where earnings are reinvested</li>
                  </ul>
                  <p>The key to maximizing compound returns is consistent reinvestment of earnings rather than withdrawing them.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="What is the Rule of 72 and how can I use it?" 
              answer={
                <>
                  <p>The Rule of 72 is a simple mental math shortcut to estimate how long it will take for an investment to double in value, given a fixed annual rate of return.</p>
                  <p><strong>The formula:</strong> Years to double = 72 ÷ Annual interest rate</p>
                  <p>For example:</p>
                  <ul>
                    <li>At 6% return, money doubles in approximately 12 years (72 ÷ 6 = 12)</li>
                    <li>At 8% return, money doubles in approximately 9 years (72 ÷ 8 = 9)</li>
                    <li>At 10% return, money doubles in approximately 7.2 years (72 ÷ 10 = 7.2)</li>
                  </ul>
                  <p>This rule works reasonably well for interest rates between 4% and 12%. You can also use it backward: if you need your money to double in 6 years, you'd need an annual return of about 12% (72 ÷ 6 = 12).</p>
                  <p>The Rule of 72 helps illustrate how small differences in return rates can dramatically impact wealth accumulation over time.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="How do dividends contribute to compound growth?" 
              answer={
                <>
                  <p>Dividends can significantly enhance compound growth when reinvested through a process called dividend reinvestment:</p>
                  <ol>
                    <li><strong>Initial investment:</strong> You purchase shares of a dividend-paying company or fund</li>
                    <li><strong>Dividend payment:</strong> The company distributes a portion of profits to shareholders</li>
                    <li><strong>Reinvestment:</strong> Instead of taking the dividend as cash, you use it to purchase additional shares</li>
                    <li><strong>Compound effect:</strong> Your next dividend will be larger because you now own more shares</li>
                    <li><strong>Repetition:</strong> This cycle continues, accelerating your total return over time</li>
                  </ol>
                  <p>Many investors use Dividend Reinvestment Plans (DRIPs) to automatically reinvest dividends. The power comes from:</p>
                  <ul>
                    <li>Increasing share count over time without additional cash investment</li>
                    <li>Dollar-cost averaging through regular reinvestment</li>
                    <li>Dividend growth if companies increase their payouts over time</li>
                  </ul>
                  <p>Studies have shown that reinvested dividends have accounted for a significant portion of the stock market's total return over time.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="What are the tax implications of compound interest?" 
              answer={
                <>
                  <p>The tax implications of compound interest vary depending on the investment vehicle and account type:</p>
                  <ul>
                    <li><strong>Taxable accounts:</strong> Interest, dividends, and capital gains are typically taxed in the year they're earned, which reduces the effective compounding rate</li>
                    <li><strong>Tax-deferred accounts:</strong> (Traditional 401(k)s, IRAs) Taxes are paid only when you withdraw funds, allowing full compounding of pre-tax amounts</li>
                    <li><strong>Tax-free accounts:</strong> (Roth 401(k)s, Roth IRAs) No taxes on qualified withdrawals, providing tax-free compounding</li>
                  </ul>
                  <p>Tax considerations:</p>
                  <ul>
                    <li>Interest income is typically taxed as ordinary income (potentially higher rates)</li>
                    <li>Qualified dividends and long-term capital gains usually have lower tax rates</li>
                    <li>Compounding in taxable accounts is most efficient with tax-efficient investments (index ETFs, municipal bonds, etc.)</li>
                  </ul>
                  <p>Tax-advantaged accounts can dramatically increase the power of compounding by deferring or eliminating the tax drag, making them ideal vehicles for long-term compound growth.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="How can I start investing with little money?" 
              answer={
                <>
                  <p>You can start benefiting from compound interest with almost any amount of money:</p>
                  <ul>
                    <li><strong>Micro-investing apps:</strong> Platforms like Acorns, Stash, or Robinhood allow you to start with as little as $5</li>
                    <li><strong>Fractional shares:</strong> Many brokerages now let you buy portions of expensive stocks</li>
                    <li><strong>Index ETFs:</strong> Low-cost exchange-traded funds often have no minimum investment requirements</li>
                    <li><strong>Employer retirement plans:</strong> Many 401(k) plans have no minimum contribution requirements</li>
                    <li><strong>Treasury securities:</strong> Some government bonds can be purchased for as little as $100</li>
                    <li><strong>High-yield savings accounts:</strong> Many online banks offer accounts with no minimum balance</li>
                  </ul>
                  <p>Key strategies for small investors:</p>
                  <ul>
                    <li>Start with whatever you can afford—consistency matters more than amount</li>
                    <li>Automate contributions to remove the temptation to spend</li>
                    <li>Focus on low-fee investment options to maximize returns</li>
                    <li>Consider round-up services that invest your spare change</li>
                    <li>Gradually increase your contributions as your income grows</li>
                  </ul>
                  <p>Remember, the magic of compound interest comes more from time in the market than initial investment size. Starting small today is far better than waiting until you have "enough" to invest.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="What is negative compound interest and how does it affect debt?" 
              answer={
                <>
                  <p>"Negative compound interest" refers to compound interest working against you through debt, particularly credit cards and high-interest loans:</p>
                  <ul>
                    <li>Just as compound interest grows your investments exponentially, it can also grow your debts exponentially</li>
                    <li>With credit cards, interest is typically compounded daily and applied monthly</li>
                    <li>If you only make minimum payments, most goes to interest rather than principal</li>
                    <li>Unpaid interest is added to your balance, creating a cycle where you pay interest on prior interest</li>
                  </ul>
                  <p>For example, a $5,000 credit card balance at 18% APR:</p>
                  <ul>
                    <li>Making only minimum payments (2% of balance): Would take 39 years to pay off with total interest of $13,000+</li>
                    <li>Making fixed $200 monthly payments: Would take 2.7 years to pay off with total interest of about $1,330</li>
                  </ul>
                  <p>To escape negative compounding:</p>
                  <ul>
                    <li>Pay more than the minimum payment</li>
                    <li>Focus on highest-interest debts first</li>
                    <li>Consider consolidating high-interest debts to a lower rate</li>
                    <li>Stop adding new debt while paying down existing balances</li>
                  </ul>
                  <p>Understanding negative compound interest can be just as valuable as understanding positive compound interest for your overall financial health.</p>
                </>
              } 
            />
            
            <FAQItem 
              question="How does inflation impact compound returns?" 
              answer={
                <>
                  <p>Inflation erodes the purchasing power of money over time, which affects compound returns in several ways:</p>
                  <ul>
                    <li><strong>Nominal vs. Real Returns:</strong> Your "nominal" return is the stated interest rate or investment gain, while your "real" return is the nominal return minus inflation</li>
                    <li><strong>Example:</strong> If your investment grows at 7% but inflation is 3%, your real return is only 4%</li>
                  </ul>
                  <p>The impact over time:</p>
                  <ul>
                    <li>If $10,000 grows at 7% compounded annually for 30 years, it would reach about $76,123 in nominal terms</li>
                    <li>But with 3% annual inflation, the purchasing power would only be equivalent to about $31,883 in today's dollars</li>
                  </ul>
                  <p>Strategies to combat inflation:</p>
                  <ul>
                    <li>Target investment returns that exceed inflation by a comfortable margin (historically, stocks have provided the best inflation-adjusted returns)</li>
                    <li>Consider inflation-protected securities like TIPS (Treasury Inflation-Protected Securities)</li>
                    <li>Include assets that historically perform well during inflation (real estate, certain commodities)</li>
                    <li>Adjust savings rates to account for inflation's impact on your target retirement amount</li>
                  </ul>
                  <p>When planning for long-term goals, always focus on real (inflation-adjusted) returns rather than nominal returns to ensure your purchasing power truly grows over time.</p>
                </>
              } 
            />
          </div>
        </div>
      </Section>

      {/* Call to Action */}
      <div className="mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Put Compound Interest to Work?
          </h2>
          <p className="text-indigo-100 max-w-2xl mx-auto mb-8">
            Use our retirement calculator to see how your savings can grow over time and build a personalized 
            plan for your financial future.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
            <a 
              href="/" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Try Our Retirement Calculator
            </a>
            <a 
              href="/fire" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-indigo-200 text-base font-medium rounded-md text-white hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
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