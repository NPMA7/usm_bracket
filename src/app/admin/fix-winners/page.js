"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useRouter } from "next/navigation";

export default function FixWinnersPage() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isUpdatingWinners, setIsUpdatingWinners] = useState(false);
  const [isFixingSingleTournament, setIsFixingSingleTournament] = useState(false);
  const [isFixingAllTournaments, setIsFixingAllTournaments] = useState(false);
  const [tournamentId, setTournamentId] = useState("");
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState("");
  const [selectedRunnerUp, setSelectedRunnerUp] = useState("");
  const [selectedThirdPlace, setSelectedThirdPlace] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const router = useRouter();

  const handleFixAllTournaments = async () => {
    setIsFixingAllTournaments(true);
    setError("");
    try {
      const response = await fetch("/api/challonge/fix-winners");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbaiki data pemenang");
      }
      
      setResults(data);
      
      // Reset form pilih pemenang manual
      setParticipants([]);
      setSelectedWinner("");
      setSelectedRunnerUp("");
      setSelectedThirdPlace("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFixingAllTournaments(false);
    }
  };

  const handleFixSingleTournament = async () => {
    if (!tournamentId) {
      setError("ID Turnamen harus diisi");
      return;
    }
    
    setIsFixingSingleTournament(true);
    setError("");
    try {
      console.log("Memperbaiki turnamen dengan ID:", tournamentId);
      const response = await fetch("/api/challonge/fix-tournament", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tournamentId }),
      });
      
      const data = await response.json();
      console.log("Respons dari API:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbaiki data pemenang");
      }
      
      setResults({
        success: data.success,
        message: data.message,
        results: [
          {
            id: data.tournament,
            name: data.tournament,
            winner_name: data.winner?.name,
            runner_up_name: data.runnerUp?.name,
            third_place_name: data.thirdPlace?.name,
            status: "fixed"
          }
        ],
        fixed: 1,
        total: 1
      });
      
      // Reset form pilih pemenang manual
      setParticipants([]);
      setSelectedWinner("");
      setSelectedRunnerUp("");
      setSelectedThirdPlace("");
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsFixingSingleTournament(false);
    }
  };

  const handleGetParticipants = async () => {
    if (!tournamentId) {
      setError("ID Turnamen harus diisi");
      return;
    }
    
    setIsLoadingParticipants(true);
    setError("");
    try {
      const response = await fetch("/api/challonge/get-tournament-winners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tournamentId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal mendapatkan data peserta");
      }
      
      setParticipants(data.participants);
      setTournamentName(data.tournament.name);
      
      // Set nilai default jika ada pemenang saat ini
      if (data.currentWinners.winner) {
        setSelectedWinner(data.currentWinners.winner.id.toString());
      }
      if (data.currentWinners.runnerUp) {
        setSelectedRunnerUp(data.currentWinners.runnerUp.id.toString());
      }
      if (data.currentWinners.thirdPlace) {
        setSelectedThirdPlace(data.currentWinners.thirdPlace.id.toString());
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const handleManualUpdate = async () => {
    if (!tournamentId) {
      setError("ID Turnamen harus diisi");
      return;
    }
    
    if (!selectedWinner && !selectedRunnerUp && !selectedThirdPlace) {
      setError("Pilih setidaknya satu pemenang atau pilih 'Belum ada juara'");
      return;
    }
    
    setIsUpdatingWinners(true);
    setError("");
    try {
      // Persiapkan data pemenang
      let winner = null;
      let runnerUp = null;
      let thirdPlace = null;
      
      // Jika nilai bukan "null" dan bukan string kosong, cari data peserta
      if (selectedWinner && selectedWinner !== "null") {
        const winnerParticipant = participants.find(p => p.id.toString() === selectedWinner);
        if (winnerParticipant) {
          winner = {
            id: winnerParticipant.id,
            name: `${winnerParticipant.name} #${winnerParticipant.final_rank || winnerParticipant.seed}`
          };
        }
      } else if (selectedWinner === "null") {
        // Jika nilai "null", kirim objek dengan id dan name null
        winner = { id: null, name: null };
      }
      
      if (selectedRunnerUp && selectedRunnerUp !== "null") {
        const runnerUpParticipant = participants.find(p => p.id.toString() === selectedRunnerUp);
        if (runnerUpParticipant) {
          runnerUp = {
            id: runnerUpParticipant.id,
            name: `${runnerUpParticipant.name} #${runnerUpParticipant.final_rank || runnerUpParticipant.seed}`
          };
        }
      } else if (selectedRunnerUp === "null") {
        runnerUp = { id: null, name: null };
      }
      
      if (selectedThirdPlace && selectedThirdPlace !== "null") {
        const thirdPlaceParticipant = participants.find(p => p.id.toString() === selectedThirdPlace);
        if (thirdPlaceParticipant) {
          thirdPlace = {
            id: thirdPlaceParticipant.id,
            name: `${thirdPlaceParticipant.name} #${thirdPlaceParticipant.final_rank || thirdPlaceParticipant.seed}`
          };
        }
      } else if (selectedThirdPlace === "null") {
        thirdPlace = { id: null, name: null };
      }
      
      const response = await fetch("/api/challonge/update-winners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          tournamentId,
          winner,
          runnerUp,
          thirdPlace
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbarui data pemenang");
      }
      
      setResults({
        success: data.success,
        message: data.message,
        results: [
          {
            id: tournamentId,
            name: tournamentName,
            winner_name: data.winner?.name,
            runner_up_name: data.runnerUp?.name,
            third_place_name: data.thirdPlace?.name,
            status: "fixed"
          }
        ],
        fixed: 1,
        total: 1
      });
      
      // Reset form pilih pemenang manual
      setParticipants([]);
      setSelectedWinner("");
      setSelectedRunnerUp("");
      setSelectedThirdPlace("");
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setIsUpdatingWinners(false);
    }
  };

  return (
    <AdminLayout 
      title="Perbaikan Data Pemenang Turnamen" 
      subtitle="Perbaiki data pemenang untuk turnamen yang sudah selesai"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Fix All Tournaments */}
        <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Perbaiki Semua Turnamen</h2>
          <p className="text-gray-400 mb-6">
            Perbaiki data pemenang untuk semua turnamen yang sudah selesai tetapi belum memiliki data pemenang.
          </p>
          <button
            onClick={handleFixAllTournaments}
            disabled={isFixingAllTournaments}
            className="bg-[#f26522] hover:bg-[#d54d0d] text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {isFixingAllTournaments ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memperbaiki...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Perbaiki Semua Turnamen
              </>
            )}
          </button>
        </div>

        {/* Fix Single Tournament */}
        <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Perbaiki Turnamen Tertentu</h2>
          <p className="text-gray-400 mb-4">
            Perbaiki data pemenang untuk turnamen tertentu berdasarkan ID Challonge.
          </p>
          <div className="mb-4">
            <input
              type="text"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              placeholder="Masukkan ID Turnamen"
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522]"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleFixSingleTournament}
              disabled={isFixingSingleTournament || !tournamentId}
              className="bg-[#f26522] hover:bg-[#d54d0d] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
            >
              {isFixingSingleTournament ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memperbaiki...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Perbaiki Otomatis
                </>
              )}
            </button>
            <button
              onClick={handleGetParticipants}
              disabled={isLoadingParticipants || !tournamentId}
              className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 border border-gray-700 flex items-center"
            >
              {isLoadingParticipants ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memuat...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Pilih Pemenang Manual
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Winner Selection */}
      {participants.length > 0 && !results && (
        <div className="mt-8 bg-[#2b2b2b] rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Pilih Pemenang Manual</h2>
          <p className="text-gray-400 mb-4">
            Turnamen: <span className="text-white">{tournamentName}</span>
          </p>
          <p className="text-gray-400 mb-4">
            Pilih pemenang untuk setiap posisi atau pilih <span className="text-yellow-500 italic">Belum ada juara</span> untuk menghapus data pemenang yang ada.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Juara 1 */}
            <div>
              <label className="block text-gray-400 mb-2">Juara 1</label>
              <select
                value={selectedWinner}
                onChange={(e) => setSelectedWinner(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522]"
              >
                <option value="">-- Pilih Juara 1 --</option>
                <option value="null">Belum ada juara</option>
                {participants.map((participant) => (
                  <option 
                    key={`winner-${participant.id}`} 
                    value={participant.id}
                    disabled={
                      (selectedRunnerUp && selectedRunnerUp === participant.id.toString()) || 
                      (selectedThirdPlace && selectedThirdPlace === participant.id.toString())
                    }
                  >
                    {participant.name} #{participant.final_rank || participant.seed}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Juara 2 */}
            <div>
              <label className="block text-gray-400 mb-2">Juara 2</label>
              <select
                value={selectedRunnerUp}
                onChange={(e) => setSelectedRunnerUp(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522]"
              >
                <option value="">-- Pilih Juara 2 --</option>
                <option value="null">Belum ada juara</option>
                {participants.map((participant) => (
                  <option 
                    key={`runnerup-${participant.id}`} 
                    value={participant.id}
                    disabled={
                      (selectedWinner && selectedWinner === participant.id.toString()) || 
                      (selectedThirdPlace && selectedThirdPlace === participant.id.toString())
                    }
                  >
                    {participant.name} #{participant.final_rank || participant.seed}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Juara 3 */}
            <div>
              <label className="block text-gray-400 mb-2">Juara 3</label>
              <select
                value={selectedThirdPlace}
                onChange={(e) => setSelectedThirdPlace(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522]"
              >
                <option value="">-- Pilih Juara 3 --</option>
                <option value="null">Belum ada juara</option>
                {participants.map((participant) => (
                  <option 
                    key={`thirdplace-${participant.id}`} 
                    value={participant.id}
                    disabled={
                      (selectedWinner && selectedWinner === participant.id.toString()) || 
                      (selectedRunnerUp && selectedRunnerUp === participant.id.toString())
                    }
                  >
                    {participant.name} #{participant.final_rank || participant.seed}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleManualUpdate}
            disabled={isUpdatingWinners || (!selectedWinner && !selectedRunnerUp && !selectedThirdPlace)}
            className="bg-[#f26522] hover:bg-[#d54d0d] text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            {isUpdatingWinners ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memperbarui...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Perbarui Pemenang
              </>
            )}
          </button>
        </div>
      )}

      {error && !results && (
        <div className="mt-8 bg-red-900/50 border border-red-800 text-red-200 p-4 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-8">
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Hasil Operasi</h2>
            
            <div className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400">
                {results.message || `Berhasil memperbaiki ${results.fixed} dari ${results.total} turnamen`}
              </p>
            </div>

            {results.results && results.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nama Turnamen
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Juara 1
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Juara 2
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Juara 3
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {results.results.map((result, index) => (
                      <tr key={index} className="hover:bg-[#2d2d2d] transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {result.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {result.winner_name || (
                            <span className="text-yellow-500 italic">Belum ada juara</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {result.runner_up_name || (
                            <span className="text-yellow-500 italic">Belum ada juara</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {result.third_place_name || (
                            <span className="text-yellow-500 italic">Belum ada juara</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {result.status === "fixed" ? (
                            <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">
                              Diperbaiki
                            </span>
                          ) : result.status === "no_winner_found" ? (
                            <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded text-xs">
                              Tidak ada pemenang
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs">
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400">Tidak ada turnamen yang perlu diperbaiki</p>
            )}
            
            <div className="mt-6">
              <button
                onClick={() => {
                  setResults(null);
                  setError("");
                }}
                className="bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white px-4 py-2 rounded-lg transition-colors border border-gray-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 