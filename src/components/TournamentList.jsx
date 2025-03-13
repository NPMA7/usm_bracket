'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TournamentList({ refreshTrigger, onTournamentSelect }) {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
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
        console.error('Error in TournamentList:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="bg-[#3b3b3b] rounded-lg p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-gray-400">Belum ada turnamen yang dibuat.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <Link
          key={tournament.tournament.id}
          href={`/tournament/${tournament.tournament.id}`}
          className="bg-[#444444] rounded-lg p-6 hover:bg-[#333333] transition-colors"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {tournament.tournament.name}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                tournament.tournament.state === "pending"
                  ? "bg-yellow-900/50 text-yellow-400"
                  : tournament.tournament.state === "underway"
                  ? "bg-blue-900/50 text-blue-400"
                  : tournament.tournament.state === "awaiting_review"
                  ? "bg-purple-900/50 text-purple-400"
                  : "bg-green-900/50 text-green-400"
              }`}
            >
              {tournament.tournament.state === "pending"
                ? "Menunggu"
                : tournament.tournament.state === "underway"
                ? "Berlangsung"
                : tournament.tournament.state === "awaiting_review"
                ? "Menunggu Review"
                : "Selesai"}
            </span>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Link
                href={`/tournament/${tournament.tournament.id}/participants`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                Kelola Peserta
              </Link>
              <Link
                href={`/tournament/${tournament.tournament.id}/matches`}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              >
                Kelola Pertandingan
              </Link>
              <Link
                href={`/tournament/${tournament.tournament.id}`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
              >
                Lihat Detail
              </Link>
            </div>
          )}

          <div className="space-y-2">
            {tournament.tournament.state === "complete" && (
              <div className="flex items-center text-green-400 mb-2">
             <img
                        src="https://assets.challonge.com/assets/icon-medal-first-9f45bab2a90d78bf720a8d196bf2dbbf260c4ba65a6e6a22c4e4c19813f7c9f2.svg"
                        className="h-7 w-7 mr-2"
                        alt="Gold medal"
                      />
                <span className="font-medium">
                  {tournament.tournament.winner_name || "Belum ditentukan"}
                </span>
              </div>
            )}

            <div className="flex items-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span>
                {tournament.tournament.participants_count || 0} Peserta
              </span>
            </div>


            <div className="flex items-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-4"
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
                {new Date(tournament.tournament.created_at).toLocaleDateString(
                  "id-ID",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 