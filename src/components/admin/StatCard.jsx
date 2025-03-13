import React from 'react';

const StatCard = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  subtitleColor = 'text-green-500',
  bgColor = 'bg-blue-500/20',
  iconColor = 'text-blue-500'
}) => {
  return (
    <div className="bg-[#2b2b2b] rounded-xl p-3 md:p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          {icon}
        </div>
        <span className="text-xs text-gray-400">{title}</span>
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white">
        {value}
      </h3>
      <p className={`${subtitleColor} text-xs mt-1`}>{subtitle}</p>
    </div>
  );
};

export default StatCard; 