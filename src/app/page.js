'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import TournamentForm from '@/components/TournamentForm';
import TournamentList from '@/components/TournamentList';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTournamentData, setSelectedTournamentData] = useState(null);

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
        
        // Jika ada turnamen, pilih yang pertama secara default
        if (data && data.length > 0) {
          const firstTournament = data[0];
          setSelectedTournament(firstTournament.tournament.id.toString());
          setSelectedTournamentData(firstTournament);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [refreshTrigger]);

  const handleTournamentCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTournamentSelect = (tournamentId) => {
    setSelectedTournament(tournamentId);
    const tournament = tournaments.find(t => t.tournament.id.toString() === tournamentId);
    if (tournament) {
      setSelectedTournamentData(tournament);
    }
  };

  const handleTournamentStarted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const isTournamentStarted = selectedTournamentData?.tournament?.state !== 'pending';
  const hasEnoughParticipants = (selectedTournamentData?.tournament?.participants_count || 0) >= 2;

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-[#2b2b2b] border-b border-gray-700 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white text-center mb-2">Sistem Bracket Turnamen</h1>
          <p className="text-gray-400 text-center">
            Buat dan kelola turnamen dengan mudah menggunakan integrasi Challonge API
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
            <div className="flex items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f26522] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Buat Turnamen Baru</h2>
            </div>
            <TournamentForm onTournamentCreated={handleTournamentCreated} />
          </div>

          {/* List Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
            <div className="flex items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f26522] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Daftar Turnamen</h2>
            </div>
            <TournamentList refreshTrigger={refreshTrigger} onTournamentSelect={handleTournamentSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}
