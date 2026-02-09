import React, { useRef, useCallback } from 'react';
import { cx } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';

export interface MonetaryInputProps {
    id: string;
    value: string;
    currencySymbol: string;
    placeholder?: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    onBlur?: (value: string) => void;
    onFocus?: () => void;
    formatValue?: (value: string) => string;
    parseValue?: (value: string) => string;
    label?: string;
    className?: string;
}

/**
 * Reusable monetary input component with currency symbol and formatting.
 * Extracted from ParametersSection for reusability.
 */
export const MonetaryInput: React.FC<MonetaryInputProps> = ({
    id,
    value,
    currencySymbol,
    placeholder = '0',
    disabled = false,
    onChange,
    onBlur,
    onFocus,
    formatValue,
    parseValue,
    label,
    className = '',
}) => {
    const { darkMode } = useTheme();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const displayValue = formatValue ? formatValue(value) : value;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        // Remove currency symbol and any formatting
        const cleanedValue = parseValue
            ? parseValue(rawValue)
            : rawValue.replace(/[^0-9.-]/g, '');
        onChange(cleanedValue);
    }, [onChange, parseValue]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        if (onBlur) {
            const rawValue = e.target.value;
            const cleanedValue = parseValue
                ? parseValue(rawValue)
                : rawValue.replace(/[^0-9.-]/g, '');
            onBlur(cleanedValue);
        }
    }, [onBlur, parseValue]);

    return (
        <div className={cx("relative w-full", className)}>
            {label && (
                <label
                    htmlFor={id}
                    className={cx(
                        "block text-sm font-medium mb-1",
                        darkMode ? "text-gray-300" : "text-gray-700"
                    )}
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {/* Currency symbol positioned on the left */}
                <span className={cx(
                    "absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-sm",
                    darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                    {currencySymbol}
                </span>
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    inputMode="decimal"
                    value={value === '0' ? '' : displayValue}
                    disabled={disabled}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={onFocus}
                    placeholder={placeholder}
                    className={cx(
                        "w-full pl-7 pr-3 py-2 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                        darkMode
                            ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
                        disabled ? (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400') : ''
                    )}
                    aria-label={label || `${id} input`}
                />
            </div>
        </div>
    );
};

export default MonetaryInput;
