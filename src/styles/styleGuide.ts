// Style Guide for Retraite Application
// This file contains standardized styles to be used across components

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
    },
    retirement: {
      bg: 'bg-gradient-to-r from-purple-500 to-pink-600',
      text: 'text-purple-600',
      border: 'border-purple-400',
      hover: 'hover:bg-purple-50',
      light: 'bg-purple-100',
      dark: 'text-purple-800',
    },
    depleted: {
      bg: 'bg-gradient-to-r from-red-500 to-pink-600',
      text: 'text-red-600',
      border: 'border-red-400',
      hover: 'hover:bg-red-50',
      light: 'bg-red-100',
      dark: 'text-red-800',
    },
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
  },
};

// Spacing
export const spacing = {
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
  }
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
  },
  
  // Buttons
  button: {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded shadow-sm',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 shadow-sm',
    tab: {
      active: 'bg-indigo-600 text-white',
      inactive: 'bg-white text-gray-700 hover:bg-gray-50',
    },
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
  },
};

// Utility function to combine classes
export const cx = (...classes: (string | false | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
}; 