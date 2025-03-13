import React from 'react';

const WelcomeCard = ({ userName }) => {
  return (
    <div className="rounded-xl p-6 shadow-sm mb-6 flex items-center bg-[#2b2b2b]">
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
          Selamat Datang Kembali
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-blue-700 mb-3">
          {userName}!
        </h2>
        <p className="text-gray-400 text-sm md:text-base">
          Kelola turnamen dengan mudah, pantau statistik, dan optimalkan pengalaman pengguna.
          Gunakan fitur-fitur yang tersedia untuk meningkatkan efisiensi pengelolaan turnamen.
        </p>
      </div>
      <div className="hidden md:block">
        <img 
          src="/images/admin-illustration.png" 
          alt="Admin Dashboard" 
          className="w-48 h-auto"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export default WelcomeCard; 