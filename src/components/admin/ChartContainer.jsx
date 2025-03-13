import React from 'react';

const ChartContainer = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-white">
          {title}
        </h2>
      </div>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
};

export default ChartContainer; 