'use client'
import { useEffect, useState } from 'react'

export default function Toast() {
  const [user, setUser] = useState(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser')
    if (adminUser) {
      setUser(JSON.parse(adminUser))
    }

    // Menghilangkan toast setelah 5 detik
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    return () => clearTimeout(timer) // Membersihkan timer saat komponen unmount
  }, [])

  if (!user || !isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
        <div>
          <div className="font-medium">
            Login sebagai {user.role.toUpperCase()}
          </div>
          <div className="text-sm">
            {user.name} ({user.email})
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200 ml-4"
        >
          ×
        </button>
      </div>
    </div>
  )
} 