import React, { useState, useCallback } from 'react';
import { cx } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';

export interface PDFExportButtonProps<TParams, TStats> {
    onGeneratePDF: () => Promise<void>;
    disabled?: boolean;
    className?: string;
}

/**
 * Reusable PDF export button with loading state and success indicator.
 * Extracted from ParametersSection for reusability.
 */
export function PDFExportButton<TParams, TStats>({
    onGeneratePDF,
    disabled = false,
    className = '',
}: PDFExportButtonProps<TParams, TStats>): React.ReactElement {
    const { darkMode } = useTheme();
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleClick = useCallback(async () => {
        if (isGenerating || disabled) return;

        setIsGenerating(true);
        setShowSuccess(false);

        try {
            await onGeneratePDF();
            setShowSuccess(true);

            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Could emit an error event or use a toast notification here
        } finally {
            setIsGenerating(false);
        }
    }, [onGeneratePDF, isGenerating, disabled]);

    const buttonDisabled = isGenerating || disabled;

    return (
        <div className={cx("relative", className)}>
            <button
                onClick={handleClick}
                disabled={buttonDisabled}
                className={cx(
                    "px-4 py-1.5 text-xs font-medium rounded-lg flex items-center shadow-sm transition-colors duration-200",
                    buttonDisabled
                        ? (darkMode ? 'bg-gray-600' : 'bg-gray-400')
                        : (darkMode
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white')
                )}
                aria-label="Generate PDF Report"
            >
                {isGenerating ? (
                    <>
                        <svg
                            className="animate-spin h-3 w-3 mr-1 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12" cy="12" r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span className="whitespace-nowrap">Generating...</span>
                    </>
                ) : (
                    <>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <span className="whitespace-nowrap">PDF Report</span>
                    </>
                )}
            </button>

            {/* Success message */}
            {showSuccess && (
                <div className={cx(
                    "absolute right-0 top-full mt-2 px-3 py-1 text-xs rounded-md shadow-sm z-10",
                    darkMode
                        ? "bg-green-900/50 text-green-300 border border-green-800"
                        : "bg-green-100 text-green-800"
                )}>
                    PDF generated successfully!
                </div>
            )}
        </div>
    );
}

export default PDFExportButton;
