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
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full p-5 text-left font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
      >
        <span className="flex-1">{question}</span>
        <svg className={`w-5 h-5 ml-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 text-gray-600 bg-gray-50">
          {answer}
        </div>
      </div>
    </div>
  );
};

const CompoundInterestPage: React.FC = () => {
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  // Add your other state variables as needed

  // Add your calculation functions as needed

  return (
    <>
      <Helmet>
        <title>Compound Interest Calculator | See Your Money Grow Over Time</title>
        <meta name="description" content="Discover the power of compound growth and see how your investments can multiply over time with our interactive compound interest calculator." />
        
        {/* OpenGraph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://FIRECalculator.ai/compound-interest" />
        <meta property="og:title" content="Compound Interest Calculator | See Your Money Grow Over Time" />
        <meta property="og:description" content="Discover the power of compound growth and see how your investments can multiply over time with our interactive compound interest calculator." />
        <meta property="og:image" content="/blog-images/compound-interest-og-image.png" />
        <meta property="og:updated_time" content="2023-03-08" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://FIRECalculator.ai/compound-interest" />
        <meta name="twitter:title" content="Compound Interest Calculator | See Your Money Grow Over Time" />
        <meta name="twitter:description" content="Discover the power of compound growth and see how your investments can multiply over time with our interactive compound interest calculator." />
        <meta name="twitter:image" content="/blog-images/compound-interest-twitter-card.png" />
      </Helmet>
      
      <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50">
        {/* Header and Calculator sections would go here */}
        
        {/* FAQ Section */}
        <div id="faq">
          <Section className="mb-10 bg-white rounded-xl shadow-md">
            <div className="prose prose-lg max-w-none p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              
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
                        <li><strong>Simple interest</strong> is calculated only on the initial principal amount.</li>
                        <li><strong>Compound interest</strong> is calculated on both the initial principal and the accumulated interest.</li>
                      </ul>
                      <p>This difference becomes dramatic over long periods.</p>
                    </>
                  } 
                />
                
                {/* Additional FAQ items would go here */}
              </div>
            </div>
          </Section>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default CompoundInterestPage; 