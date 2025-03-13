'use client'
import Link from 'next/link'
import { useSidebar } from '@/context/SidebarContext'
import { useState, useEffect, useRef } from 'react'

export default function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar()
  const [isTournamentOpen, setIsTournamentOpen] = useState(false)
  const [user, setUser] = useState(null)
  const sidebarRef = useRef(null)

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser')
    if (adminUser) {
      setUser(JSON.parse(adminUser))
    }

    setIsOpen(false)

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [setIsOpen])

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    window.location.href = '/'
  }

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    {
      name: 'Kelola Users',
      href: '/admin/users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )
    }
  ]

  const tournamentSubMenu = [
    {
      name: 'Dashboard Turnamen',
      href: '/admin/tournaments',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: 'Buat Turnamen',
      href: '/admin/tournaments/create',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      roleRequired: 'owner'
    }
  ]

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 bg-[#2b2b2b] p-2 rounded-lg hover:bg-[#363636] transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen bg-[#2b2b2b] z-100 text-gray-300 w-64 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-gray-700`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#f26522]" viewBox="0 0 20 20" fill="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />  </svg>
            <span className="text-xl font-bold text-white">Admin Panel</span>
          </div>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-[#363636] hover:text-white transition-colors duration-200"
              >
                <span className="inline-flex items-center justify-center mr-3">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}

            {/* Tournament Dropdown */}
            <div className="space-y-1">
              <button
                onClick={() => setIsTournamentOpen(!isTournamentOpen)}
                className="flex items-center w-full px-4 py-3 text-gray-300 rounded-lg hover:bg-[#363636] hover:text-white transition-colors duration-200"
              >
                <span className="inline-flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="flex-1 text-left">Turnamen</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transform transition-transform duration-200 ${
                    isTournamentOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Submenu */}
              <div className={`pl-4 space-y-1 ${isTournamentOpen ? 'block' : 'hidden'}`}>
                {tournamentSubMenu.map((item) => (
                  <Link
                    key={item.name}
                    href={item.roleRequired && (!user || user.role !== item.roleRequired) ? '#' : item.href}
                    className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                      item.roleRequired && (!user || user.role !== item.roleRequired)
                        ? 'text-gray-500 cursor-not-allowed bg-[#2b2b2b]'
                        : 'text-gray-300 hover:bg-[#363636] hover:text-white'
                    }`}
                    onClick={(e) => {
                      if (item.roleRequired && (!user || user.role !== item.roleRequired)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <span className="inline-flex items-center justify-center mr-3">
                      {item.icon}
                    </span>
                    {item.name}
                    {item.roleRequired && (!user || user.role !== item.roleRequired) && (
                      <span className="ml-2 text-xs text-gray-500">(Owner only)</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-red-400 rounded-lg hover:bg-[#363636] transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </>
  )
}