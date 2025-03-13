'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import DashboardStats from '@/components/admin/DashboardStats'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'

function AdminDashboardContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const { isOpen } = useSidebar()

  useEffect(() => {
    // Periksa status login
    const adminUser = localStorage.getItem('adminUser')
    if (!adminUser) {
      window.location.href = '/login'
      return
    }

    const user = JSON.parse(adminUser)
    if (!['admin', 'owner'].includes(user.role)) {
      localStorage.removeItem('adminUser')
      window.location.href = '/login'
      return
    }

    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'sm:ml-64' : 'sm:ml-0'}`}>
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Selamat Datang di Dashboard Admin</h1>
            <p className="text-gray-400">Kelola turnamen dan pengguna dari satu tempat</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#2b2b2b] rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-400">Total Pengguna</span>
              </div>
              <h3 className="text-2xl font-bold text-white">1,234</h3>
              <p className="text-green-500 text-sm mt-2">+12% dari bulan lalu</p>
            </div>

            <div className="bg-[#2b2b2b] rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-400">Turnamen Aktif</span>
              </div>
              <h3 className="text-2xl font-bold text-white">23</h3>
              <p className="text-orange-500 text-sm mt-2">5 turnamen baru</p>
            </div>

            <div className="bg-[#2b2b2b] rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-400">Total Pertandingan</span>
              </div>
              <h3 className="text-2xl font-bold text-white">789</h3>
              <p className="text-purple-500 text-sm mt-2">45 hari terakhir</p>
            </div>

            <div className="bg-[#2b2b2b] rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-400">Tingkat Penyelesaian</span>
              </div>
              <h3 className="text-2xl font-bold text-white">92%</h3>
              <p className="text-green-500 text-sm mt-2">Naik 3% dari minggu lalu</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#2b2b2b] rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Turnamen Terbaru</h2>
                <button className="text-blue-500 hover:text-blue-400 text-sm">Lihat Semua</button>
              </div>
              <div className="space-y-4">
                {/* Placeholder untuk daftar turnamen */}
                <div className="flex items-center justify-between p-4 bg-[#363636] rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Turnamen Mobile Legends</h3>
                      <p className="text-gray-400 text-sm">32 Tim Terdaftar</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">2 jam yang lalu</span>
                </div>
              </div>
            </div>

            <div className="bg-[#2b2b2b] rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Aktivitas Terkini</h2>
                <button className="text-blue-500 hover:text-blue-400 text-sm">Lihat Semua</button>
              </div>
              <div className="space-y-4">
                {/* Placeholder untuk aktivitas */}
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-white">Tim Baru Terdaftar</p>
                    <p className="text-gray-400 text-sm">Tim XYZ bergabung dalam turnamen</p>
                  </div>
                  <span className="text-gray-400 text-sm ml-auto">5 menit yang lalu</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <AdminDashboardContent />
    </SidebarProvider>
  )
} 