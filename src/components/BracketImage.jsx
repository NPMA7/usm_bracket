'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function BracketImage({ tournamentId, refreshKey, isAdmin }) {
  const [bracketUrls, setBracketUrls] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tournament, setTournament] = useState(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [iframeError, setIframeError] = useState(false);
  const [challongeUrl, setChallongeUrl] = useState('');
  const [moduleRefreshKey, setModuleRefreshKey] = useState(0);
  const moduleIframeRef = useRef(null);

  useEffect(() => {
    fetchBracketImage();
  }, [tournamentId, refreshKey]);

  useEffect(() => {
    if (moduleRefreshKey > 0) {
      fetchBracketImage();
    }
  }, [moduleRefreshKey]);

  const fetchBracketImage = async () => {
    setIsLoading(true);
    setIframeError(false);
    try {
      // Ambil data turnamen dari database
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('bracket_tournaments')
        .select('*')
        .eq('challonge_id', tournamentId)
        .single();
      
      if (tournamentError) {
        throw new Error('Gagal mengambil data turnamen dari database');
      }
      
      setTournament(tournamentData);
      
      const challongeUrl = tournamentData.url;
      setChallongeUrl(challongeUrl);
      
      const isStarted = tournamentData.state !== 'pending';
      setTournamentStarted(isStarted);
      
      // Ambil data peserta dari database
      const { data: participantsData, error: participantsError } = await supabase
        .from('bracket_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { nullsLast: true });
      
      if (!participantsError) {
        setParticipants(participantsData);
      }
      
      // Buat URL untuk gambar bracket
      const liveImageUrl = tournamentData.live_image_url || `https://challonge.com/${challongeUrl}/module`;
      const svgIconUrl = `https://challonge.com/${challongeUrl}.svg`;
      const fullSizeImageUrl = tournamentData.full_challonge_url + '.svg';
      
      setBracketUrls({
        liveImage: liveImageUrl,
        svgImage: svgIconUrl,
        fullSizeImage: fullSizeImageUrl,
        isStarted: isStarted,
        participantsCount: tournamentData.participants_count || 0,
        state: tournamentData.state
      });
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
    return tournament.full_challonge_url;
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
          <span>Geser ke kanan kiri atau atas bawah untuk melihat seluruh bracket turnamen</span>
        </div>
      </div>
      <div className="overflow-auto">
        <div className="flex flex-col justify-center">
          {!shouldShowBracketImage() ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded w-full">
              <p className="font-bold mb-2">Bracket belum tersedia</p>
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