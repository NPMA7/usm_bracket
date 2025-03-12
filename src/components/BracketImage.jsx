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

  // Refresh bracket ketika key berubah
  useEffect(() => {
    if (moduleRefreshKey > 0) {
      fetchBracketImage();
    }
  }, [moduleRefreshKey]);

  // Refresh bracket ketika refreshKey berubah
  // useEffect(() => {
  //   if (refreshKey > 0) {
  //     fetchBracketImage();
  //   }
  // }, [refreshKey]);

  const fetchBracketImage = async () => {
    setIsLoading(true);
    setIframeError(false);
    try {
      // Fetch tournament details first
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
      
      // Ekstrak URL Challonge
      const challongeUrl = tournament.tournament.url;
      setChallongeUrl(challongeUrl);
      
      // Cek status turnamen
      const isStarted = tournament.tournament.state !== 'pending';
      setTournamentStarted(isStarted);
      
      // Fetch participants untuk mengetahui jumlah peserta
      const participantsResponse = await fetch(`/api/challonge/participants?tournamentId=${tournamentId}`);
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData);
      }
      
      // Fetch bracket image URLs
      const response = await fetch(`/api/challonge/bracket?tournamentId=${tournamentId}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil gambar bracket');
      }
      
      const data = await response.json();
      setBracketUrls(data);

      // Cek apakah user adalah admin (ini hanya simulasi, seharusnya diambil dari sistem autentikasi)
      // Dalam implementasi nyata, Anda perlu mengecek apakah user saat ini memiliki hak admin
      setIsAdmin(true); // Anggap semua user adalah admin untuk demo
    } catch (err) {
      setError(err.message);
      console.error('Error fetching bracket image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBracket = () => {
    // Refresh module embed dengan increment refresh key
    setModuleRefreshKey(prevKey => prevKey + 1);
    
    // Reset error state
    setIframeError(false);
    
    // Tampilkan pesan sukses sementara
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in-out';
    successMessage.textContent = 'Bracket berhasil diperbarui!';
    document.body.appendChild(successMessage);
    
    // Hapus pesan setelah 3 detik
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
    // Hapus parameter timestamp untuk mencegah refresh otomatis
    return `https://challonge.com/${challongeUrl}/module`;
  };

  const shouldShowBracketImage = () => {
    // Jika turnamen sudah dimulai, selalu tampilkan gambar
    if (tournamentStarted) return true;
    
    // Jika turnamen belum dimulai, cek jumlah peserta
    const participantsCount = participants.length;
    return participantsCount >= 2;
  };

  const toggleParticipantManager = () => {
    setShowParticipantManager(!showParticipantManager);
  };

  const handleModuleIframeLoad = () => {
    // Reset error state ketika iframe berhasil dimuat
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Bracket Turnamen</h2>
      
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
                    <button
                      onClick={refreshBracket}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center mr-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Refresh Bracket
                    </button>
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
                  <p>Challonge tidak mengizinkan embedding bracket untuk turnamen yang belum dimulai.</p>
                  <p className="mt-2">Silakan mulai turnamen terlebih dahulu atau kunjungi Challonge langsung.</p>
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
              )}
            </div>
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
      </div>
      
      {!tournamentStarted && getChallongeDirectUrl() && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="mb-2 text-gray-600 dark:text-gray-400">
              Untuk melihat preview bracket, kunjungi halaman Challonge langsung:
            </p>
            <a 
              href={getChallongeDirectUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              Lihat Bracket di Challonge
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 