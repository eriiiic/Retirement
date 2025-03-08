import React from 'react';
import { cx } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';

export type MetricTrend = 'up' | 'down' | 'neutral';

interface MetricProps {
  value: string | number;
  label: string;
  trend?: MetricTrend;
  size?: 'sm' | 'md' | 'lg';
  formatter?: (value: number) => string;
  className?: string;
  tooltip?: string;
}

export const Metric: React.FC<MetricProps> = ({
  value,
  label,
  trend = 'neutral',
  size = 'md',
  formatter,
  className,
  tooltip
}) => {
  const { darkMode } = useTheme();
  const formattedValue = typeof value === 'number' && formatter ? formatter(value) : value;
  
  // Updated trend config with dark mode support
  const trendConfig = {
    up: {
      textColor: darkMode ? 'text-green-400' : 'text-green-600',
      icon: (
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    },
    down: {
      textColor: darkMode ? 'text-red-400' : 'text-red-600',
      icon: (
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    },
    neutral: {
      textColor: darkMode ? 'text-gray-300' : 'text-gray-600',
      icon: (
        <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      )
    }
  };
  
  const sizeConfig = {
    sm: {
      container: 'space-y-0.5',
      label: 'text-xs',
      value: 'text-sm'
    },
    md: {
      container: 'space-y-1',
      label: 'text-sm',
      value: 'text-base'
    },
    lg: {
      container: 'space-y-1.5',
      label: 'text-base',
      value: 'text-lg'
    }
  };

  const { textColor, icon } = trendConfig[trend];
  const { container, label: labelSize, value: valueSize } = sizeConfig[size];

  return (
    <div className={cx('flex flex-col', container, className)} title={tooltip}>
      <span className={cx(
        labelSize, 
        darkMode ? 'text-gray-300' : 'text-gray-600'
      )}>
        {label}
      </span>
      <div className="flex items-baseline">
        <span className={cx('font-semibold', textColor, valueSize)}>
          {formattedValue}
        </span>
        {trend !== 'neutral' && icon}
      </div>
    </div>
  );
};

export default Metric; 