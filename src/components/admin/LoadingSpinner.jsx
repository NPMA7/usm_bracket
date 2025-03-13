import React from 'react';

const LoadingSpinner = ({ message = 'Memuat data...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent mb-4"></div>
        <p className="text-white">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 