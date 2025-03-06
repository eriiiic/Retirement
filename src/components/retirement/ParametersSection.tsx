import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SimulatorParams, Statistics, FormatAmountFunction, GraphDataPoint } from './types';
import FormulaModal from './FormulaModal';
import { generateModernRetirementReport } from '../../utils/modernPdfGenerator';
import { colors, typography, spacing, components, cx } from '../../styles/styleGuide';
import { calculateInflationAdjustedValue } from '../../utils/financialCalculations';

// Define the customStyles variable before the component
const customStyles = `
  .custom-input-width .text-input {
    min-width: 160px !important;
    width: 100% !important;
  }

  /* Desktop styles for monthly withdrawal (single line layout) */
  .monthly-withdrawal-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  /* Button positioning for desktop */
  .inflation-button-desktop {
    flex-shrink: 0;
    height: 32px;
    z-index: 5;
  }

  /* Slider container styles - match proportions of other sliders */
  .withdrawal-slider-wrapper {
    flex: 2;
    min-width: 120px;
    max-width: calc(67% - 95px); /* 2/3 width minus button width */
  }

  /* Input form container styles */
  .withdrawal-input-wrapper {
    flex: 1;
    min-width: 120px;
    max-width: 33%; /* 1/3 width to match other inputs */
  }

  /* Special mobile styles for monthly withdrawal header */
  @media (max-width: 639px) {
    /* Make the header with title and button on one line */
    .monthly-withdrawal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 8px;
    }
    
    .monthly-withdrawal-title {
      width: 45%;
    }
    
    .inflation-button-mobile {
      width: 50%;
      justify-content: center;
    }
    
    /* Hide desktop button on mobile */
    .inflation-button-desktop {
      display: none;
    }
    
    /* Mobile specific styles for slider and input - side by side */
    .monthly-withdrawal-row {
      flex-direction: row; /* Keep as row on mobile for slider and input */
      align-items: center;
      gap: 8px;
    }
    
    .withdrawal-slider-wrapper {
      width: 48%;
      max-width: 48%;
      flex: 1;
      margin-top: 0;
    }
    
    .withdrawal-input-wrapper {
      width: 48%;
      max-width: 48%;
      flex: 1;
      margin-top: 0;
    }
  }
  
  /* Hide mobile button on desktop */
  @media (min-width: 640px) {
    .inflation-button-mobile {
      display: none;
    }
    
    .monthly-withdrawal-header {
      margin-bottom: 8px;
    }
  }
`;

interface ParametersSectionProps {
  params: SimulatorParams;
  statistics: Statistics;
  formatAmount: FormatAmountFunction;
  onParamChange: (key: keyof SimulatorParams, value: any) => void;
  chartRef?: React.RefObject<HTMLDivElement>;
  graphData?: GraphDataPoint[];
}

export const ParametersSection: React.FC<ParametersSectionProps> = ({
  params,
  statistics,
  formatAmount,
  onParamChange,
  chartRef,
  graphData = []  // Provide a default empty array
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
  
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // References to input elements for maintaining focus
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // References to slider elements for drag handling
  const sliderRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // Reference for the custom retirement slider track
  const retirementSliderRef = useRef<HTMLDivElement | null>(null);
  
  // State to track current slider being dragged
  const [draggingSlider, setDraggingSlider] = useState<string | null>(null);
  
  // State to track slider container dimensions for calculations
  const sliderContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Add state for PDF generation
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [showPdfSuccess, setShowPdfSuccess] = useState<boolean>(false);

  // Add state for auto retirement age calculation
  const [autoCalculateRetirementAge, setAutoCalculateRetirementAge] = useState(false);

  // Memoize parameter constraints to avoid recreation on each render
  const paramConstraints = useMemo(() => ({
    currentAge: { min: 20, max: 80, default: 40 },
    maxAge: { min: 80, max: 105, default: 95 },
    retirementInput: { min: 50, max: 80, default: 60 },
    annualReturnRate: { min: 0, max: 30, default: 7 },
    inflation: { min: 0, max: 15, default: 2 },
    withdrawalRate: { min: 0.5, max: 20, default: 4 }
  }), []);

  // Common function to update slider value based on position
  const updateSliderValue = useCallback((id: keyof SimulatorParams, clientX: number, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    
    // Calculate position as percentage of container width
    let percent = (clientX - rect.left) / rect.width;
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
      
      // For annual return rate and inflation, limit to one decimal place
      if (id === 'annualReturnRate' || id === 'inflation') {
        newValue = Math.round(newValue * 10) / 10;
      }
      
      // Update UI and state
      slider.value = newValue.toString();
      
      // Update state with the new value
      onParamChange(id, newValue);
      setInputValues(prev => ({ ...prev, [id]: newValue.toString() }));
    }
  }, [onParamChange]);

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
        const container = sliderContainerRefs.current[draggingSlider] as HTMLDivElement;
        updateSliderValue(id, e.clientX, container);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (draggingSlider && sliderRefs.current[draggingSlider] && sliderContainerRefs.current[draggingSlider]) {
        const id = draggingSlider as keyof SimulatorParams;
        // Prevent scrolling while dragging
        e.preventDefault();
        
        // Get the touch position
        const touch = e.touches[0];
        const container = sliderContainerRefs.current[draggingSlider] as HTMLDivElement;
        updateSliderValue(id, touch.clientX, container);
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
  }, [draggingSlider, updateSliderValue]);

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
      onParamChange('initialCapital', 250000);
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
        onParamChange('initialCapital', 250000);
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
  const addThousandSeparators = useCallback((value: string) => {
    if (!value) return '';
    // Remove any existing commas or spaces first
    const cleanValue = value.replace(/[,\s]/g, '');
    // Use locale string to add thousand separators
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return cleanValue;
    return num.toLocaleString('en-US');
  }, []);

  // Remove thousand separators for processing
  const removeThousandSeparators = useCallback((value: string) => {
    if (!value) return '';
    return value.replace(/[,\s]/g, '');
  }, []);

  // Get currency symbol based on currency code
  const getCurrencySymbol = useCallback((currency: string): string => {
    switch(currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      default: return '$';
    }
  }, []);

  // Remove currency symbol for processing
  const removeCurrencySymbol = useCallback((value: string) => {
    // Remove any currency symbol before handling change
    return value.replace(/^[\$€£¥]\s?/, '');
  }, []);

  // Format number according to regional currency settings
  const formatNumberForCurrency = useCallback((value: string | number, currency: string) => {
    if (value === '' || value === '0' || value === 0) return '';
    
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    if (isNaN(numValue)) return '';
    
    // Format based on currency
    switch(currency) {
      case 'USD':
        return new Intl.NumberFormat('en-US', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 0 
        }).format(numValue);
      
      case 'EUR':
        return new Intl.NumberFormat('fr-FR', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      
      case 'GBP':
        return new Intl.NumberFormat('en-GB', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      
      case 'JPY':
        return new Intl.NumberFormat('ja-JP', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      
      default:
        return value.toString();
    }
  }, []);

  const handleInputChange = useCallback((key: keyof SimulatorParams, value: string) => {
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
  }, [onParamChange, removeThousandSeparators]);

  const handleInputBlur = useCallback((key: keyof SimulatorParams, value: string) => {
    // Clear the focused field when input loses focus
    setFocusedField(null);
    
    // Remove thousand separators before parsing
    const cleanValue = removeThousandSeparators(value);
    let parsedValue: number;
    
    // Handle special cases based on parameter type
    if (key in paramConstraints) {
      const constraint = paramConstraints[key as keyof typeof paramConstraints];
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
  }, [onParamChange, paramConstraints, removeThousandSeparators]);

  const handleInputFocus = useCallback((key: string) => {
    setFocusedField(key);
  }, []);

  const handleCurrencyChange = useCallback((currency: string) => {
    onParamChange('currency', currency);
  }, [onParamChange]);

  // Format number inputs with proper formatting
  const formatNumberInput = useCallback((value: string, addSeparators: boolean = false) => {
    if (!value) return '';
    
    // Remove existing separators for processing
    const cleanValue = removeThousandSeparators(value);
    
    // Handle decimal input
    let num: number;
    try {
      // Try to parse as float first
      num = parseFloat(cleanValue);
      if (isNaN(num)) {
        num = 0;
      }
    } catch (e) {
      console.error('Error parsing number:', e);
      num = 0;
    }
    
    // Use our currency formatter for consistency
    if (addSeparators) {
      return formatNumberForCurrency(num, params.currency);
    }
    
    // Otherwise just return the number
    return num.toString();
  }, [removeThousandSeparators, formatNumberForCurrency, params.currency]);

  // Get displayed value for monetary inputs (with regional number formatting)
  const getDisplayValue = useCallback((key: keyof SimulatorParams, value: string) => {
    if (value === '0') return '';
    
    if (key === 'initialCapital' || key === 'monthlyInvestment' || key === 'monthlyRetirementWithdrawal') {
      return formatNumberForCurrency(value, params.currency);
    }
    
    return value;
  }, [formatNumberForCurrency, params.currency]);

  // Helper to determine if retirement input is an age or a year
  const isRetirementInputAnAge = useCallback((): boolean => {
    const input = Number(params.retirementInput);
    return (input > 0 && input < 120 && params.retirementInput.length <= 2) || 
           !(params.retirementInput.length === 4 && params.retirementInput.startsWith('20'));
  }, [params.retirementInput]);

  // Get slider min/max/step values based on parameter type
  const getSliderConfig = useCallback((id: keyof SimulatorParams) => {
    switch (id) {
      case 'initialCapital':
        // Fixed range from 0 to 3,000,000 as specified
        return { min: 0, max: 3000000, step: 10000 };
      case 'currentAge':
        return { min: 20, max: 80, step: 1 };
      case 'monthlyInvestment':
        // Set fixed maximum value to 10000 as requested
        return { min: 0, max: 10000, step: 100 };
      case 'retirementInput':
        return { 
          min: params.currentAge + 1, 
          max: isRetirementInputAnAge() ? 100 : new Date().getFullYear() + 50, 
          step: 1 
        };
      case 'monthlyRetirementWithdrawal':
        // Set fixed maximum value to 20000 as requested
        return { min: 0, max: 20000, step: 100 };
      case 'annualReturnRate':
        return { min: 0, max: 20, step: 0.1 };
      case 'inflation':
        return { min: 0, max: 10, step: 0.1 };
      case 'withdrawalRate':
        // Updated range as requested: 1-20
        return { min: 1, max: 20, step: 0.1 };
      case 'maxAge':
        // Updated range as requested: 70-105
        return { min: 70, max: 105, step: 1 };
      default:
        return { min: 0, max: 100, step: 1 };
    }
  }, [params.currentAge, isRetirementInputAnAge]);

  // Handle slider mousedown for enhanced drag behavior
  const handleSliderMouseDown = useCallback((id: keyof SimulatorParams, e: React.MouseEvent) => {
    setDraggingSlider(id as string);
    
    // Immediately update slider position based on initial click
    if (sliderContainerRefs.current[id as string]) {
      const container = sliderContainerRefs.current[id as string] as HTMLDivElement;
      updateSliderValue(id, e.clientX, container);
    }
  }, [updateSliderValue]);

  // Handle touch start for mobile devices
  const handleSliderTouchStart = useCallback((id: keyof SimulatorParams, e: React.TouchEvent) => {
    setDraggingSlider(id as string);
    
    // Immediately update slider position based on initial touch
    if (sliderContainerRefs.current[id as string]) {
      const touch = e.touches[0];
      const container = sliderContainerRefs.current[id as string] as HTMLDivElement;
      updateSliderValue(id, touch.clientX, container);
    }
  }, [updateSliderValue]);

  // Handle form value changes
  const handleValueChange = useCallback((id: keyof SimulatorParams, value: string | number) => {
    // Update state with the new value
    onParamChange(id, value);
    setInputValues(prev => ({ ...prev, [id]: value.toString() }));
  }, [onParamChange]);

  // Handle PDF generation
  const handleGeneratePDF = useCallback(async () => {
    setIsPdfGenerating(true);
    setShowPdfSuccess(false);
    
    console.log('PDF generation started in ParametersSection');
    console.log('Params:', params);
    console.log('Statistics:', statistics);
    console.log('GraphData length:', graphData?.length);
    
    try {
      console.log('Calling generateModernRetirementReport with:', {
        paramsProvided: !!params,
        statisticsProvided: !!statistics,
        chartRefProvided: !!chartRef,
        graphDataProvided: !!graphData && graphData.length > 0,
        formatAmountTest: formatAmount(1000) // Test formatting function
      });
      
      // Generate the full report (removed test PDF generation)
      await generateModernRetirementReport({
        params,
        statistics: {
          ...statistics,
          ageAtYear: (year: number) => year - statistics.birthYear
        },
        formatAmount,
        graphData,
        chartRef
      });
      
      console.log('PDF generation completed successfully in ParametersSection');
      setShowPdfSuccess(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowPdfSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. See console for details.');
    } finally {
      setIsPdfGenerating(false);
    }
  }, [params, statistics, formatAmount, graphData, chartRef]);

  // Calculate optimal retirement age based on financial independence
  const calculateOptimalRetirementAge = useCallback((): number => {
    // Start with current age as baseline
    let testAge = params.currentAge; // Start from exact current age, not +1
    const maxTestAge = params.maxAge - 5; // Leave at least 5 years of retirement
    
    // Financial parameters
    const monthlyInvestment = Number(params.monthlyInvestment);
    const initialCapital = Number(params.initialCapital);
    const annualReturnRate = Number(params.annualReturnRate) / 100;
    const inflation = Number(params.inflation) / 100;
    const monthlyWithdrawal = Number(params.monthlyRetirementWithdrawal);
    const adjustedRate = annualReturnRate - inflation;
    
    // Keep testing ages until we find one where the accumulated capital
    // is sufficient for the planned retirement duration
    while (testAge <= maxTestAge) {
      // Years until retirement
      const yearsToRetirement = testAge - params.currentAge;
      
      // Calculate future value of current investments
      const futureValue = initialCapital * Math.pow(1 + annualReturnRate, yearsToRetirement) + 
                          monthlyInvestment * 12 * ((Math.pow(1 + annualReturnRate, yearsToRetirement) - 1) / annualReturnRate);
      
      // Calculate years in retirement
      const yearsInRetirement = params.maxAge - testAge;
      
      // Calculate needed capital for retirement
      const annualWithdrawal = monthlyWithdrawal * 12;
      let neededCapital;
      
      if (adjustedRate > 0) {
        // Using the present value of an annuity formula
        neededCapital = annualWithdrawal * (1 - Math.pow(1 + adjustedRate, -yearsInRetirement)) / adjustedRate;
      } else {
        // Simple multiplication if adjusted rate is zero or negative
        neededCapital = annualWithdrawal * yearsInRetirement;
      }
      
      // If we have enough capital, this is our optimal retirement age
      if (futureValue >= neededCapital) {
        // We've found the earliest possible retirement age
        return testAge;
      }
      
      // Try the next age
      testAge++;
    }
    
    // If we couldn't find an optimal age, return a reasonable default
    return Math.min(65, params.maxAge - 5);
  }, [params]);

  // Add handler for auto retirement age calculation
  const toggleAutoRetirementCalculation = useCallback(() => {
    const newValue = !autoCalculateRetirementAge;
    setAutoCalculateRetirementAge(newValue);
    
    if (newValue) {
      // Calculate the optimal retirement age using financial data
      const optimalAge = calculateOptimalRetirementAge();
      onParamChange('retirementInput', optimalAge.toString());
      onParamChange('autoCalculateRetirementAge', true);
    } else {
      onParamChange('autoCalculateRetirementAge', false);
    }
  }, [autoCalculateRetirementAge, onParamChange, calculateOptimalRetirementAge]);

  // Function to calculate slider progress for the retirement age slider
  const calculateProgress = useCallback((id: keyof SimulatorParams) => {
    if (id !== 'retirementInput') return 0;
    
    const value = parseFloat(inputValues[id] || '0');
    const config = getSliderConfig(id);
    const min = config.min || 0;
    const max = config.max || 100;
    
    // Calculate percentage
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  }, [inputValues, getSliderConfig]);

  // Render a parameter input field with slider for specified parameters
  const renderParameterInput = useCallback((
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

    // Check if this input should be disabled (for retirement age when auto-calc is enabled)
    const isDisabled = id === 'retirementInput' && autoCalculateRetirementAge;
    
    return (
      <div className={cx("flex flex-col gap-1")}>
        <label htmlFor={id} className={cx(typography.style.label, "flex justify-between")}>
          <span>{label}</span>
        </label>
        
        <div className={cx("flex items-center", spacing.gap.sm)}>
          {includeSlider && (
            <div 
              ref={el => sliderContainerRefs.current[id as string] = el}
              className={cx(
                "w-full sm:w-2/3 md:w-2/3 relative",
                isDisabled ? 'pointer-events-none' : ''
              )}
              onMouseDown={(e) => !isDisabled && handleSliderMouseDown(id, e)}
              onTouchStart={(e) => !isDisabled && handleSliderTouchStart(id, e)}
            >
              <div 
                className={cx(
                  "absolute inset-0 w-full h-2 rounded-lg cursor-pointer",
                  isDisabled ? 'bg-gray-300' : components.form.slider.track
                )}
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              ></div>
              <div 
                className={cx(
                  "absolute h-2 rounded-lg",
                  isDisabled ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                )}
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
                disabled={isDisabled}
                onChange={(e) => {
                  if (isDisabled) return;
                  const newValue = e.target.value;
                  let numericNewValue = parseFloat(newValue);
                  
                  // For annual return rate and inflation, limit to one decimal place
                  if (id === 'annualReturnRate' || id === 'inflation') {
                    numericNewValue = Math.round(numericNewValue * 10) / 10;
                  }
                  
                  onParamChange(id, numericNewValue);
                  
                  // For monetary values, ensure we're updating with the correct value format
                  if (currency && (id === 'initialCapital' || id === 'monthlyInvestment' || id === 'monthlyRetirementWithdrawal')) {
                    setInputValues(prev => ({ ...prev, [id]: numericNewValue.toString() }));
                  } else {
                    setInputValues(prev => ({ ...prev, [id]: numericNewValue.toString() }));
                  }
                }}
                className={cx(
                  "w-full h-2 appearance-none bg-transparent absolute z-10 cursor-pointer opacity-0",
                  isDisabled ? 'cursor-not-allowed' : ''
                )}
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
              <div 
                className={cx(
                  "absolute w-4 h-4 bg-white border rounded-full shadow transition-all",
                  isDisabled ? 'border-gray-400' : 'border-indigo-500',
                  draggingSlider === id ? 'w-5 h-5 border-purple-600 scale-110 shadow-md' : ''
                )}
                style={{ 
                  left: `${((numericValue - min) / (max - min)) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderWidth: draggingSlider === id ? '2px' : '1px'
                }}
              ></div>
            </div>
          )}
          
          {/* Input field with appropriate styling based on type */}
          {id === 'currentAge' ? (
            <div className="relative w-full sm:w-1/3 flex items-center justify-end">
              <div className="w-full sm:w-2/3 flex items-center">
                <input
                  ref={el => inputRefs.current[id as string] = el}
                  id={id as string}
                  type="text"
                  inputMode="numeric"
                  value={value === '0' ? '' : value}
                  disabled={isDisabled}
                  onChange={(e) => handleInputChange(id, e.target.value)}
                  onBlur={(e) => handleInputBlur(id, e.target.value)}
                  onFocus={() => handleInputFocus(id as string)}
                  placeholder="46"
                  className={cx(
                    "w-full rounded-lg border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-sm text-right",
                    typography.size.sm,
                    colors.neutral[600],
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  )}
                  aria-label={`${label} input`}
                />
                <span className={cx(typography.size.xs, colors.neutral[600], "ml-1")}>years old</span>
              </div>
            </div>
          ) : id === 'retirementInput' ? (
            <div className="relative w-full sm:w-2/3 flex items-center justify-end">
              <div className="w-full sm:w-4/5 flex items-center">
                <input
                  ref={el => inputRefs.current[id as string] = el}
                  id={id as string}
                  type="text"
                  inputMode="numeric"
                  value={value === '0' ? '' : value}
                  disabled={isDisabled}
                  onChange={(e) => handleInputChange(id, e.target.value)}
                  onBlur={(e) => handleInputBlur(id, e.target.value)}
                  onFocus={() => handleInputFocus(id as string)}
                  placeholder="65"
                  className={cx(
                    "w-full rounded-lg border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-sm text-right",
                    typography.size.sm,
                    colors.neutral[700],
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  )}
                  aria-label={`${label} input`}
                />
                <span className={cx(typography.size.xs, colors.neutral[600], "ml-1")}>
                  {isRetirementInputAnAge() ? "years old" : "year"}
                </span>
              </div>
            </div>
          ) : id === 'initialCapital' || id === 'monthlyInvestment' || id === 'monthlyRetirementWithdrawal' ? (
            <div className="relative w-full sm:w-1/3 flex items-center justify-end">
              <div className="w-full sm:w-2/3 flex items-center">
                <div className="relative w-full">
                  {/* Currency symbol positioned on the left */}
                  <span className={cx(
                    "absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none",
                    typography.size.sm,
                    colors.neutral[500]
                  )}>
                    {getCurrencySymbol(params.currency)}
                  </span>
                  <input
                    ref={el => inputRefs.current[id as string] = el}
                    id={id as string}
                    type="text"
                    inputMode="decimal"
                    value={value === '0' ? '' : formatNumberForCurrency(value, params.currency)}
                    onChange={(e) => {
                      // Remove currency symbol before handling change
                      const valueWithoutCurrency = removeCurrencySymbol(e.target.value);
                      handleInputChange(id, valueWithoutCurrency);
                    }}
                    onBlur={(e) => {
                      // Remove currency symbol before handling blur
                      const valueWithoutCurrency = removeCurrencySymbol(e.target.value);
                      handleInputBlur(id, valueWithoutCurrency);
                    }}
                    onFocus={() => handleInputFocus(id as string)}
                    placeholder={placeholder}
                    className={cx(
                      "w-full rounded-lg border border-gray-300 py-1.5 pl-6 pr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-sm text-right",
                      typography.size.sm,
                      colors.neutral[700]
                    )}
                    aria-label={`${label} input`}
                  />
                </div>
              </div>
            </div>
          ) : id === 'maxAge' ? (
            <div className="relative w-full sm:w-1/3 flex items-center justify-end">
              <div className="w-full sm:w-3/4 flex items-center">
                <input
                  ref={el => inputRefs.current[id as string] = el}
                  id={id as string}
                  type="text"
                  inputMode="numeric"
                  value={value === '0' ? '' : value}
                  onChange={(e) => handleInputChange(id, e.target.value)}
                  onBlur={(e) => handleInputBlur(id, e.target.value)}
                  onFocus={() => handleInputFocus(id as string)}
                  placeholder="95"
                  className={cx(
                    "w-full rounded-lg border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-sm text-right",
                    typography.size.sm,
                    colors.neutral[700]
                  )}
                  aria-label={`${label} input`}
                />
                <span className={cx(typography.size.xs, colors.neutral[600], "ml-1")}>years old</span>
              </div>
            </div>
          ) : (
            <div className={cx(
              "relative flex items-center",
              includeSlider 
                ? (percentage ? 'w-full sm:w-1/4' : 'w-full sm:w-1/3') 
                : 'w-full'
            )}>
              <input
                ref={el => inputRefs.current[id as string] = el}
                id={id as string}
                type="text"
                inputMode={percentage || currency ? "decimal" : "numeric"}
                value={currency 
                  ? `${getCurrencySymbol(params.currency)} ${value === '0' ? '' : value}` 
                  : (value === '0' ? '' : value)}
                onChange={(e) => {
                  if (currency) {
                    // Remove currency symbol before handling change
                    const valueWithoutCurrency = removeCurrencySymbol(e.target.value);
                    handleInputChange(id, valueWithoutCurrency);
                  } else {
                    handleInputChange(id, e.target.value);
                  }
                }}
                onBlur={(e) => {
                  if (currency) {
                    // Remove currency symbol before handling blur
                    const valueWithoutCurrency = removeCurrencySymbol(e.target.value);
                    handleInputBlur(id, valueWithoutCurrency);
                  } else {
                    handleInputBlur(id, e.target.value);
                  }
                }}
                onFocus={() => handleInputFocus(id as string)}
                placeholder={currency 
                  ? `${getCurrencySymbol(params.currency)} ${placeholder}` 
                  : placeholder}
                className={cx(
                  "w-full rounded-lg border border-gray-300 py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-sm text-right",
                  typography.size.sm,
                  colors.neutral[700]
                )}
                aria-label={`${label} input`}
              />
              {percentage && (
                <span className={cx(typography.size.xs, colors.neutral[600], "ml-1.5")}>
                  %
                </span>
              )}
              {suffix && !percentage && (
                <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 pointer-events-none text-xs">
                  {suffix}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [
    params, 
    autoCalculateRetirementAge, 
    draggingSlider, 
    getSliderConfig, 
    handleInputBlur, 
    handleInputChange, 
    handleInputFocus, 
    handleSliderMouseDown, 
    handleSliderTouchStart, 
    isRetirementInputAnAge, 
    onParamChange
  ]);

  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.innerHTML = customStyles;
    document.head.appendChild(styleEl);
    
    // Clean up function
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className={cx("bg-gray-50 rounded-lg border border-gray-200 shadow-sm overflow-hidden p-4")}>
      {/* Header with Title */}
      <div className={cx("flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 pb-2 border-b border-gray-200")}>
        <div>
          <h2 className="text-xl font-semibold text-gradient mb-1 sm:mb-0">Define Your Plan</h2>
          <p className={typography.style.subtitle}>Tailor your personal path to financial freedom</p>
        </div>
          
        <div className="flex flex-row items-center justify-end w-full sm:w-auto gap-2 mt-3 sm:mt-0">
          {/* PDF button */}
          <button
            onClick={handleGeneratePDF}
            disabled={isPdfGenerating}
            className={cx(
              "px-4 py-1.5 text-white text-xs font-medium rounded-lg flex items-center shadow-sm transition-colors duration-200",
              isPdfGenerating ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
            )}
            aria-label="Generate PDF Report"
          >
            {isPdfGenerating ? (
              <>
                <svg className="animate-spin h-3 w-3 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="whitespace-nowrap">Generating...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="whitespace-nowrap">PDF Report</span>
              </>
            )}
          </button>
          
          {/* Success message */}
          {showPdfSuccess && (
            <div className={cx("absolute right-0 top-full mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-md shadow-sm z-10")}>
              PDF generated successfully!
            </div>
          )}

          <div className="flex items-center">
            <span className={cx("text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent mr-1")}>Currency:</span>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button 
                className={cx(
                  "px-2.5 py-1.5 text-xs font-medium transition-all min-w-[2rem]",
                  params.currency === 'USD'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => handleCurrencyChange('USD')}
                aria-label="Switch to US Dollar"
              >
                $
              </button>
              <button 
                className={cx(
                  "px-2.5 py-1.5 text-xs font-medium transition-all min-w-[2rem]",
                  params.currency === 'EUR'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => handleCurrencyChange('EUR')}
                aria-label="Switch to Euro"
              >
                €
              </button>
              <button 
                className={cx(
                  "px-2.5 py-1.5 text-xs font-medium transition-all min-w-[2rem]",
                  params.currency === 'GBP'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => handleCurrencyChange('GBP')}
                aria-label="Switch to British Pound"
              >
                £
              </button>
              <button 
                className={cx(
                  "px-2.5 py-1.5 text-xs font-medium transition-all min-w-[2rem]",
                  params.currency === 'JPY'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => handleCurrencyChange('JPY')}
                aria-label="Switch to Japanese Yen"
              >
                ¥
              </button>
            </div>
            <span className={cx(typography.size.xs, "text-gray-500 ml-1 hidden sm:inline")}>Display only</span>
          </div>
        </div>
      </div>

      {/* Combined Parameters Section - All inputs on same page */}
      <div className={cx(components.container.section, "mb-3")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Current Status Section - Optimized */}
          <div className={cx("bg-gradient-to-b from-blue-50 to-white rounded-lg border border-blue-100 shadow-sm p-1 overflow-hidden")}>
            <h3 className={cx("text-xs font-semibold text-blue-800 uppercase tracking-wider px-2 mb-0.5 py-0.5 flex items-center")}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Current Status
            </h3>
            <div className={cx("space-y-0")}>
              <div className="p-1">
                <h4 className="text-xs font-medium text-blue-800 flex items-center mb-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Initial Capital
                </h4>
                {renderParameterInput(
                  "", 
                  "initialCapital", 
                  getDisplayValue('initialCapital', inputValues.initialCapital), 
                  "150,000", 
                  true,
                  false,
                  undefined,
                  true
                )}
              </div>
              
              <div className="p-1">
                <h4 className="text-xs font-medium text-blue-800 flex items-center mb-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Current Age
                </h4>
                {renderParameterInput(
                  "", 
                  "currentAge", 
                  inputValues.currentAge, 
                  "46", 
                  false, 
                  false, 
                  "",
                  true
                )}
              </div>
              
              <div className="p-1">
                <h4 className="text-xs font-medium text-blue-800 flex items-center mb-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Monthly Investment
                </h4>
                {renderParameterInput(
                  "", 
                  "monthlyInvestment", 
                  getDisplayValue('monthlyInvestment', inputValues.monthlyInvestment), 
                  "500", 
                  true,
                  false,
                  undefined,
                  true
                )}
              </div>
            </div>
          </div>

          {/* Retirement Plan Section - Optimized */}
          <div className="bg-gradient-to-b from-purple-50 to-white rounded-lg border border-purple-100 shadow-sm p-1 overflow-hidden">
            <h3 className="text-xs font-semibold text-purple-800 uppercase tracking-wider px-2 mb-0.5 py-0.5 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Retirement Plan
            </h3>
            <div className="space-y-0">
              {/* Custom wrapper for retirement age parameter */}
              <div className="p-1">
                {/* First row - add label and the auto-calculated tag when active */}
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="text-xs font-medium text-purple-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Retirement Age
                    {autoCalculateRetirementAge && (
                      <span className="ml-1.5 text-xs text-purple-600 font-normal">(Auto-calculated)</span>
                    )}
                  </h4>
                </div>
                
                {/* Second row - auto-calculate button and slider */}
                <div className="flex items-center">
                  {/* Auto-calculate button - now wider with explicit text */}
                  <button
                    onClick={toggleAutoRetirementCalculation}
                    className={`flex-shrink-0 mr-2 p-1.5 px-3 rounded-lg transition-all flex items-center w-32 sm:w-36 ${
                      autoCalculateRetirementAge 
                        ? 'bg-purple-600 text-white ring-1 ring-purple-300' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50'
                    }`}
                    title="Calculate ideal retirement age for financial independence"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-medium">
                      {autoCalculateRetirementAge ? "Auto-calc" : "Auto-calc"}
                    </span>
                  </button>
                  
                  {/* Standard parameter input with reduced width */}
                  <div className={`flex-1 ${autoCalculateRetirementAge ? "opacity-70 pointer-events-none" : ""}`}>
                    {renderParameterInput(
                      "", // Empty label since we've added it manually above
                      "retirementInput", 
                      inputValues.retirementInput, 
                      "65", 
                      false, 
                      false, 
                      "",
                      true // Include slider
                    )}
                  </div>
                </div>
              </div>

              {/* Withdrawal Strategy - Optimized */}
              <div className="mb-1 p-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-medium text-purple-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Withdrawal Strategy
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 ml-4.5">
                      {params.withdrawalMode === 'amount'
                        ? "Specify how much you want to withdraw each month"
                        : params.withdrawalMode === 'age'
                          ? "Set a target age and we'll calculate a sustainable withdrawal"
                          : "Define a withdrawal rate as percentage of your capital"}
                    </p>
                  </div>
                  <div className="flex w-full sm:w-auto border border-purple-200 rounded-lg overflow-hidden shadow-sm">
                    <button 
                      className={`flex-1 px-3 py-1.5 text-xs font-medium transition-all ${
                        params.withdrawalMode === 'amount'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-purple-50'
                      }`}
                      onClick={() => onParamChange('withdrawalMode', 'amount')}
                    >
                      Amount
                    </button>
                    <button 
                      className={`flex-1 px-3 py-1.5 text-xs font-medium transition-all ${
                        params.withdrawalMode === 'age'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-purple-50'
                      }`}
                      onClick={() => onParamChange('withdrawalMode', 'age')}
                    >
                      Target Age
                    </button>
                    <button 
                      className={`flex-1 px-3 py-1.5 text-xs font-medium transition-all ${
                        params.withdrawalMode === 'rate'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-purple-50'
                      }`}
                      onClick={() => onParamChange('withdrawalMode', 'rate')}
                    >
                      Rate
                    </button>
                  </div>
                </div>
              </div>

              {params.withdrawalMode === 'amount' ? (
                <div className="p-1">
                  <div className="monthly-withdrawal-header">
                    <h4 className="monthly-withdrawal-title text-xs font-medium text-purple-800 flex items-center mb-0.5 sm:mb-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Monthly Withdrawal
                    </h4>
                    
                    {/* Mobile-only Inflation Adjusted Button */}
                    <button
                      onClick={() => onParamChange('inflationAdjustedWithdrawal', !params.inflationAdjustedWithdrawal)}
                      className={`inflation-button-mobile p-1.5 px-2 rounded-lg transition-all flex items-center ${
                        params.inflationAdjustedWithdrawal 
                          ? 'bg-purple-600 text-white ring-1 ring-purple-300' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50'
                      }`}
                      title="Adjust the entered amount for inflation from today until retirement start"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs font-medium whitespace-nowrap">
                        Inflation Adjusted
                      </span>
                    </button>
                  </div>
                  
                  {params.inflationAdjustedWithdrawal && (
                    <p className="text-xs text-purple-600 italic mb-2">
                      Amount will be adjusted for inflation from today until retirement. 
                      {statistics.calculatedRetirementStartYear && (
                        <span className="font-medium">
                          {" "}Future value at retirement: {formatAmount(
                            calculateInflationAdjustedValue(
                              params.monthlyRetirementWithdrawal,
                              params.inflation,
                              statistics.calculatedRetirementStartYear - new Date().getFullYear()
                            )
                          )}
                        </span>
                      )}
                    </p>
                  )}
                  
                  <div className="monthly-withdrawal-row">
                    {/* Desktop-only Inflation Adjusted Button */}
                    <button
                      onClick={() => onParamChange('inflationAdjustedWithdrawal', !params.inflationAdjustedWithdrawal)}
                      className={`inflation-button-desktop p-1.5 px-2 rounded-lg transition-all flex items-center justify-center ${
                        params.inflationAdjustedWithdrawal 
                          ? 'bg-purple-600 text-white ring-1 ring-purple-300' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50'
                      }`}
                      title="Adjust the entered amount for inflation from today until retirement start"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs font-medium whitespace-nowrap">
                        Inflation Adjusted
                      </span>
                    </button>
                    
                    {/* Custom Slider Container - now always full width on mobile */}
                    <div className="withdrawal-slider-wrapper">
                      <div 
                        ref={el => sliderContainerRefs.current["monthlyRetirementWithdrawal"] = el}
                        className="relative h-8"
                        onMouseDown={(e) => handleSliderMouseDown("monthlyRetirementWithdrawal", e)}
                        onTouchStart={(e) => handleSliderTouchStart("monthlyRetirementWithdrawal", e)}
                      >
                        <div 
                          className={components.form.slider.track}
                          style={{ top: '50%', transform: 'translateY(-50%)', position: 'absolute', height: '8px', width: '100%', borderRadius: '8px' }}
                        ></div>
                        <div 
                          className="absolute h-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500"
                          style={{ 
                            width: `${((params.monthlyRetirementWithdrawal - getSliderConfig("monthlyRetirementWithdrawal").min) / (getSliderConfig("monthlyRetirementWithdrawal").max - getSliderConfig("monthlyRetirementWithdrawal").min)) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: '8px'
                          }}
                        ></div>
                        <input
                          ref={el => sliderRefs.current["monthlyRetirementWithdrawal"] = el}
                          type="range"
                          min={getSliderConfig("monthlyRetirementWithdrawal").min}
                          max={getSliderConfig("monthlyRetirementWithdrawal").max}
                          step={getSliderConfig("monthlyRetirementWithdrawal").step}
                          value={params.monthlyRetirementWithdrawal}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            let numericValue = parseFloat(newValue);
                            onParamChange("monthlyRetirementWithdrawal", numericValue);
                            setInputValues(prev => ({ ...prev, monthlyRetirementWithdrawal: numericValue.toString() }));
                          }}
                          className="w-full h-2 appearance-none bg-transparent absolute z-10 cursor-pointer opacity-0"
                          style={{ top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <div 
                          className="absolute w-4 h-4 bg-white border rounded-full shadow transition-all"
                          style={{ 
                            left: `${((params.monthlyRetirementWithdrawal - getSliderConfig("monthlyRetirementWithdrawal").min) / (getSliderConfig("monthlyRetirementWithdrawal").max - getSliderConfig("monthlyRetirementWithdrawal").min)) * 100}%`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            borderWidth: draggingSlider === "monthlyRetirementWithdrawal" ? '2px' : '1px'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Custom Input Field */}
                    <div className="withdrawal-input-wrapper">
                      <div className="relative w-full">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-sm text-gray-500">
                          {getCurrencySymbol(params.currency)}
                        </span>
                        <input
                          ref={el => inputRefs.current["monthlyRetirementWithdrawal"] = el}
                          id="monthlyRetirementWithdrawal"
                          type="text"
                          inputMode="decimal"
                          value={getDisplayValue('monthlyRetirementWithdrawal', inputValues.monthlyRetirementWithdrawal) === '0' ? '' : formatNumberForCurrency(getDisplayValue('monthlyRetirementWithdrawal', inputValues.monthlyRetirementWithdrawal), params.currency)}
                          onChange={(e) => {
                            const valueWithoutCurrency = removeCurrencySymbol(e.target.value);
                            handleInputChange("monthlyRetirementWithdrawal", valueWithoutCurrency);
                          }}
                          onBlur={(e) => {
                            const valueWithoutCurrency = removeCurrencySymbol(e.target.value);
                            handleInputBlur("monthlyRetirementWithdrawal", valueWithoutCurrency);
                          }}
                          onFocus={() => handleInputFocus("monthlyRetirementWithdrawal")}
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 py-1.5 pl-6 pr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-sm text-right"
                          aria-label="Monthly retirement withdrawal input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : params.withdrawalMode === 'age' ? (
                <div className="p-1">
                  <h4 className="text-xs font-medium text-purple-800 flex items-center mb-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Target Age
                  </h4>
                  {renderParameterInput(
                    "", 
                    "maxAge", 
                    inputValues.maxAge, 
                    "95", 
                    false, 
                    false, 
                    "",
                    true
                  )}
                </div>
              ) : (
                <div className="p-1">
                  <h4 className="text-xs font-medium text-purple-800 flex items-center mb-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Withdrawal Rate
                  </h4>
                  {renderParameterInput(
                    "", 
                    "withdrawalRate", 
                    inputValues.withdrawalRate, 
                    "4", 
                    false, 
                    true,
                    undefined,
                    true
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Market Assumptions Section - Optimized */}
        <div className="mt-3 bg-gradient-to-b from-green-50 to-white rounded-lg border border-green-100 shadow-sm p-1 overflow-hidden">
          <h3 className="text-xs font-semibold text-green-800 uppercase tracking-wider px-2 mb-2 py-0.5 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Market Assumptions
          </h3>
          <p className="text-xs text-gray-600 italic px-2 mb-3 ml-5">
            These settings affect how your investments grow over time and how inflation impacts your withdrawal purchasing power.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Annual Return Rate */}
            <div className="bg-white rounded-lg border border-green-100 shadow-sm p-1">
              <h4 className="text-xs font-medium text-green-800 flex items-center mb-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Annual Return
              </h4>
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
            <div className="bg-white rounded-lg border border-green-100 shadow-sm p-1">
              <h4 className="text-xs font-medium text-green-800 flex items-center mb-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Inflation
              </h4>
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
            <div className="bg-white rounded-lg border border-green-100 shadow-sm p-1">
              <h4 className="text-xs font-medium text-green-800 flex items-center mb-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Compound Frequency
              </h4>
              <div className="p-1">
                <p className="text-xs text-gray-600 mb-2">
                  {params.compoundFrequency === 'monthly'
                    ? "Interest compounded monthly (higher returns)"
                    : "Interest compounded annually"}
                </p>
                <div className="flex border border-green-200 rounded-lg overflow-hidden shadow-sm mt-2">
                  <button 
                    className={`px-3 py-1 text-xs font-medium transition-all flex-1 ${
                      params.compoundFrequency === 'monthly'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-green-50'
                    }`}
                    onClick={() => onParamChange('compoundFrequency', 'monthly')}
                    aria-label="Set monthly compounding"
                  >
                    Monthly
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs font-medium transition-all flex-1 ${
                      params.compoundFrequency === 'annual'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-green-50'
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