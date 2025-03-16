'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentWIBTime } from '@/lib/utils';

export default function StartTournamentButton({ tournamentId, onTournamentStarted, disabled }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleStartTournament = async () => {
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Mulai turnamen di Challonge terlebih dahulu
      const response = await fetch(`/api/challonge/${tournamentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      });

      if (!response.ok) {
        throw new Error('Gagal memulai turnamen di Challonge');
      }

      const data = await response.json();

      // Dapatkan jumlah peserta saat ini
      const { count } = await supabase
        .from('bracket_participants')
        .select('*', { count: 'exact' })
        .eq('tournament_id', tournamentId);

      // Update status turnamen di database menggunakan Supabase
      const { error: updateError } = await supabase
        .from('bracket_tournaments')
        .update({
          state: 'underway',
          started_at: getCurrentWIBTime(),
          updated_at: getCurrentWIBTime()
        })
        .eq('challonge_id', tournamentId);
      
      if (updateError) {
        throw new Error(updateError.message || 'Gagal memulai turnamen');
      }
      
      setSuccess(true);
      
      if (onTournamentStarted) {
        onTournamentStarted(data.tournament);
      }
      
      // Reload halaman setelah 2 detik
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleStartTournament}
        disabled={isLoading || disabled || success}
        className={`flex items-center justify-center px-4 py-2 rounded font-medium ${
          disabled || success
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memulai...
          </>
        ) : success ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Turnamen Dimulai!
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Mulai Turnamen
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 text-sm text-green-600">
          Turnamen berhasil dimulai! Halaman akan dimuat ulang...
        </div>
      )}
    </div>
  );
} 