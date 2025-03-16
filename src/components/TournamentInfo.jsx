import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TournamentInfo = ({ tournament, title, description, matches = [], onStartTournament, onFinalizeTournament, isProcessing }) => {
  const [participantsCount, setParticipantsCount] = useState(0);
  const [localIsProcessing, setLocalIsProcessing] = useState(false);
  const [localTournament, setLocalTournament] = useState(tournament);
  const [hasWinner, setHasWinner] = useState(false);

  // Tambahkan state untuk modal konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  // Tambahkan komponen ConfirmationModal
  const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isProcessing }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#2b2b2b] rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
          <p className="text-gray-300 mb-6">{message}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Memproses...
                </>
              ) : (
                'Konfirmasi'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fungsi untuk memperbarui data turnamen
  const refreshTournamentData = async () => {
    if (!tournament?.tournament?.id) return;

    try {
      // Ambil data turnamen terbaru
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('bracket_tournaments')
        .select('*')
        .eq('challonge_id', tournament.tournament.id)
        .single();

      if (tournamentError) throw tournamentError;

      setLocalTournament({
        tournament: {
          ...tournamentData,
          id: tournamentData.challonge_id,
          local_data: tournamentData
        }
      });

      // Ambil jumlah peserta
      const { count } = await supabase
        .from('bracket_participants')
        .select('*', { count: 'exact' })
        .eq('tournament_id', tournament.tournament.id);

      setParticipantsCount(count || 0);
    } catch (error) {
      console.error('Error refreshing tournament data:', error);
    }
  };

  useEffect(() => {
    refreshTournamentData();

    // Set interval untuk memperbarui data setiap 5 detik
    const interval = setInterval(refreshTournamentData, 5000);

    return () => clearInterval(interval);
  }, [tournament?.tournament?.id]);

  const handleFinalizeTournament = async () => {
    if (!tournament?.tournament?.id || localIsProcessing) return;

    setConfirmTitle("Selesaikan Turnamen");
    setConfirmMessage("Apakah Anda yakin ingin menyelesaikan turnamen ini? Aksi ini tidak dapat dibatalkan.");
    setConfirmAction(() => async () => {
      setLocalIsProcessing(true);
      try {
        const response = await fetch(`/api/challonge/${tournament.tournament.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'finalize' }),
        });

        if (!response.ok) {
          throw new Error('Gagal menyelesaikan turnamen');
        }

        if (onFinalizeTournament) {
          onFinalizeTournament();
        }

        // Reload halaman setelah 2 detik
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        setShowConfirmModal(false);
      } catch (error) {
        console.error('Error finalizing tournament:', error);
        alert('Gagal menyelesaikan turnamen. Silakan coba lagi.');
      } finally {
        setLocalIsProcessing(false);
      }
    });
    setShowConfirmModal(true);
  };

  // Format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Mendapatkan status turnamen dalam bahasa Indonesia
  const getTournamentStatus = (state) => {
    const statusMap = {
      pending: "Menunggu",
      underway: "Sedang Berlangsung",
      complete: "Selesai",
    };
    return statusMap[state] || state;
  };

  // Mendapatkan total pertandingan dari jumlah matches
  const getTotalMatches = (matches) => {
    if (!matches || !Array.isArray(matches)) return 0;
    return matches.length;
  };

  // Menentukan apakah harus menampilkan total pertandingan
  const shouldShowMatches = Array.isArray(matches) && matches.length > 0;

  // Mendapatkan warna status
  const getStatusColor = (state) => {
    const colorMap = {
      pending: "text-yellow-500",
      underway: "text-green-500",
      complete: "text-blue-500",
    };
    return colorMap[state] || "text-gray-500";
  };

  // Fungsi untuk mengecek apakah turnamen sudah memiliki pemenang
  const checkTournamentWinner = (matches) => {
    if (!matches || !Array.isArray(matches)) return false;
    
    // Cari pertandingan final (biasanya memiliki round tertinggi)
    const finalMatch = matches.reduce((highest, current) => {
      return (current.match.round > highest.match.round) ? current : highest;
    }, matches[0]);

    // Jika ada final match dan memiliki winner_id, berarti sudah ada pemenang
    return finalMatch && finalMatch.match.winner_id !== null;
  };

  useEffect(() => {
    // Update hasWinner setiap kali matches berubah
    setHasWinner(checkTournamentWinner(matches));
  }, [matches]);

  return (
    <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-[#363636] p-4 border-b border-[#404040]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {localTournament?.tournament?.name}
          </h1>
          <div className="flex items-center space-x-2">
            {localTournament?.tournament?.state === "pending" && (
              <button
                onClick={onStartTournament}
                disabled={isProcessing}
                className={`px-3 py-1 rounded-lg flex items-center space-x-1 ${
                  isProcessing
                    ? 'bg-green-600/50 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white text-sm`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Mulai</span>
              </button>
            )}
            {localTournament?.tournament?.state === "underway" && (
              <button
                onClick={handleFinalizeTournament}
                disabled={localIsProcessing || isProcessing || !hasWinner}
                className={`px-3 py-1 rounded-lg flex items-center space-x-1 ${
                  localIsProcessing || isProcessing || !hasWinner
                    ? 'bg-red-600/50 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white text-sm group relative`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                <span>{localIsProcessing ? 'Menyelesaikan...' : 'Selesai'}</span>
                {!hasWinner && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Belum ada pemenang
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-400 mt-2 text-sm">{description}</p>
      </div>

      {/* Info Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Peserta */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#404040] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#f26522]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Peserta</p>
              <p className="text-base font-bold text-white">
                {participantsCount} Peserta
              </p>
            </div>
          </div>

          {/* Total Pertandingan */}
          {shouldShowMatches && (
            <div className="flex items-center space-x-3">
              <div className="bg-[#404040] p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#f26522]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Pertandingan</p>
                <p className="text-base font-bold text-white">
                  {getTotalMatches(matches)}
                </p>
              </div>
            </div>
          )}

          {/* Game Type */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#404040] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#f26522]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tipe Game</p>
              <p className="text-base font-bold text-white">
                {localTournament?.tournament?.game_name || "Tidak Ada"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#404040] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#f26522]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <p className={`text-base font-bold ${getStatusColor(localTournament?.tournament?.state)}`}>
                {getTournamentStatus(localTournament?.tournament?.state)}
              </p>
            </div>
          </div>

          {/* Tanggal Dibuat */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#404040] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#f26522]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tanggal Dibuat</p>
              <p className="text-base font-bold text-white">
                {formatDate(localTournament?.tournament?.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tambahkan Modal Konfirmasi */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        isProcessing={localIsProcessing}
      />
    </div>
  );
};

export default TournamentInfo;
