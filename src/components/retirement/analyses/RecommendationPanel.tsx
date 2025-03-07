import React, { useState } from 'react';
import { FormatAmountFunction } from '../types';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { SectionTitle, Card } from '../../common/StyledComponents';

// Helper function for consistent percentage formatting with 1 decimal place
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

interface Recommendation {
  change: string; 
  impact: string; 
  impact_detail?: string; 
  priority: 'High' | 'Medium' | 'Low';
}

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  withdrawalRate: {
    current: number;
    safe: number;
    isSafe: boolean;
  };
  optimalDelayYears?: number;
}

// Update Modal component to match RiskAssessmentCard tooltip style
const RecommendationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  recommendation: Recommendation;
  position: { x: number; y: number };
}> = ({ isOpen, onClose, recommendation, position }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed shadow-xl z-50 pointer-events-auto"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 100}px`
      }}
    >
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-64">
        <h3 className="font-semibold text-gray-800 mb-1">{recommendation.change}</h3>
        <p className="text-xs text-gray-600">{recommendation.impact}</p>
        {recommendation.impact_detail && (
          <p className="text-xs text-indigo-600 mt-1 italic">{recommendation.impact_detail}</p>
        )}
        <div className="mt-2 border-t border-gray-100 pt-2">
          <div className="text-xs text-gray-700 font-medium mb-1">Implementation Steps:</div>
          <ul className="text-xs text-gray-600 space-y-1">
            {getImplementationSteps(recommendation).map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Add helper function for implementation steps
const getImplementationSteps = (recommendation: Recommendation): string[] => {
  if (recommendation.change.toLowerCase().includes('withdraw')) {
    return [
      'Calculate new sustainable withdrawal amount',
      'Adjust monthly budget to accommodate changes',
      'Review and optimize expense categories',
      'Consider part-time work to supplement income'
    ];
  } else if (recommendation.change.toLowerCase().includes('delay')) {
    return [
      'Review current employment situation',
      'Explore part-time or consulting opportunities',
      'Adjust retirement date in financial plans',
      'Update investment strategy for extended timeline'
    ];
  } else {
    return [
      'Review current strategy implementation',
      'Set specific milestones and deadlines',
      'Monitor progress regularly',
      'Adjust approach based on results'
    ];
  }
};

// Update RecommendationItem component
const RecommendationItem = React.memo(({ 
  recommendation, 
  index 
}: { 
  recommendation: Recommendation; 
  index: number 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const { change, impact, impact_detail, priority } = recommendation;
  
  // More descriptive labels for the priority
  const priorityLabel = priority === 'High' 
    ? 'Critical' 
    : priority === 'Medium' 
      ? 'Recommended' 
      : 'Beneficial';
      
  // More specific tooltip text for each priority level  
  const priorityDescription = priority === 'High'
    ? 'Critical action for financial security'
    : priority === 'Medium'
      ? 'Recommended for improved security'
      : 'Beneficial for long-term growth';

  // Function to determine which icon to show
  const getIcon = () => {
    if (change.toLowerCase().includes('withdraw')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    } else if (priority === 'High') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    } else if (priority === 'Medium') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };
  
  // Handle mouse enter with position
  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsModalOpen(true);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div 
        className={cx(
          "flex items-center p-2 sm:p-2.5 rounded-lg border group transition-all duration-200 cursor-help",
          priority === 'High' ? "border-red-100 hover:bg-red-50" : 
          priority === 'Medium' ? "border-yellow-100 hover:bg-yellow-50" : 
          "border-blue-100 hover:bg-blue-50"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={cx(
          "w-7 sm:w-8 h-7 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0",
          priority === 'High' ? "bg-red-100 text-red-600" : 
          priority === 'Medium' ? "bg-yellow-100 text-yellow-600" : 
          "bg-blue-100 text-blue-600"
        )}>
          {getIcon()}
        </div>
        <div className="flex-grow min-w-0">
          <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">{change}</div>
          <div className="text-xs text-gray-500 truncate">{impact}</div>
          {impact_detail && (
            <div className="text-[10px] sm:text-xs italic text-indigo-600 mt-0.5 truncate">{impact_detail}</div>
          )}
        </div>
        <div 
          className={cx(
            "px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ml-1 sm:ml-2 flex-shrink-0",
            priority === 'High' ? "bg-red-100 text-red-800" : 
            priority === 'Medium' ? "bg-yellow-100 text-yellow-800" : 
            "bg-blue-100 text-blue-800"
          )}
          title={priorityDescription}
        >
          {priorityLabel}
        </div>
      </div>

      <RecommendationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendation={recommendation}
        position={tooltipPosition}
      />
    </>
  );
});

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  withdrawalRate,
  optimalDelayYears = 0
}) => {
  return (
    <Card className="overflow-hidden lg:col-span-2">
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-indigo-200 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <SectionTitle className="text-indigo-800 mb-0 text-sm sm:text-base">Recommended Action Plan</SectionTitle>
      </div>
      <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        <div className="pb-1.5 border-b border-gray-100 mb-1 flex justify-between items-center">
          <div className="text-xs text-gray-500 font-medium">
            {withdrawalRate.current <= 4 ? 'Top Priorities' : 
             withdrawalRate.current <= 6 ? 'Recommended Actions to Improve Security' : 
             'Critical Actions Required'}
          </div>
          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <span className="hidden sm:inline">Impact</span>
            <span className="sm:hidden">Priority</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Show top 3 recommendations (highest priority first) */}
        {recommendations
          .slice()
          .sort((a, b) => {
            const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .slice(0, 3)
          .map((rec, index) => (
            <RecommendationItem 
              key={index} 
              recommendation={rec} 
              index={index}
            />
          ))
        }

        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs font-medium text-gray-500">Current withdrawal rate:</div>
              <div className={cx(
              "text-sm font-bold flex items-center",
              withdrawalRate.isSafe ? "text-green-600" : "text-red-600"
              )}>
              {formatPercentage(withdrawalRate.current)}
              <span className="ml-1.5 text-xs font-normal px-1.5 py-0.5 rounded-full bg-gray-100">
                {withdrawalRate.isSafe ? "safe" : "high"}
              </span>
              </div>
            </div>
          
          {/* Withdrawal rate progress bar container */}
          <div className="relative">
            {/* Safe zone indicator */}
            <div className="absolute inset-y-0 left-0 bg-green-100 rounded-l-full" style={{ width: '50%' }}></div>
            {/* Warning zone indicator */}
            <div className="absolute inset-y-0 left-[50%] bg-yellow-100" style={{ width: '25%' }}></div>
            {/* Danger zone indicator */}
            <div className="absolute inset-y-0 left-[75%] bg-red-100 rounded-r-full" style={{ width: '25%' }}></div>
            
            {/* Main progress bar */}
            <div 
              className="relative w-full bg-transparent h-2 rounded-full"
              role="progressbar" 
              aria-valuenow={Math.round(withdrawalRate.current * 10) / 10}
              aria-valuemin={0}
              aria-valuemax={8}
              aria-label="Withdrawal rate progress"
            >
              <div 
                className={cx(
                  "h-2 rounded-full transition-all duration-500",
                  withdrawalRate.current <= 4 ? "bg-green-500" :
                  withdrawalRate.current <= 6 ? "bg-yellow-500" :
                  "bg-red-500"
                )} 
                style={{ width: `${Math.min(100, (withdrawalRate.current / 8) * 100)}%` }}
              ></div>
            </div>
            
            {/* Safe withdrawal rate marker */}
            <div className="absolute top-[-4px] h-3 flex items-center" style={{ left: `${(withdrawalRate.safe / 8) * 100}%` }}>
              <div className="h-3 w-0.5 bg-green-700"></div>
              <div className="absolute left-1.5 top-[-12px] text-[9px] text-green-700 whitespace-nowrap">
                Safe rate (4%)
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px]">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-100 mr-1"></div>
              <span className="text-gray-600">Safe (0-4%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-100 mr-1"></div>
              <span className="text-gray-600">Warning (4-6%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-100 mr-1"></div>
              <span className="text-gray-600">High Risk ({'>'}6%)</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-2.5 border border-indigo-100">
          <div className="text-xs space-y-2">
            <div>
              <div className="text-xs font-medium text-indigo-800 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Implementation Strategy
              </div>
              <div className="text-gray-600">
                {withdrawalRate.isSafe ? (
                  <>
                    Your withdrawal rate is within safe parameters. Focus on optimizing your strategy:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Implement highest priority recommendations first</li>
                      <li>Optional 1-2 year retirement delay for additional security</li>
                      <li>Consider tax-efficient withdrawal sequencing</li>
                    </ul>
                  </>
                ) : withdrawalRate.current <= 6 ? (
                  <>
                    Your withdrawal rate needs attention to improve sustainability:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Address recommended actions to strengthen your plan</li>
                      <li>{optimalDelayYears > 0 ? 
                          `Consider delaying retirement by ${optimalDelayYears} ${optimalDelayYears === 1 ? 'year' : 'years'} to improve security` :
                          'Review retirement timing to improve security'}</li>
                      <li>Evaluate flexible spending strategies for non-essential expenses</li>
                    </ul>
                  </>
                ) : (
                  <>
                    Your withdrawal rate requires significant adjustment for long-term sustainability:
                    <ul className="mt-1 list-disc pl-4 text-xs space-y-1">
                      <li>Take critical actions immediately to address financial sustainability</li>
                      <li>{optimalDelayYears > 0 ? 
                          `Delay retirement by ${optimalDelayYears} ${optimalDelayYears === 1 ? 'year' : 'years'} to strengthen your position` :
                          'Significant retirement delay recommended'}</li>
                      <li>Develop a timeline with milestone checks to monitor progress</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t border-indigo-200 pt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">Implementation approach</div>
                <div className="text-xs font-semibold text-indigo-700">
                  {withdrawalRate.isSafe ? 'Optimization focus' : withdrawalRate.current <= 6 ? 'Balanced adjustment' : 'Critical intervention'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Expected impact timeframe</div>
                <div className="text-xs font-semibold text-indigo-700">
                  {withdrawalRate.isSafe ? 'Long-term growth' : withdrawalRate.current <= 6 ? 'Medium-term improvement' : 'Short-term stabilization'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RecommendationPanel; 