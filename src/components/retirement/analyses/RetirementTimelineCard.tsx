import React from 'react';
import { SectionTitle, Card } from '../../common/StyledComponents';
import { colors, typography, spacing, components, cx } from '../../../styles/styleGuide';
import { useTheme } from '../../../context/ThemeContext';

// Interfaces
interface Milestone {
  year: number;
  label: string;
  type: 'retirement' | 'investment' | 'withdrawal' | 'target';
}

interface RetirementTimelineCardProps {
  currentAge: number;
  retirementAge: number;
  yearLabels: { [key: number]: string };
  milestonesToShow: Milestone[];
  savingsRate: number;
  focusYear?: number;
}

// ScenarioTimeline Component
interface ScenarioTimelineProps {
  yearLabels: { [key: number]: string };
  milestonesToShow: Milestone[];
  savingsRate: number;
  focusYear?: number;
  darkMode: boolean;
}

const ScenarioTimeline: React.FC<ScenarioTimelineProps> = ({
  yearLabels,
  milestonesToShow,
  savingsRate,
  focusYear,
  darkMode
}) => {
  const currentYear = new Date().getFullYear();
  
  // Calculate years range to display
  const years = Object.keys(yearLabels).map(y => parseInt(y)).sort((a, b) => a - b);
  const startYear = years[0];
  const endYear = years[years.length - 1];
  const totalYears = endYear - startYear;

  return (
    <div className="w-full">
      <div className={cx(
        "w-full h-16 rounded-lg overflow-hidden flex relative",
        darkMode ? "bg-gray-800" : "bg-gray-100"
      )}>
        {/* Timeline segments */}
        {milestonesToShow.map((milestone, index) => {
          const position = ((milestone.year - startYear) / totalYears) * 100;
          const isFocused = focusYear === milestone.year;
          
          let lineColorClass = "";
          if (milestone.type === 'retirement') {
            lineColorClass = darkMode ? "bg-blue-600" : "bg-blue-500";
          } else if (milestone.type === 'investment') {
            lineColorClass = darkMode ? "bg-green-600" : "bg-green-500";
          } else if (milestone.type === 'withdrawal') {
            lineColorClass = darkMode ? "bg-yellow-600" : "bg-yellow-500";
          } else if (milestone.type === 'target') {
            lineColorClass = darkMode ? "bg-purple-600" : "bg-purple-500";
          }
          
          let dotColorClass = "";
          if (milestone.type === 'retirement') {
            dotColorClass = darkMode ? "bg-blue-500" : "bg-blue-600";
          } else if (milestone.type === 'investment') {
            dotColorClass = darkMode ? "bg-green-500" : "bg-green-600";
          } else if (milestone.type === 'withdrawal') {
            dotColorClass = darkMode ? "bg-yellow-500" : "bg-yellow-600";
          } else if (milestone.type === 'target') {
            dotColorClass = darkMode ? "bg-purple-500" : "bg-purple-600";
          }
          
          return (
            <div 
              key={index}
              className={cx(
                "absolute top-0 bottom-0 w-0.5 flex flex-col items-center",
                lineColorClass,
                isFocused ? "z-10" : ""
              )}
              style={{ left: `${position}%` }}
            >
              <div className={cx(
                "rounded-full w-3 h-3 mt-2",
                dotColorClass
              )}></div>
              <div className={cx(
                "text-xs font-semibold mt-1 whitespace-nowrap",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                {milestone.label}
              </div>
              <div className={cx(
                "text-[10px]",
                darkMode ? "text-gray-400" : "text-gray-500"
              )}>
                {milestone.year}
              </div>
            </div>
          );
        })}
        
        {/* Timeline bar showing savings rate */}
        <div className={cx(
          "absolute bottom-0 h-1.5 left-0",
          darkMode ? "bg-blue-500" : "bg-blue-600"
        )} style={{ width: `${savingsRate * 100}%` }}></div>
      </div>
    </div>
  );
};

export const RetirementTimelineCard: React.FC<RetirementTimelineCardProps> = ({
  currentAge,
  retirementAge,
  yearLabels,
  milestonesToShow,
  savingsRate,
  focusYear
}) => {
  const { darkMode } = useTheme();
  
  // Calculate years until retirement
  const yearsUntilRetirement = retirementAge - currentAge;
  
  return (
    <Card className="overflow-hidden lg:col-span-3">
      <div className={cx(
        "px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between",
        darkMode 
          ? "bg-blue-900/50 border-blue-700" 
          : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
      )}>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className={cx(
            "h-4 w-4 mr-2",
            darkMode ? "text-blue-400" : "text-blue-600"
          )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className={cx(
            "mb-0 text-sm sm:text-base font-semibold",
            darkMode ? "text-blue-300" : "text-blue-800"
          )}>Retirement Timeline</h3>
        </div>
        <div className={cx(
          "text-xs font-medium px-1.5 py-0.5 rounded-full",
          darkMode ? "bg-blue-900/70 text-blue-300" : "bg-blue-100 text-blue-700"
        )}>
          {yearsUntilRetirement > 0 ? `${yearsUntilRetirement} years until retirement` : `In retirement`}
        </div>
      </div>
      <div className={cx(
        "p-2 sm:p-3",
        darkMode ? "bg-gray-900" : "bg-white"
      )}>
        <ScenarioTimeline 
          yearLabels={yearLabels}
          milestonesToShow={milestonesToShow}
          savingsRate={savingsRate}
          focusYear={focusYear}
          darkMode={darkMode}
        />
        <div className={cx(
          "mt-2 text-[10px] text-center",
          darkMode ? "text-gray-500" : "text-gray-500"
        )}>
          Timeline shows key milestones in your retirement journey
        </div>
      </div>
    </Card>
  );
}; 