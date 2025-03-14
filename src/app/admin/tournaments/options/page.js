"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateTournamentForm from "@/components/CreateTournamentForm";
import TournamentList from "@/components/TournamentList";
import AdminLayout from "@/components/admin/AdminLayout";
import EditTournamentModal from "@/components/EditTournamentModal";

export default function TournamentOptions() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  // Mendeteksi ukuran layar
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px adalah breakpoint untuk md di Tailwind
    };
    
    // Cek ukuran layar saat komponen dimuat
    checkScreenSize();
    
    // Set form terbuka secara default untuk layar md ke atas
    if (!isMobile) {
      setIsFormOpen(true);
    }
    
    // Tambahkan event listener untuk resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isMobile]);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const userData = JSON.parse(adminUser);
      setUser(userData);
      setIsAdmin(userData.role === 'owner');
      if (userData.role !== 'owner') {
        router.push('/admin/tournaments');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    fetchTournaments();
  }, [refreshTrigger]);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/challonge');
      if (!response.ok) {
        throw new Error('Gagal mengambil data turnamen');
      }
      const data = await response.json();
      setTournaments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tournamentId, tournamentName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus turnamen "${tournamentName}"?`)) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch(`/api/challonge/${tournamentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal menghapus turnamen');
      }

      // Refresh daftar turnamen
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (tournament) => {
    setSelectedTournament(tournament.tournament);
    setEditModalOpen(true);
  };

  const handleTournamentUpdated = (data) => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTournamentCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setIsFormOpen(false);
  };

  // Fungsi untuk toggle form hanya jika di mobile
  const toggleForm = () => {
    if (isMobile) {
      setIsFormOpen(!isFormOpen);
    }
  };

  return (
    <AdminLayout 
      loading={isLoading}
      requireOwner={true}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - Only show for owner */}
          {isAdmin && (
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
              <div className={`flex items-center mb-6 ${isMobile ? 'cursor-pointer' : ''}`} onClick={toggleForm}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 text-[#f26522] mr-2 ${isFormOpen ? 'rotate-45 transition-transform duration-200' : ''} ${!isMobile ? 'hidden md:block' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-white">
                  Buat Turnamen Baru
                </h2>
              </div>

              {(isFormOpen || !isMobile) && (
                <CreateTournamentForm onTournamentCreated={handleTournamentCreated} />
              )}
            </div>
          )}

          {/* List Section */}
          <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#f26522] mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white">
                    Daftar Turnamen
                  </h2>
                </div>
                <span className="bg-[#3b3b3b] text-gray-400 px-3 py-1 rounded-full text-sm">
                  {tournaments.length} Turnamen
                </span>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {deleteError && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
                  {deleteError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nama Turnamen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Game
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Peserta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {tournaments.map((t) => (
                      <tr key={t.tournament.id} className="hover:bg-[#3b3b3b] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                          {t.tournament.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {t.tournament.tournament_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {t.tournament.game_name || 'Tidak ditentukan'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${t.tournament.state === 'complete' ? 'bg-green-900 text-green-200' : 
                              t.tournament.state === 'underway' ? 'bg-blue-900 text-blue-200' : 
                              'bg-yellow-900 text-yellow-200'}`}>
                            {t.tournament.state === 'complete' ? 'Selesai' :
                             t.tournament.state === 'underway' ? 'Berlangsung' :
                             'Menunggu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {t.tournament.participants_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-3">
                          <button
                            onClick={() => handleEdit(t)}
                            className="text-blue-500 hover:text-blue-400 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t.tournament.id, t.tournament.name)}
                            disabled={isDeleting || t.tournament.state !== 'pending'}
                            className={`text-red-500 hover:text-red-400 transition-colors ${
                              (isDeleting || t.tournament.state !== 'pending') ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {tournaments.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-400">
                  Belum ada turnamen yang dibuat.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit Turnamen */}
      <EditTournamentModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        tournament={selectedTournament}
        onSuccess={handleTournamentUpdated}
      />
    </AdminLayout>
  );
}