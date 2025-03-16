'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import WelcomeCard from '@/components/admin/WelcomeCard'
import DashboardStats from '@/components/admin/DashboardStats'

function AdminDashboard() {
  const [userName, setUserName] = useState('Admin')
  const [isLoading, setIsLoading] = useState(true)
  
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
        setIsLoading(false)
      } catch (error) {
        console.error('Error getting user data:', error)
        setIsLoading(false)
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
    <AdminLayout loading={isLoading}>
      <div className="grid grid-cols-1 gap-6">
        {/* Kartu Selamat Datang */}
        <WelcomeCard userName={userName} />
        
        {/* Status Koneksi */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Status Koneksi</h2>
          <DashboardStats />
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard 