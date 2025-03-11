'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import BracketImage from '@/components/BracketImage';
import StartTournamentButton from '@/components/StartTournamentButton';

export default function TournamentDetail({ params }) {
  const unwrappedParams = use(params);
  const [id, setId] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [standings, setStandings] = useState([]);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (unwrappedParams) {
      setId(unwrappedParams.id);
    }
  }, [unwrappedParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch tournament details
        const response = await fetch(`/api/challonge?tournamentId=${id}`);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data turnamen');
        }
        
        const data = await response.json();
        const tournamentData = Array.isArray(data) 
          ? data.find(t => t.tournament.id.toString() === id)
          : data;
          
        if (!tournamentData) {
          throw new Error('Turnamen tidak ditemukan');
        }
        
        setTournament(tournamentData);
        setTournamentStarted(tournamentData.tournament.state !== 'pending');
        setParticipantsCount(tournamentData.tournament.participants_count || 0);

        // Fetch standings data
        const standingsResponse = await fetch(`/api/challonge/participants?tournamentId=${id}`);
        if (!standingsResponse.ok) {
          throw new Error('Gagal mengambil data standings');
        }
        const standingsData = await standingsResponse.json();
        
        console.log('Raw standings data:', standingsData);
        
        // Sort standings directly since the data is already in the correct format
        const sortedStandings = standingsData.sort((a, b) => {
          const rankA = a.rank || 999;
          const rankB = b.rank || 999;
          return rankA - rankB;
        });
        
        console.log('Sorted standings:', sortedStandings);
        
        setStandings(sortedStandings);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsLoadingStandings(false);
      }
    };

    fetchData();
  }, [id]);

  const handleTournamentStarted = () => {
    setTournamentStarted(true);
  };

  const handleStartTournament = async () => {
    if (!id || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/challonge/tournaments/${id}/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Gagal memulai turnamen');
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
    
    if (!confirm('Apakah Anda yakin ingin menyelesaikan turnamen ini? Aksi ini tidak dapat dibatalkan.')) {
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/challonge/tournaments/${id}/finalize`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Gagal menyelesaikan turnamen');
      }
      
      // Refresh data
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
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
            <Link href="/" className="inline-flex items-center text-[#f26522] hover:text-[#ff7b3d] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Kembali ke Daftar Turnamen
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
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Kembali ke Daftar Turnamen
          </Link>
        </div>
        </div>
        
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tournament Info Card */}
        <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8">
          <div className="p-6">
          <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  {tournament.tournament.name}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span>{tournament.tournament.participants_count || 0} Peserta</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Status: {
                      tournament.tournament.state === 'pending' ? 'Belum Dimulai' :
                      tournament.tournament.state === 'underway' ? 'Sedang Berlangsung' :
                      tournament.tournament.state === 'awaiting_review' ? 'Menunggu Review' :
                      tournament.tournament.state === 'complete' ? 'Selesai' : tournament.tournament.state
                    }</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>Dibuat {new Date(tournament.tournament.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>
            {!tournamentStarted && (
              <StartTournamentButton 
                tournamentId={id} 
                onTournamentStarted={handleTournamentStarted}
                disabled={participantsCount < 2}
              />
            )}
          </div>
          </div>
        </div>

        {/* Final Result Box */}
        {tournament.tournament.state === 'complete' && standings.length > 0 && (
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#f26522]" viewBox="0 0 16 16">
                  <path d="M8 0L10.472 2.472L14 2.8944L11.416 4.8288L12.944 8L8 6.4L3.056 8L4.584 4.8288L2 2.8944L5.528 2.472L8 0Z" fill="currentColor"/>
                  <path d="M4 7.2V16H12V7.2C11.4154 7.4647 10.7701 7.6 10 7.6C9.22991 7.6 8.58459 7.4647 8 7.2C7.41541 7.4647 6.77009 7.6 6 7.6C5.22991 7.6 4.58459 7.4647 4 7.2Z" fill="currentColor"/>
                </svg>
                Final Result
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {standings
                  .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                  .slice(0, 2)
                  .map((participant, index) => {
                    return (
                      <div 
                        key={participant.participant_id}
                        className={`p-6 rounded-lg flex items-center justify-between ${
                          index === 0 
                            ? 'bg-gradient-to-r from-[#f26522]/20 to-[#f26522]/5 border border-[#f26522]' 
                            : 'bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          {index === 0 ? (
                            <div className="w-12 h-12 flex items-center justify-center">
                              <img src="https://assets.challonge.com/assets/icon-medal-first-9f45bab2a90d78bf720a8d196bf2dbbf260c4ba65a6e6a22c4e4c19813f7c9f2.svg" 
                                className="h-10 w-10" 
                                alt="Gold medal" 
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 flex items-center justify-center">
                              <img src="https://assets.challonge.com/assets/icon-medal-second-db37f62deb0580bc0b59a95cb799e284012340d3225eb8c88c316482f872e98e.svg" 
                                className="h-10 w-10" 
                                alt="Silver medal" 
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-lg font-bold text-white">
                              {participant.name}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center mt-1">
                              <span className="font-medium mr-2">
                                {index === 0 ? 'Champion' : 'Runner-up'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-gray-700/50 text-xs">
                                W/L: {participant.wins || 0}-{participant.losses || 0}
                              </span>
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

        {/* Tournament Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Info Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Informasi Turnamen
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tipe Turnamen</label>
                  <p className="text-white">{tournament.tournament.tournament_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Game</label>
                  <p className="text-white">{tournament.tournament.game_name || 'Tidak ditentukan'}</p>
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Diperbarui</label>
                  <p className="text-white">{new Date(tournament.tournament.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</p>
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">URL Challonge</label>
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
          
          {/* Actions Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Kelola Turnamen
              </h2>

              {!tournamentStarted && participantsCount < 2 && (
                <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg mb-6">
                  <p className="font-bold">Turnamen belum dapat dimulai</p>
                  <p>Turnamen membutuhkan minimal 2 peserta untuk dapat dimulai.</p>
            </div>
          )}
          
              <div className="space-y-4">
            <Link 
              href={`/tournament/${id}/participants`}
                  className="flex items-center justify-center w-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white py-3 px-4 rounded-lg transition-colors"
            >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
              Kelola Peserta
            </Link>
            
            <Link 
              href={`/tournament/${id}/matches`}
                  className="flex items-center justify-center w-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white py-3 px-4 rounded-lg transition-colors"
            >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
              Kelola Pertandingan
            </Link>

                {tournament.tournament.state === 'pending' && participantsCount >= 2 && (
                  <button
                    onClick={handleStartTournament}
                    disabled={isProcessing}
                    className="flex items-center justify-center w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    {isProcessing ? 'Memulai Turnamen...' : 'Mulai Turnamen'}
                  </button>
                )}

                {tournament.tournament.state === 'underway' && standings.some(s => s.rank === 1) && (
                  <button
                    onClick={handleFinalizeTournament}
                    disabled={isProcessing}
                    className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {isProcessing ? 'Menyelesaikan Turnamen...' : 'Selesaikan Turnamen'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bracket Section */}
        <div className="mt-8">
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Bracket Column */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Bracket Turnamen
                  </h2>
        <BracketImage tournamentId={id} />
                </div>

                {/* Standings Column */}
                <div className="lg:w-96">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Standings
                  </h2>
                  
                  <div className="bg-[#232323] rounded-lg overflow-hidden">
                    {isLoadingStandings ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f26522] border-t-transparent"></div>
                      </div>
                    ) : standings.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        Belum ada data standings
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Participant Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Match History</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {standings.map((standing) => (
                            <tr key={standing.participant_id} className="hover:bg-[#2d2d2d] transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {standing.rank || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {standing.name}
                              </td>
                              <td className="px-4 py-3">
                                {(standing.wins > 0 || standing.losses > 0) ? (
                                  <div className="flex gap-1">
                                    {[...Array(standing.wins || 0)].map((_, idx) => (
                                      <span
                                        key={`win-${idx}`}
                                        className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium bg-blue-900/50 text-blue-300"
                                      >
                                        W
                                      </span>
                                    ))}
                                    {[...Array(standing.losses || 0)].map((_, idx) => (
                                      <span
                                        key={`loss-${idx}`}
                                        className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium bg-red-900/50 text-red-300"
                                      >
                                        L
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-sm">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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