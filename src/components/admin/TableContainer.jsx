import React from 'react';

const TableContainer = ({ 
  title, 
  children, 
  actionText, 
  onActionClick,
  count,
  countLabel = 'Total',
  className = ''
}) => {
  return (
    <div className={`bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-[#f26522] mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <h2 className="text-xl font-semibold text-white">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {count !== undefined && (
            <span className="bg-[#3b3b3b] text-gray-400 px-3 py-1 rounded-full text-sm">
              {count} {countLabel}
            </span>
          )}
          {actionText && (
            <button
              onClick={onActionClick}
              className="text-blue-500 hover:text-blue-400 text-xs md:text-sm"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default TableContainer; 