'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TournamentList({ refreshTrigger, onTournamentSelect }) {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="space-y-4">
        {tournaments.map((tournament) => (
          <div 
            key={tournament.tournament.id} 
          className="bg-[#3b3b3b] rounded-lg p-6 hover:bg-[#404040] transition-colors"
          >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-white">
              <Link 
                href={`/tournament/${tournament.tournament.id}`}
                className="hover:text-[#f26522] transition-colors"
              >
                {tournament.tournament.name}
              </Link>
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              tournament.tournament.state === 'complete' 
                ? 'bg-green-900/50 text-green-400'
                : tournament.tournament.state === 'underway'
                ? 'bg-blue-900/50 text-blue-400'
                : 'bg-yellow-900/50 text-yellow-400'
            }`}>
              {tournament.tournament.state}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Tipe: {tournament.tournament.tournament_type}</span>
            </div>
            <div className="flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              <span>Game: {tournament.tournament.game_name || 'Tidak ditentukan'}</span>
            </div>
            <div className="flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Dibuat: {new Date(tournament.tournament.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</span>
            </div>
            </div>
            
          <div className="flex flex-wrap gap-3">
              <Link 
                href={`/tournament/${tournament.tournament.id}`}
              className="inline-flex items-center px-4 py-2 bg-[#f26522] hover:bg-[#ff7b3d] text-white rounded-lg transition-colors"
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
                Lihat Turnamen
              </Link>
              
              <Link 
                href={`/tournament/${tournament.tournament.id}/participants`}
              className="inline-flex items-center px-4 py-2 bg-[#3b3b3b] hover:bg-[#4b4b4b] text-white rounded-lg transition-colors border border-gray-600"
              >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
                Kelola Peserta
              </Link>
          </div>
          </div>
        ))}
    </div>
  );
} 