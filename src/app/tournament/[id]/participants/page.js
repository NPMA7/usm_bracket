'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import ParticipantForm from '@/components/ParticipantForm';

export default function TournamentParticipants(props) {
  const params = use(props.params);
  const id = params.id;
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch tournament details
        const tournamentResponse = await fetch(`/api/challonge?tournamentId=${id}`);
        
        if (!tournamentResponse.ok) {
          throw new Error('Gagal mengambil data turnamen');
        }
        
        const tournamentData = await tournamentResponse.json();
        // Find the tournament with the matching ID
        const tournament = Array.isArray(tournamentData) 
          ? tournamentData.find(t => t.tournament.id.toString() === id)
          : tournamentData;
          
        if (!tournament) {
          throw new Error('Turnamen tidak ditemukan');
        }
        
        setTournament(tournament);
        
        // Fetch participants
        const participantsResponse = await fetch(`/api/challonge/participants?tournamentId=${id}`);
        
        if (!participantsResponse.ok) {
          throw new Error('Gagal mengambil data peserta');
        }
        
        const participantsData = await participantsResponse.json();
        console.log('Raw Participants Data:', participantsData);
        
        // Transform data if needed
        const transformedParticipants = participantsData.map(p => ({
          id: p.participant?.id || p.id,
          name: p.participant?.name || p.name,
          email: p.participant?.email || p.email,
          final_rank: p.participant?.final_rank || p.final_rank
        }));
        
        console.log('Transformed Participants:', transformedParticipants);
        setParticipants(transformedParticipants);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, refreshTrigger]);

  const handleParticipantAdded = () => {
    setRefreshTrigger(prev => prev + 1);
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
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
            <h1 className="text-3xl font-bold text-white mb-2">
              {tournament?.tournament?.name}
            </h1>
            <p className="text-gray-400">
              Kelola peserta untuk turnamen ini
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
            <div className="flex items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f26522] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Tambah Peserta</h2>
            </div>
            {tournament?.tournament?.state !== 'pending' ? (
              <div className="bg-[#3b3b3b] rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-400 mb-2">Penambahan peserta dinonaktifkan</p>
                <p className="text-sm text-gray-500">
                  {tournament?.tournament?.state === 'underway' ? 'Turnamen sedang berlangsung' : 
                   tournament?.tournament?.state === 'awaiting_review' ? 'Turnamen sedang menunggu review' :
                   'Turnamen telah selesai'}
                </p>
              </div>
            ) : (
              <ParticipantForm 
                tournamentId={id} 
                onParticipantAdded={handleParticipantAdded}
              />
            )}
          </div>
          
          {/* List Section */}
          <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f26522] mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <h2 className="text-xl font-semibold text-white">Daftar Peserta</h2>
              </div>
              <span className="bg-[#3b3b3b] text-gray-400 px-3 py-1 rounded-full text-sm">
                {participants.length} Peserta
              </span>
            </div>
            
            {participants.length === 0 ? (
              <div className="bg-[#3b3b3b] rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-gray-400">Belum ada peserta yang ditambahkan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className="bg-[#3b3b3b] rounded-lg p-4 hover:bg-[#404040] transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-white">
                        {participant.name}
                      </h3>
                      {participant.final_rank && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
                          Peringkat #{participant.final_rank}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      {participant.email && (
                        <div className="flex items-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span>{participant.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 