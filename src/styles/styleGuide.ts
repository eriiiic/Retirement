// Style Guide for Retraite Application
// This file contains standardized styles to be used across components

// Type definitions to help with TypeScript
interface SpacingSubValues {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

interface ResponsiveValues {
  xs: string;
  sm: string;
  md: string;
  lg: string;
}

interface PaddingValues extends SpacingSubValues {
  cell: string;
  button: string;
  alert: string;
}

interface SpacingType {
  container: string;
  section: string;
  item: string;
  gap: SpacingSubValues;
  margin: SpacingSubValues;
  padding: PaddingValues;
  responsive: ResponsiveValues;
}

// Color Palette
export const colors = {
  // Primary colors
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5', // Main primary color
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  
  // Secondary colors (purple)
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea', // Main secondary color
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  
  // Accent colors
  accent: {
    blue: '#1e40af',
    green: '#047857',
    red: '#b91c1c',
    yellow: '#b45309',
  },
  
  // Neutrals
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Status colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Phase colors
  phases: {
    investment: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      text: 'text-blue-600',
      border: 'border-blue-400',
      hover: 'hover:bg-blue-50',
      light: 'bg-blue-100',
      dark: 'text-blue-800',
      textLight: 'text-blue-100',
    },
    retirement: {
      bg: 'bg-gradient-to-r from-purple-500 to-pink-600',
      text: 'text-purple-600',
      border: 'border-purple-400',
      hover: 'hover:bg-purple-50',
      light: 'bg-purple-100',
      dark: 'text-purple-800',
      textLight: 'text-purple-100',
    },
    depleted: {
      bg: 'bg-gradient-to-r from-red-500 to-pink-600',
      text: 'text-red-600',
      border: 'border-red-400',
      hover: 'hover:bg-red-50',
      light: 'bg-red-100',
      dark: 'text-red-800',
      textLight: 'text-red-100',
    },
    success: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      text: 'text-green-600',
      border: 'border-green-400',
      hover: 'hover:bg-green-50',
      light: 'bg-green-100',
      dark: 'text-green-800',
      textLight: 'text-green-100',
    },
  },
  
  // Common hardcoded text colors
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-600',
    light: 'text-gray-500',
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
    muted: 'text-gray-400',
    white: 'text-white',
    indigo: {
      600: 'text-indigo-600',
      700: 'text-indigo-700',
      800: 'text-indigo-800',
    },
    green: {
      600: 'text-green-600',
      700: 'text-green-700',
      800: 'text-green-800',
    },
    red: {
      600: 'text-red-600',
      700: 'text-red-700',
      800: 'text-red-800',
    },
  },
  
  // Common hardcoded background colors
  bg: {
    white: 'bg-white',
    light: 'bg-gray-50',
    highlight: 'bg-gray-100',
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50',
    warning: 'bg-yellow-50',
    indigo: {
      50: 'bg-indigo-50',
      100: 'bg-indigo-100',
    },
    green: {
      50: 'bg-green-50',
      100: 'bg-green-100',
    },
    red: {
      50: 'bg-red-50',
      100: 'bg-red-100',
    },
  },

  // Border colors
  border: {
    light: 'border-gray-200',
    default: 'border-gray-300',
    dark: 'border-gray-400',
    success: 'border-green-200',
    error: 'border-red-200',
    info: 'border-blue-200',
    warning: 'border-yellow-200',
    indigo: 'border-indigo-200',
  },

  // Hover states
  hover: {
    light: 'hover:bg-gray-50',
    default: 'hover:bg-gray-100',
    success: 'hover:bg-green-100',
    error: 'hover:bg-red-100',
    info: 'hover:bg-blue-100',
    warning: 'hover:bg-yellow-100',
    indigo: 'hover:bg-indigo-100',
  },
};

// Typography
export const typography = {
  // Base text sizes
  size: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  },
  
  // Font weights
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  
  // Common text styles
  style: {
    title: 'text-xl font-bold text-gray-800',
    subtitle: 'text-sm text-gray-600',
    sectionTitle: 'text-lg font-semibold text-gray-800',
    label: 'text-xs font-medium text-gray-700',
    value: 'text-sm font-medium text-gray-900',
    metric: {
      positive: 'text-sm font-medium text-green-600',
      negative: 'text-sm font-medium text-red-600',
      neutral: 'text-sm font-medium text-blue-600',
    },
    caption: 'text-xs text-gray-500',
    gradient: 'text-gradient',
  },
  
  // Text truncation
  truncate: {
    single: 'truncate',
    multiline: 'line-clamp-2',
  },
  
  // Text transformation
  transform: {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
  },

  // Responsive text sizing
  responsive: {
    text: {
      xs: 'text-xs sm:text-sm',
      sm: 'text-sm sm:text-base',
      base: 'text-base sm:text-lg',
      lg: 'text-lg sm:text-xl',
    },
    hidden: {
      mobileOnly: 'hidden sm:block',
      desktopOnly: 'block sm:hidden',
    },
  },
};

// Spacing
export const spacing: SpacingType = {
  container: 'p-6',
  section: 'p-4',
  item: 'p-2',
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
  margin: {
    xs: 'mt-1 mb-1',
    sm: 'mt-2 mb-2',
    md: 'mt-4 mb-4',
    lg: 'mt-6 mb-6',
    xl: 'mt-8 mb-8',
  },
  padding: {
    xs: 'px-1 py-1',
    sm: 'px-2 py-2',
    md: 'px-4 py-4',
    lg: 'px-6 py-6',
    xl: 'px-8 py-8',
    cell: 'px-1 sm:px-2 md:px-3 py-2', // Common table cell padding
    button: 'px-2 sm:px-4 py-1.5 sm:py-2', // Common button padding
    alert: 'px-2 sm:px-4 py-1.5 sm:py-2', // Common alert padding
  },
  responsive: {
    xs: 'p-1 sm:p-2',
    sm: 'p-2 sm:p-3',
    md: 'p-3 sm:p-4 md:p-6',
    lg: 'p-4 sm:p-6 md:p-8',
  },
};

// Component styles
export const components = {
  // Containers
  container: {
    card: 'bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden',
    section: 'bg-white rounded-lg border border-gray-100 shadow-sm p-4',
    highlight: 'bg-gray-50 rounded-lg p-4',
  },
  
  // Headers
  header: {
    main: 'bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-5',
    section: 'text-xs font-semibold text-gray-700 uppercase tracking-wider px-4 py-2 bg-gray-50 rounded-t-lg',
    subsection: 'text-xs font-medium text-gray-700 mb-2',
    withIcon: 'flex items-center gap-2',
  },
  
  // Buttons
  button: {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 shadow-sm',
    tab: {
      active: 'bg-indigo-600 text-white',
      inactive: 'bg-white text-gray-700 hover:bg-gray-50',
    },
    icon: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 shadow-sm transition-colors flex items-center',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 shadow-sm transition-colors',
    success: 'bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 shadow-sm transition-colors',
  },
  
  // Form elements
  form: {
    slider: {
      track: 'h-2 rounded-full bg-gray-200',
      thumb: 'w-5 h-5 rounded-full bg-indigo-600 border-2 border-white',
      activeThumb: 'w-5 h-5 rounded-full bg-indigo-700 border-2 border-white scale-110',
    },
    input: 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
  },
  
  // Data visualization
  dataViz: {
    chart: 'rounded-xl overflow-hidden shadow-sm border border-gray-200',
    timeline: 'h-16 rounded-xl overflow-hidden flex',
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-blue-600',
    // Progress indicators
    progressBar: {
      container: 'h-2 w-full bg-gray-200 rounded-full overflow-hidden',
      filled: 'h-full rounded-full',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      primary: 'bg-indigo-500',
      secondary: 'bg-purple-500',
    },
  },
  
  // Table styles
  table: {
    container: 'w-full divide-y divide-gray-200 border-collapse',
    header: 'bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
    row: {
      base: 'bg-white border-b border-gray-100',
      alternate: 'bg-gray-50',
      hover: 'hover:bg-gray-50',
      active: 'bg-indigo-50',
    },
    cell: {
      base: 'whitespace-nowrap text-xs sm:text-sm',
      highlight: 'font-medium text-gray-900',
    },
  },
  
  // Layout utilities
  layout: {
    flex: {
      row: 'flex flex-row',
      col: 'flex flex-col',
      rowReverse: 'flex flex-row-reverse',
      colReverse: 'flex flex-col-reverse',
      center: 'flex items-center justify-center',
      between: 'flex items-center justify-between',
      start: 'flex items-start justify-start',
      end: 'flex items-end justify-end',
      responsive: {
        col: 'flex flex-col sm:flex-row',
        row: 'flex flex-row sm:flex-col',
      },
    },
    grid: {
      cols2: 'grid grid-cols-1 sm:grid-cols-2',
      cols3: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
      cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      gap: 'gap-4',
    },
    position: {
      relative: 'relative',
      absolute: 'absolute',
      absoluteFill: 'absolute inset-0',
      absoluteCenter: 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
      verticalCenter: 'absolute top-1/2 transform -translate-y-1/2',
    },
  },
  
  // Animation classes
  animation: {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    ping: 'animate-ping',
    custom: {
      pingSlow: 'animate-ping-slow',
      bounceSlow: 'animate-bounce-subtle',
      attention: 'animate-attention-pulse',
    },
  },

  // Alert components
  alert: {
    base: 'rounded-lg shadow-sm flex items-center',
    success: 'bg-green-100 text-green-800 border border-green-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    custom: 'rounded-lg shadow-sm flex items-center',
  },

  // Icon styles
  icon: {
    sizes: {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4 sm:w-5 sm:h-5',
      md: 'w-5 h-5 sm:w-6 sm:h-6',
      lg: 'w-6 h-6 sm:w-7 sm:h-7',
    },
    spacings: {
      right: {
        xs: 'mr-1',
        sm: 'mr-1 sm:mr-2',
        md: 'mr-2 sm:mr-3',
      },
      left: {
        xs: 'ml-1',
        sm: 'ml-1 sm:ml-2',
        md: 'ml-2 sm:ml-3',
      },
    },
    colors: {
      indigo: 'text-indigo-600',
      green: 'text-green-600',
      red: 'text-red-600',
      blue: 'text-blue-600',
      yellow: 'text-yellow-600',
      gray: 'text-gray-600',
    },
  },
};

// Utility function to combine classes
export const cx = (...classes: (string | false | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
}; 