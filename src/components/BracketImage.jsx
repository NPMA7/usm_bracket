'use client';

import { useState, useEffect, useRef } from 'react';
import ParticipantManager from './ParticipantManager';

export default function BracketImage({ tournamentId, refreshKey }) {
  const [bracketUrls, setBracketUrls] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tournament, setTournament] = useState(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [iframeError, setIframeError] = useState(false);
  const [challongeUrl, setChallongeUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showParticipantManager, setShowParticipantManager] = useState(false);
  const [moduleRefreshKey, setModuleRefreshKey] = useState(0);
  const moduleIframeRef = useRef(null);

  useEffect(() => {
    fetchBracketImage();
  }, [tournamentId]);

  useEffect(() => {
    if (moduleRefreshKey > 0) {
      fetchBracketImage();
    }
  }, [moduleRefreshKey]);

  const fetchBracketImage = async () => {
    setIsLoading(true);
    setIframeError(false);
    try {
      const tournamentResponse = await fetch(`/api/challonge?tournamentId=${tournamentId}`);
      if (!tournamentResponse.ok) {
        throw new Error('Gagal mengambil data turnamen');
      }
      
      const tournamentData = await tournamentResponse.json();
      const tournament = Array.isArray(tournamentData) 
        ? tournamentData.find(t => t.tournament.id.toString() === tournamentId)
        : tournamentData;
          
      if (!tournament) {
        throw new Error('Turnamen tidak ditemukan');
      }
      
      setTournament(tournament);
      
      const challongeUrl = tournament.tournament.url;
      setChallongeUrl(challongeUrl);
      
      const isStarted = tournament.tournament.state !== 'pending';
      setTournamentStarted(isStarted);
      
      const participantsResponse = await fetch(`/api/challonge/participants?tournamentId=${tournamentId}`);
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData);
      }
      
      const response = await fetch(`/api/challonge/bracket?tournamentId=${tournamentId}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil gambar bracket');
      }
      
      const data = await response.json();
      setBracketUrls(data);

      setIsAdmin(true);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching bracket image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBracket = () => {
    setModuleRefreshKey(prevKey => prevKey + 1);
    setIframeError(false);
    
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out';
    successMessage.textContent = 'Bracket berhasil diperbarui!';
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage);
      }
    }, 3000);
  };

  const getChallongeDirectUrl = () => {
    if (!tournament) return '';
    return tournament.tournament.full_challonge_url;
  };

  const getChallongeModuleUrl = () => {
    if (!challongeUrl) return '';
    return `https://challonge.com/${challongeUrl}/module`;
  };

  const shouldShowBracketImage = () => {
    if (tournamentStarted) return true;
    const participantsCount = participants.length;
    return participantsCount >= 2;
  };

  const toggleParticipantManager = () => {
    setShowParticipantManager(!showParticipantManager);
  };

  const handleModuleIframeLoad = () => {
    setIframeError(false);
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

  if (!bracketUrls && !challongeUrl) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        Tidak dapat memuat gambar bracket.
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md">      
      <div className="bg-gray-700 p-2 rounded-lg mb-2">
        <div className="flex items-center justify-center text-white">
          <span>Geser ke kanan atau kiri untuk melihat seluruh bracket turnamen</span>
        </div>
      </div>
      
      {!tournamentStarted && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Turnamen belum dimulai.</strong> Gambar bracket mungkin belum lengkap atau belum tersedia. Silakan mulai turnamen di Challonge untuk melihat bracket lengkap.
            </span>
          </div>
        </div>
      )}

      {showParticipantManager && isAdmin && !tournamentStarted && (
        <div className="mb-6">
          <ParticipantManager tournamentId={tournamentId} onPositionSaved={refreshBracket} />
        </div>
      )}
      
      <div className="overflow-auto">
        <div className="flex flex-col justify-center">
          {!shouldShowBracketImage() ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded w-full">
              <p className="font-bold mb-2">Bracket belum tersedia</p>
              <p>Turnamen membutuhkan minimal 2 peserta dan harus dimulai untuk menampilkan bracket.</p>
              <p className="mt-2">Silakan tambahkan peserta dan mulai turnamen di Challonge.</p>
            </div>
          ) : iframeError ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded w-full">
              <p className="font-bold mb-2">Tidak dapat menampilkan bracket di halaman ini</p>
              {tournamentStarted ? (
                <>
                  <p>Terjadi kesalahan saat memuat bracket turnamen.</p>
                  <p className="mt-2">Silakan coba refresh halaman atau kunjungi Challonge langsung.</p>
                  <p className="mt-4">
                    <a 
                      href={getChallongeDirectUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      Lihat di Challonge
                    </a>
                  </p>
                </>
              ) : (
                <>
                  <iframe 
                    ref={moduleIframeRef}
                    src={getChallongeModuleUrl()} 
                    width="100%" 
                    height="500"
                    allowtransparency="true"
                    frameBorder="0"
                    scrolling="auto"
                    onLoad={handleModuleIframeLoad}
                    onError={() => setIframeError(true)}
                  />
                </>
              )}
            </div>
          ) : (
            <iframe 
              ref={moduleIframeRef}
              src={getChallongeModuleUrl()}
              width="100%"
              height="500" 
              allowtransparency="true"
              frameBorder="0"
              scrolling="auto"
              onLoad={handleModuleIframeLoad}
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}