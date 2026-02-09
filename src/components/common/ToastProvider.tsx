import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cx } from '../../styles/styleGuide';
import { useTheme } from '../../context/ThemeContext';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook to access toast functionality.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

interface ToastProviderProps {
    children: ReactNode;
}

/**
 * Provider component that wraps app and provides toast functionality.
 */
export function ToastProvider({ children }: ToastProviderProps): React.ReactElement {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast: Toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        // Auto-remove toast after duration
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
            {children}
            <ToastContainer toasts={toasts} onClose={hideToast} />
        </ToastContext.Provider>
    );
}

// Toast icons for each type
const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    switch (type) {
        case 'success':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        case 'error':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        case 'warning':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        case 'info':
        default:
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
};

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

/**
 * Container component that renders all active toasts.
 */
function ToastContainer({ toasts, onClose }: ToastContainerProps): React.ReactElement | null {
    const { darkMode } = useTheme();

    if (toasts.length === 0) return null;

    const getToastStyles = (type: ToastType) => {
        const baseStyles = "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 animate-slide-in";

        switch (type) {
            case 'success':
                return cx(baseStyles, darkMode
                    ? "bg-green-900/90 border-green-700 text-green-200"
                    : "bg-green-50 border-green-200 text-green-800"
                );
            case 'error':
                return cx(baseStyles, darkMode
                    ? "bg-red-900/90 border-red-700 text-red-200"
                    : "bg-red-50 border-red-200 text-red-800"
                );
            case 'warning':
                return cx(baseStyles, darkMode
                    ? "bg-yellow-900/90 border-yellow-700 text-yellow-200"
                    : "bg-yellow-50 border-yellow-200 text-yellow-800"
                );
            case 'info':
            default:
                return cx(baseStyles, darkMode
                    ? "bg-blue-900/90 border-blue-700 text-blue-200"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                );
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => (
                <div key={toast.id} className={getToastStyles(toast.type)}>
                    <ToastIcon type={toast.type} />
                    <span className="flex-1 text-sm font-medium">{toast.message}</span>
                    <button
                        onClick={() => onClose(toast.id)}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                        aria-label="Close notification"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

export default ToastProvider;
