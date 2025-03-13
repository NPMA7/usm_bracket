import React from 'react';

const DashboardCard = ({ 
  title, 
  children, 
  actionText, 
  onActionClick,
  className = ''
}) => {
  return (
    <div className={`bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-white">
          {title}
        </h2>
        {actionText && (
          <button
            onClick={onActionClick}
            className="text-blue-500 hover:text-blue-400 text-xs md:text-sm"
          >
            {actionText}
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export default DashboardCard; 