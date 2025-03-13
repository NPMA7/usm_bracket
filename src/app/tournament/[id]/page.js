"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import BracketImage from "@/components/BracketImage";
import EditParticipantPositionModal from "@/components/EditParticipantPositionModal";
import TournamentHeader from "@/components/TournamentHeader";
import TournamentInfoCard from "@/components/TournamentInfoCard";
import FinalResultBox from "@/components/FinalResultBox";
import StandingsTable from "@/components/StandingsTable";

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
  const [shuffleSuccess, setShuffleSuccess] = useState(false);
  const [bracketImageKey, setBracketImageKey] = useState(0);
  const [showEditPositionModal, setShowEditPositionModal] = useState(false);
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
        // Fetch tournament details
        const response = await fetch(`/api/challonge?tournamentId=${id}`);

        if (!response.ok) {
          throw new Error("Gagal mengambil data turnamen");
        }

        const data = await response.json();
        const tournamentData = Array.isArray(data)
          ? data.find((t) => t.tournament.id.toString() === id)
          : data;

        if (!tournamentData) {
          throw new Error("Turnamen tidak ditemukan");
        }

        setTournament(tournamentData);
        setTournamentStarted(tournamentData.tournament.state !== "pending");
        setParticipantsCount(tournamentData.tournament.participants_count || 0);

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
      const standingsResponse = await fetch(
        `/api/challonge/participants?tournamentId=${tournamentId}`
      );
      if (!standingsResponse.ok) {
        throw new Error("Gagal mengambil data standings");
      }
      const standingsData = await standingsResponse.json();

      // Sort standings berdasarkan jumlah kemenangan (wins) dan kekalahan (losses)
      const sortedStandings = standingsData.sort((a, b) => {
        // Periksa apakah data menggunakan format baru (dengan objek participant)
        const winsA = a.participant ? a.participant.wins || 0 : 0;
        const winsB = b.participant ? b.participant.wins || 0 : 0;
        const lossesA = a.participant ? a.participant.losses || 0 : 0;
        const lossesB = b.participant ? b.participant.losses || 0 : 0;

        // Tim dengan W 0 dan L 0 diletakkan di urutan paling bawah
        if (winsA === 0 && lossesA === 0 && (winsB > 0 || lossesB > 0)) {
          return 1; // A di bawah B
        }
        if (winsB === 0 && lossesB === 0 && (winsA > 0 || lossesA > 0)) {
          return -1; // B di bawah A
        }

        // Jika keduanya W 0 dan L 0 atau keduanya bukan W 0 dan L 0, urutkan berdasarkan wins
        return winsB - winsA;
      });

      setStandings(sortedStandings);
      // Set waktu terakhir refresh
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
      const standingsResponse = await fetch(
        `/api/challonge/participants?tournamentId=${tournamentId}`
      );
      if (!standingsResponse.ok) {
        throw new Error("Gagal mengambil data standings");
      }
      const standingsData = await standingsResponse.json();

      // Sort standings berdasarkan jumlah kemenangan (wins) dan kekalahan (losses)
      const sortedStandings = standingsData.sort((a, b) => {
        // Periksa apakah data menggunakan format baru (dengan objek participant)
        const winsA = a.participant ? a.participant.wins || 0 : 0;
        const winsB = b.participant ? b.participant.wins || 0 : 0;
        const lossesA = a.participant ? a.participant.losses || 0 : 0;
        const lossesB = b.participant ? b.participant.losses || 0 : 0;

        // Tim dengan W 0 dan L 0 diletakkan di urutan paling bawah
        if (winsA === 0 && lossesA === 0 && (winsB > 0 || lossesB > 0)) {
          return 1; // A di bawah B
        }
        if (winsB === 0 && lossesB === 0 && (winsA > 0 || lossesA > 0)) {
          return -1; // B di bawah A
        }

        // Jika keduanya W 0 dan L 0 atau keduanya bukan W 0 dan L 0, urutkan berdasarkan wins
        return winsB - winsA;
      });

      setStandings(sortedStandings);
      // Set waktu terakhir refresh
      setLastRefreshed(new Date());
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
      const matchesResponse = await fetch(
        `/api/challonge/matches?tournamentId=${tournamentId}`
      );
      if (!matchesResponse.ok) {
        throw new Error("Gagal mengambil data matches");
      }
      const matchesData = await matchesResponse.json();
      setMatches(matchesData);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleTournamentStarted = () => {
    setTournamentStarted(true);
  };

  const handleStartTournament = async () => {
    if (!id || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/challonge/tournaments/${id}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Gagal memulai turnamen");
      }

      setTournamentStarted(true);
      // Refresh data
      window.location.reload();
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
      const response = await fetch(
        `/api/challonge/tournaments/${id}/finalize`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menyelesaikan turnamen");
      }

      // Refresh data
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Fungsi untuk mengacak urutan peserta turnamen
   * Hanya me-refresh data bracket dan standings, bukan seluruh halaman
   */
  const handleShuffleTournament = async () => {
    if (!id || isProcessing) return;

    if (
      !confirm(
        "Apakah Anda yakin ingin mengacak urutan peserta? Ini akan mengubah bracket turnamen."
      )
    ) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/challonge/tournaments/${id}/shuffle`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Gagal mengacak peserta turnamen");
      }

      setShuffleSuccess(true);

      // Hilangkan notifikasi sukses setelah 3 detik
      setTimeout(() => {
        setShuffleSuccess(false);
      }, 3000);

      // Refresh bracket dengan mengubah key
      setBracketImageKey((prevKey) => prevKey + 1);

      // Refresh standings data
      await fetchStandings(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Fungsi untuk menangani sukses edit posisi peserta
   * Refresh bracket dan standings data
   */
  const handleEditPositionSuccess = () => {
    // Refresh bracket dengan mengubah key
    setBracketImageKey((prevKey) => prevKey + 1);

    // Refresh standings data
    fetchStandings(id);
  };

  /**
   * Fungsi untuk memeriksa status turnamen tanpa menampilkan loading
   * @param {string} tournamentId - ID turnamen
   */
  const checkTournamentStatus = async (tournamentId) => {
    try {
      const response = await fetch(
        `/api/challonge?tournamentId=${tournamentId}`
      );
      if (!response.ok) {
        throw new Error("Gagal mengambil data turnamen");
      }

      const data = await response.json();
      const tournamentData = Array.isArray(data)
        ? data.find((t) => t.tournament.id.toString() === tournamentId)
        : data;

      if (tournamentData) {
        setTournament(tournamentData);
        setTournamentStarted(tournamentData.tournament.state !== "pending");

        // Jika turnamen baru saja selesai, refresh standings tanpa loading
        if (
          tournamentData.tournament.state === "complete" &&
          tournament?.tournament?.state !== "complete"
        ) {
          await fetchStandingsQuiet(tournamentId);
        }
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
        <TournamentInfoCard
          tournament={tournament}
          tournamentStarted={tournamentStarted}
          participantsCount={participantsCount}
          id={id}
          onTournamentStarted={handleTournamentStarted}
          isAdmin={isAdmin}
        />

        {tournament.tournament.state === "complete" && standings.length > 0 && (
          <FinalResultBox standings={standings} />
        )}

        {/* Tournament Details */}
        <div
          className={`grid grid-cols-1 ${
            isAdmin ? "md:grid-cols-2" : ""
          } gap-8`}
        >
          {/* Info Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl">
            <div className="p-6">
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Tipe Turnamen
                  </label>
                  <p className="text-white">
                    {tournament.tournament.tournament_type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Game
                  </label>
                  <p className="text-white">
                    {tournament.tournament.game_name || "Tidak ditentukan"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Diperbarui
                  </label>
                  <p className="text-white">
                    {new Date(
                      tournament.tournament.updated_at
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
                    href={tournament.tournament.full_challonge_url}
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

          {/* Actions Section - Only show for admin/owner */}
          {isAdmin && (
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Kelola Turnamen
                </h2>

                {!tournamentStarted && participantsCount < 2 && (
                  <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg mb-6">
                    <p className="font-bold">Turnamen belum dapat dimulai</p>
                    <p>
                      Turnamen membutuhkan minimal 2 peserta untuk dapat
                      dimulai.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <Link
                    href={`/tournament/${id}/participants`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center"
                  >
                    Kelola Peserta
                  </Link>
                  <Link
                    href={`/tournament/${id}/matches`}
                    className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center"
                  >
                    Kelola Pertandingan
                  </Link>
                  {!tournamentStarted && (
                    <button
                      onClick={handleStartTournament}
                      disabled={participantsCount < 2 || isProcessing}
                      className="block w-full bg-[#f26522] hover:bg-[#ff7b3d] text-white px-4 py-2 rounded-lg text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? "Memulai..." : "Mulai Turnamen"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
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
                  <BracketImage
                    tournamentId={id}
                    refreshKey={bracketImageKey}
                    isAdmin={isAdmin}
                  />
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
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Standings
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

      {isAdmin && (
        <EditParticipantPositionModal
          isOpen={showEditPositionModal}
          onClose={() => setShowEditPositionModal(false)}
          tournamentId={id}
          onSuccess={handleEditPositionSuccess}
        />
      )}
    </div>
  );
}
