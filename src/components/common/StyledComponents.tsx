import React, { ReactNode } from 'react';
import { cx, typography, colors, spacing, components } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';

// Text Components
type TextProps = {
  children: ReactNode;
  className?: string;
};

export const Title = ({ children, className = '' }: TextProps) => {
  const { darkMode } = useTheme();
  return (
    <h2 className={cx('text-xl font-bold', darkMode ? 'text-gray-100' : 'text-gray-800', className)}>
      {children}
    </h2>
  );
};

export const Subtitle = ({ children, className = '' }: TextProps) => {
  const { darkMode } = useTheme();
  return (
    <p className={cx('text-sm', darkMode ? 'text-gray-400' : 'text-gray-600', className)}>
      {children}
    </p>
  );
};

export const SectionTitle = ({ children, className = '' }: TextProps) => {
  const { darkMode } = useTheme();
  return (
    <h3 className={cx('text-lg font-semibold', darkMode ? 'text-gray-100' : 'text-gray-800', className)}>
      {children}
    </h3>
  );
};

export const Label = ({ children, className = '' }: TextProps) => {
  const { darkMode } = useTheme();
  return (
    <p className={cx('text-xs font-medium uppercase', darkMode ? 'text-gray-400' : 'text-gray-700', className)}>
      {children}
    </p>
  );
};

export const Value = ({ children, className = '' }: TextProps) => {
  const { darkMode } = useTheme();
  return (
    <p className={cx('text-sm font-medium', darkMode ? 'text-gray-200' : 'text-gray-900', className)}>
      {children}
    </p>
  );
};

export const Caption = ({ children, className = '' }: TextProps) => {
  const { darkMode } = useTheme();
  return (
    <p className={cx('text-xs', darkMode ? 'text-gray-500' : 'text-gray-500', className)}>
      {children}
    </p>
  );
};

// Metric Values
export const PositiveMetric = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm font-medium text-green-600 dark:text-green-400', className)}>
    {children}
  </p>
);

export const NegativeMetric = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm font-medium text-red-600 dark:text-red-400', className)}>
    {children}
  </p>
);

export const NeutralMetric = ({ children, className = '' }: TextProps) => (
  <p className={cx('text-sm font-medium text-blue-600 dark:text-blue-400', className)}>
    {children}
  </p>
);

// Container Components
type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className = '' }: ContainerProps) => {
  const { darkMode } = useTheme();
  return (
    <div className={cx('rounded-lg overflow-hidden shadow-sm', 
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200', 
      className
    )}>
      {children}
    </div>
  );
};

export const Section = ({ children, className = '' }: ContainerProps) => {
  const { darkMode } = useTheme();
  return (
    <div className={cx('rounded-lg shadow-sm p-4', 
      darkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-100', 
      className
    )}>
      {children}
    </div>
  );
};

export const HighlightBox = ({ children, className = '' }: ContainerProps) => {
  const { darkMode } = useTheme();
  return (
    <div className={cx('rounded-lg p-4', 
      darkMode ? 'bg-gray-700' : 'bg-gray-50', 
      className
    )}>
      {children}
    </div>
  );
};

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

// Dynamic Width Container Component
type DynamicWidthContainerProps = {
  children: ReactNode;
  width: string;
  className?: string;
};

export const DynamicWidthContainer = ({ 
  children, 
  width, 
  className = '' 
}: DynamicWidthContainerProps) => (
  <div 
    className={cx('h-full', className)}
    style={{ width }}
  >
    {children}
  </div>
);

// Progress Bar Component with enhanced styling
type EnhancedProgressBarProps = {
  percentage: number;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  height?: 'xs' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  showLabel?: boolean;
  className?: string;
};

export const EnhancedProgressBar = ({ 
  percentage, 
  variant = 'primary',
  height = 'sm',
  animate = false,
  showLabel = false,
  className = ''
}: EnhancedProgressBarProps) => {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  
  const heightClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };
  
  const variantClasses = {
    primary: 'bg-indigo-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };
  
  return (
    <div className={cx('relative w-full', className)}>
      <div className={cx('w-full bg-gray-200 rounded-full overflow-hidden', heightClasses[height])}>
        <div 
          className={cx(
            'h-full rounded-full transition-all duration-500', 
            variantClasses[variant],
            animate && 'relative overflow-hidden'
          )}
          style={{ width: `${safePercentage}%` }}
        >
          {animate && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="animate-progress-stripe w-[200%] h-full opacity-15 bg-stripe-gradient"></div>
            </div>
          )}
        </div>
      </div>
      {showLabel && (
        <div className="mt-1 text-xs font-medium text-gray-600 text-right">
          {safePercentage}%
        </div>
      )}
    </div>
  );
};

// Centered Element Component
type CenteredElementProps = {
  children: ReactNode;
  vertical?: boolean;
  horizontal?: boolean;
  className?: string;
};

export const CenteredElement = ({ 
  children, 
  vertical = true, 
  horizontal = true,
  className = ''
}: CenteredElementProps) => (
  <div 
    className={cx(
      'relative',
      className
    )}
    style={{ 
      ...(vertical && { top: '50%', transform: horizontal ? 'translate(-50%, -50%)' : 'translateY(-50%)' }),
      ...(horizontal && !vertical && { left: '50%', transform: 'translateX(-50%)' }),
      ...(horizontal && vertical && { left: '50%' }),
      position: 'absolute'
    }}
  >
    {children}
  </div>
);

// Table Cell Component
type TableCellProps = {
  children: ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  variant?: 'default' | 'highlight' | 'numeric' | 'action';
  className?: string;
};

export const TableCell = ({ 
  children, 
  width,
  align = 'left',
  variant = 'default',
  className = '' 
}: TableCellProps) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  const variantClasses = {
    default: 'text-gray-700',
    highlight: 'text-gray-900 font-medium',
    numeric: 'text-gray-900 font-medium font-mono',
    action: 'text-indigo-600 hover:text-indigo-800',
  };
  
  return (
    <div 
      className={cx(
        'px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap text-xs sm:text-sm truncate',
        alignClasses[align],
        variantClasses[variant],
        className
      )}
      style={width ? { width } : undefined}
    >
      {children}
    </div>
  );
};

// Timeline Component
type TimelineComponentProps = {
  segments: Array<{
    id: string;
    width: string;
    label: string;
    sublabel?: string;
    color?: string;
  }>;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
};

export const Timeline = ({ 
  segments,
  height = 'md',
  className = ''
}: TimelineComponentProps) => {
  const heightClasses = {
    sm: 'h-10',
    md: 'h-16',
    lg: 'h-24',
  };
  
  return (
    <div className={cx('flex rounded-xl overflow-hidden w-full', heightClasses[height], className)}>
      {segments.map(segment => (
        <div
          key={segment.id}
          className="h-full flex flex-col justify-center px-3 transition-all"
          style={{ 
            width: segment.width,
            backgroundColor: segment.color 
          }}
        >
          <div className="text-sm text-white font-medium">{segment.label}</div>
          {segment.sublabel && <div className="text-xs text-white opacity-80">{segment.sublabel}</div>}
        </div>
      ))}
    </div>
  );
};

// Grid Layout Component
type GridLayoutProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

export const GridLayout = ({ 
  children, 
  columns = 2,
  gap = 'md',
  className = '' 
}: GridLayoutProps) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };
  
  return (
    <div className={cx('grid', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
};

// Section Container for standardized section styling
type SectionContainerProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
};

export const SectionContainer = ({ 
  children, 
  title,
  subtitle,
  className = '',
  id
}: SectionContainerProps) => {
  const { darkMode } = useTheme();
  
  return (
    <section 
      id={id}
      className={cx(
        'mb-8 rounded-lg overflow-hidden shadow-sm', 
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200',
        className
      )}
    >
      {(title || subtitle) && (
        <div className={cx('px-6 py-4 border-b', darkMode ? 'border-gray-700' : 'border-gray-200')}>
          {title && <h2 className={cx('text-lg font-semibold', darkMode ? 'text-white' : 'text-gray-800')}>{title}</h2>}
          {subtitle && <p className={cx('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-600')}>{subtitle}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </section>
  );
}; 