import React from 'react';

const WelcomeCard = ({ userName }) => {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg bg-blue-600 relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full -ml-20 -mb-20"></div>
      
      <div className="p-6 md:p-8 relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Selamat Datang Kembali, <span className="text-yellow-300">{userName} !</span>
          </h1>
          
          <p className="text-white text-sm md:text-base max-w-xl opacity-90">
            Kelola turnamen dengan mudah, pantau statistik, dan optimalkan pengalaman
            pengguna. Gunakan fitur-fitur yang tersedia untuk meningkatkan efisiensi
            pengelolaan turnamen.
          </p>
        </div>
        
        <div className="hidden md:block">
          <img 
            src="/images/admin-illustration.png" 
            alt="Admin Dashboard" 
            className="w-32 h-32 object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard; 