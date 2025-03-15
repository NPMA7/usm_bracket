"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import ParticipantForm from "@/components/ParticipantForm";
import EditParticipantModal from "@/components/EditParticipantModal";
import DeleteParticipantModal from "@/components/DeleteParticipantModal";
import TournamentParticipantsList from "@/components/TournamentParticipantsList";
import TournamentInfo from "@/components/TournamentInfo";
import BracketImage from "@/components/BracketImage";
import StandingsTable from "@/components/StandingsTable";
import EditParticipantPositionModal from "@/components/EditParticipantPositionModal";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TournamentParticipants(props) {
  const router = useRouter();
  const params = use(props.params);
  const id = params.id;
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [standings, setStandings] = useState([]);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shuffleSuccess, setShuffleSuccess] = useState(false);
  const [bracketImageKey, setBracketImageKey] = useState(0);
  const [bracketOpacity, setBracketOpacity] = useState(1);
  const [isRefreshingBracket, setIsRefreshingBracket] = useState(false);

  // State untuk modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Tambahkan state untuk dropdown
  const [activeDropdown, setActiveDropdown] = useState(null);

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

  // Fungsi untuk memperbarui data
  const refreshData = async () => {
    if (!id) return;

    try {
      // Fetch tournament details from database
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('bracket_tournaments')
        .select('*')
        .eq('challonge_id', id)
        .single();
      
      if (tournamentError) {
        throw new Error("Gagal mengambil data turnamen dari database");
      }
      
      // Format data untuk kompatibilitas dengan komponen yang ada
      const formattedTournament = {
        tournament: {
          ...tournamentData,
          id: tournamentData.challonge_id,
          local_data: tournamentData
        }
      };
      
      setTournament(formattedTournament);

      // Fetch participants from database
      const { data: participantsData, error: participantsError } = await supabase
        .from('bracket_participants')
        .select('*')
        .eq('tournament_id', id)
        .order('seed', { nullsLast: true });
      
      if (participantsError) {
        throw new Error("Gagal mengambil data peserta dari database");
      }
      
      // Format data untuk kompatibilitas dengan komponen yang ada
      const formattedParticipants = participantsData.map(participant => ({
        participant: {
          ...participant,
          id: participant.challonge_id,
          tournament_id: participant.tournament_id,
          local_data: participant
        }
      }));
      
      setParticipants(formattedParticipants);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    // Cek apakah user adalah admin
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const userData = JSON.parse(adminUser);
      setUser(userData);
      if (!['admin', 'owner'].includes(userData.role)) {
        router.push(`/tournament/${id}`);
      }
    } else {
      router.push(`/tournament/${id}`);
    }
  }, [id, router]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      await refreshData();
      setIsLoading(false);
    };

    fetchInitialData();

    // Set interval untuk memperbarui data setiap 5 detik
    const interval = setInterval(refreshData, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // Tambahkan useEffect untuk interval refresh standings
  useEffect(() => {
    if (!id) return;

    if (tournament?.tournament?.state === "complete") {
      return;
    }

    // Jangan jalankan interval jika modal edit posisi sedang terbuka
    if (positionModalOpen) {
      return;
    }

    // Interval untuk standings
    const standingsIntervalId = setInterval(() => {
      fetchStandingsQuiet(id);
    }, 5000); // Diubah menjadi 5 detik

    // Interval untuk daftar peserta
    const participantsIntervalId = setInterval(() => {
      fetchParticipants();
    }, 5000);

    return () => {
      clearInterval(standingsIntervalId);
      clearInterval(participantsIntervalId);
    };
  }, [id, tournament?.tournament?.state, positionModalOpen]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch tournament details from bracket_tournaments
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('bracket_tournaments')
          .select('*')
          .eq('challonge_id', id)
          .single();

        if (tournamentError) {
          console.error('Tournament Error:', tournamentError);
          throw new Error("Gagal mengambil data turnamen dari database. Silakan coba lagi nanti.");
        }

        if (!tournamentData) {
          throw new Error("Turnamen tidak ditemukan. Pastikan ID turnamen benar.");
        }

        // Format data untuk kompatibilitas dengan komponen yang ada
        const formattedTournament = {
          tournament: {
            ...tournamentData,
            id: tournamentData.challonge_id,
            challonge_id: tournamentData.challonge_id,
            local_data: tournamentData
          }
        };

        setTournament(formattedTournament);
        setTournamentStarted(tournamentData.state !== "pending");

        // Fetch participants and standings
        await Promise.all([
          fetchParticipants(),
          fetchStandings(id)
        ]);

      } catch (err) {
        console.error('Fetch Error:', err);
        setError(err.message || "Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, refreshTrigger]);

  const fetchParticipants = async () => {
    try {
        const { data: participantsData, error: participantsError } = await supabase
          .from('bracket_participants')
          .select('*')
          .eq('tournament_id', id)
          .order('seed', { nullsLast: true });

        if (participantsError) {
          throw new Error("Gagal mengambil data peserta dari database");
        }

        const formattedParticipants = participantsData.map(participant => ({
          id: participant.challonge_id,
          participant_id: participant.challonge_id,
          name: participant.name || "",
          seed: participant.seed,
          final_rank: participant.final_rank,
          original_data: participant
        }));

        setParticipants(formattedParticipants);
      } catch (err) {
      console.error('Participants Error:', err);
      throw err;
    }
  };

  const fetchStandingsQuiet = async (tournamentId) => {
    try {
      // Ambil data peserta
      const { data: participantsData, error: participantsError } = await supabase
        .from('bracket_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { nullsLast: true });

      if (participantsError) {
        throw new Error("Gagal mengambil data peserta");
      }

      // Ambil data pertandingan
      const { data: matchesData, error: matchesError } = await supabase
        .from('bracket_matches')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (matchesError) {
        throw new Error("Gagal mengambil data pertandingan");
      }

      // Format data peserta
      const formattedParticipants = participantsData.map(participant => ({
        participant: {
          ...participant,
          id: participant.challonge_id,
          tournament_id: participant.tournament_id,
          wins: 0,
          losses: 0,
          matches_played: 0,
          score_difference: 0
        }
      }));

      // Hitung statistik dari pertandingan
      matchesData.forEach(match => {
        if (match.state === 'complete') {
          const winner = match.winner_id;
          const loser = match.loser_id;
          
          // Update statistik pemenang
          const winnerStanding = formattedParticipants.find(s => s.participant.id === winner);
          if (winnerStanding) {
            winnerStanding.participant.wins += 1;
            winnerStanding.participant.matches_played += 1;
          }

          // Update statistik yang kalah
          const loserStanding = formattedParticipants.find(s => s.participant.id === loser);
          if (loserStanding) {
            loserStanding.participant.losses += 1;
            loserStanding.participant.matches_played += 1;
          }

          // Hitung selisih skor jika ada
          if (match.scores_csv) {
            const scores = match.scores_csv.split(',').map(score => {
              const [score1, score2] = score.split('-').map(Number);
              return { score1, score2 };
            });

            if (winnerStanding && loserStanding) {
              const totalScore1 = scores.reduce((sum, s) => sum + s.score1, 0);
              const totalScore2 = scores.reduce((sum, s) => sum + s.score2, 0);
              winnerStanding.participant.score_difference += Math.max(totalScore1, totalScore2);
              loserStanding.participant.score_difference += Math.min(totalScore1, totalScore2);
            }
          }
        }
      });

      // Urutkan standings berdasarkan:
      // 1. Jumlah kemenangan (descending)
      // 2. Selisih skor (descending)
      // 3. Jumlah pertandingan (ascending)
      const sortedStandings = formattedParticipants.sort((a, b) => {
        if (a.participant.wins !== b.participant.wins) {
          return b.participant.wins - a.participant.wins;
        }
        if (a.participant.score_difference !== b.participant.score_difference) {
          return b.participant.score_difference - a.participant.score_difference;
        }
        return a.participant.matches_played - b.participant.matches_played;
      });

      setStandings(sortedStandings);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error fetching standings quietly:", err);
    }
  };

  const fetchStandings = async (tournamentId) => {
    setIsLoadingStandings(true);
    try {
      // Gunakan fungsi yang sama dengan fetchStandingsQuiet
      await fetchStandingsQuiet(tournamentId);
    } catch (err) {
      console.error("Error fetching standings:", err);
    } finally {
      setIsLoadingStandings(false);
    }
  };

  const handleShuffleTournament = async () => {
    if (!id || isProcessing) return;

    setConfirmTitle("Acak Urutan Peserta");
    setConfirmMessage("Apakah Anda yakin ingin mengacak urutan peserta? Ini akan mengubah bracket turnamen.");
    setConfirmAction(() => async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/challonge/tournaments/${id}/shuffle`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Gagal mengacak peserta turnamen");
        }

        setShuffleSuccess(true);
        setTimeout(() => setShuffleSuccess(false), 3000);
        
        setBracketImageKey((prevKey) => prevKey + 1);
        await fetchStandings(id);
        setRefreshTrigger((prev) => prev + 1);
        setShowConfirmModal(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleEditPositionSuccess = async () => {
    setBracketImageKey((prevKey) => prevKey + 1);
    await Promise.all([
      fetchParticipants(),
      fetchStandings(id)
    ]);
    setPositionModalOpen(false);
  };

  const handleParticipantAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEditClick = (participant) => {
    setSelectedParticipant(participant);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (participant) => {
    setSelectedParticipant(participant);
    setDeleteModalOpen(true);
  };

  const handleEditPositions = () => {
    setPositionModalOpen(true);
  };

  const handlePositionsUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setPositionModalOpen(false);
  };

  const handleParticipantUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setEditModalOpen(false);
  };

  const handleParticipantDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
    setDeleteModalOpen(false);
  };

  const handleStartTournament = async () => {
    if (!id || isProcessing) return;

    setConfirmTitle("Mulai Turnamen");
    setConfirmMessage("Apakah Anda yakin ingin memulai turnamen? Peserta tidak dapat ditambah atau dihapus setelah turnamen dimulai.");
    setConfirmAction(() => async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/challonge/tournaments/${id}/start`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Gagal memulai turnamen");
        }

        setTournamentStarted(true);
        setRefreshTrigger((prev) => prev + 1);
        setShowConfirmModal(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleFinalizeTournament = async () => {
    if (!id || isProcessing) return;

    setConfirmTitle("Selesaikan Turnamen");
    setConfirmMessage("Apakah Anda yakin ingin menyelesaikan turnamen? Tindakan ini tidak dapat dibatalkan.");
    setConfirmAction(() => async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/challonge/tournaments/${id}/finalize`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Gagal menyelesaikan turnamen");
        }

        setRefreshTrigger((prev) => prev + 1);
        setShowConfirmModal(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleRefreshBracket = async () => {
    setIsRefreshingBracket(true);
    setBracketOpacity(0);
    await new Promise(resolve => setTimeout(resolve, 300));
    setBracketImageKey(prev => prev + 1);
    setBracketOpacity(1);
    setTimeout(() => {
      setIsRefreshingBracket(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent mb-4"></div>
        <p className="text-white">Memuat data...</p>
      </div>
    </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          <TournamentInfo
            tournament={tournament}
            description="Kelola peserta untuk turnamen ini"
            onStartTournament={handleStartTournament}
            onFinalizeTournament={handleFinalizeTournament}
            isProcessing={isProcessing}
          />
        </div>

        {/* Action Buttons */}
        {tournament?.tournament?.state === "pending" && participants.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setPositionModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Edit Posisi Tim'
                )}
              </button>
              <button
                onClick={handleShuffleTournament}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    <span>Sedang Mengacak...</span>
                  </>
                ) : (
                  'Shuffle Tim'
                )}
              </button>
            </div>
            {shuffleSuccess && (
              <div className="text-green-400 text-sm text-center mt-2">
                Berhasil mengacak urutan peserta!
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Kolom Kiri: Tambah Peserta dan Daftar Peserta */}
          <div className="space-y-8">
            {/* Form Section */}
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6 md:h-[90vh] flex flex-col">
              <div 
                className="flex items-center justify-between mb-6 cursor-pointer md:cursor-default"
                onClick={() => setActiveDropdown(activeDropdown === 'form' ? null : 'form')}
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#f26522] mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white">Tambah Peserta</h2>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-gray-400 transition-transform md:hidden ${activeDropdown === 'form' ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${activeDropdown === 'form' || window.innerWidth >= 768 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 md:max-h-[500px] md:opacity-100'}`}>
                {tournament?.tournament?.state !== "pending" ? (
                  <div className="bg-[#3b3b3b] rounded-lg p-6 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto mb-4 text-gray-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-gray-400 mb-2">
                      Penambahan peserta dinonaktifkan
                    </p>
                    <p className="text-sm text-gray-500">
                      {tournament?.tournament?.state === "underway"
                        ? "Turnamen sedang berlangsung"
                        : tournament?.tournament?.state === "awaiting_review"
                        ? "Turnamen sedang menunggu review"
                        : "Turnamen telah selesai"}
                    </p>
                  </div>
                ) : (
                  <ParticipantForm
                    tournamentId={id}
                    onParticipantAdded={handleParticipantAdded}
                  />
                )}
              </div>
            </div>

            {/* List Section */}
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6 md:h-[400px] flex flex-col">
              <div 
                className="flex items-center justify-between mb-6 cursor-pointer md:cursor-default"
                onClick={() => setActiveDropdown(activeDropdown === 'list' ? null : 'list')}
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#f26522] mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white">
                    Daftar Peserta
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-[#3b3b3b] text-gray-400 px-3 py-1 rounded-full text-sm">
                    {participants.length} Peserta
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 text-gray-400 transition-transform md:hidden ${activeDropdown === 'list' ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${activeDropdown === 'list' || window.innerWidth >= 768 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 md:max-h-[500px] md:opacity-100'}`}>
                <TournamentParticipantsList
                  participants={participants}
                  tournament={tournament}
                  onEditClick={handleEditClick}
                  onDeleteClick={handleDeleteClick}
                />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Bracket dan Standings */}
          <div className="space-y-8">
            {/* Bracket Preview Section */}
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6 h-[70vh] md:h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#f26522] mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white">
                    Preview Bracket
                  </h2>
                </div>
                <button
                  onClick={handleRefreshBracket}
                  disabled={isRefreshingBracket}
                  className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${isRefreshingBracket ? 'animate-spin' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{isRefreshingBracket ? 'Memuat...' : 'Refresh'}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tournament?.tournament ? (
                  <div style={{
                    transition: 'opacity 0.3s ease-in-out',
                    opacity: bracketOpacity
                  }}>
                    <BracketImage 
                      tournamentId={tournament.tournament.challonge_id} 
                      refreshKey={bracketImageKey}
                      isAdmin={true}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-gray-500 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-gray-400">Preview bracket tidak tersedia</p>
                  </div>
                )}
              </div>
            </div>

            {/* Standings Section */}
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6 h-[400px] flex flex-col">
              <div className="flex items-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#f26522] mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  Standings
                  {lastRefreshed && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Diperbarui {lastRefreshed.toLocaleTimeString("id-ID")})
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <StandingsTable
                  standings={standings}
                  isLoading={isLoadingStandings}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedParticipant && (
        <EditParticipantModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          participant={selectedParticipant}
          tournamentId={id}
          onParticipantUpdated={handleParticipantUpdated}
        />
      )}

      {selectedParticipant && (
        <DeleteParticipantModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          participant={selectedParticipant}
          tournamentId={id}
          onParticipantDeleted={handleParticipantDeleted}
        />
      )}

      <EditParticipantPositionModal
        isOpen={positionModalOpen}
        onClose={() => setPositionModalOpen(false)}
        tournament={tournament}
        participants={participants}
        onPositionsUpdated={handleEditPositionSuccess}
      />

      {/* Tambahkan Modal Konfirmasi */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        isProcessing={isProcessing}
      />
    </div>
  </AdminLayout>
  );
} 