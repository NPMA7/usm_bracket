"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import MatchesFilter from "@/components/MatchesFilter";
import MatchesTable from "@/components/MatchesTable";
import UpdateMatchForm from "@/components/UpdateMatchForm";
import TournamentInfo from "@/components/TournamentInfo";
import StandingsTable from "@/components/StandingsTable";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentWIBTime } from '@/lib/utils';

export default function TournamentMatches(props) {
  const router = useRouter();
  const params = use(props.params);
  const id = params.id;
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scores, setScores] = useState([{ player1: 0, player2: 0 }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  // Tambahkan state untuk modal konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  // Fungsi untuk menghitung standings
  const calculateStandings = (participants, matches) => {
    if (!participants || !matches) return [];

    // Inisialisasi data standings
    const standingsData = participants.map(p => ({
      participant: {
        ...p.participant,
        wins: 0,
        losses: 0,
        matches_played: 0,
        score_difference: 0
      }
    }));

    // Hitung statistik dari matches
    matches.forEach(match => {
      if (match.match.state === 'complete') {
        const winner = match.match.winner_id;
        const loser = match.match.loser_id;
        
        // Update statistik pemenang
        const winnerStanding = standingsData.find(s => s.participant.id === winner);
        if (winnerStanding) {
          winnerStanding.participant.wins += 1;
          winnerStanding.participant.matches_played += 1;
        }

        // Update statistik yang kalah
        const loserStanding = standingsData.find(s => s.participant.id === loser);
        if (loserStanding) {
          loserStanding.participant.losses += 1;
          loserStanding.participant.matches_played += 1;
        }

        // Hitung selisih skor jika ada
        if (match.match.scores_csv) {
          const scores = match.match.scores_csv.split(',').map(score => {
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
    return standingsData.sort((a, b) => {
      if (a.participant.wins !== b.participant.wins) {
        return b.participant.wins - a.participant.wins;
      }
      if (a.participant.score_difference !== b.participant.score_difference) {
        return b.participant.score_difference - a.participant.score_difference;
      }
      return a.participant.matches_played - b.participant.matches_played;
    });
  };

  // Modifikasi refreshData untuk menghitung standings
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

      // Format tournament data
      const formattedTournament = {
        tournament: {
          ...tournamentData,
          id: tournamentData.challonge_id,
          local_data: tournamentData
        }
      };
      
      setTournament(formattedTournament);

      // Ambil data langsung dari API Challonge
      const challongeResponse = await fetch(`/api/challonge/tournaments/${id}/matches`);
      if (!challongeResponse.ok) {
        throw new Error("Gagal mengambil data dari API Challonge");
      }
      const challongeData = await challongeResponse.json();

      // Fungsi untuk mendapatkan nama ronde
      const getRoundName = (round) => {
        if (round > 0) {
          return `Ronde ${round}`;
        } else if (round === 0) {
          return 'Loser 0';
        } else {
          // Untuk ronde negatif (biasanya untuk bracket yang kalah)
          return `Loser ${Math.abs(round)}`;
        }
      };

      // Format matches data langsung dari Challonge
      const formattedMatches = challongeData.map(matchData => ({
        match: {
          ...matchData.match,
          id: matchData.match.id,
          tournament_id: id,
          state: matchData.match.state || 'pending',
          round: matchData.match.round,
          round_name: getRoundName(matchData.match.round),
          player1_id: matchData.match.player1_id,
          player2_id: matchData.match.player2_id,
          winner_id: matchData.match.winner_id,
          loser_id: matchData.match.loser_id,
          scores_csv: matchData.match.scores_csv,
          suggested_play_order: matchData.match.suggested_play_order
        }
      }));
      
      setMatches(formattedMatches);

      // Simpan data pertandingan ke database
      const { data: tournamentDbData, error: tournamentDbError } = await supabase
        .from('bracket_tournaments')
        .select('id')
        .eq('challonge_id', id)
        .single();

      if (tournamentDbError) {
        throw new Error("Gagal mengambil ID turnamen dari database");
      }

      // Siapkan data untuk dimasukkan ke database
      const matchesForDb = formattedMatches.map(match => ({
        id: match.match.id,
        challonge_id: match.match.id,
        tournament_id: tournamentDbData.id,
        round: match.match.round,
        round_name: match.match.round_name,
        player1_id: match.match.player1_id,
        player2_id: match.match.player2_id,
        winner_id: match.match.winner_id,
        loser_id: match.match.loser_id,
        scores_csv: match.match.scores_csv,
        state: match.match.state,
        suggested_play_order: match.match.suggested_play_order,
        created_at: getCurrentWIBTime(),
        updated_at: getCurrentWIBTime()
      }));

      // Upsert data pertandingan ke database
      const { error: matchesDbError } = await supabase
        .from('bracket_matches')
        .upsert(matchesForDb, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (matchesDbError) {
        console.error("Gagal menyimpan data pertandingan ke database:", matchesDbError);
      }

      // Fetch participants from database
      const { data: participantsData, error: participantsError } = await supabase
        .from('bracket_participants')
        .select('*')
        .eq('tournament_id', id)
        .order('seed', { nullsLast: true });
      
      if (participantsError) {
        throw new Error("Gagal mengambil data peserta dari database");
      }
      
      // Format participants data
      const formattedParticipants = participantsData.map(participant => ({
        participant: {
          ...participant,
          id: participant.challonge_id,
          tournament_id: participant.tournament_id,
          local_data: participant
        }
      }));
      
      setParticipants(formattedParticipants);

      // Hitung dan update standings
      const calculatedStandings = calculateStandings(formattedParticipants, formattedMatches);
      setStandings(calculatedStandings);

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

  const getParticipantName = (id) => {
    if (!id) return "TBD";
    const participant = participants.find((p) => {
      // Periksa apakah data menggunakan format baru (dengan objek participant)
      if (p.participant) {
        return p.participant.id === id;
      }
      return p.id === id || p.participant_id === id;
    });

    if (!participant) return "Unknown";

    // Periksa apakah data menggunakan format baru (dengan objek participant)
    return participant.participant
      ? participant.participant.name
      : participant.name;
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    // Parse scores_csv jika ada
    if (match.match.scores_csv) {
      const parsedScores = match.match.scores_csv.split(",").map((score) => {
        const [player1, player2] = score.split("-").map(Number);
        return { player1, player2 };
      });
      setScores(parsedScores);
    } else {
      // Reset scores jika tidak ada scores_csv
      setScores([{ player1: 0, player2: 0 }]);
    }
    setShowMatchModal(true);
  };

  const handleCloseModal = () => {
    setShowMatchModal(false);
    setSelectedMatch(null);
    setScores([{ player1: 0, player2: 0 }]);
  };

  const handleSetChange = (index, player, value) => {
    const newScores = [...scores];
    newScores[index][player] = value;
    setScores(newScores);
  };

  const handleAddSet = () => {
    setScores([...scores, { player1: 0, player2: 0 }]);
  };

  const handleRemoveSet = (index) => {
    const newScores = scores.filter((_, i) => i !== index);
    setScores(newScores);
  };

  const handleUpdateMatch = async () => {
    if (!selectedMatch || isProcessing) return;

    setIsProcessing(true);
    try {
      // Format scores untuk API
      const scoresString = scores
        .map((set) => `${set.player1}-${set.player2}`)
        .join(",");

      // Tentukan pemenang berdasarkan skor
      let winnerId = null;
      let player1Wins = 0;
      let player2Wins = 0;

      scores.forEach((set) => {
        if (set.player1 > set.player2) player1Wins++;
        else if (set.player2 > set.player1) player2Wins++;
      });

      if (player1Wins > player2Wins) {
        winnerId = selectedMatch.match.player1_id;
      } else if (player2Wins > player1Wins) {
        winnerId = selectedMatch.match.player2_id;
      }

      // Update match di Challonge API
      const response = await fetch(`/api/challonge/tournaments/${id}/matches/${selectedMatch.match.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match: {
            winner_id: winnerId,
            scores_csv: scoresString,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengupdate pertandingan di Challonge');
      }

      // Refresh data setelah update
      await refreshData();

      // Reset selection dan tutup modal
      setSelectedMatch(null);
      setScores([{ player1: 0, player2: 0 }]);
      setShowMatchModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReopenMatch = async (match) => {
    if (!match || isProcessing) return;

    setShowMatchModal(false); // Tutup modal form terlebih dahulu
    setConfirmTitle("Buka Kembali Pertandingan");
    setConfirmMessage("Apakah Anda yakin ingin membuka kembali pertandingan ini? Skor sebelumnya akan dihapus.");
    setConfirmAction(() => async () => {
      setIsProcessing(true);
      try {
       

        const response = await fetch(`/api/challonge/tournaments/${id}/matches/${match.match.id}/reopen`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });


        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error reopening match:', errorText);
          throw new Error(`Gagal membuka kembali pertandingan: ${errorText}`);
        }

     
        await refreshData();
        
        // Reset UI state
        setSelectedMatch(null);
        setScores([{ player1: 0, player2: 0 }]);
        setShowConfirmModal(false);
      } catch (err) {
        console.error('Error in handleReopenMatch:', err);
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
    setConfirmMessage("Apakah Anda yakin ingin menyelesaikan turnamen ini? Aksi ini tidak dapat dibatalkan.");
    setConfirmAction(() => async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('bracket_tournaments')
        .update({
          state: 'complete',
            completed_at: getCurrentWIBTime(),
            updated_at: getCurrentWIBTime()
        })
        .eq('challonge_id', id)
        .select();

      if (error) {
        throw new Error("Gagal menyelesaikan turnamen di database");
      }

      window.location.href = `/tournament/${id}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
    });
    setShowConfirmModal(true);
  };

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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen-no-nav">
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
      <div className="min-h-screen-no-nav">
      <div className="container mx-auto px-4 py-8">
        <TournamentInfo
          tournament={tournament}
          description="Kelola pertandingan dan skor untuk turnamen ini"
          matches={matches}
        />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Matches Section */}
            <div className="lg:col-span-7">
            <MatchesFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onFinalizeTournament={handleFinalizeTournament}
              tournament={tournament}
              isProcessing={isProcessing}
            />

            <div className="bg-[#2b2b2b] rounded-lg shadow-xl overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-[#f26522]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  Daftar Pertandingan
                </h2>

                <div className="overflow-x-auto">
                  <MatchesTable
                    matches={matches}
                    getParticipantName={getParticipantName}
                    onSelectMatch={handleSelectMatch}
                    tournament={tournament}
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                  />
                </div>
                </div>
              </div>
            </div>

            {/* Standings Section */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-[#2b2b2b] rounded-lg shadow-xl overflow-hidden flex-1">
                <div className="p-6 h-full flex flex-col">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-[#f26522]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                    </svg>
                    Klasemen
                  </h2>

                  <div className="overflow-x-auto flex-1">
                    <StandingsTable
                      standings={standings}
                      isLoading={isLoading}
                    />
              </div>
            </div>
          </div>

          {/* Update Form Section */}
            {showMatchModal && (
                <div className="sticky top-4 mt-8">
              <UpdateMatchForm
                selectedMatch={selectedMatch}
                getParticipantName={getParticipantName}
                scores={scores}
                onSetChange={handleSetChange}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
                onUpdateMatch={handleUpdateMatch}
                onReopenMatch={handleReopenMatch}
                isProcessing={isProcessing}
                onClose={handleCloseModal}
              />
                </div>
            )}
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
        isProcessing={isProcessing}
      />
    </AdminLayout>
  );
}