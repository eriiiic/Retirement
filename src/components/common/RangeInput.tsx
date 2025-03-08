import React from 'react';

interface RangeInputProps {
    label: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    tooltip?: string;
}

const RangeInput: React.FC<RangeInputProps> = ({ label, min, max, step = 1, value, onChange, tooltip }) => {
    return (
        <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="flex-grow h-2 rounded-lg appearance-none bg-indigo-100 cursor-pointer"
                />
                <span className="ml-3 w-12 text-center text-indigo-600 font-semibold">{value}</span>
            </div>
            {tooltip && (
                <div className="absolute -top-8 right-0 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {tooltip}
                </div>
            )}
        </div>
    );
};

export default RangeInput; 