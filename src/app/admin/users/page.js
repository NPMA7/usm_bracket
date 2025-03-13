'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import { SidebarProvider, useSidebar } from '@/context/SidebarContext'
import { supabase } from '@/lib/supabase'

function UsersManagementContent() {
  const router = useRouter()
  const { isOpen } = useSidebar()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalOwners: 0
  })

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

    fetchUsers()
  }, [])

  const calculateStats = (userData) => {
    const totalUsers = userData.filter(user => user.role === 'user').length
    const totalAdmins = userData.filter(user => user.role === 'admin').length
    const totalOwners = userData.filter(user => user.role === 'owner').length

    setStats({
      totalUsers,
      totalAdmins,
      totalOwners
    })
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let query = supabase.from('users').select('*')
      
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      setUsers(data)
      calculateStats(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser'))
      if (adminUser.role !== 'owner') {
        return
      }

      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const handleDeleteUser = async (userId) => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser'))
    if (adminUser.role !== 'owner') {
      alert('Hanya owner yang dapat menghapus pengguna')
      return
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.whatsapp?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#f26522] border-t-transparent shadow-lg"></div>
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
            <h1 className="text-2xl font-bold text-white mb-2">Manajemen Pengguna</h1>
            <p className="text-gray-400">Kelola semua pengguna dalam sistem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Kartu Total Users */}
            <div className="bg-[#2b2b2b] rounded-xl p-4 shadow-lg border border-gray-700 hover:border-blue-500 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total User</p>
                    <h3 className="text-2xl font-bold text-white">{stats.totalUsers}</h3>
                  </div>
                </div>
                <span className="text-xs text-blue-400">Pengguna Biasa</span>
              </div>
            </div>

            {/* Kartu Total Admins */}
            <div className="bg-[#2b2b2b] rounded-xl p-4 shadow-lg border border-gray-700 hover:border-purple-500 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Admin</p>
                    <h3 className="text-2xl font-bold text-white">{stats.totalAdmins}</h3>
                  </div>
                </div>
                <span className="text-xs text-purple-400">Administrator</span>
              </div>
            </div>

            {/* Kartu Total Owners */}
            <div className="bg-[#2b2b2b] rounded-xl p-4 shadow-lg border border-gray-700 hover:border-orange-500 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Owner</p>
                    <h3 className="text-2xl font-bold text-white">{stats.totalOwners}</h3>
                  </div>
                </div>
                <span className="text-xs text-orange-400">Super Admin</span>
              </div>
            </div>
          </div>

          <div className="bg-[#2b2b2b] rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Daftar Pengguna</h2>
                  <p className="text-gray-400 text-sm">{filteredUsers.length} pengguna terdaftar</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari pengguna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 bg-[#363636] text-gray-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value)
                    fetchUsers()
                  }}
                  className="px-4 py-2 bg-[#363636] text-gray-300 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Role</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#363636]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Kontak
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Terdaftar
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-[#2b2b2b]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#363636] transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.avatar}
                                alt={user.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-medium">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{user.email}</div>
                        <div className="text-sm text-gray-400">WA: {user.whatsapp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {JSON.parse(localStorage.getItem('adminUser'))?.role === 'owner' ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-sm text-gray-300 bg-[#363636] border border-gray-700 rounded-lg px-3 py-1 w-full max-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-3 py-1 text-sm rounded-lg
                            ${user.role === 'owner' ? 'bg-orange-500/20 text-orange-400' : 
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 
                              'bg-blue-500/20 text-blue-400'}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowModal(true)
                          }}
                          className="text-blue-500 hover:text-blue-400 mr-4 transition-colors duration-150"
                        >
                          Detail
                        </button>
                        {JSON.parse(localStorage.getItem('adminUser'))?.role === 'owner' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:text-red-400 transition-colors duration-150"
                          >
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modal Detail Pengguna */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#2b2b2b] rounded-xl p-6 max-w-2xl w-full mx-4 relative">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedUser(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center mb-6">
                <div className="h-16 w-16 flex-shrink-0">
                  {selectedUser.avatar ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-2xl font-medium">
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-white">{selectedUser.name}</h3>
                  <p className="text-gray-400">@{selectedUser.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="text-white">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">WhatsApp</label>
                    <p className="text-white">{selectedUser.whatsapp}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Role</label>
                    <p className={`px-3 w-20 py-1 text-sm text-center rounded-lg mt-1
                      ${selectedUser.role === 'owner' ? 'bg-orange-500/20 text-orange-400' : 
                        selectedUser.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 
                        'bg-blue-500/20 text-blue-400'}`}>
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Tanggal Registrasi</label>
                    <p className="text-white">
                      {new Date(selectedUser.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Tanggal Ulang Tahun</label>
                    <p className="text-white">
                      {selectedUser.birthdate ? 
                        new Date(selectedUser.birthdate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'Belum diatur'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Alamat</label>
                    <p className="text-white break-words">
                      {selectedUser.address || 'Belum diatur'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UsersManagement() {
  return (
    <SidebarProvider>
      <UsersManagementContent />
    </SidebarProvider>
  )
} 