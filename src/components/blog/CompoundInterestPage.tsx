import React, { useState, useEffect } from 'react';
import { Title, Subtitle, Card, Section, SectionTitle } from '../common/StyledComponents';
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

// Safari detection utility
const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
};

const CompoundInterestPage: React.FC = () => {
  // State for Safari detection
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  
  // Detect Safari browser on component mount
  useEffect(() => {
    setIsSafariBrowser(isSafari());
  }, []);

  // State for interactive formula example
  const [principal, setPrincipal] = useState(5000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);
  const [compound, setCompound] = useState(12);

  // Calculate compound interest for the interactive example
  const calculateCompoundInterest = () => {
    const r = rate / 100;
    const n = compound;
    const t = years;
    const P = principal;
    return (P * Math.pow(1 + r/n, n*t)).toFixed(2);
  };

  // Generate data for the comparison chart
  const generateComparisonData = () => {
    const data = [];
    for (let year = 0; year <= years; year++) {
      const simpleInterest = principal * (1 + (rate / 100) * year);
      const compoundInterest = principal * Math.pow(1 + (rate / 100) / compound, compound * year);
      data.push({
        year,
        simple: Math.round(simpleInterest * 100) / 100,
        compound: Math.round(compoundInterest * 100) / 100,
      });
    }
    return data;
  };

  // Calculate investment growth over time
  const calculateGrowth = (
    monthlyContribution: number,
    startAge: number,
    endAge: number,
    annualReturn: number = 7,
    stopContributionAge?: number
  ) => {
    const data = [];
    let total = 0;
    const monthlyRate = annualReturn / 100 / 12;
    
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
      
      data.push({
        age,
        total: Math.round(total * 100) / 100,
        contribution: Math.round((age < (stopContributionAge || endAge) ? 
          (age - startAge + 1) * 12 * monthlyContribution : 
          (stopContributionAge ? (stopContributionAge - startAge) * 12 * monthlyContribution : 0)) * 100) / 100
      });
    }
    
    return data;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 sm:mb-8 text-center">
        <div className={`inline-block mb-4 px-4 py-2 rounded-lg shadow-sm ${isSafariBrowser ? 'bg-indigo-50' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isSafariBrowser ? 'text-indigo-600' : 'text-gradient'}`}>
            Understanding Compound Interest: Your Path to Financial Growth
          </h1>
        </div>
        <p className="text-gray-800 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Learn how compound interest can transform your savings into substantial wealth over time, 
          and why it's considered one of the most powerful forces in financial planning.
        </p>
      </div>

      {/* Enhanced Introduction Section */}
      <Section className={`mb-10 ${isSafariBrowser ? 'bg-indigo-50' : 'bg-gradient-to-br from-white to-indigo-50'}`}>
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
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
      <Card className={`mb-10 p-8 ${isSafariBrowser ? 'bg-blue-50' : 'bg-gradient-to-br from-white to-blue-50'}`}>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
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
                    ${calculateCompoundInterest()}
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
                  data={generateComparisonData()} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  style={{ overflow: 'visible' }}
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
                    isAnimationActive={!isSafariBrowser}
                  />
                  <Line
                    type="monotone"
                    dataKey="compound"
                    name="Compound Interest"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                    isAnimationActive={!isSafariBrowser}
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
                      ${calculateGrowth(200, 25, 65, 7, 35)[40].total.toLocaleString()}
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
                      ${calculateGrowth(200, 35, 65)[30].total.toLocaleString()}
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
                      data={calculateGrowth(200, 25, 65, 7, 35)}
                      type="monotone"
                      dataKey="total"
                      name="Emily (Early Start)"
                      stroke="#9333ea"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8 }}
                      isAnimationActive={!isSafariBrowser}
                    />
                    <Line
                      data={calculateGrowth(200, 35, 65)}
                      type="monotone"
                      dataKey="total"
                      name="Leo (Late Start)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8 }}
                      isAnimationActive={!isSafariBrowser}
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

      {/* Call to Action */}
      <Card className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Ready to Put Compound Interest to Work?</h3>
        <p className="text-gray-700 text-center mb-6 max-w-2xl mx-auto">
          Use our retirement calculator to see how your savings can grow over time and build a personalized 
          plan for your financial future.
        </p>
        <div className="flex justify-center">
          <a
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
          >
            Try Our Retirement Calculator
          </a>
        </div>
      </Card>

      {/* Add this at the bottom of the component */}
      <style>
        {`
          @supports (-webkit-hyphens:none) {
            /* Additional Safari-specific styles if needed */
            .chart-container {
              min-height: 400px;
              width: 100%;
            }
            
            svg {
              display: block;
            }
          }
        `}
      </style>
    </div>
  );
};

export default CompoundInterestPage; 