import React from 'react';
import { cx, typography, spacing } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';
import SliderInput, { SliderInputProps } from './SliderInput';

export interface ParameterInputGroupProps {
    id: string;
    label: string;
    value: string | number;
    numericValue: number;
    placeholder?: string;
    suffix?: string;
    disabled?: boolean;
    showSlider?: boolean;
    sliderConfig?: {
        min: number;
        max: number;
        step: number;
        variant?: 'default' | 'rate';
    };
    onInputChange: (value: string) => void;
    onInputBlur?: (value: string) => void;
    onInputFocus?: () => void;
    onSliderChange: (value: number) => void;
    inputRef?: React.RefCallback<HTMLInputElement>;
    className?: string;
}

/**
 * Combined parameter input group with optional slider and text input.
 * Provides a consistent UI pattern for parameter inputs across the app.
 */
export const ParameterInputGroup: React.FC<ParameterInputGroupProps> = ({
    id,
    label,
    value,
    numericValue,
    placeholder = '0',
    suffix,
    disabled = false,
    showSlider = false,
    sliderConfig,
    onInputChange,
    onInputBlur,
    onInputFocus,
    onSliderChange,
    inputRef,
    className = '',
}) => {
    const { darkMode } = useTheme();

    const displayValue = value === '0' || value === 0 ? '' : String(value);

    return (
        <div className={cx("flex flex-col gap-1", className)}>
            <label htmlFor={id} className={cx(typography.style.label, "flex justify-between")}>
                <span>{label}</span>
            </label>

            <div className={cx("flex items-center", spacing.gap.sm)}>
                {/* Slider section */}
                {showSlider && sliderConfig && (
                    <div className="w-full sm:w-2/3 md:w-2/3">
                        <SliderInput
                            id={`${id}-slider`}
                            value={numericValue}
                            min={sliderConfig.min}
                            max={sliderConfig.max}
                            step={sliderConfig.step}
                            onChange={onSliderChange}
                            disabled={disabled}
                            variant={sliderConfig.variant}
                        />
                    </div>
                )}

                {/* Input field section */}
                <div className={cx(
                    "relative flex items-center justify-end",
                    showSlider ? "w-full sm:w-1/3" : "w-full"
                )}>
                    <div className="w-full sm:w-2/3 flex items-center">
                        <input
                            ref={inputRef}
                            id={id}
                            type="text"
                            inputMode="numeric"
                            value={displayValue}
                            disabled={disabled}
                            onChange={(e) => onInputChange(e.target.value)}
                            onBlur={(e) => onInputBlur?.(e.target.value)}
                            onFocus={onInputFocus}
                            placeholder={placeholder}
                            className={cx(
                                "w-full px-3 py-2 rounded-md shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                                darkMode
                                    ? "bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500"
                                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
                                disabled ? (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400') : ''
                            )}
                            aria-label={`${label} input`}
                        />
                        {suffix && (
                            <span className={cx(
                                "ml-1 text-xs whitespace-nowrap",
                                darkMode ? "text-gray-400" : "text-gray-600"
                            )}>
                                {suffix}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParameterInputGroup;
