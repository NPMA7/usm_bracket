'use client'
import { useState, useEffect } from 'react'

const DashboardStats = () => {
  // Hapus statistik website
  const [connections, setConnections] = useState({
    challonge: false,
    supabase: false
  })

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/connections')
        const data = await response.json()
        setConnections(data)
      } catch (error) {
        console.error('Error fetching connections:', error)
      }
    }

    fetchConnections()
    const interval = setInterval(fetchConnections, 30000) // Update koneksi setiap 30 detik

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-[#2b2b2b] rounded-xl p-5">
        <h3 className="text-white text-sm font-medium mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Status Koneksi API & Database
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1e1e1e] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Challonge API</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${connections.challonge ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {connections.challonge ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
          </div>
          <div className="bg-[#1e1e1e] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Supabase Database</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${connections.supabase ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {connections.supabase ? 'Terhubung' : 'Terputus'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardStats