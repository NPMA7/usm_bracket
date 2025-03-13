'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import WelcomeCard from '@/components/admin/WelcomeCard'

function AdminDashboard() {
  const [userName, setUserName] = useState('Admin')
  
  // Efek untuk mengambil data pengguna saat komponen dimuat
  useEffect(() => {
    // Mengambil data pengguna dari localStorage yang sama dengan yang digunakan di Header
    const getUser = () => {
      try {
        const storedUser = localStorage.getItem('adminUser')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          if (userData.name) {
            setUserName(userData.name)
          }
        }
      } catch (error) {
        console.error('Error getting user data:', error)
      }
    }
    
    getUser()
    
    // Menambahkan event listener untuk perubahan di localStorage
    const handleStorageChange = () => {
      getUser()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, []);

  return (
    <AdminLayout>
      <WelcomeCard userName={userName} />
    </AdminLayout>
  )
}

export default AdminDashboard 