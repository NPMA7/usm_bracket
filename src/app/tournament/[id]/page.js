"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import BracketImage from "@/components/BracketImage";
import TournamentInfoCard from "@/components/TournamentInfoCard";
import FinalResultBox from "@/components/FinalResultBox";
import StandingsTable from "@/components/StandingsTable";
import { supabase } from '@/lib/supabase';

export default function TournamentDetail({ params }) {
  const unwrappedParams = use(params);
  const [id, setId] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [standings, setStandings] = useState([]);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bracketImageKey, setBracketImageKey] = useState(0);
  const [matches, setMatches] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) {
      setUser(JSON.parse(adminUser));
    }
  }, []);

  useEffect(() => {
    if (unwrappedParams) {
      setId(unwrappedParams.id);
    }
  }, [unwrappedParams]);

  // Tambahkan useEffect untuk interval refresh standings
  useEffect(() => {
    // Hanya jalankan jika id sudah ada
    if (!id) return;

    // Jika turnamen sudah selesai, tidak perlu interval refresh
    if (tournament?.tournament?.state === "complete") {
      return;
    }

    // Buat interval untuk refresh standings setiap 10 detik
    const intervalId = setInterval(() => {
      // Gunakan fungsi fetchStandingsQuiet untuk refresh tanpa loading indicator
      fetchStandingsQuiet(id);

      // Tambahkan juga refresh status turnamen
      checkTournamentStatus(id);
    }, 10000); // 10 detik

    // Cleanup function untuk membersihkan interval ketika komponen unmount
    return () => {
      ("Membersihkan interval refresh");
      clearInterval(intervalId);
    };
  }, [id, tournament?.tournament?.state]); // Jalankan kembali jika id atau status turnamen berubah

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
          throw new Error("Gagal mengambil data turnamen");
        }

        // Hitung jumlah peserta dari tabel bracket_participants
        const { count } = await supabase
          .from('bracket_participants')
          .select('*', { count: 'exact' })
          .eq('tournament_id', id);

        // Format data untuk kompatibilitas dengan komponen yang ada
        const formattedTournament = {
          ...tournamentData,
          participants_count: count || 0
        };

        setTournament(formattedTournament);
        setTournamentStarted(tournamentData.state !== "pending");
        setParticipantsCount(count || 0);

        // Fetch standings data
        await fetchStandings(id);

        // Fetch matches data
        await fetchMatches(id);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsLoadingStandings(false);
        setIsLoadingMatches(false);
      }
    };

    fetchData();
  }, [id]);

  /**
   * Fungsi untuk mengambil data standings terbaru tanpa menampilkan loading
   * Digunakan untuk refresh otomatis agar lebih smooth
   * @param {string} tournamentId - ID turnamen
   */
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

  /**
   * Fungsi untuk mengambil data standings terbaru
   * @param {string} tournamentId - ID turnamen
   */
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

  /**
   * Fungsi untuk mengambil data matches terbaru
   * @param {string} tournamentId - ID turnamen
   */
  const fetchMatches = async (tournamentId) => {
    setIsLoadingMatches(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('bracket_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('suggested_play_order', { nullsLast: true });

      if (matchesError) {
        throw new Error("Gagal mengambil data matches");
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
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleTournamentStarted = () => {
    setTournamentStarted(true);
  };

 
  /**
   * Fungsi untuk memeriksa status turnamen tanpa menampilkan loading
   * @param {string} tournamentId - ID turnamen
   */
  const checkTournamentStatus = async (tournamentId) => {
    try {
      // Fetch tournament details from database
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('bracket_tournaments')
        .select('*')
        .eq('challonge_id', tournamentId)
        .single();

      if (tournamentError) {
        throw new Error("Gagal memeriksa status turnamen");
      }

      // Hitung jumlah peserta dari tabel bracket_participants
      const { count } = await supabase
        .from('bracket_participants')
        .select('*', { count: 'exact' })
        .eq('tournament_id', tournamentId);

      // Format data untuk kompatibilitas dengan komponen yang ada
      const formattedTournament = {
        ...tournamentData,
        participants_count: count || 0,
        created_at: tournamentData.created_at,
        updated_at: new Date().toISOString()
      };

      setTournament(formattedTournament);
      setTournamentStarted(tournamentData.state !== "pending");
      setParticipantsCount(count || 0);

      // Jika turnamen baru saja selesai, refresh standings tanpa loading
      if (
        tournamentData.state === "complete" &&
        tournament?.state !== "complete"
      ) {
        await fetchStandingsQuiet(tournamentId);
      }
    } catch (err) {
      console.error("Error checking tournament status:", err);
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

  const isAdmin = user && ["admin", "owner"].includes(user.role);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
       <div className="bg-[#2b2b2b] border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href={`/  `}
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
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
            Kembali ke Daftar Turnamen
          </Link>
          {user && ["admin", "owner"].includes(user.role) && (
            <Link
              href="/admin"
              className="bg-[#f26522] hover:bg-[#d54d0d] text-white px-6 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {tournament && (
          <TournamentInfoCard
            tournament={tournament}
            tournamentStarted={tournamentStarted}
            participantsCount={participantsCount}
            id={id}
            onTournamentStarted={handleTournamentStarted}
            isAdmin={user && ['admin', 'owner'].includes(user.role)}
            showControls={false}
          />
        )}

        {tournament && tournament.state === "complete" && standings.length > 0 && (
          <FinalResultBox standings={standings} />
        )}

        {/* Tournament Details */}
        <div
          className={`grid grid-cols-1 gap-8`}
        >
          {/* Info Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl">
            <div className="p-6  gap-8">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Informasi Turnamen
              </h2>
                <div className="space-y-4 grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-mum text-gray-400 mb-1">
                    Tipe Turnamen
                  </label>
                  <p className="text-white">
                    {tournament.tournament_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Game
                  </label>
                  <p className="text-white">
                    {tournament.game_name || "Tidak ditentukan"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Diperbarui
                  </label>
                  <p className="text-white">
                    {new Date(
                      tournament.updated_at
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    URL Challonge
                  </label>
                  <a
                    href={tournament.full_challonge_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f26522] hover:text-[#ff7b3d] transition-colors"
                  >
                    Lihat di Challonge
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Bracket Column */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Bracket Turnamen
                  </h2>
                  {!tournamentStarted ? (
                    <div className="bg-[#2b2b2b] p-6 rounded-lg border border-gray-700">
                      <div className="flex items-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-semibold text-yellow-500">Turnamen Belum Dimulai</h3>
                      </div>
                      <p className="text-gray-400 mb-2">Bracket turnamen akan ditampilkan setelah turnamen dimulai.</p>
                    </div>
                  ) : (
                    <BracketImage
                      tournamentId={id}
                      refreshKey={bracketImageKey}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>

                {/* Standings Column */}
                <div className="lg:w-96">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Klasemen
                    {lastRefreshed && (
                      <span className="ml-2 text-xs text-gray-400">
                        (Diperbarui {lastRefreshed.toLocaleTimeString("id-ID")})
                      </span>
                    )}
                  </h2>

                  <div className="bg-[#232323] rounded-lg overflow-auto md:h-[90vh] h-[50vh]">
                    <StandingsTable
                      standings={standings}
                      isLoading={isLoadingStandings}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}