'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import EditTournamentActionsModal from '@/components/EditTournamentActionsModal';
import { formatDateIndonesia } from '@/lib/utils';

export default function TournamentOptions() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament && showDetailModal) {
      fetchParticipantsCount(selectedTournament.id);
    }
  }, [selectedTournament, showDetailModal]);

  const fetchParticipantsCount = async (tournamentId) => {
    try {
      const { count, error } = await supabase
        .from('bracket_participants')
        .select('*', { count: 'exact' })
        .eq('tournament_id', tournamentId);

      if (error) throw error;
      setParticipantsCount(count || 0);
    } catch (err) {
      console.error('Error fetching participants count:', err);
    }
  };

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bracket_tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data);
    } catch (err) {
      setError('Gagal mengambil data turnamen');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (tournament) => {
    setSelectedTournament(tournament);
    setShowEditModal(true);
  };

  const handleShowDetail = (tournament) => {
    setSelectedTournament(tournament);
    setShowDetailModal(true);
  };

  return (
    <AdminLayout
      loading={isLoading}
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-gaming">Daftar Turnamen</h1>
            <p className="text-gray-400 text-lg">
              Kelola semua turnamen yang ada di sistem
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-6 py-4 rounded-lg flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="bg-[#2b2b2b] rounded-xl shadow-2xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-[#232323]">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nama Turnamen
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Game
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#2b2b2b] divide-y divide-gray-800">
                {tournaments.map((tournament) => (
                  <tr key={tournament.id} className="hover:bg-[#333333] transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{tournament.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {tournament.game_name || 'Tidak ditentukan'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full
                        ${tournament.state === 'complete' ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 
                          tournament.state === 'underway' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' : 
                          'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full
                          ${tournament.state === 'complete' ? 'bg-green-400' : 
                            tournament.state === 'underway' ? 'bg-blue-400' : 
                            'bg-yellow-400'}`}></span>
                        {tournament.state === 'complete' ? 'Selesai' :
                         tournament.state === 'underway' ? 'Berlangsung' :
                         'Menunggu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      
                      <button
                        onClick={() => handleShowDetail(tournament)}
                        className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Detail
                      </button>
                      <button
                        onClick={() => handleEditClick(tournament)}
                        className="inline-flex items-center gap-1.5 text-[#f26522] hover:text-[#f26522]/80 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Turnamen */}
      {showDetailModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2b2b2b] rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-gray-800">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Detail Turnamen</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Nama Turnamen</p>
                  <p className="text-white font-medium">{selectedTournament.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Game</p>
                  <p className="text-white font-medium">{selectedTournament.game_name || 'Tidak ditentukan'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tipe Turnamen</p>
                  <p className="text-white font-medium">{selectedTournament.tournament_type}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-medium rounded-full mt-1
                    ${selectedTournament.state === 'complete' ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 
                      selectedTournament.state === 'underway' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' : 
                      'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full
                      ${selectedTournament.state === 'complete' ? 'bg-green-400' : 
                        selectedTournament.state === 'underway' ? 'bg-blue-400' : 
                        'bg-yellow-400'}`}></span>
                    {selectedTournament.state === 'complete' ? 'Selesai' :
                     selectedTournament.state === 'underway' ? 'Berlangsung' :
                     'Menunggu'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Jumlah Peserta</p>
                  <p className="text-white font-medium">{participantsCount} Peserta</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tanggal Dibuat</p>
                  <p className="text-white font-medium">{formatDateIndonesia(selectedTournament.created_at)}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Link
                  href={`/admin/tournament/${selectedTournament.id}/participants`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Kelola Peserta
                </Link>
                <Link
                  href={`/admin/tournament/${selectedTournament.id}/matches`}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Kelola Pertandingan
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <EditTournamentActionsModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        tournament={selectedTournament}
        onSuccess={fetchTournaments}
      />
    </AdminLayout>
  );
}

