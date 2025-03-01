import { useState, useEffect, useRef } from 'react';
import { SimulatorParams, Statistics, FormatAmountFunction } from './types';

interface ParametersSectionProps {
  params: SimulatorParams;
  statistics: Statistics;
  formatAmount: FormatAmountFunction;
  onParamChange: (key: keyof SimulatorParams, value: any) => void;
}

export const ParametersSection: React.FC<ParametersSectionProps> = ({
  params,
  statistics,
  formatAmount,
  onParamChange,
}) => {
  const [inputValues, setInputValues] = useState({
    initialCapital: params.initialCapital.toString(),
    monthlyInvestment: params.monthlyInvestment.toString(),
    currentAge: params.currentAge.toString(),
    retirementInput: String(params.retirementInput),
    monthlyRetirementWithdrawal: params.monthlyRetirementWithdrawal.toString(),
    maxAge: params.maxAge.toString(),
    annualReturnRate: params.annualReturnRate.toString(),
    inflation: params.inflation.toString(),
    withdrawalRate: params.withdrawalRate?.toString() || "4",
  });
  
  // Track the focused input field
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // References to input elements for maintaining focus
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // References to slider elements for drag handling
  const sliderRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // State to track current slider being dragged
  const [draggingSlider, setDraggingSlider] = useState<string | null>(null);
  
  // State to track slider container dimensions for calculations
  const sliderContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Update local input values when params change, but only if the field is not currently focused
  useEffect(() => {
    setInputValues(prev => {
      const newValues = { ...prev };
      
      Object.keys(params).forEach(key => {
        const paramKey = key as keyof SimulatorParams;
        const inputKey = paramKey as keyof typeof prev;
        
        // Only update fields that are not currently being edited
        if (key !== focusedField) {
          if (typeof newValues[inputKey] !== 'undefined') {
            if (paramKey === 'initialCapital' || paramKey === 'monthlyInvestment' || 
                paramKey === 'monthlyRetirementWithdrawal') {
              // For monetary values, format appropriately
              newValues[inputKey] = params[paramKey].toString();
            } else {
              // For other values, just convert to string
              newValues[inputKey] = String(params[paramKey]);
            }
          }
        }
      });
      
      return newValues;
    });
  }, [params, focusedField]);

  // Set up global mouse move and mouse up event listeners for drag handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingSlider && sliderRefs.current[draggingSlider] && sliderContainerRefs.current[draggingSlider]) {
        const id = draggingSlider as keyof SimulatorParams;
        // Get slider element and its properties
        const slider = sliderRefs.current[draggingSlider] as HTMLInputElement;
        const container = sliderContainerRefs.current[draggingSlider] as HTMLDivElement;
        
        const rect = container.getBoundingClientRect();
        
        // Calculate position as percentage of container width
        let percent = (e.clientX - rect.left) / rect.width;
        // Clamp between 0 and 1
        percent = Math.max(0, Math.min(1, percent));
        
        // Get min/max/step values from slider
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step) || 1;
        
        // Calculate new value based on percentage and step
        let newValue = min + percent * (max - min);
        // Round to nearest step
        newValue = Math.round(newValue / step) * step;
        // Ensure value is within bounds
        newValue = Math.max(min, Math.min(max, newValue));
        
        // Update UI and state
        slider.value = newValue.toString();
        
        // Update state with the new value
        onParamChange(id, newValue);
        
        // Check if this is a monetary value
        const isMonetary = id === 'initialCapital' || id === 'monthlyInvestment' || id === 'monthlyRetirementWithdrawal';
        
        setInputValues(prev => ({ ...prev, [id]: newValue.toString() }));
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (draggingSlider && sliderRefs.current[draggingSlider] && sliderContainerRefs.current[draggingSlider]) {
        const id = draggingSlider as keyof SimulatorParams;
        // Prevent scrolling while dragging
        e.preventDefault();
        
        // Get the touch position
        const touch = e.touches[0];
        
        // Get slider element and its properties
        const slider = sliderRefs.current[draggingSlider] as HTMLInputElement;
        const container = sliderContainerRefs.current[draggingSlider] as HTMLDivElement;
        
        const rect = container.getBoundingClientRect();
        
        // Calculate position as percentage of container width
        let percent = (touch.clientX - rect.left) / rect.width;
        // Clamp between 0 and 1
        percent = Math.max(0, Math.min(1, percent));
        
        // Get min/max/step values from slider
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step) || 1;
        
        // Calculate new value based on percentage and step
        let newValue = min + percent * (max - min);
        // Round to nearest step
        newValue = Math.round(newValue / step) * step;
        // Ensure value is within bounds
        newValue = Math.max(min, Math.min(max, newValue));
        
        // Update UI and state
        slider.value = newValue.toString();
        
        // Update state with the new value
        onParamChange(id, newValue);
        
        // Check if this is a monetary value
        const isMonetary = id === 'initialCapital' || id === 'monthlyInvestment' || id === 'monthlyRetirementWithdrawal';
        
        setInputValues(prev => ({ ...prev, [id]: newValue.toString() }));
      }
    };
    
    const handleMouseUp = () => {
      setDraggingSlider(null);
    };
    
    const handleTouchEnd = () => {
      setDraggingSlider(null);
    };
    
    if (draggingSlider) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [draggingSlider, onParamChange]);

  // Maintain focus after state updates
  useEffect(() => {
    if (focusedField && inputRefs.current[focusedField]) {
      inputRefs.current[focusedField]?.focus();
    }
  }, [inputValues, focusedField]);

  // Set default values for new users or initial load
  useEffect(() => {
    // Check if this is the initial load (all values are at defaults)
    const isInitialLoad = params.initialCapital === 0 &&
                          params.currentAge === 0 &&
                          params.monthlyInvestment === 0 &&
                          String(params.retirementInput) === '0' &&
                          params.maxAge === 0;

    // If it's the initial load, set all default values
    if (isInitialLoad) {
      // Set all default values at once
      onParamChange('initialCapital', 150000);
      onParamChange('currentAge', 46);
      onParamChange('monthlyInvestment', 500);
      onParamChange('retirementInput', 60);
      onParamChange('maxAge', 95);
      onParamChange('annualReturnRate', 7);
      onParamChange('inflation', 2);
      onParamChange('compoundFrequency', 'monthly'); // Default to monthly compounding
    } else {
      // Set individual values only if they are at the default "0" value
      if (params.initialCapital === 0) {
        onParamChange('initialCapital', 150000);
      }
      if (params.currentAge === 0) {
        onParamChange('currentAge', 46);
      }
      if (params.monthlyInvestment === 0) {
        onParamChange('monthlyInvestment', 500);
      }
      if (String(params.retirementInput) === '0') {
        onParamChange('retirementInput', 60);
      }
      if (params.maxAge === 0) {
        onParamChange('maxAge', 95);
      }
      if (params.annualReturnRate === 0) {
        onParamChange('annualReturnRate', 7);
      }
      if (params.inflation === 0) {
        onParamChange('inflation', 2);
      }
      if (!params.compoundFrequency) {
        onParamChange('compoundFrequency', 'monthly'); // Set default if not defined
      }
    }
  }, []);

  // Add thousand separators to a number
  const addThousandSeparators = (value: string) => {
    if (!value) return '';
    // Remove any existing commas or spaces first
    const cleanValue = value.replace(/[,\s]/g, '');
    // Use locale string to add thousand separators
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return cleanValue;
    return num.toLocaleString('en-US');
  };

  // Remove thousand separators for processing
  const removeThousandSeparators = (value: string) => {
    if (!value) return '';
    return value.replace(/[,\s]/g, '');
  };

  const handleInputChange = (key: keyof SimulatorParams, value: string) => {
    // Set the focused field to maintain focus
    setFocusedField(key as string);
    
    // Common validation and state update logic
    const updateInput = (validatedValue: string) => {
      setInputValues(prev => ({ ...prev, [key]: validatedValue }));
      
      if (validatedValue !== '') {
        const numericValue = parseFloat(validatedValue);
        if (!isNaN(numericValue)) {
          onParamChange(key, numericValue);
        }
      }
    };
    
    // For monetary inputs, only allow numbers, commas, dots, and spaces
    if (key === 'initialCapital' || key === 'monthlyInvestment' || key === 'monthlyRetirementWithdrawal') {
      // Remove non-numeric characters except commas, dots, and spaces
      const validatedValue = value.replace(/[^\d.,\s]/g, '');
      // Store the raw value without separators
      const cleanValue = removeThousandSeparators(validatedValue);
      updateInput(cleanValue);
    } 
    // For percentage inputs, only allow numbers and dots
    else if (key === 'annualReturnRate' || key === 'inflation' || key === 'withdrawalRate') {
      // Remove non-numeric characters except dots
      const validatedValue = value.replace(/[^\d.]/g, '');
      // Ensure at most one decimal point
      const parts = validatedValue.split('.');
      const formattedValue = parts.length > 1 
        ? `${parts[0]}.${parts.slice(1).join('')}` 
        : validatedValue;
      updateInput(formattedValue);
    }
    // For age inputs, only allow numbers
    else if (key === 'currentAge' || key === 'maxAge' || key === 'retirementInput') {
      // Remove non-numeric characters
      const validatedValue = value.replace(/\D/g, '');
      updateInput(validatedValue);
    }
    else {
      setInputValues(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleInputBlur = (key: keyof SimulatorParams, value: string) => {
    // Clear the focused field when input loses focus
    setFocusedField(null);
    
    // Remove thousand separators before parsing
    const cleanValue = removeThousandSeparators(value);
    let parsedValue: number;
    
    // Define min/max constraints based on parameter type
    const constraints = {
      currentAge: { min: 20, max: 80, default: 40 },
      maxAge: { min: 80, max: 105, default: 95 },
      retirementInput: { min: 50, max: 80, default: 60 },
      annualReturnRate: { min: 0, max: 30, default: 7 },
      inflation: { min: 0, max: 15, default: 2 },
      withdrawalRate: { min: 0.5, max: 20, default: 4 }
    };
    
    // Handle special cases based on parameter type
    if (key in constraints) {
      const constraint = constraints[key as keyof typeof constraints];
      parsedValue = key === 'retirementInput' 
        ? parseInt(cleanValue) || constraint.default
        : parseFloat(cleanValue) || constraint.default;
      
      // Apply bounds
      parsedValue = Math.max(constraint.min, Math.min(constraint.max, parsedValue));
      
      // Round to one decimal place for percentage values
      if (key === 'annualReturnRate' || key === 'inflation' || key === 'withdrawalRate') {
        parsedValue = Math.round(parsedValue * 10) / 10;
      }
    }
    else {
      parsedValue = parseFloat(cleanValue) || 0;
      // Apply minimum of 0 to all monetary values
      parsedValue = Math.max(0, parsedValue);
    }
    
    onParamChange(key, parsedValue);
    
    // Update the input value to reflect the validated value
    setInputValues(prev => ({ ...prev, [key]: parsedValue.toString() }));
  };

  const handleInputFocus = (key: string) => {
    setFocusedField(key);
  };

  const handleCurrencyChange = (currency: string) => {
    onParamChange('currency', currency);
  };

  // Format number for display in input fields
  const formatNumberInput = (value: string, addSeparators = true) => {
    if (value === '') return '';
    if (value === '0') return '0';
    
    // First clean and parse the value
    const cleanValue = removeThousandSeparators(value);
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return '';
    
    // Add thousand separators if requested
    if (addSeparators) {
      return addThousandSeparators(num.toString());
    }
    
    // Otherwise just return the number
    return num.toString();
  };

  // Get displayed value for monetary inputs (with thousand separators)
  const getDisplayValue = (key: keyof SimulatorParams, value: string) => {
    if (value === '0') return '';
    
    if (key === 'initialCapital' || key === 'monthlyInvestment' || key === 'monthlyRetirementWithdrawal') {
      return formatNumberInput(value, true);
    }
    
    return value;
  };

  // Helper to determine if retirement input is an age or a year
  const isRetirementInputAnAge = (): boolean => {
    const input = Number(params.retirementInput);
    return (input > 0 && input < 120 && params.retirementInput.length <= 2) || 
           !(params.retirementInput.length === 4 && params.retirementInput.startsWith('20'));
  };

  // Get slider min/max/step values based on parameter type
  const getSliderConfig = (id: keyof SimulatorParams) => {
    switch (id) {
      case 'initialCapital':
        // For very large values, adjust max based on current value
        const initialCapitalMax = Math.max(1000000, params.initialCapital * 2);
        return { min: 0, max: initialCapitalMax, step: 1000 };
      case 'currentAge':
        return { min: 20, max: 80, step: 1 };
      case 'monthlyInvestment':
        // For very large values, adjust max based on current value
        const monthlyInvestmentMax = Math.max(10000, params.monthlyInvestment * 2);
        return { min: 0, max: monthlyInvestmentMax, step: 100 };
      case 'retirementInput':
        return { 
          min: params.currentAge + 1, 
          max: isRetirementInputAnAge() ? 100 : new Date().getFullYear() + 50, 
          step: 1 
        };
      case 'monthlyRetirementWithdrawal':
        // For very large values, adjust max based on current value
        const monthlyWithdrawalMax = Math.max(20000, params.monthlyRetirementWithdrawal * 2);
        return { min: 0, max: monthlyWithdrawalMax, step: 100 };
      case 'annualReturnRate':
        return { min: 0, max: 20, step: 0.1 };
      case 'inflation':
        return { min: 0, max: 10, step: 0.1 };
      case 'withdrawalRate':
        return { min: 0.5, max: 20, step: 0.1 };
      case 'maxAge':
        return { min: 80, max: 105, step: 1 };
      default:
        return { min: 0, max: 100, step: 1 };
    }
  };

  // Handle slider mousedown for enhanced drag behavior
  const handleSliderMouseDown = (id: keyof SimulatorParams, e: React.MouseEvent) => {
    setDraggingSlider(id as string);
    
    // Immediately update slider position based on initial click
    if (sliderContainerRefs.current[id as string]) {
      const container = sliderContainerRefs.current[id as string] as HTMLDivElement;
      const rect = container.getBoundingClientRect();
      
      // Calculate position as percentage of container width
      let percent = (e.clientX - rect.left) / rect.width;
      // Clamp between 0 and 1
      percent = Math.max(0, Math.min(1, percent));
      
      // Get min/max/step values
      const slider = sliderRefs.current[id as string];
      if (slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step) || 1;
        
        // Calculate new value based on percentage and step
        let newValue = min + percent * (max - min);
        // Round to nearest step
        newValue = Math.round(newValue / step) * step;
        // Ensure value is within bounds
        newValue = Math.max(min, Math.min(max, newValue));
        
        // Update UI and state
        slider.value = newValue.toString();
        
        // Update state with the new value - handle values consistently
        onParamChange(id, newValue);
        setInputValues(prev => ({ ...prev, [id]: newValue.toString() }));
      }
    }
  };

  // Handle touch start for mobile devices
  const handleSliderTouchStart = (id: keyof SimulatorParams, e: React.TouchEvent) => {
    setDraggingSlider(id as string);
    
    // Immediately update slider position based on initial touch
    if (sliderContainerRefs.current[id as string]) {
      const touch = e.touches[0];
      const container = sliderContainerRefs.current[id as string] as HTMLDivElement;
      const rect = container.getBoundingClientRect();
      
      // Calculate position as percentage of container width
      let percent = (touch.clientX - rect.left) / rect.width;
      // Clamp between 0 and 1
      percent = Math.max(0, Math.min(1, percent));
      
      // Get min/max/step values
      const slider = sliderRefs.current[id as string];
      if (slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step) || 1;
        
        // Calculate new value based on percentage and step
        let newValue = min + percent * (max - min);
        // Round to nearest step
        newValue = Math.round(newValue / step) * step;
        // Ensure value is within bounds
        newValue = Math.max(min, Math.min(max, newValue));
        
        // Update UI and state
        slider.value = newValue.toString();
        
        // Update state with the new value
        onParamChange(id, newValue);
        setInputValues(prev => ({ ...prev, [id]: newValue.toString() }));
      }
    }
  };

  // Render a parameter input field with slider for specified parameters
  const renderParameterInput = (
    label: string,
    id: keyof SimulatorParams,
    value: string,
    placeholder: string,
    currency?: boolean,
    percentage?: boolean,
    suffix?: string,
    includeSlider: boolean = false
  ) => {
    // Parse value to number for slider - ensure we have a clean number
    let numericValue: number;
    
    // Special handling for monetary values with thousand separators
    if (currency && (id === 'initialCapital' || id === 'monthlyInvestment' || id === 'monthlyRetirementWithdrawal')) {
      // Use the actual param value directly rather than the formatted input value
      numericValue = params[id] as number;
    } else {
      numericValue = parseFloat(value) || 0;
    }
    
    // Get slider configuration
    const { min, max, step } = getSliderConfig(id);
    
    return (
      <div className="flex flex-col gap-1 p-2">
        <label htmlFor={id} className="text-xs font-medium text-gray-600 flex justify-between">
          <span>{label}</span>
          <span className="font-semibold text-gray-800">
            {currency ? formatAmount(parseFloat(value) || 0) : (value || '0')}{percentage ? '%' : ''}{suffix ? ` ${suffix}` : ''}
          </span>
        </label>
        
        <div className="flex items-center gap-2">
          {includeSlider && (
            <div 
              ref={el => sliderContainerRefs.current[id as string] = el}
              className="w-2/3 relative" 
              onMouseDown={(e) => handleSliderMouseDown(id, e)}
              onTouchStart={(e) => handleSliderTouchStart(id, e)}
            >
              <div 
                className="absolute inset-0 w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              ></div>
              <div 
                className="absolute h-2 bg-indigo-500 rounded-lg"
                style={{ 
                  width: `${((numericValue - min) / (max - min)) * 100}%`,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              ></div>
              <input
                ref={el => sliderRefs.current[id as string] = el}
                type="range"
                min={min}
                max={max}
                step={step}
                value={numericValue}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const numericNewValue = parseFloat(newValue);
                  onParamChange(id, numericNewValue);
                  
                  // For monetary values, ensure we're updating with the correct value format
                  if (currency && (id === 'initialCapital' || id === 'monthlyInvestment' || id === 'monthlyRetirementWithdrawal')) {
                    setInputValues(prev => ({ ...prev, [id]: numericNewValue.toString() }));
                  } else {
                    setInputValues(prev => ({ ...prev, [id]: newValue }));
                  }
                }}
                className="w-full h-2 appearance-none bg-transparent absolute z-10 cursor-pointer opacity-0"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
              <div 
                className={`absolute w-4 h-4 bg-white border border-indigo-500 rounded-full shadow transition-all ${draggingSlider === id ? 'w-5 h-5 border-indigo-600 scale-110' : ''}`}
                style={{ 
                  left: `${((numericValue - min) / (max - min)) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              ></div>
            </div>
          )}
          
          <div className={`relative ${includeSlider ? 'w-1/3' : 'w-full'}`}>
            <input
              ref={el => inputRefs.current[id as string] = el}
              id={id as string}
              type="text"
              inputMode={percentage || currency ? "decimal" : "numeric"}
              value={currency 
                ? `${params.currency === 'USD' ? '$' : '€'} ${value === '0' ? '' : value}` 
                : percentage
                  ? `${value === '0' ? '' : value}`
                  : (value === '0' ? '' : value)}
              onChange={(e) => {
                if (currency) {
                  // Remove currency symbol before handling change
                  const valueWithoutCurrency = e.target.value.replace(/^[\$€]\s?/, '');
                  handleInputChange(id, valueWithoutCurrency);
                } else if (percentage) {
                  // Remove percentage symbol before handling change
                  const valueWithoutPercentage = e.target.value.replace(/%$/, '');
                  handleInputChange(id, valueWithoutPercentage);
                } else {
                  handleInputChange(id, e.target.value);
                }
              }}
              onBlur={(e) => {
                if (currency) {
                  // Remove currency symbol before handling blur
                  const valueWithoutCurrency = e.target.value.replace(/^[\$€]\s?/, '');
                  handleInputBlur(id, valueWithoutCurrency);
                } else if (percentage) {
                  // Remove percentage symbol before handling blur
                  const valueWithoutPercentage = e.target.value.replace(/%$/, '');
                  handleInputBlur(id, valueWithoutPercentage);
                } else {
                  handleInputBlur(id, e.target.value);
                }
              }}
              onFocus={() => handleInputFocus(id as string)}
              placeholder={currency 
                ? `${params.currency === 'USD' ? '$' : '€'} ${placeholder}` 
                : percentage ? placeholder : placeholder}
              className={`w-full rounded-lg border border-gray-300 py-1.5 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-sm ${percentage ? 'text-right pr-6' : 'text-left'}`}
              aria-label={`${label} input`}
            />
            {percentage && (
              <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 pointer-events-none">
                %
              </span>
            )}
            {suffix && !percentage && (
              <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 pointer-events-none text-xs">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-4">
      {/* Header with Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gradient">Define Your Plan</h2>
          <p className="text-xs text-gray-600">Tailor your personal path to financial freedom</p>
        </div>
          
        {/* Currency selector as toggle button - moved to title bar */}
        <div className="flex items-center mt-2 sm:mt-0">
          <div className="text-xs text-gray-600 mr-2">Currency:</div>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button 
              className={`px-3 py-1 text-xs font-medium transition-all ${
                params.currency === 'USD'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleCurrencyChange('USD')}
              aria-label="Switch to US Dollar"
            >
              USD ($)
            </button>
            <button 
              className={`px-3 py-1 text-xs font-medium transition-all ${
                params.currency === 'EUR'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleCurrencyChange('EUR')}
              aria-label="Switch to Euro"
            >
              EUR (€)
            </button>
          </div>
          <span className="text-[10px] text-gray-500 ml-2 hidden sm:inline">Display only</span>
        </div>
      </div>

      {/* Combined Parameters Section - All inputs on same page */}
      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Current Status Section */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2 overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-2 mb-1 py-1 bg-gray-50 rounded-t-lg">Current Status</h3>
            
            {renderParameterInput(
              "Initial Capital", 
              "initialCapital", 
              getDisplayValue('initialCapital', inputValues.initialCapital), 
              "150,000", 
              true,
              false,
              undefined,
              true // Include slider
            )}
            
            {renderParameterInput(
              "Current Age", 
              "currentAge", 
              inputValues.currentAge, 
              "46", 
              false, 
              false, 
              "years",
              true // Include slider
            )}
            
            {renderParameterInput(
              "Monthly Investment", 
              "monthlyInvestment", 
              getDisplayValue('monthlyInvestment', inputValues.monthlyInvestment), 
              "500", 
              true,
              false,
              undefined,
              true // Include slider
            )}
          </div>

          {/* Retirement Plan Section */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2 overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-2 mb-1 py-1 bg-gray-50 rounded-t-lg">Retirement Plan</h3>

            {renderParameterInput(
              "Retirement Age/Year", 
              "retirementInput", 
              inputValues.retirementInput, 
              "65", 
              false, 
              false, 
              isRetirementInputAnAge() ? "years old" : "year",
              true // Include slider
            )}

            {/* Withdrawal Strategy */}
            <div className="mb-3 mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-medium text-gray-800">Withdrawal Strategy</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {params.withdrawalMode === 'amount'
                      ? "Specify how much you want to withdraw each month"
                      : params.withdrawalMode === 'age'
                        ? "Set a target age and we'll calculate a sustainable withdrawal"
                        : "Define a withdrawal rate as percentage of your capital"}
                  </p>
                </div>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <button 
                    className={`px-3 py-1 text-xs font-medium transition-all ${
                      params.withdrawalMode === 'amount'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => onParamChange('withdrawalMode', 'amount')}
                  >
                    Amount
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs font-medium transition-all ${
                      params.withdrawalMode === 'age'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => onParamChange('withdrawalMode', 'age')}
                  >
                    Age
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs font-medium transition-all ${
                      params.withdrawalMode === 'rate'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => onParamChange('withdrawalMode', 'rate')}
                  >
                    Rate
                  </button>
                </div>
              </div>
            </div>

            {params.withdrawalMode === 'age' ? (
              renderParameterInput(
                "Target Age", 
                "maxAge", 
                inputValues.maxAge, 
                "95", 
                false, 
                false, 
                "years",
                false
              )
            ) : params.withdrawalMode === 'amount' ? (
              renderParameterInput(
                "Monthly Withdrawal", 
                "monthlyRetirementWithdrawal", 
                getDisplayValue('monthlyRetirementWithdrawal', inputValues.monthlyRetirementWithdrawal), 
                "0", 
                true,
                false,
                undefined,
                true // Include slider
              )
            ) : (
              renderParameterInput(
                "Withdrawal Rate", 
                "withdrawalRate", 
                inputValues.withdrawalRate, 
                "4", 
                false, 
                true,
                undefined,
                false
              )
            )}
          </div>
        </div>
        
        {/* Market Assumptions Section - Moved from retirement tab */}
        <div className="mt-3 bg-white rounded-lg border border-gray-100 shadow-sm p-2 overflow-hidden">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider px-2 mb-2 py-1 bg-gray-50 rounded-t-lg">Market Assumptions</h3>
          <p className="text-xs text-gray-600 italic px-2 mb-3">
            These settings affect how your investments grow over time and how inflation impacts your withdrawal purchasing power.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Annual Return Rate */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Annual Return</h4>
              {renderParameterInput(
                "Expected return on investments", 
                "annualReturnRate", 
                inputValues.annualReturnRate, 
                "5", 
                false, 
                true,
                undefined,
                true // Include slider
              )}
            </div>
            
            {/* Inflation Rate */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Inflation</h4>
              {renderParameterInput(
                "Annual inflation rate", 
                "inflation", 
                inputValues.inflation, 
                "2", 
                false, 
                true,
                undefined,
                true // Include slider
              )}
            </div>
            
            {/* Compound Frequency */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Compound Frequency</h4>
              <div className="p-2">
                <p className="text-xs text-gray-600 mb-2">
                  {params.compoundFrequency === 'monthly'
                    ? "Interest compounded monthly (higher returns)"
                    : "Interest compounded annually"}
                </p>
                <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm mt-2">
                  <button 
                    className={`px-3 py-1 text-xs font-medium transition-all flex-1 ${
                      params.compoundFrequency === 'monthly'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => onParamChange('compoundFrequency', 'monthly')}
                    aria-label="Set monthly compounding"
                  >
                    Monthly
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs font-medium transition-all flex-1 ${
                      params.compoundFrequency === 'annual'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => onParamChange('compoundFrequency', 'annual')}
                    aria-label="Set annual compounding"
                  >
                    Annual
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParametersSection; 