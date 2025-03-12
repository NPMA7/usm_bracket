"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";

export default function TournamentMatches(props) {
  const params = use(props.params);
  const id = params.id;
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [updateData, setUpdateData] = useState({
    winnerId: "",
    scores: "",
    sets: [{ player1Score: "", player2Score: "" }],
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      if (isLoading) {
        try {
          // Fetch tournament details
          const tournamentResponse = await fetch(
            `/api/challonge?tournamentId=${id}`
          );

          if (!tournamentResponse.ok) {
            throw new Error("Gagal mengambil data turnamen");
          }

          const tournamentData = await tournamentResponse.json();
          // Find the tournament with the matching ID
          const tournament = Array.isArray(tournamentData)
            ? tournamentData.find((t) => t.tournament.id.toString() === id)
            : tournamentData;

          if (!tournament) {
            throw new Error("Turnamen tidak ditemukan");
          }

          setTournament(tournament);

          // Fetch matches
          const matchesResponse = await fetch(
            `/api/challonge/matches?tournamentId=${id}`
          );

          if (!matchesResponse.ok) {
            throw new Error("Gagal mengambil data pertandingan");
          }

          const matchesData = await matchesResponse.json();
          console.log("Matches data:", matchesData);
          setMatches(matchesData);

          // Fetch participants
          const participantsResponse = await fetch(
            `/api/challonge/participants?tournamentId=${id}`
          );

          if (!participantsResponse.ok) {
            throw new Error("Gagal mengambil data peserta");
          }

          const participantsData = await participantsResponse.json();
          console.log("Participants data:", participantsData);
          setParticipants(participantsData);
        } catch (err) {
          console.error("Error fetching data:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsRefreshing(true);
        try {
          // Fetch matches only for refresh
          const matchesResponse = await fetch(
            `/api/challonge/matches?tournamentId=${id}`
          );

          if (!matchesResponse.ok) {
            throw new Error("Gagal mengambil data pertandingan");
          }

          const matchesData = await matchesResponse.json();
          console.log("Refreshed matches data:", matchesData);
          setMatches(matchesData);
        } catch (err) {
          console.error("Error refreshing data:", err);
          setError(err.message);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, refreshTrigger, isLoading]);

  const getParticipantName = (id) => {
    // Jika ID tidak ada (null atau undefined), kembalikan "TBD"
    if (id === null || id === undefined) {
      return "TBD";
    }

    if (!Array.isArray(participants)) {
      console.log("Participants is not an array:", participants);
      return "Loading...";
    }

    // Log untuk debugging
    console.log("Looking for participant ID:", id);
    console.log("Participants data structure:", participants);

    // Cek apakah data menggunakan format baru (dengan objek participant)
    const participant = participants.find(p => {
      // Jika menggunakan format baru (dengan objek participant)
      if (p.participant) {
        return p.participant.id === id;
      }
      // Jika menggunakan format lama
      return p.participant_id === id || p.id === id;
    });

    // Log hasil pencarian
    console.log("Found participant:", participant);

    if (!participant) return "Unknown";
    
    // Ekstrak nama dari struktur data yang sesuai
    if (participant.participant) {
      // Format baru
      return participant.participant.name || participant.participant.display_name || "Unknown";
    }
    
    // Format lama
    return participant.name || "Unknown";
  };

  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
    // Parse existing scores if they exist
    let initialSets = [{ player1Score: "", player2Score: "" }];
    if (match.match.scores_csv) {
      const scores = match.match.scores_csv.split(",");
      initialSets = scores.map((score) => {
        const [p1, p2] = score.split("-").map((s) => s.trim());
        return { player1Score: p1 || "", player2Score: p2 || "" };
      });
    }

    setUpdateData({
      winnerId: match.match.winner_id || "",
      scores: match.match.scores_csv || "",
      sets: initialSets,
    });
    setUpdateError("");
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSetChange = (index, player, value) => {
    const newSets = [...updateData.sets];
    // Jika value kosong, set ke "0"
    newSets[index][`${player}Score`] = value === "" ? "0" : value;

    // Update the scores string dengan memastikan "0" tetap terkirim
    const scoresString = newSets
      .map((set) => `${set.player1Score || "0"}-${set.player2Score || "0"}`)
      .join(",");

    // Hitung total kemenangan untuk menentukan pemenang
    let player1Wins = 0;
    let player2Wins = 0;

    newSets.forEach((set) => {
      const score1 = parseInt(set.player1Score) || 0;
      const score2 = parseInt(set.player2Score) || 0;
      if (score1 > score2) player1Wins++;
      else if (score2 > score1) player2Wins++;
    });

    // Tentukan pemenang berdasarkan jumlah kemenangan set
    let autoWinnerId = "";
    if (player1Wins > player2Wins) {
      autoWinnerId = selectedMatch.match.player1_id.toString();
    } else if (player2Wins > player1Wins) {
      autoWinnerId = selectedMatch.match.player2_id.toString();
    }

    setUpdateData((prev) => ({
      ...prev,
      sets: newSets,
      scores: scoresString,
      winnerId: autoWinnerId || prev.winnerId,
    }));
  };

  const handleAddSet = () => {
    setUpdateData((prev) => ({
      ...prev,
      sets: [...prev.sets, { player1Score: "0", player2Score: "0" }],
    }));
  };

  const handleRemoveSet = (index) => {
    if (updateData.sets.length > 1) {
      const newSets = updateData.sets.filter((_, i) => i !== index);
      const scoresString = newSets
        .map((set) => `${set.player1Score || "0"}-${set.player2Score || "0"}`)
        .join(",");

      setUpdateData((prev) => ({
        ...prev,
        sets: newSets,
        scores: scoresString,
      }));
    }
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();

    if (!updateData.winnerId) {
      setUpdateError("Pilih pemenang pertandingan");
      return;
    }

    setIsUpdating(true);
    setUpdateError("");

    try {
      const response = await fetch("/api/challonge/matches", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: id,
          matchId: selectedMatch.match.id,
          winnerId: parseInt(updateData.winnerId),
          scores: updateData.scores,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memperbarui pertandingan");
      }

      setSelectedMatch(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopenMatch = async (match) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin membuka kembali pertandingan ini? Tindakan ini akan mereset hasil pertandingan."
      )
    ) {
      return;
    }

    setIsUpdating(true);
    setUpdateError("");

    try {
      const response = await fetch("/api/challonge/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: id,
          matchId: match.match.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Gagal membuka kembali pertandingan"
        );
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
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

      // Arahkan ke halaman detail turnamen
      window.location.href = `/tournament/${id}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fungsi untuk memfilter pertandingan berdasarkan pencarian dan status
  const filteredMatches = () => {
    return [...matches].filter(match => {
      // Filter berdasarkan status
      if (statusFilter !== "all" && match.match.state !== statusFilter) {
        return false;
      }
      
      // Jika tidak ada pencarian, kembalikan hasil filter status saja
      if (!searchTerm.trim()) {
        return true;
      }
      
      // Filter berdasarkan nama tim
      const player1Id = match.match.player1_id;
      const player2Id = match.match.player2_id;
      
      const isPlayer1Valid = player1Id && player1Id !== 0;
      const isPlayer2Valid = player2Id && player2Id !== 0;
      
      const player1Name = isPlayer1Valid ? getParticipantName(player1Id) : "TBD";
      const player2Name = isPlayer2Valid ? getParticipantName(player2Id) : "TBD";
      
      const searchTermLower = searchTerm.toLowerCase();
      
      return player1Name.toLowerCase().includes(searchTermLower) || 
             player2Name.toLowerCase().includes(searchTermLower);
    }).sort((a, b) => {
      // Prioritaskan status berdasarkan urutan: "open", "complete", lainnya
      if (a.match.state === "open" && b.match.state !== "open") return -1;
      if (a.match.state !== "open" && b.match.state === "open") return 1;
      
      // Jika keduanya bukan "open", prioritaskan "complete"
      if (a.match.state === "complete" && b.match.state !== "complete") return -1;
      if (a.match.state !== "complete" && b.match.state === "complete") return 1;
      
      // Jika keduanya sama statusnya, urutkan berdasarkan ronde dan nomor match
      if (a.match.round !== b.match.round) return a.match.round - b.match.round;
      return a.match.suggested_play_order - b.match.suggested_play_order;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent"></div>
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
      {/* Header */}
      <div className="bg-[#2b2b2b] border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/tournament/${id}`}
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
            Kembali ke Detail Turnamen
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tournament Info */}
        <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-white mb-4">
                    {tournament.tournament.name}
                  </h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span>{participants.length} Peserta</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Status: {tournament.tournament.state}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Dibuat{" "}
                      {new Date(
                        tournament.tournament.created_at
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isRefreshing && (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#f26522] border-t-transparent"></div>
                )}
                {(tournament.tournament.state === "underway" ||
                  tournament.tournament.state === "awaiting_review") && 
                  // Periksa apakah semua pertandingan sudah selesai
                  matches.length > 0 && 
                  matches.every(match => match.match.state === "complete") && (
                  <button
                    onClick={handleFinalizeTournament}
                    disabled={isProcessing}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {isProcessing
                      ? "Menyelesaikan Turnamen..."
                      : "Selesaikan Turnamen"}
                  </button>
                )}
                {(tournament.tournament.state === "underway" ||
                  tournament.tournament.state === "awaiting_review") && 
                  // Tampilkan pesan jika masih ada pertandingan yang belum selesai
                  matches.length > 0 && 
                  !matches.every(match => match.match.state === "complete") && (
                  <div className="text-yellow-400 text-sm flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Selesaikan semua pertandingan untuk menyelesaikan turnamen
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Final Result Box */}
        {tournament.tournament.state === "complete" &&
          participants.length > 0 && (
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-[#f26522]"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M8 0L10.472 2.472L14 2.8944L11.416 4.8288L12.944 8L8 6.4L3.056 8L4.584 4.8288L2 2.8944L5.528 2.472L8 0Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4 7.2V16H12V7.2C11.4154 7.4647 10.7701 7.6 10 7.6C9.22991 7.6 8.58459 7.4647 8 7.2C7.41541 7.4647 6.77009 7.6 6 7.6C5.22991 7.6 4.58459 7.4647 4 7.2Z"
                      fill="currentColor"
                    />
                  </svg>
                  Final Result
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {participants
                    .sort((a, b) => {
                      // Periksa apakah data menggunakan format baru (dengan objek participant)
                      const rankA = a.participant 
                        ? (a.participant.final_rank || a.participant.rank || 999) 
                        : (a.final_rank || a.rank || 999);
                      const rankB = b.participant 
                        ? (b.participant.final_rank || b.participant.rank || 999) 
                        : (b.final_rank || b.rank || 999);
                      return rankA - rankB;
                    })
                    .slice(0, 2)
                    .map((participant, index) => {
                      // Ekstrak data peserta dari struktur yang sesuai
                      const participantData = participant.participant || participant;
                      const participantId = participantData.id || participantData.participant_id;
                      const name = participantData.name || participantData.display_name || 'Unnamed';
                      
                      const matchesForParticipant = matches.filter(
                        (m) =>
                          m.match.winner_id === participantId ||
                          m.match.loser_id === participantId
                      );

                      const wins = matchesForParticipant.filter(
                        (m) => m.match.winner_id === participantId
                      ).length;

                      const losses = matchesForParticipant.filter(
                        (m) => m.match.loser_id === participantId
                      ).length;

                      return (
                        <div
                          key={participantId}
                          className={`p-6 rounded-lg flex items-center justify-between ${
                            index === 0
                              ? "bg-gradient-to-r from-[#f26522]/20 to-[#f26522]/5 border border-[#f26522]" 
                              : "bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            {index === 0 ? (
                              <div className="w-12 h-12 flex items-center justify-center">
                                <img
                                  src="/gold-medals.svg"
                                  className="h-10 w-10"
                                  alt="Gold medal"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 flex items-center justify-center">
                                <img
                                  src="/silver-medals.svg"
                                  className="h-10 w-10"
                                  alt="Silver medal"
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-lg font-bold text-white">
                                {name}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center mt-1">
                                <span className="font-medium mr-2">
                                  {index === 0 ? "Champion" : "Runner-up"}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-400 text-xs">
                                    W: {wins}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-400 text-xs">
                                    L: {losses}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

        {/* Matches List */}
        <div className="bg-[#2b2b2b] rounded-lg shadow-xl overflow-y-auto h-[90vh] ">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
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
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="bg-[#3b3b3b] border border-gray-600 text-white rounded-lg block w-full pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                  placeholder="Cari berdasarkan nama tim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="md:w-64">
                <select
                  className="bg-[#3b3b3b] border border-gray-600 text-white rounded-lg block w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="open">Open</option>
                  <option value="complete">Complete</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Match Count Info */}
            {matches.length > 0 && (
              <div className="mb-4 text-sm text-gray-400">
                Menampilkan {filteredMatches().length} dari {matches.length} pertandingan
                {searchTerm && <span> (filter: "{searchTerm}")</span>}
                {statusFilter !== "all" && <span> (status: "{statusFilter}")</span>}
              </div>
            )}

            {matches.length === 0 ? (
              <div className="bg-[#3b3b3b] rounded-lg p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-4 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-gray-400">
                  Belum ada pertandingan yang dijadwalkan.
                </p>
              </div>
            ) : filteredMatches().length === 0 ? (
              <div className="bg-[#3b3b3b] rounded-lg p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-4 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-gray-400">
                  Tidak ada pertandingan yang cocok dengan pencarian Anda.
                </p>
                <button 
                  onClick={() => {setSearchTerm(""); setStatusFilter("all");}}
                  className="mt-4 px-4 py-2 bg-[#f26522] text-white rounded-lg hover:bg-[#ff7b3d] transition-colors"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-[#232323]">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Match #
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Ronde
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Tim 1
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Tim 2
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Skor
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {/* Urutkan matches agar yang status "open" ditampilkan terlebih dahulu */}
                    {filteredMatches().map((match, index) => {
                      const player1Id = match.match.player1_id;
                      const player2Id = match.match.player2_id;
                      
                      // Periksa apakah ID peserta valid (bukan 0, null, atau undefined)
                      const isPlayer1Valid = player1Id && player1Id !== 0;
                      const isPlayer2Valid = player2Id && player2Id !== 0;
                      
                      const player1Name = isPlayer1Valid ? getParticipantName(player1Id) : "TBD";
                      const player2Name = isPlayer2Valid ? getParticipantName(player2Id) : "TBD";
                      
                      const isTBD = player1Name === "TBD" || player2Name === "TBD";
                      const isComplete = match.match.state === "complete";
                      const isOpen = match.match.state === "open";
                      
                      // Pertandingan dapat diedit jika:
                      // 1. Status pertandingan adalah "open" (selalu diutamakan)
                      // 2. Atau jika tidak TBD dan turnamen belum selesai
                      const canEditMatch = isOpen || (!isTBD && tournament.tournament.state !== "complete");

                      return (
                        <tr
                          key={match.match.id}
                          className="hover:bg-[#333333] transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {match.match.suggested_play_order || index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                              {match.match.round > 0
                                ? `Ronde ${match.match.round}`
                                : `Loser ${Math.abs(match.match.round)}`}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              match.match.player1_id === match.match.winner_id
                                ? "text-green-400 font-medium"
                                : player1Name === "TBD" 
                                  ? "text-blue-400 font-medium"
                                  : "text-gray-300"
                            }`}
                          >
                            {player1Name}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              match.match.player2_id === match.match.winner_id
                                ? "text-green-400 font-medium"
                                : player2Name === "TBD" 
                                  ? "text-blue-400 font-medium"
                                  : "text-gray-300"
                            }`}
                          >
                            {player2Name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isComplete
                                  ? "bg-green-900/50 text-green-400"
                                  : isOpen
                                    ? "bg-yellow-900/50 text-yellow-400"
                                    : "bg-blue-900/50 text-blue-400"
                              }`}
                            >
                              {match.match.state}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {match.match.scores_csv || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleSelectMatch(match)}
                                disabled={!canEditMatch}
                                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  !canEditMatch
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : isTBD
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                {isTBD ? (
                                  <>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Menunggu Tim
                                  </>
                                ) : tournament.tournament.state === "complete" ? (
                                  <>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Terkunci
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    Edit Hasil
                                  </>
                                )}
                              </button>
                              {!isTBD &&
                                isComplete &&
                                tournament.tournament.state !== "complete" && (
                                  <button
                                    onClick={() => handleReopenMatch(match)}
                                    className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-colors"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Reopen
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal tetap sama seperti sebelumnya */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-gray-600 pb-4 mb-6">
                <div className="flex space-x-4 mb-4">
                  <button className="text-white px-4 py-2 font-medium border-b-2 border-[#f26522]">
                    Report scores
                  </button>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateMatch}>
                <div className="space-y-6">
                  <div className="relative">
                    <div className="flex justify-end space-x-4 mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveSet(updateData.sets.length - 1)
                        }
                        disabled={updateData.sets.length <= 1}
                        className={`text-[#f26522] hover:text-[#ff7b3d] text-sm font-medium ${
                          updateData.sets.length <= 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        REMOVE A SET
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSet}
                        className="text-[#f26522] hover:text-[#ff7b3d] text-sm font-medium"
                      >
                        ADD A SET
                      </button>
                    </div>

                    <div className="overflow-x-auto pb-4">
                      <div className="min-w-max">
                        <div className="flex">
                          <div className="w-32 shrink-0">
                            <div className="h-8 flex items-center">
                              <span className="text-gray-400 text-sm">
                                Participant
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex border-b border-gray-600">
                              {updateData.sets.map((_, index) => (
                                <div key={index} className="w-20 text-center">
                                  <span className="text-gray-400 text-sm">
                                    Set {index + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mt-2">
                          <div className="flex">
                            <div className="w-32 shrink-0 flex items-center">
                              <span className="text-white">
                                {selectedMatch.match.player1_id && selectedMatch.match.player1_id !== 0
                                  ? getParticipantName(selectedMatch.match.player1_id)
                                  : "TBD"}
                              </span>
                            </div>
                            <div className="flex">
                              {updateData.sets.map((set, index) => (
                                <div
                                  key={index}
                                  className="w-20 flex justify-center"
                                >
                                  <input
                                    type="number"
                                    min="0"
                                    value={
                                      set.player1Score === ""
                                        ? "0"
                                        : set.player1Score
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handleSetChange(
                                        index,
                                        "player1",
                                        value === "0" ? "" : value
                                      );
                                    }}
                                    className="w-16 p-2 bg-[#3b3b3b] border border-gray-600 rounded text-white text-center"
                                    onFocus={(e) => {
                                      if (e.target.value === "0") {
                                        handleSetChange(index, "player1", "");
                                      }
                                    }}
                                    disabled={selectedMatch.match.player1_id === 0 || selectedMatch.match.player1_id === null}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex">
                            <div className="w-32 shrink-0 flex items-center">
                              <span className="text-white">
                                {selectedMatch.match.player2_id && selectedMatch.match.player2_id !== 0
                                  ? getParticipantName(selectedMatch.match.player2_id)
                                  : "TBD"}
                              </span>
                            </div>
                            <div className="flex">
                              {updateData.sets.map((set, index) => (
                                <div
                                  key={index}
                                  className="w-20 flex justify-center"
                                >
                                  <input
                                    type="number"
                                    min="0"
                                    value={
                                      set.player2Score === ""
                                        ? "0"
                                        : set.player2Score
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handleSetChange(
                                        index,
                                        "player2",
                                        value === "0" ? "" : value
                                      );
                                    }}
                                    className="w-16 p-2 bg-[#3b3b3b] border border-gray-600 rounded text-white text-center"
                                    onFocus={(e) => {
                                      if (e.target.value === "0") {
                                        handleSetChange(index, "player2", "");
                                      }
                                    }}
                                    disabled={selectedMatch.match.player2_id === 0 || selectedMatch.match.player2_id === null}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-600">
                    <h3 className="text-white text-lg text-center font-medium mb-4">
                      Verify the winner
                    </h3>
                    <div className="flex justify-center space-x-4">
                      {selectedMatch.match.player1_id && selectedMatch.match.player1_id !== 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateChange({
                              target: {
                                name: "winnerId",
                                value: selectedMatch.match.player1_id.toString(),
                              },
                            })
                          }
                          className={`px-4 py-2 rounded ${
                            updateData.winnerId ===
                            selectedMatch.match.player1_id?.toString()
                              ? "bg-[#f26522] text-white"
                              : "bg-[#3b3b3b] text-white hover:bg-[#4b4b4b]"
                          }`}
                        >
                          {getParticipantName(selectedMatch.match.player1_id)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded bg-gray-700 text-gray-400 cursor-not-allowed"
                        >
                          TBD
                        </button>
                      )}
                      
                      {selectedMatch.match.player2_id && selectedMatch.match.player2_id !== 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateChange({
                              target: {
                                name: "winnerId",
                                value: selectedMatch.match.player2_id.toString(),
                              },
                            })
                          }
                          className={`px-4 py-2 rounded ${
                            updateData.winnerId ===
                            selectedMatch.match.player2_id?.toString()
                              ? "bg-[#f26522] text-white"
                              : "bg-[#3b3b3b] text-white hover:bg-[#4b4b4b]"
                          }`}
                        >
                          {getParticipantName(selectedMatch.match.player2_id)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded bg-gray-700 text-gray-400 cursor-not-allowed"
                        >
                          TBD
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-[#f26522] text-white px-6 py-2 rounded font-medium hover:bg-[#ff7b3d] disabled:opacity-50"
                    >
                      {isUpdating ? "UPDATING..." : "SUBMIT SCORES"}
                    </button>
                  </div>
                </div>
              </form>

              {updateError && (
                <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded">
                  {updateError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
