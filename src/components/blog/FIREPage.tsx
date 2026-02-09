import React, { useState, useEffect, useMemo } from 'react';
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
  Label,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import SEO from '../common/SEO';
import RangeInput from '../common/RangeInput';
import NumberInput from '../common/NumberInput';
import { isSafari } from '../../utils/browserDetection'; // Import isSafari utility
import Footer from '../common/Footer'; // Import Footer component
import { cx } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';

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



const FIREPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  // State for Safari detection
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);

  // Detect Safari browser on component mount
  useEffect(() => {
    setIsSafariBrowser(isSafari()); // Use imported isSafari function
  }, []);

  // State for interactive calculator
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(45);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [annualIncome, setAnnualIncome] = useState(75000);
  const [savingsRate, setSavingsRate] = useState(50);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  // Calculate FIRE numbers - Memoized
  const fireNumbers = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge;
    const annualSavings = annualIncome * (savingsRate / 100);

    // Calculate future value of current savings
    const futureValueCurrentSavings = currentSavings * Math.pow(1 + annualReturn / 100, yearsToRetirement);

    // Calculate future value of annual contributions
    let totalSavings = futureValueCurrentSavings;
    for (let i = 0; i < yearsToRetirement; i++) {
      totalSavings += annualSavings * Math.pow(1 + annualReturn / 100, yearsToRetirement - i);
    }

    const annualExpenses = annualIncome * (1 - savingsRate / 100);
    const targetNetWorth = (annualExpenses * 100) / withdrawalRate;

    return {
      targetNetWorth: Math.round(targetNetWorth),
      projectedNetWorth: Math.round(totalSavings),
      annualRetirementIncome: Math.round(totalSavings * (withdrawalRate / 100)),
      yearsToRetirement,
      monthlyInvestment: Math.round(annualSavings / 12)
    };
  }, [currentAge, retirementAge, currentSavings, annualIncome, savingsRate, annualReturn, withdrawalRate]);

  // Generate data for the savings growth chart - Memoized
  const savingsGrowthData = useMemo(() => {
    const years = retirementAge - currentAge;
    const annualSavings = annualIncome * (savingsRate / 100);
    const data = [];

    let savings = currentSavings;
    let contributions = currentSavings;

    for (let year = 0; year <= years; year++) {
      if (year > 0) {
        contributions += annualSavings;
        savings = savings * (1 + annualReturn / 100) + annualSavings;
      }

      data.push({
        year: currentAge + year,
        savings: Math.round(savings),
        contributions: Math.round(contributions),
        returns: Math.round(savings - contributions)
      });
    }

    return data;
  }, [currentAge, retirementAge, currentSavings, annualIncome, savingsRate, annualReturn]);

  // Generate retirement lifestyle data for pie chart - Memoized
  const retirementBudgetData = useMemo(() => {
    const annualSpending = fireNumbers.annualRetirementIncome;

    return [
      { name: 'Housing', value: Math.round(annualSpending * 0.30) },
      { name: 'Food', value: Math.round(annualSpending * 0.15) },
      { name: 'Transportation', value: Math.round(annualSpending * 0.10) },
      { name: 'Healthcare', value: Math.round(annualSpending * 0.15) },
      { name: 'Entertainment', value: Math.round(annualSpending * 0.10) },
      { name: 'Travel', value: Math.round(annualSpending * 0.10) },
      { name: 'Other', value: Math.round(annualSpending * 0.10) },
    ];
  }, [fireNumbers.annualRetirementIncome]);

  // Colors for pie chart
  const COLORS = useMemo(() => ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'], []);

  // FIRE types data for the comparison section
  const fireTypes = useMemo(() => [
    {
      type: "LeanFIRE",
      description: "Minimalist approach with lower expenses and a smaller nest egg",
      savingsRate: "50-60%+",
      lifestyle: "Frugal and minimalist",
      retirementAmount: "$750,000 - $1M",
      benefits: "Reach FIRE sooner, environmental benefits of lower consumption",
      challenges: "Limited flexibility for lifestyle inflation or unexpected expenses"
    },
    {
      type: "RegularFIRE",
      description: "The standard approach to financial independence",
      savingsRate: "40-50%",
      lifestyle: "Conscious spending, moderate frugality",
      retirementAmount: "$1M - $2.5M",
      benefits: "Balance between current enjoyment and future security",
      challenges: "Requires consistent high savings rate for 10-20 years"
    },
    {
      type: "FatFIRE",
      description: "Luxurious approach with higher spending in retirement",
      savingsRate: "30-40%",
      lifestyle: "More generous spending while still saving",
      retirementAmount: "$2.5M - $5M+",
      benefits: "More financial flexibility, travel, and experiences",
      challenges: "Takes longer to achieve, requires higher income"
    },
    {
      type: "CoastFIRE",
      description: "Save enough early, then only cover expenses while investments grow",
      savingsRate: "Variable",
      lifestyle: "Front-loaded savings, then reduced work",
      retirementAmount: "Depends on coast period",
      benefits: "Reduced work stress earlier in life",
      challenges: "Requires significant early savings and career flexibility"
    },
    {
      type: "BaristaFIRE",
      description: "Part-time work covers expenses while investments grow",
      savingsRate: "Variable",
      lifestyle: "Semi-retirement with part-time work",
      retirementAmount: "Lower than traditional FIRE",
      benefits: "Escape full-time work sooner, maintain social connections",
      challenges: "Still dependent on some work income, healthcare considerations"
    }
  ], []);

  return (
    <div className={cx(
      "max-w-6xl mx-auto px-4 py-8",
      darkMode ? "bg-gray-900" : "bg-gray-50"
    )}>
      <SEO
        title="FIRE: Financial Independence, Retire Early | Retirement Planning Guide"
        description="Learn about the FIRE movement (Financial Independence, Retire Early) and how to achieve financial freedom through smart investing and intentional spending."
        canonicalUrl="/fire"
        ogType="article"
        ogImage="/blog-images/fire-og-image.png"
        keywords="FIRE movement, financial independence, retire early, investing, savings rate, financial freedom"
      />

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
              FIRE: Financial Independence, Retire Early
            </h1>
            <p className="text-gray-100 text-sm sm:text-base max-w-2xl mx-auto font-medium">
              Learn how the FIRE movement can help you achieve financial freedom, escape the 9-5 grind,
              and design a life centered around your passions and priorities.
            </p>
            <div className={cx(
              "mt-4 backdrop-blur-sm rounded-lg py-2 px-4 inline-block",
              darkMode ? "bg-black/20" : "bg-white/10"
            )}>
              <nav className="flex flex-wrap justify-center gap-3 sm:gap-5 text-sm">
                <a href="#what-is-fire" className="text-white hover:text-indigo-200 font-medium transition-colors">What is FIRE?</a>
                <a href="#fire-formula" className="text-white hover:text-indigo-200 font-medium transition-colors">FIRE Formula</a>
                <a href="#fire-types" className="text-white hover:text-indigo-200 font-medium transition-colors">Types of FIRE</a>
                <a href="#faq" className="text-white hover:text-indigo-200 font-medium transition-colors">FAQ</a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* What is FIRE Section */}
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
          <SectionHeader
            id="what-is-fire"
            title="What is FIRE?"
            className="mb-6"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />

          <div className="space-y-6">
            <p className={cx(
              "text-lg leading-relaxed",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              <span className={cx(
                "font-semibold",
                darkMode ? "text-indigo-400" : "text-indigo-600"
              )}>FIRE</span> stands for <span className="font-semibold">Financial Independence, Retire Early</span>. It's a movement focused on extreme savings and investments that allow people to retire much earlier than traditional budgets and retirement plans would allow.
            </p>

            <div className={cx(
              "p-6 rounded-lg border",
              darkMode
                ? "bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-800/50"
                : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
            )}>
              <p className={cx(
                "italic",
                darkMode ? "text-gray-300" : "text-gray-800"
              )}>
                "Financial independence means having enough income to pay your living expenses for the rest of your life without having to work full-time. Retire early means having the freedom to pursue your dreams and ambitions whenever you want."
              </p>
            </div>

            <p className={cx(
              "text-lg leading-relaxed",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              The FIRE movement gained popularity in the 2010s, inspired by the 1992 book <span className="italic">"Your Money or Your Life"</span> by Vicki Robin and Joe Dominguez, as well as the 2010 book <span className="italic">"Early Retirement Extreme"</span> by Jacob Lund Fisker.
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
              )}>The Two Core Pillars of FIRE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cx(
                  "p-4 rounded-lg shadow-sm",
                  darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                )}>
                  <h4 className={cx(
                    "font-semibold mb-2 flex items-center",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>
                    <span className={cx(
                      "mr-2",
                      darkMode ? "text-indigo-400" : "text-indigo-600"
                    )}>FI</span>
                    Financial Independence
                  </h4>
                  <p className={cx(
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Having sufficient personal wealth to live without needing to work actively
                    for basic necessities. Your assets generate enough passive income to cover your living expenses.
                  </p>
                </div>
                <div className={cx(
                  "p-4 rounded-lg shadow-sm",
                  darkMode ? "bg-gray-750 border border-gray-700" : "bg-white"
                )}>
                  <h4 className={cx(
                    "font-semibold mb-2 flex items-center",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>
                    <span className={cx(
                      "mr-2",
                      darkMode ? "text-green-400" : "text-green-600"
                    )}>RE</span>
                    Retire Early
                  </h4>
                  <p className={cx(
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    Leveraging financial independence to leave traditional work decades before the conventional
                    retirement age of 65+, creating freedom to pursue your true interests.
                  </p>
                </div>
              </div>
            </div>

            <div className={cx(
              "p-6 rounded-xl border mb-8 transform hover:scale-[1.02] transition-transform duration-300",
              darkMode
                ? "bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-800/50"
                : "bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200"
            )}>
              <div className="flex flex-col md:flex-row items-center">
                <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-4xl text-white">🔥</span>
                  </div>
                </div>
                <div>
                  <h3 className={cx(
                    "text-xl font-bold mb-2",
                    darkMode
                      ? "text-indigo-400"
                      : "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
                  )}>
                    The FIRE Origin Story
                  </h3>
                  <p className={cx(
                    "italic border-l-4 pl-4 text-lg",
                    darkMode
                      ? "text-indigo-300 border-indigo-700"
                      : "text-indigo-900 border-indigo-300"
                  )}>
                    "Financial Independence is having enough income (from investments, passive businesses, or
                    other sources) to pay for your living expenses for the rest of your life without having to
                    work for money."
                  </p>
                  <p className={cx(
                    "mt-2",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>
                    The FIRE movement grew from the 1992 bestseller "Your Money or Your Life" by Vicki Robin
                    and Joe Dominguez, later popularized by bloggers like Mr. Money Mustache who retired at 30.
                  </p>
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
                )}>Why FIRE is Growing</h4>
                <ul className={cx(
                  "space-y-2",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• Dissatisfaction with 9-5 work</li>
                  <li>• Seeking meaning beyond consumption</li>
                  <li>• Greater awareness of work-life balance</li>
                  <li>• Access to low-cost index funds</li>
                </ul>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm border",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <h4 className={cx(
                  "font-semibold mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Essential Components</h4>
                <ul className={cx(
                  "space-y-2",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• High savings rate (50%+ of income)</li>
                  <li>• Low-cost index fund investing</li>
                  <li>• Lifestyle optimization</li>
                  <li>• Financial literacy and planning</li>
                </ul>
              </div>
              <div className={cx(
                "p-4 rounded-lg shadow-sm border",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <h4 className={cx(
                  "font-semibold mb-2",
                  darkMode ? "text-gray-100" : "text-gray-900"
                )}>Who Is It For?</h4>
                <ul className={cx(
                  "space-y-2",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li>• Those seeking work/life freedom</li>
                  <li>• Value-focused individuals</li>
                  <li>• People wanting career flexibility</li>
                  <li>• Those rejecting consumerism</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* FIRE Formula Section */}
      <Card className={cx(
        "mb-10 p-8",
        darkMode
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-white to-blue-50"
      )}>
        <SectionHeader
          title="The FIRE Formula: How It Works"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />
        <div id="fire-formula"></div>

        <div className="space-y-8">
          {/* FIRE Formula */}
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
                  Target Nest Egg = Annual Expenses × 25
                </p>
              </div>
              <p className={cx(
                "mt-2",
                darkMode ? "text-gray-400" : "text-gray-600"
              )}>Based on the 4% Safe Withdrawal Rate</p>
            </div>

            {/* Formula Explained */}
            <div className={cx(
              "prose prose-lg max-w-none",
              darkMode
                ? "prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-white prose-a:text-indigo-400"
                : ""
            )}>
              <h3 className={cx(
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>The 4% Rule Explained</h3>
              <p>
                The foundation of FIRE planning is the <strong>4% rule</strong> (or Safe Withdrawal Rate),
                originated from the 1998 Trinity Study. It suggests that if you withdraw 4% of your portfolio
                in your first year of retirement, then adjust that amount for inflation each subsequent year,
                your money has a high probability of lasting 30+ years.
              </p>
              <p>
                This means that to achieve financial independence, you need to save approximately <strong>25 times your annual expenses</strong> (since 4% is 1/25th of your portfolio).
              </p>

              <div className={cx(
                "not-prose grid grid-cols-1 md:grid-cols-2 gap-6 mt-6",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-gray-750 border border-gray-700" : "bg-gray-50"
                )}>
                  <h4 className={cx(
                    "font-semibold mb-3",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>Example Calculation:</h4>
                  <p>If your annual expenses are <strong className={darkMode ? "text-white" : ""}>$40,000</strong>:</p>
                  <div className={cx(
                    "mt-3 p-3 text-center rounded font-mono font-semibold",
                    darkMode ? "bg-blue-900/30" : "bg-blue-50"
                  )}>
                    $40,000 × 25 = <span className={cx(darkMode ? "text-indigo-300" : "text-indigo-600")}>$1,000,000</span>
                  </div>
                  <p className="mt-3 text-sm">
                    This is your target FIRE number - the amount you need invested to generate enough passive income to cover your expenses indefinitely.
                  </p>
                </div>

                <div className={cx(
                  "p-4 rounded-lg",
                  darkMode ? "bg-gray-750 border border-gray-700" : "bg-gray-50"
                )}>
                  <h4 className={cx(
                    "font-semibold mb-3",
                    darkMode ? "text-gray-100" : "text-gray-900"
                  )}>Safe Withdrawal in Action:</h4>
                  <ul className="space-y-2 text-sm list-disc ml-5">
                    <li>Year 1: Withdraw 4% of $1,000,000 = <strong className={darkMode ? "text-white" : ""}>$40,000</strong></li>
                    <li>Year 2: Adjust for 2% inflation = <strong className={darkMode ? "text-white" : ""}>$40,800</strong></li>
                    <li>Year 3: Adjust for 2% inflation = <strong className={darkMode ? "text-white" : ""}>$41,616</strong></li>
                  </ul>
                  <p className="mt-3 text-sm">
                    Meanwhile, your portfolio continues to grow through investment returns, balancing out your withdrawals over time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Rate and Time to FIRE */}
          <div className={cx(
            "p-6 rounded-xl border",
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white shadow-md border-blue-100"
          )}>
            <h4 className={cx(
              "text-xl font-semibold mb-4 flex items-center",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>
              <span className={cx(
                "p-1.5 rounded-full mr-2 flex items-center justify-center",
                "bg-indigo-600 text-white"
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              The Magic Number: Your Savings Rate
            </h4>
            <p className={cx(
              "mb-4",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Your savings rate is the single most important factor determining how quickly you can achieve FIRE.
            </p>

            <div className="overflow-x-auto">
              <table className={cx(
                "min-w-full rounded-lg overflow-hidden",
                darkMode ? "bg-gray-800" : "bg-white"
              )}>
                <thead className={cx(
                  darkMode ? "bg-gray-700" : "bg-blue-50"
                )}>
                  <tr>
                    <th className={cx(
                      "py-3 px-4 text-left font-medium",
                      darkMode ? "text-gray-200" : "text-gray-800"
                    )}>Savings Rate</th>
                    <th className={cx(
                      "py-3 px-4 text-left font-medium",
                      darkMode ? "text-gray-200" : "text-gray-800"
                    )}>Years to FIRE</th>
                    <th className={cx(
                      "py-3 px-4 text-left font-medium",
                      darkMode ? "text-gray-200" : "text-gray-800"
                    )}>Assuming 7% Returns</th>
                  </tr>
                </thead>
                <tbody className={cx(
                  "divide-y",
                  darkMode ? "divide-gray-700" : "divide-gray-200"
                )}>
                  <tr className={darkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>10%</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>51 years</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>Standard retirement timeline</td>
                  </tr>
                  <tr className={darkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>25%</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>32 years</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>Slightly early retirement</td>
                  </tr>
                  <tr className={darkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>50%</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>17 years</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>Classic FIRE timeline</td>
                  </tr>
                  <tr className={darkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>65%</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>10.5 years</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>Aggressive FIRE path</td>
                  </tr>
                  <tr className={darkMode ? "hover:bg-gray-750" : "hover:bg-gray-50"}>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>75%</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>7 years</td>
                    <td className={cx(
                      "py-2 px-4",
                      darkMode ? "text-gray-300" : "text-gray-900"
                    )}>Extreme FIRE approach</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={cx(
              "text-sm mt-4",
              darkMode ? "text-gray-400" : "text-gray-600"
            )}>
              This table assumes consistent savings rate and investment returns. Individual results may vary based on market conditions, income growth, and lifestyle changes.
            </p>
          </div>

          {/* Key Investment Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cx(
              "p-6 rounded-xl border",
              darkMode
                ? "bg-gradient-to-b from-green-900/40 to-green-800/40 border-green-800"
                : "bg-gradient-to-b from-green-50 to-green-100 border-green-200"
            )}>
              <h4 className={cx(
                "font-semibold mb-3 flex items-center",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>
                <span className="bg-green-600 text-white p-1.5 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Income Growth
              </h4>
              <p className={cx(
                "text-sm",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Increase your earning potential through skills development, side hustles, and career advancement
                to accelerate your journey to FIRE.
              </p>
            </div>

            <div className={cx(
              "p-6 rounded-xl border",
              darkMode
                ? "bg-gradient-to-b from-blue-900/40 to-blue-800/40 border-blue-800"
                : "bg-gradient-to-b from-blue-50 to-blue-100 border-blue-200"
            )}>
              <h4 className={cx(
                "font-semibold mb-3 flex items-center",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>
                <span className="bg-blue-600 text-white p-1.5 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </span>
                Expense Optimization
              </h4>
              <p className={cx(
                "text-sm",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Cut costs on the things that bring little value while spending intentionally on what truly
                matters to you. Focus on the "big three": housing, transportation, and food.
              </p>
            </div>

            <div className={cx(
              "p-6 rounded-xl border",
              darkMode
                ? "bg-gradient-to-b from-purple-900/40 to-purple-800/40 border-purple-800"
                : "bg-gradient-to-b from-purple-50 to-purple-100 border-purple-200"
            )}>
              <h4 className={cx(
                "font-semibold mb-3 flex items-center",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>
                <span className="bg-purple-600 text-white p-1.5 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Strategic Investing
              </h4>
              <p className={cx(
                "text-sm",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                Harness the power of low-cost index funds, tax-advantaged accounts, and compound interest to grow
                your wealth efficiently and passively.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Types of FIRE Section */}
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
          <SectionHeader
            id="fire-types"
            title="Find Your FIRE: Different Approaches to Financial Independence"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          <p className={cx(
            "mb-6",
            darkMode ? "text-gray-300" : "text-gray-700"
          )}>
            There isn't just one way to achieve FIRE. The movement has evolved to include several variations
            that accommodate different financial goals, risk tolerances, and lifestyle preferences.
          </p>

          <div className="grid grid-cols-1 gap-6 mb-8">
            {fireTypes.map((type, index) => (
              <div key={index} className={cx(
                "p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow",
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              )}>
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 mb-4 md:mb-0">
                    <div className={`inline-flex items-center justify-center p-3 rounded-lg ${index === 0 ? (darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700') :
                      index === 1 ? (darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700') :
                        index === 2 ? (darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700') :
                          index === 3 ? (darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700') :
                            (darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700')
                      }`}>
                      <h3 className="text-xl font-bold">{type.type}</h3>
                    </div>
                  </div>
                  <div className="md:w-3/4 md:pl-6">
                    <p className={cx(
                      "mb-4",
                      darkMode ? "text-gray-300" : "text-gray-700"
                    )}>{type.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className={cx(
                          "text-sm",
                          darkMode ? "text-gray-400" : "text-gray-600"
                        )}><span className="font-medium">Typical Savings Rate:</span> {type.savingsRate}</p>
                        <p className={cx(
                          "text-sm",
                          darkMode ? "text-gray-400" : "text-gray-600"
                        )}><span className="font-medium">Lifestyle:</span> {type.lifestyle}</p>
                        <p className={cx(
                          "text-sm",
                          darkMode ? "text-gray-400" : "text-gray-600"
                        )}><span className="font-medium">Target Amount:</span> {type.retirementAmount}</p>
                      </div>
                      <div>
                        <p className={cx(
                          "text-sm",
                          darkMode ? "text-gray-400" : "text-gray-600"
                        )}><span className="font-medium">Benefits:</span> {type.benefits}</p>
                        <p className={cx(
                          "text-sm",
                          darkMode ? "text-gray-400" : "text-gray-600"
                        )}><span className="font-medium">Challenges:</span> {type.challenges}</p>
                      </div>
                    </div>
                    <p className={cx(
                      "text-sm mt-4",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>Learn more about <a className={darkMode ? "text-indigo-400 hover:text-indigo-300" : ""} href={`/fire-types/${type.type.toLowerCase()}`}>{type.type}</a></p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={cx(
            "p-6 rounded-xl border",
            darkMode
              ? "bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-800/50"
              : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
          )}>
            <h3 className={cx(
              "text-xl font-semibold mb-4",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>Finding Your FIRE Path</h3>
            <p className={cx(
              "mb-4",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              The right FIRE approach for you depends on your personal values, financial situation, and vision for your ideal life.
              Ask yourself these key questions:
            </p>
            <ul className={cx(
              "space-y-2",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              <li className="flex items-start">
                <span className={cx(
                  "mr-2",
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                )}>•</span>
                <span>What standard of living do you want in retirement?</span>
              </li>
              <li className="flex items-start">
                <span className={cx(
                  "mr-2",
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                )}>•</span>
                <span>How quickly do you want to reach financial independence?</span>
              </li>
              <li className="flex items-start">
                <span className={cx(
                  "mr-2",
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                )}>•</span>
                <span>Do you want to quit working entirely, or transition to more meaningful work?</span>
              </li>
              <li className="flex items-start">
                <span className={cx(
                  "mr-2",
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                )}>•</span>
                <span>How much are you willing to sacrifice now for freedom later?</span>
              </li>
              <li className="flex items-start">
                <span className={cx(
                  "mr-2",
                  darkMode ? "text-indigo-400" : "text-indigo-600"
                )}>•</span>
                <span>What activities and experiences truly bring you joy and fulfillment?</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>


      {/* Conclusion Section */}
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
          <SectionHeader
            title="Your Journey to Financial Independence Starts Today"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />

          <div className="space-y-6">
            <p className={cx(
              "text-lg leading-relaxed",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              The FIRE movement isn't just about retiring early—it's about gaining the freedom to live life on your own terms.
              By combining intentional spending, strategic investing, and thoughtful planning, you can break free from financial
              constraints decades earlier than conventional wisdom suggests.
            </p>

            <p className={cx(
              "text-lg leading-relaxed",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              Remember that FIRE is a highly personal journey. Your version might look different from someone else's,
              and that's perfectly fine. The key is to find the balance between enjoying today and building for tomorrow
              that works for your unique situation and values.
            </p>

            <div className={cx(
              "p-6 rounded-xl border",
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white shadow-md border-indigo-100"
            )}>
              <h3 className={cx(
                "text-xl font-semibold mb-4",
                darkMode ? "text-gray-100" : "text-gray-900"
              )}>Ready to Take Your First Steps?</h3>
              <div className="space-y-3">
                <p className={cx(
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>Here's your actionable FIRE starter plan:</p>
                <ol className={cx(
                  "list-decimal pl-5 space-y-2",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  <li><strong>Calculate your savings rate</strong> as a percentage of your take-home pay</li>
                  <li><strong>Track your expenses</strong> for at least one month to establish a baseline</li>
                  <li><strong>Open or max out tax-advantaged accounts</strong> like 401(k)s and IRAs</li>
                  <li><strong>Identify one major expense</strong> you can reduce without affecting your happiness</li>
                  <li><strong>Build an emergency fund</strong> of 3-6 months of expenses</li>
                </ol>
                <p className={cx(
                  "mt-4",
                  darkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  The key to FIRE success is consistency and patience. Small improvements compound dramatically over time,
                  just like your investments. Start today, adjust as needed, and keep the long view in mind.
                </p>
              </div>
            </div>
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
            darkMode ? "divide-gray-700" : "divide-gray-200"
          )}>
            <FAQItem
              question="What is the 4% rule and is it still valid?"
              answer={
                <>
                  <p>The 4% rule suggests that you can safely withdraw 4% of your portfolio value in the first year of retirement, then adjust that amount for inflation each subsequent year, without running out of money for at least 30 years.</p>
                  <p>This rule originated from the 1998 Trinity Study, which analyzed historical market data to determine safe withdrawal rates for different portfolio allocations and time horizons.</p>
                  <p>While still widely used as a starting point, some considerations for today's investors include:</p>
                  <ul>
                    <li>Lower expected market returns in the future may warrant using a more conservative 3-3.5% withdrawal rate</li>
                    <li>Early retirees with 40+ year horizons should be more conservative than traditional 30-year retirees</li>
                    <li>Flexibility in spending during market downturns can significantly improve success rates</li>
                  </ul>
                  <p>Most financial planners now recommend a dynamic withdrawal approach that adjusts based on market conditions rather than rigidly following the 4% rule.</p>
                </>
              }
            />

            <FAQItem
              question="Is FIRE only for high-income earners?"
              answer={
                <>
                  <p>While a high income can accelerate your path to FIRE, it's not a requirement. FIRE is achievable at various income levels through:</p>
                  <ul>
                    <li>Maintaining a high savings rate relative to your income</li>
                    <li>Geographic arbitrage (living in lower-cost areas)</li>
                    <li>Lifestyle optimization to reduce expenses</li>
                    <li>Side hustles and income diversification</li>
                    <li>Pursuing variations like LeanFIRE that require less capital</li>
                  </ul>
                  <p>The key factor is the gap between your income and expenses, not the absolute income level. A person earning $50,000 who saves 50% will reach FIRE faster than someone earning $200,000 who saves only 10%.</p>
                </>
              }
            />

            <FAQItem
              question="How do I account for healthcare costs in my FIRE plan?"
              answer={
                <>
                  <p>Healthcare is often the biggest wild card in FIRE planning, especially in the U.S. Consider these approaches:</p>
                  <ul>
                    <li><strong>ACA Health Insurance:</strong> Factor in premiums and potential subsidies based on your modified adjusted gross income</li>
                    <li><strong>Health Sharing Ministries:</strong> Alternative to traditional insurance (though with significant limitations)</li>
                    <li><strong>Part-time work:</strong> BaristaFIRE strategy to maintain employer health benefits</li>
                    <li><strong>Buffer fund:</strong> Set aside an additional $100,000-$300,000 specifically for healthcare uncertainties</li>
                    <li><strong>Medical tourism:</strong> Option for major procedures in countries with quality, affordable care</li>
                  </ul>
                  <p>Most successful FIRE plans include significantly higher healthcare allocations than what you currently pay while employed.</p>
                </>
              }
            />

            <FAQItem
              question="What investments are best for achieving FIRE?"
              answer={
                <>
                  <p>The most common and recommended investment approach for FIRE consists of:</p>
                  <ul>
                    <li><strong>Low-cost index funds:</strong> Total market or S&P 500 funds with expense ratios under 0.1%</li>
                    <li><strong>Tax-advantaged accounts:</strong> 401(k)s, IRAs, HSAs maximized before taxable accounts</li>
                    <li><strong>Simple asset allocation:</strong> Typically 70-90% stocks and 10-30% bonds, adjusting as you approach FIRE</li>
                  </ul>
                  <p>While some FIRE pursuers incorporate real estate or other alternative investments, the core of most FIRE portfolios remains broadly diversified, low-cost index funds due to their:</p>
                  <ul>
                    <li>Historical returns (7-10% before inflation)</li>
                    <li>Low maintenance requirements</li>
                    <li>Liquidity</li>
                    <li>Broad diversification</li>
                  </ul>
                </>
              }
            />

            <FAQItem
              question="How can I access retirement funds before age 59½ without penalties?"
              answer={
                <>
                  <p>Several strategies exist to access retirement funds early without the 10% penalty:</p>
                  <ul>
                    <li><strong>Roth Conversion Ladder:</strong> Convert traditional IRA funds to Roth, then withdraw the converted amount penalty-free after a 5-year waiting period</li>
                    <li><strong>Rule 72(t)/SEPP:</strong> Take substantially equal periodic payments based on your life expectancy</li>
                    <li><strong>Taxable accounts:</strong> Build a bridge of non-retirement investments to cover expenses until you can access retirement accounts</li>
                    <li><strong>Roth IRA contributions:</strong> Withdraw your original contributions (not earnings) at any time without penalty</li>
                    <li><strong>HSA accounts:</strong> Save receipts for medical expenses to reimburse yourself in retirement</li>
                  </ul>
                  <p>Most FIRE plans use a combination of these strategies in different life stages.</p>
                </>
              }
            />

            <FAQItem
              question="What happens if the market crashes right after I retire?"
              answer={
                <>
                  <p>This is known as "sequence of returns risk" and it's one of the biggest threats to a FIRE plan. Strategies to mitigate this risk include:</p>
                  <ul>
                    <li><strong>Cash buffer:</strong> Keep 1-3 years of expenses in cash/short-term bonds</li>
                    <li><strong>Variable withdrawal strategy:</strong> Reduce spending during market downturns</li>
                    <li><strong>Part-time work:</strong> Create some income during the first few years of retirement</li>
                    <li><strong>More conservative withdrawal rate:</strong> Use 3-3.5% instead of 4%</li>
                    <li><strong>"Bond tent":</strong> Temporarily increase bond allocation around retirement date</li>
                  </ul>
                  <p>The first 5-10 years of retirement returns have a disproportionate impact on long-term success, so having contingency plans for this period is crucial.</p>
                </>
              }
            />

            <FAQItem
              question="How do I avoid lifestyle inflation as my income grows?"
              answer={
                <>
                  <p>Lifestyle inflation (increasing spending as income rises) is one of the biggest obstacles to reaching FIRE. Effective strategies include:</p>
                  <ul>
                    <li><strong>Automatic savings:</strong> Increase savings rate with each raise or bonus</li>
                    <li><strong>Conscious spending plan:</strong> Decide in advance which upgrades actually improve your happiness</li>
                    <li><strong>Delay major upgrades:</strong> Wait 30 days before making any lifestyle-increasing purchase</li>
                    <li><strong>Find free or low-cost upgrades:</strong> Improve quality of life without permanent cost increases</li>
                    <li><strong>Track net worth:</strong> Focus on the growing number rather than expanding lifestyle</li>
                  </ul>
                  <p>The most successful FIRE achievers typically maintain a fairly consistent lifestyle even as their incomes and net worth grow substantially.</p>
                </>
              }
            />

            <FAQItem
              question="Is it better to pay off debt or invest when pursuing FIRE?"
              answer={
                <>
                  <p>This depends on several factors, with interest rates being the primary consideration:</p>
                  <ul>
                    <li><strong>High-interest debt (&gt;7%):</strong> Almost always better to pay off before investing beyond employer match</li>
                    <li><strong>Moderate interest (4-7%):</strong> Consider the psychological benefit of debt freedom vs. potentially higher returns</li>
                    <li><strong>Low-interest debt (&lt;4%):</strong> Often mathematically optimal to invest while making minimum payments</li>
                  </ul>
                  <p>Other considerations that might favor debt payoff:</p>
                  <ul>
                    <li>Emotional/psychological benefits of being debt-free</li>
                    <li>Simplifying finances before retirement</li>
                    <li>Reducing fixed expenses (increasing flexibility)</li>
                    <li>Risk reduction during market volatility</li>
                  </ul>
                  <p>Many FIRE pursuers take a hybrid approach, investing in tax-advantaged accounts while aggressively paying down debt.</p>
                </>
              }
            />

            <FAQItem
              question="What's the biggest mistake people make when pursuing FIRE?"
              answer={
                <>
                  <p>Common FIRE mistakes include:</p>
                  <ul>
                    <li><strong>Focusing only on the finish line:</strong> Neglecting to build a life you enjoy on the journey</li>
                    <li><strong>Extreme frugality without purpose:</strong> Cutting expenses that actually bring joy and value</li>
                    <li><strong>Neglecting health:</strong> Saving money at the expense of physical and mental wellbeing</li>
                    <li><strong>Not planning for post-FIRE life:</strong> Retiring from something rather than to something</li>
                    <li><strong>Rigid adherence to the plan:</strong> Inability to adapt to changing circumstances or priorities</li>
                  </ul>
                  <p>The most successful FIRE journeys balance present enjoyment with future security, focus on value-based spending rather than deprivation, and evolve as life circumstances change.</p>
                </>
              }
            />

            <FAQItem
              question="How do I talk to my partner about FIRE if they're not interested?"
              answer={
                <>
                  <p>Aligning financially with a partner is crucial for FIRE success. Try these approaches:</p>
                  <ul>
                    <li><strong>Focus on values and goals:</strong> Discuss what you both want long-term rather than the mechanics of FIRE</li>
                    <li><strong>Start small:</strong> Suggest a "financial date night" to review spending and savings without agenda</li>
                    <li><strong>Highlight freedom, not restriction:</strong> Emphasize what FIRE enables rather than what it limits</li>
                    <li><strong>Share success stories:</strong> Introduce them to FIRE content that resonates with their interests</li>
                    <li><strong>Consider compromise:</strong> "Partial FIRE" or "Coast FIRE" might be more appealing</li>
                  </ul>
                  <p>Remember that financial compatibility requires ongoing communication and mutual respect for different perspectives. Sometimes a financial advisor as a neutral third party can help facilitate these conversations.</p>
                </>
              }
            />

            <FAQItem
              question="How does compound interest work and why is it so important for FIRE?"
              answer={
                <>
                  <p>Compound interest is often called the eighth wonder of the world for good reason. It's the process where your investment returns generate their own returns over time, creating an exponential growth curve.</p>
                  <p>Here's how it works:</p>
                  <ul>
                    <li><strong>Year 1:</strong> You invest $10,000 and earn 7% ($700), giving you $10,700</li>
                    <li><strong>Year 2:</strong> That $10,700 earns 7% ($749), giving you $11,449</li>
                    <li><strong>Year 10:</strong> Your initial $10,000 has grown to $19,672 without adding any new money</li>
                    <li><strong>Year 30:</strong> That same $10,000 becomes $76,123 just through compound growth</li>
                  </ul>
                  <p>For FIRE seekers, compound interest is the primary engine that makes early retirement possible. The earlier you start investing, the more time your money has to compound, which is why many FIRE enthusiasts prioritize high savings rates early in their careers.</p>
                  <p>This is also why small improvements in your investment return rate (through low-cost index funds) or small increases in your savings rate can dramatically reduce the time needed to reach financial independence.</p>
                </>
              }
            />

            <FAQItem
              question="What personal finance habits are most important to develop for FIRE success?"
              answer={
                <>
                  <p>The journey to FIRE requires developing several key financial habits:</p>
                  <ul>
                    <li><strong>Expense tracking:</strong> Monitoring every dollar spent to identify optimization opportunities and ensure alignment with values</li>
                    <li><strong>Automatic investing:</strong> Setting up automatic transfers to investment accounts to remove emotion and ensure consistency</li>
                    <li><strong>Financial education:</strong> Continuous learning about investing, tax optimization, and wealth-building strategies</li>
                    <li><strong>Value-based spending:</strong> Learning to spend freely on what truly matters to you while cutting ruthlessly on things that don't</li>
                    <li><strong>Regular financial review:</strong> Quarterly or monthly check-ins on net worth, spending patterns, and progress toward goals</li>
                    <li><strong>Long-term thinking:</strong> Making decisions based on 5-10 year outcomes rather than immediate gratification</li>
                  </ul>
                  <p>Most FIRE achievers report that the habits themselves become rewarding and continue long after financial independence is reached. The discipline, intention, and mindfulness around money often transfer to other areas of life as well.</p>
                </>
              }
            />

            <FAQItem
              question="How can I balance saving for FIRE with other financial priorities like buying a home or paying for education?"
              answer={
                <>
                  <p>Balancing multiple financial goals is a common challenge. Here's a framework that works for many FIRE pursuers:</p>
                  <ol>
                    <li><strong>Establish a financial hierarchy:</strong>
                      <ul>
                        <li>First tier: Emergency fund and high-interest debt elimination</li>
                        <li>Second tier: Employer retirement match (100% immediate return)</li>
                        <li>Third tier: Other major life goals and moderate-interest debt</li>
                        <li>Fourth tier: Additional FIRE investments and low-interest debt</li>
                      </ul>
                    </li>
                    <li><strong>Consider opportunity costs:</strong> For example, if your mortgage is at 3% but you expect 7% investment returns, it might make mathematical sense to invest rather than pay extra on the mortgage</li>
                    <li><strong>Use separate accounts:</strong> Create dedicated savings accounts for different goals to track progress and prevent co-mingling of funds</li>
                    <li><strong>Recalibrate regularly:</strong> Review your priorities annually as life circumstances change</li>
                  </ol>
                  <p>Remember that some expenses like education or a reasonable home purchase can be viewed as investments that may actually accelerate your FIRE journey through increased earning potential or reduced long-term costs.</p>
                </>
              }
            />

            <FAQItem
              question="What tax-optimization strategies are most effective for FIRE pursuers?"
              answer={
                <>
                  <p>Tax optimization can significantly accelerate your path to FIRE. The most effective strategies include:</p>
                  <ul>
                    <li><strong>Tax-advantaged account maximization:</strong> 401(k), IRA, HSA contributions to reduce current tax burden and allow tax-free growth</li>
                    <li><strong>Tax-loss harvesting:</strong> Selling investments at a loss to offset capital gains while maintaining market exposure</li>
                    <li><strong>Strategic Roth conversions:</strong> Converting traditional retirement funds to Roth in low-income years to manage tax brackets in retirement</li>
                    <li><strong>Asset location optimization:</strong> Placing tax-inefficient investments in tax-advantaged accounts and tax-efficient ones in taxable accounts</li>
                    <li><strong>Geographic arbitrage:</strong> Living in low or no income tax states/countries during high-earning or withdrawal phases</li>
                    <li><strong>Qualified Dividends and Long-Term Capital Gains:</strong> Structuring investments to take advantage of lower tax rates on these income types</li>
                  </ul>
                  <p>Remember that tax laws change frequently, so maintaining flexibility in your plan and regularly consulting with a tax professional can help ensure you're using the most current and applicable strategies for your situation.</p>
                </>
              }
            />
          </div>
        </div>
      </Section>

      {/* Blog Post Schema for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": "FIRE Movement: Financial Independence, Retire Early Guide",
          "description": "Learn everything about the FIRE movement, from core principles to practical strategies for achieving financial independence and early retirement.",
          "author": {
            "@type": "Organization",
            "name": "AI FIRE Retirement Planner"
          },
          "datePublished": new Date().toISOString().split('T')[0],
          "dateModified": new Date().toISOString().split('T')[0],
          "image": "https://example.com/images/fire-movement.jpg",
          "publisher": {
            "@type": "Organization",
            "name": "AI FIRE Retirement Planner",
            "logo": {
              "@type": "ImageObject",
              "url": "https://example.com/logo.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://example.com/fire"
          }
        })
      }} />

      {/* FAQ Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the 4% rule and is it still reliable?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The 4% rule is a guideline for retirement withdrawals developed from the Trinity Study, suggesting you can withdraw 4% of your portfolio in the first year of retirement, then adjust that amount for inflation each subsequent year. While historically reliable for 30-year periods, longer retirements may require a more conservative 3-3.5% rate. Consider using variable withdrawal strategies for added safety."
              }
            },
            {
              "@type": "Question",
              "name": "Is FIRE only for high-income earners?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "While a high income can accelerate your path to FIRE, it's not a requirement. FIRE is achievable at various income levels through maintaining a high savings rate relative to your income, geographic arbitrage, lifestyle optimization, side hustles, and considering variations like LeanFIRE that require less capital. The key factor is the gap between income and expenses, not absolute income."
              }
            },
            {
              "@type": "Question",
              "name": "How do I account for healthcare costs in my FIRE plan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Healthcare is often the biggest wild card in FIRE planning. Consider ACA health insurance with potential subsidies, health sharing ministries, part-time work to maintain employer benefits (BaristaFIRE), setting aside an additional healthcare buffer fund, or medical tourism for major procedures. Most successful FIRE plans include significantly higher healthcare allocations than what you currently pay while employed."
              }
            },
            {
              "@type": "Question",
              "name": "What investments are best for achieving FIRE?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The most common investment approach for FIRE consists of low-cost index funds with expense ratios under 0.1%, tax-advantaged accounts like 401(k)s and IRAs, and a simple asset allocation typically 70-90% stocks and 10-30% bonds. The core of most FIRE portfolios remains broadly diversified, low-cost index funds due to their historical returns, low maintenance, liquidity, and broad diversification."
              }
            },
            {
              "@type": "Question",
              "name": "How can I access retirement funds before age 59½ without penalties?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Several strategies exist: Roth Conversion Ladder (converting traditional IRA funds to Roth, then withdrawing after 5 years), Rule 72(t)/SEPP (taking substantially equal periodic payments), building a bridge of taxable accounts, withdrawing Roth IRA contributions, and using HSA accounts strategically. Most FIRE plans use a combination of these strategies in different life stages."
              }
            }
          ]
        })
      }} />

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

      {/* Add Footer Component */}
      <Footer />
    </div>
  );
};

export default FIREPage; 