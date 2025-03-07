import { Currency } from '../components/retirement/types';

export interface FormattedValue {
  raw: number;
  formatted: string;
  abbreviated: string;
}

export interface CurrencyValue {
  value: number;
  currency: Currency;
}

/**
 * Validates and sanitizes a number input
 * @param value Number to validate
 * @param fallback Fallback value if invalid
 * @returns Validated number
 */
export const validateNumber = (value: number, fallback: number = 0): number => {
  return isNaN(value) || !isFinite(value) ? fallback : value;
};

/**
 * Validates and sanitizes a percentage value
 * @param value Percentage to validate
 * @returns Validated percentage between 0 and 100
 */
export const validatePercentage = (value: number): number => {
  return Math.max(0, Math.min(100, validateNumber(value, 0)));
};

/**
 * Formats a percentage value with specified decimals
 * @param value Value to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  const validValue = validatePercentage(value);
  const multiplier = Math.pow(10, decimals);
  return `${Math.round(validValue * multiplier) / multiplier}%`;
};

/**
 * Formats a currency value with appropriate locale
 * @param value Value to format
 * @param currency Currency code
 * @param showDecimals Whether to show decimal places
 * @returns Formatted currency string
 */
export const formatCurrencyValue = (value: number, currency: Currency, showDecimals: boolean = false): string => {
  const validValue = validateNumber(value);
  const locale = 
    currency === 'EUR' ? 'fr-FR' : 
    currency === 'GBP' ? 'en-GB' :
    currency === 'JPY' ? 'ja-JP' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: showDecimals ? 1 : 0,
    maximumFractionDigits: showDecimals ? 1 : 0
  }).format(validValue);
};

/**
 * Formats a display value with M suffix for millions
 * @param value Value to format
 * @param currency Currency code
 * @returns Formatted string with M suffix for millions
 */
export const formatDisplayValue = (value: number, currency: Currency): string => {
  const validValue = validateNumber(value);
  if (validValue >= 1000000) {
    return formatCurrencyValue(validValue / 1000000, currency, true) + 'M';
  }
  return formatCurrencyValue(validValue, currency, false);
}; 