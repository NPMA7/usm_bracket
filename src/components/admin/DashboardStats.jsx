'use client'
import { useState, useEffect } from 'react'

const DashboardStats = () => {
  const [stats, setStats] = useState({
    currentVisitors: 0,
    pageViews: 0,
    avgLoadTime: 0,
    bounceRate: 0,
    connections: {
      challonge: false,
      supabase: false
    }
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Update statistik setiap 5 detik

    return () => clearInterval(interval)
  }, [])

  // Data untuk statistik
  const statCards = [
    {
      title: 'Pengunjung Saat Ini',
      value: stats.currentVisitors,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      bgColor: 'bg-blue-600'
    },
    {
      title: 'Total Kunjungan',
      value: stats.pageViews,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      bgColor: 'bg-purple-600'
    },
    {
      title: 'Rata-rata Waktu Loading',
      value: `${stats.avgLoadTime}s`,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      bgColor: 'bg-green-600'
    },
    {
      title: 'Bounce Rate',
      value: `${stats.bounceRate}%`,
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" 
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      bgColor: 'bg-red-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-4 text-white`}>
            <div className="flex items-center mb-2">
              <div className="mr-3">
                {stat.icon}
              </div>
              <h3 className="text-sm font-medium">{stat.title}</h3>
            </div>
            <p className="text-4xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#2b2b2b] rounded-xl p-5">
        <h3 className="text-white text-sm font-medium mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Status Koneksi API & Database
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#3a3a3a] rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stats.connections.challonge ? 'bg-green-500' : 'bg-red-500'} mr-3`}></div>
              <span className="text-white">Challonge API</span>
            </div>
            <span className={`px-3 py-1 ${stats.connections.challonge ? 'bg-green-500' : 'bg-red-500'} rounded-full text-xs font-medium text-white`}>
              {stats.connections.challonge ? 'Terhubung' : 'Tidak Terhubung'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#3a3a3a] rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stats.connections.supabase ? 'bg-green-500' : 'bg-red-500'} mr-3`}></div>
              <span className="text-white">Supabase Database</span>
            </div>
            <span className={`px-3 py-1 ${stats.connections.supabase ? 'bg-green-500' : 'bg-red-500'} rounded-full text-xs font-medium text-white`}>
              {stats.connections.supabase ? 'Terhubung' : 'Tidak Terhubung'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardStats