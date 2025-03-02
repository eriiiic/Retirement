import React from 'react';
import CapitalTransitionTest from './CapitalTransitionTest';

const TestRunner: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Financial Simulation Tests</h1>
      <div className="border rounded-lg p-4 bg-gray-50">
        <CapitalTransitionTest />
      </div>
    </div>
  );
};

export default TestRunner; 