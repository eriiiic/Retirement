import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that syncs state with localStorage.
 * Provides persistence across page reloads and browser sessions.
 * 
 * @param key - The localStorage key to use
 * @param initialValue - Default value if nothing is stored
 * @returns [value, setValue, clearValue] - State and handlers
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    // Get initial value from localStorage or use provided default
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const parsed = JSON.parse(item);
                // Merge with initial value to handle new properties added to schema
                if (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue)) {
                    return { ...initialValue, ...parsed };
                }
                return parsed;
            }
            return initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage when value changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.warn(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Wrapper to update value
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue(prev => {
            const newValue = value instanceof Function ? value(prev) : value;
            return newValue;
        });
    }, []);

    // Clear stored value and reset to initial
    const clearValue = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error clearing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, clearValue];
}

export default useLocalStorage;
