import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, role, avatar')
          .eq('email', currentUser.email)
          .single()
        
        setUser(userData)
      }
    }

    getUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    window.location.href = '/'
  }

  return (
    <header className="bg-[#2b2b2b] border-b border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
           
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <span className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">
                  Dashboard
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="ml-4 relative flex-shrink-0">
              <div>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                >
                  <span className="sr-only">Open user menu</span>
                  {user?.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-medium">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </button>
              </div>

              {showDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-[#363636] ring-1 ring-black ring-opacity-5">
                  {user && (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-300">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-gray-400 capitalize">{user.role}</div>
                      </div>
                      <div className="border-t border-gray-700"></div>
                    </>
                  )}
                  <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                    Pengaturan
                  </a>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 