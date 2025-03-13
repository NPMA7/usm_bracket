import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTournaments: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact' })

      // Get total admins
      const { count: totalAdmins } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .in('role', ['admin', 'owner'])

      // Get verified users
      const { count: verifiedUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('email_verified', true)

      // Get total tournaments
      const { count: totalTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact' })

      setStats({
        totalUsers: totalUsers || 0,
        totalAdmins: totalAdmins || 0,
        totalTournaments: totalTournaments || 0
      })
    }

    fetchStats()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Total Users</div>
        <div className="mt-2 text-3xl font-semibold text-gray-900">
          {stats.totalUsers}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Total Admin</div>
        <div className="mt-2 text-3xl font-semibold text-gray-900">
          {stats.totalAdmins}
        </div>
      </div>
   

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm font-medium text-gray-500">Total Turnamen</div>
        <div className="mt-2 text-3xl font-semibold text-gray-900">
          {stats.totalTournaments}
        </div>
      </div>
    </div>
  )
} 