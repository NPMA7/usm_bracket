'use client';

import { useState, useEffect } from 'react';

export default function TournamentBracket({ tournamentId }) {
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tournament, setTournament] = useState(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [tournamentStatus, setTournamentStatus] = useState('');

  useEffect(() => {
    const fetchTournamentData = async () => {
      setIsLoading(true);
      try {
        // Fetch tournament details
        const tournamentResponse = await fetch(`/api/challonge?tournamentId=${tournamentId}`);
        if (!tournamentResponse.ok) {
          throw new Error('Gagal mengambil data turnamen');
        }
        const tournamentData = await tournamentResponse.json();
        // Find the tournament with the matching ID
        const tournament = Array.isArray(tournamentData) 
          ? tournamentData.find(t => t.tournament.id.toString() === tournamentId)
          : tournamentData;
          
        if (!tournament) {
          throw new Error('Turnamen tidak ditemukan');
        }
        
        setTournament(tournament);
        
        // Cek status turnamen
        const isStarted = tournament.tournament.state !== 'pending';
        setTournamentStarted(isStarted);
        setTournamentStatus(tournament.tournament.state);
        
        // Fetch matches
        const matchesResponse = await fetch(`/api/challonge/matches?tournamentId=${tournamentId}`);
        if (!matchesResponse.ok) {
          throw new Error('Gagal mengambil data pertandingan');
        }
        const matchesData = await matchesResponse.json();
        
        // Periksa format respons dan ambil array matches
        if (Array.isArray(matchesData)) {
          setMatches(matchesData);
        } else if (matchesData && Array.isArray(matchesData.matches)) {
          setMatches(matchesData.matches);
        } else {
          // Jika bukan array dan tidak memiliki property matches, set sebagai array kosong
          setMatches([]);
          console.log('Format respons matches tidak sesuai:', matchesData);
        }
        
        // Fetch participants
        const participantsResponse = await fetch(`/api/challonge/participants?tournamentId=${tournamentId}`);
        if (!participantsResponse.ok) {
          throw new Error('Gagal mengambil data peserta');
        }
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching tournament data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (tournamentId) {
      fetchTournamentData();
    }
  }, [tournamentId]);

  const getParticipantName = (id) => {
    if (!id) return 'TBD';
    const participant = participants.find(p => p.participant.id === id);
    return participant ? participant.participant.name : 'Unknown';
  };

  const getMatchResult = (match) => {
    if (!match.match.winner_id) return 'vs';
    return match.match.scores_csv || 'Selesai';
  };

  // Group matches by round
  const groupMatchesByRound = () => {
    const grouped = {};
    // Pastikan matches adalah array sebelum memanggil forEach
    if (Array.isArray(matches)) {
      matches.forEach(match => {
        const round = match.match.round;
        if (!grouped[round]) {
          grouped[round] = [];
        }
        grouped[round].push(match);
      });
    }
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  // Fungsi untuk mendapatkan warna status pertandingan
  const getMatchStatusColor = (match) => {
    if (match.match.state === 'complete') {
      return 'border-green-500';
    } else if (match.match.state === 'open') {
      return 'border-blue-500';
    } else {
      return 'border-gray-300';
    }
  };

  const roundsMatches = groupMatchesByRound();
  const rounds = Object.keys(roundsMatches).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Bracket Turnamen</h2>
        {tournament && (
          <a 
            href={tournament.tournament.live_image_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Lihat Gambar Bracket Lengkap
          </a>
        )}
      </div>
      
      {!tournamentStarted && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Turnamen belum dimulai.</strong> Bracket akan diperbarui setelah turnamen dimulai. Silakan mulai turnamen di Challonge untuk melihat bracket lengkap.
            </span>
          </div>
        </div>
      )}
      
      {(!Array.isArray(matches) || matches.length === 0) ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          {participants.length > 0 ? (
            <>
              <p className="font-bold mb-2">Bracket belum tersedia</p>
              <p>Turnamen sudah memiliki {participants.length} peserta, tetapi bracket belum dibuat.</p>
              <p className="mt-2">Silakan mulai turnamen di Challonge untuk membuat bracket secara otomatis.</p>
            </>
          ) : (
            <>
              <p className="font-bold mb-2">Belum ada peserta</p>
              <p>Tambahkan peserta ke turnamen terlebih dahulu, kemudian mulai turnamen untuk melihat bracket.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="bracket-container flex space-x-8 min-w-max pb-4">
            {rounds.map(round => (
              <div key={round} className="min-w-[280px]">
                <h3 className="text-lg font-semibold mb-4 text-center bg-gray-100 dark:bg-gray-700 py-2 rounded">
                  {round > 0 ? `Ronde ${round}` : `Ronde Loser ${Math.abs(round)}`}
                </h3>
                
                <div className="space-y-8 relative">
                  {roundsMatches[round].map((match, index) => (
                    <div 
                      key={match.match.id} 
                      className={`border-2 rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm ${getMatchStatusColor(match)}`}
                    >
                      <div className={`p-2 rounded ${match.match.player1_id === match.match.winner_id ? 'bg-green-100 dark:bg-green-800 font-bold' : ''}`}>
                        {getParticipantName(match.match.player1_id)}
                      </div>
                      
                      <div className="text-center text-sm py-1 font-semibold">
                        {getMatchResult(match)}
                      </div>
                      
                      <div className={`p-2 rounded ${match.match.player2_id === match.match.winner_id ? 'bg-green-100 dark:bg-green-800 font-bold' : ''}`}>
                        {getParticipantName(match.match.player2_id)}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                        <span>Match #{match.match.identifier}</span>
                        <span>{match.match.state === 'complete' ? '✓ Selesai' : match.match.state === 'open' ? '⚡ Aktif' : '⏳ Menunggu'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Peserta Turnamen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {participants.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded col-span-full">
              Belum ada peserta yang ditambahkan.
            </div>
          ) : (
            participants.map(participant => (
              <div 
                key={participant.participant.id}
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 hover:shadow-md transition"
              >
                <div className="font-medium text-lg">{participant.participant.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <div>Seed: {participant.participant.seed || 'N/A'}</div>
                  {participant.participant.final_rank && (
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      Peringkat Akhir: #{participant.participant.final_rank}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {tournament && tournament.tournament.state === 'complete' && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4">Hasil Akhir Turnamen</h3>
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <div className="text-center">
              <p className="text-lg font-bold mb-2">Pemenang</p>
              {participants.filter(p => p.participant.final_rank === 1).map(winner => (
                <div key={winner.participant.id} className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {winner.participant.name}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="font-semibold mb-1">Juara 1</p>
                {participants.filter(p => p.participant.final_rank === 1).map(p => (
                  <div key={p.participant.id}>{p.participant.name}</div>
                ))}
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1">Juara 2</p>
                {participants.filter(p => p.participant.final_rank === 2).map(p => (
                  <div key={p.participant.id}>{p.participant.name}</div>
                ))}
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1">Juara 3</p>
                {participants.filter(p => p.participant.final_rank === 3).map(p => (
                  <div key={p.participant.id}>{p.participant.name}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .bracket-container {
          position: relative;
        }
        
        @media (max-width: 640px) {
          .bracket-container {
            padding-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
}