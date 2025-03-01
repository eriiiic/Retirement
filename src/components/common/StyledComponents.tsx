import React, { ReactNode } from 'react';
import { cx } from '../../styles/styleGuide';

// Text Components
type TextProps = {
  children: ReactNode;
  className?: string;
};

export const Title = ({ children, className = '' }: TextProps) => (
  <h2 className={cx('text-xl font-bold text-gray-800', className)}>
    {children}
  </h2>
);

export const Subtitle = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm text-gray-600', className)}>
    {children}
  </p>
);

export const SectionTitle = ({ children, className = '' }: TextProps) => (
  <h3 className={cx('text-lg font-semibold text-gray-800', className)}>
    {children}
  </h3>
);

export const Label = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-xs font-medium text-gray-700 uppercase', className)}>
    {children}
  </p>
);

export const Value = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm font-medium text-gray-900', className)}>
    {children}
  </p>
);

export const Caption = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-xs text-gray-500', className)}>
    {children}
  </p>
);

// Metric Values
export const PositiveMetric = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm font-medium text-green-600', className)}>
    {children}
  </p>
);

export const NegativeMetric = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm font-medium text-red-600', className)}>
    {children}
  </p>
);

export const NeutralMetric = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm font-medium text-blue-600', className)}>
    {children}
  </p>
);

// Container Components
type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className = '' }: ContainerProps) => (
  <div className={cx('bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden', className)}>
    {children}
  </div>
);

export const Section = ({ children, className = '' }: ContainerProps) => (
  <div className={cx('bg-white rounded-lg border border-gray-100 shadow-sm p-4', className)}>
    {children}
  </div>
);

export const HighlightBox = ({ children, className = '' }: ContainerProps) => (
  <div className={cx('bg-gray-50 rounded-lg p-4', className)}>
    {children}
  </div>
);

// Header Components
type HeaderProps = {
  children: ReactNode;
  className?: string;
};

export const MainHeader = ({ children, className = '' }: HeaderProps) => (
  <div className={cx('bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5', className)}>
    {children}
  </div>
);

export const SectionHeader = ({ children, className = '' }: HeaderProps) => (
  <h3 className={cx('text-xs font-semibold text-gray-700 uppercase tracking-wider px-4 py-2 bg-gray-50 rounded-t-lg', className)}>
    {children}
  </h3>
);

export const SubsectionHeader = ({ children, className = '' }: HeaderProps) => (
  <h4 className={cx('text-xs font-medium text-gray-700 mb-2', className)}>
    {children}
  </h4>
);

// Button Components
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

export const PrimaryButton = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  type = 'button'
}: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cx(
      'bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded shadow-sm',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  type = 'button'
}: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cx(
      'bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 shadow-sm',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
  >
    {children}
  </button>
);

// Tab Components
type TabProps = {
  children: ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
};

export const Tab = ({ children, isActive, onClick, className = '' }: TabProps) => (
  <button
    onClick={onClick}
    className={cx(
      'px-3 py-1 text-xs font-medium transition-all',
      isActive ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50',
      className
    )}
  >
    {children}
  </button>
);

// Status Indicator
type StatusIndicatorProps = {
  isPositive: boolean;
  text: string;
  message?: string;
  className?: string;
};

export const StatusIndicator = ({ 
  isPositive, 
  text, 
  message,
  className = '' 
}: StatusIndicatorProps) => (
  <div 
    className={cx(
      'rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm',
      isPositive ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
      className
    )}
  >
    <div className={cx(
      'w-3 h-3 rounded-full animate-pulse',
      isPositive ? 'bg-green-500' : 'bg-red-500'
    )}></div>
    <div>
      <div className="font-semibold">{text}</div>
      {message && <div className="text-xs">{message}</div>}
    </div>
  </div>
);

// Timeline Component
type TimelineSegmentProps = {
  width: string;
  label: string;
  sublabel?: string;
  yearRange?: string;
  className?: string;
};

export const TimelineSegment = ({ 
  width, 
  label, 
  sublabel, 
  yearRange,
  className = '' 
}: TimelineSegmentProps) => (
  <div 
    className={cx('h-full flex flex-col justify-center px-3', className)}
    style={{ width }}
  >
    <div className="text-sm text-white font-medium">{label}</div>
    {sublabel && <div className="text-xs text-white opacity-80">{sublabel}</div>}
    {yearRange && <div className="text-xs text-white opacity-80">{yearRange}</div>}
  </div>
);

// Progress Bar Component
type ProgressBarProps = {
  percentage: number;
  label?: string;
  value?: string;
  className?: string;
  barColor?: string;
};

export const ProgressBar = ({ 
  percentage, 
  label, 
  value,
  className = '',
  barColor = 'bg-blue-600'
}: ProgressBarProps) => (
  <div className={cx('', className)}>
    {(label || value) && (
      <div className="flex justify-between items-center mb-1">
        {label && <div className="text-sm text-gray-700">{label}</div>}
        {value && <div className="text-sm font-medium text-blue-600">{value}</div>}
      </div>
    )}
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div 
        className={cx('h-full', barColor)}
        style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
      ></div>
    </div>
  </div>
); 