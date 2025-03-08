import React from 'react';

interface NumberInputProps {
    label: string;
    min?: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, min = 0, step = 1, value, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = parseInt(e.target.value);
        if (!isNaN(numValue) && numValue >= min) {
            onChange(numValue);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type="number"
                min={min}
                step={step}
                value={value}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onFocus={(e) => e.target.classList.add('ring-2', 'ring-indigo-500', 'border-indigo-500')}
                onBlur={(e) => e.target.classList.remove('ring-2', 'ring-indigo-500', 'border-indigo-500')}
            />
        </div>
    );
};

export default NumberInput; 