"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import TournamentHeader from "@/components/TournamentHeader";
import MatchesFilter from "@/components/MatchesFilter";
import MatchesTable from "@/components/MatchesTable";
import UpdateMatchForm from "@/components/UpdateMatchForm";
import TournamentInfo from "@/components/TournamentInfo";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TournamentMatches(props) {
  const router = useRouter();
  const params = use(props.params);
  const id = params.id;
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scores, setScores] = useState([{ player1: 0, player2: 0 }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);

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
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
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

        // Fetch matches from database
        const { data: matchesData, error: matchesError } = await supabase
          .from('bracket_matches')
          .select('*')
          .eq('tournament_id', id)
          .order('suggested_play_order', { nullsLast: true });
        
        if (matchesError) {
          throw new Error("Gagal mengambil data pertandingan dari database");
        }
        
        // Format data untuk kompatibilitas dengan komponen yang ada
        const formattedMatches = matchesData.map(match => ({
          match: {
            ...match,
            id: match.challonge_id,
            tournament_id: match.tournament_id,
            local_data: match
          }
        }));
        
        setMatches(formattedMatches);

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

      // Update pertandingan di database
      const { data, error } = await supabase
        .from('bracket_matches')
        .update({
          winner_id: winnerId,
          scores_csv: scoresString,
          state: winnerId ? 'complete' : 'open',
          updated_at: new Date().toISOString()
        })
        .eq('challonge_id', selectedMatch.match.id)
        .eq('tournament_id', id)
        .select();

      if (error) {
        throw new Error("Gagal mengupdate pertandingan di database");
      }

      // Refresh matches data
      const { data: matchesData, error: matchesError } = await supabase
        .from('bracket_matches')
        .select('*')
        .eq('tournament_id', id)
        .order('suggested_play_order', { nullsLast: true });
      
      if (matchesError) {
        throw new Error("Gagal mengambil data pertandingan dari database");
      }
      
      // Format data untuk kompatibilitas dengan komponen yang ada
      const formattedMatches = matchesData.map(match => ({
        match: {
          ...match,
          id: match.challonge_id,
          tournament_id: match.tournament_id,
          local_data: match
        }
      }));
      
      setMatches(formattedMatches);

      // Reset selection
      setSelectedMatch(null);
      setScores([{ player1: 0, player2: 0 }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReopenMatch = async (match) => {
    if (!match || isProcessing) return;

    setIsProcessing(true);
    try {
      // Update pertandingan di database
      const { data, error } = await supabase
        .from('bracket_matches')
        .update({
          winner_id: null,
          scores_csv: '',
          state: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('challonge_id', match.match.id)
        .eq('tournament_id', id)
        .select();

      if (error) {
        throw new Error("Gagal membuka kembali pertandingan di database");
      }

      // Refresh matches data
      const { data: matchesData, error: matchesError } = await supabase
        .from('bracket_matches')
        .select('*')
        .eq('tournament_id', id)
        .order('suggested_play_order', { nullsLast: true });
      
      if (matchesError) {
        throw new Error("Gagal mengambil data pertandingan dari database");
      }
      
      // Format data untuk kompatibilitas dengan komponen yang ada
      const formattedMatches = matchesData.map(match => ({
        match: {
          ...match,
          id: match.challonge_id,
          tournament_id: match.tournament_id,
          local_data: match
        }
      }));
      
      setMatches(formattedMatches);

      // Reset selection
      setSelectedMatch(null);
      setScores([{ player1: 0, player2: 0 }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizeTournament = async () => {
    if (!id || isProcessing) return;

    if (
      !confirm(
        "Apakah Anda yakin ingin menyelesaikan turnamen ini? Aksi ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      // Update status turnamen di database
      const { data, error } = await supabase
        .from('bracket_tournaments')
        .update({
          state: 'complete',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('challonge_id', id)
        .select();

      if (error) {
        throw new Error("Gagal menyelesaikan turnamen di database");
      }

      // Redirect ke halaman detail turnamen
      window.location.href = `/tournament/${id}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent mb-4"></div>
        <p className="text-white">Memuat data...</p>
      </div>
    </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
          <div className="mt-4">
            <Link
              href={`/tournament/${id}`}
              className="inline-flex items-center text-[#f26522] hover:text-[#ff7b3d] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Kembali ke Detail Turnamen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <TournamentHeader id={id} />

      <div className="container mx-auto px-4 py-8">
        <TournamentInfo
          tournament={tournament}
          description="Kelola pertandingan dan skor untuk turnamen ini"
          matches={matches}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Matches Section */}
          <div className="lg:col-span-2">
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
                    className="h-6 w-6 mr-2"
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

          {/* Update Form Section */}
          <div className="lg:col-span-1">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
