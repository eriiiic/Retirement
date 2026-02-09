import React, { useRef, useEffect, useCallback, useState } from 'react';
import { cx } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';

export interface SliderInputProps {
    id: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    variant?: 'default' | 'rate';
    className?: string;
}

/**
 * Reusable slider input component with drag handling and dark mode support.
 * Extracted from ParametersSection for reusability across the app.
 */
export const SliderInput: React.FC<SliderInputProps> = ({
    id,
    value,
    min,
    max,
    step,
    onChange,
    disabled = false,
    variant = 'default',
    className = '',
}) => {
    const { darkMode } = useTheme();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const sliderRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Calculate current progress percentage
    const progressPercent = ((value - min) / (max - min)) * 100;

    // Update slider value from position
    const updateValueFromPosition = useCallback((clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        let newValue = min + percent * (max - min);
        newValue = Math.round(newValue / step) * step;
        newValue = Math.max(min, Math.min(max, newValue));

        // Round to one decimal for rate variants
        if (variant === 'rate') {
            newValue = Math.round(newValue * 10) / 10;
        }

        onChange(newValue);
    }, [min, max, step, variant, onChange]);

    // Mouse/touch drag handlers
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            updateValueFromPosition(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            updateValueFromPosition(e.touches[0].clientX);
        };

        const handleEnd = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleEnd);
            document.removeEventListener('touchcancel', handleEnd);
        };
    }, [isDragging, updateValueFromPosition]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (disabled) return;
        setIsDragging(true);
        updateValueFromPosition(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled) return;
        setIsDragging(true);
        updateValueFromPosition(e.touches[0].clientX);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        let newValue = parseFloat(e.target.value);
        if (variant === 'rate') {
            newValue = Math.round(newValue * 10) / 10;
        }
        onChange(newValue);
    };

    // Style classes based on variant and state
    const trackBgClass = disabled
        ? darkMode ? 'bg-gray-700' : 'bg-gray-300'
        : darkMode ? 'bg-gray-700' : 'bg-gray-200';

    const fillClass = disabled
        ? darkMode ? 'bg-gray-600' : 'bg-gray-400'
        : variant === 'rate'
            ? darkMode
                ? 'bg-gradient-to-r from-green-700 to-green-700/70'
                : 'bg-gradient-to-r from-green-500 to-green-500/70'
            : darkMode
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500';

    const thumbBorderClass = disabled
        ? darkMode ? 'border-gray-600' : 'border-gray-400'
        : variant === 'rate'
            ? darkMode ? 'border-green-400' : 'border-green-500'
            : darkMode ? 'border-indigo-400' : 'border-indigo-500';

    const thumbBgClass = darkMode
        ? variant === 'rate' ? 'bg-gray-200 border-green-500' : 'bg-gray-200 border-gray-300'
        : variant === 'rate' ? 'bg-white border-green-500' : 'bg-white border';

    return (
        <div
            ref={containerRef}
            className={cx(
                "relative w-full",
                disabled ? 'pointer-events-none' : '',
                className
            )}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Track background */}
            <div
                className={cx(
                    "absolute inset-0 w-full h-2 rounded-lg cursor-pointer",
                    trackBgClass
                )}
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />

            {/* Filled portion */}
            <div
                className={cx("absolute h-2 rounded-lg", fillClass)}
                style={{
                    width: `${progressPercent}%`,
                    top: '50%',
                    transform: 'translateY(-50%)'
                }}
            />

            {/* Hidden native slider for accessibility */}
            <input
                ref={sliderRef}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={handleSliderChange}
                className={cx(
                    "w-full h-2 appearance-none bg-transparent absolute z-10 cursor-pointer opacity-0",
                    disabled ? 'cursor-not-allowed' : ''
                )}
                style={{ top: '50%', transform: 'translateY(-50%)' }}
                aria-label={id}
            />

            {/* Thumb */}
            <div
                className={cx(
                    "absolute w-4 h-4 rounded-full shadow transition-all",
                    thumbBgClass,
                    thumbBorderClass,
                    isDragging ? 'w-5 h-5 scale-110 shadow-md' : ''
                )}
                style={{
                    left: `${progressPercent}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    borderWidth: isDragging ? '2px' : '1px'
                }}
            />
        </div>
    );
};

export default SliderInput;
