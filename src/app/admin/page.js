'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'

function AdminDashboardContent() {
  const { isOpen } = useSidebar()

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <Sidebar />
      
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'sm:ml-64' : 'sm:ml-0'}`}>
        <Header />
        
        <main className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Selamat Datang di Dashboard Admin</h1>
            <p className="text-gray-400 text-sm md:text-base">Kami senang Anda di sini! Silakan jelajahi fitur-fitur yang tersedia untuk mengelola turnamen dan pengguna.</p>
          </div>

          <div className="bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-white">Apa yang ingin Anda lakukan hari ini?</h2>
            <p className="text-gray-400 text-sm md:text-base">Anda dapat mengelola turnamen, melihat statistik, dan banyak lagi.</p>
          </div>

          <div className="bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-white">Panduan Penggunaan</h2>
            <p className="text-gray-400 text-sm md:text-base">Jika Anda baru di sini, kami sarankan untuk memulai dengan membaca panduan penggunaan kami.</p>
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