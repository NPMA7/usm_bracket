'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import StatCard from '@/components/admin/StatCard'
import SearchFilter from '@/components/admin/SearchFilter'
import UserTable from '@/components/admin/UserTable'
import UserModal from '@/components/admin/UserModal'
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal'
import { supabase } from '@/lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

function UsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalOwners: 0
  })
  const [isOwner, setIsOwner] = useState(false)

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

  const fetchUsers = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      
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

  useEffect(() => {
    // Periksa status login dan role
    const adminUser = localStorage.getItem('adminUser')
    if (adminUser) {
      const user = JSON.parse(adminUser)
      setIsOwner(user.role === 'owner')
    }

    // Initial fetch dengan loading
    fetchUsers(true)

    // Set interval untuk fetch data setiap 5 detik
    const interval = setInterval(() => {
      // Fetch data tanpa loading
      fetchUsers(false)
    }, 5000)

    // Cleanup interval ketika component unmount
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Ketika roleFilter berubah, fetch tanpa loading
    fetchUsers(false)
  }, [roleFilter])

  const handleRoleChange = async (userId, newRole) => {
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser'))
      if (adminUser.role !== 'owner') {
        toast.error('Hanya owner yang dapat mengubah role pengguna')
        return
      }

      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Refresh users list tanpa loading
      fetchUsers(false)
      toast.success('Role pengguna berhasil diubah')
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Gagal mengubah role pengguna')
    }
  }

  const handleDeleteUser = async (userId) => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser'))
    if (adminUser.role !== 'owner') {
      toast.error('Hanya owner yang dapat menghapus pengguna')
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus pengguna');
      }

      // Refresh users list tanpa loading
      fetchUsers(false)
      setShowDeleteModal(false)
      setUserToDelete(null)
      toast.success('Pengguna berhasil dihapus')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.whatsapp?.includes(searchTerm)
  )

  const roleFilterOptions = [
    { value: 'all', label: 'Semua Role' },
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
    { value: 'owner', label: 'Owner' }
  ]

  return (
    <AdminLayout 
      title="Manajemen Pengguna" 
      subtitle="Kelola semua pengguna dalam sistem"
      loading={loading}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" />
              <path d="M10 4a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          }
          title="Total Pengguna"
          value={stats.totalUsers + stats.totalAdmins + stats.totalOwners}
          subtitle="Semua Pengguna"
          bgColor="bg-green-500/20"
          iconColor="text-green-500"
        />

        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          }
          title="Total User"
          value={stats.totalUsers}
          subtitle="Pengguna Biasa"
          bgColor="bg-blue-500/20"
          iconColor="text-blue-500"
          subtitleColor="text-blue-400"
        />

        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          }
          title="Total Admin"
          value={stats.totalAdmins}
          subtitle="Administrator"
          bgColor="bg-purple-500/20"
          iconColor="text-purple-500"
          subtitleColor="text-purple-400"
        />

        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          }
          title="Total Owner"
          value={stats.totalOwners}
          subtitle="Super Admin"
          bgColor="bg-orange-500/20"
          iconColor="text-orange-500"
          subtitleColor="text-orange-400"
        />
      </div>

      <div className="bg-[#2b2b2b] rounded-xl shadow-lg p-4 sm:p-6">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterValue={roleFilter}
          onFilterChange={setRoleFilter}
          filterOptions={roleFilterOptions}
          searchPlaceholder="Cari pengguna..."
        />

        <UserTable
          users={filteredUsers}
          onViewDetails={(user) => {
            setSelectedUser(user)
            setShowModal(true)
          }}
          onDeleteUser={(user) => {
            setUserToDelete(user)
            setShowDeleteModal(true)
          }}
          onRoleChange={handleRoleChange}
          isOwner={isOwner}
        />
      </div>

      <UserModal
        user={selectedUser}
        onClose={() => {
          setShowModal(false)
          setSelectedUser(null)
        }}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setUserToDelete(null)
        }}
        onConfirm={() => handleDeleteUser(userToDelete.id)}
        itemName={userToDelete?.name}
        isLoading={isDeleting}
      />
    </AdminLayout>
  )
}

export default UsersManagement 