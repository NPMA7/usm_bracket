import React from 'react';

const SearchFilter = ({ 
  searchTerm, 
  onSearchChange, 
  filterValue, 
  onFilterChange,
  filterOptions = [],
  searchPlaceholder = 'Cari...',
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 ${className}`}>             
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 bg-[#363636] text-gray-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 absolute right-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        
        {filterOptions.length > 0 && (
          <select
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#363636] text-gray-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default SearchFilter; 