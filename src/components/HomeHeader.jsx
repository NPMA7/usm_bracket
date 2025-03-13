import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const HomeHeader = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      setUser(JSON.parse(adminUser));
    }
  }, []);

  return (
    <div className="bg-[#2b2b2b] border-b border-gray-700 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-4xl font-bold text-white ${!user || !['admin', 'owner'].includes(user.role) ? 'mx-auto' : ''}`}>
            Sistem Bracket Turnamen
          </h1>
          {user && ['admin', 'owner'].includes(user.role) && (
            <Link href="/admin" className="bg-[#f26522] hover:bg-[#d54d0d] text-white px-6 py-2 rounded-lg transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Admin Panel
            </Link>
          )}
        </div>
   
      </div>
    </div>
  );
};

export default HomeHeader; 