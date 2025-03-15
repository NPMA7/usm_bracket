'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EditParticipantPositionModal({ isOpen, onClose, tournament, participants: initialParticipants, onPositionsUpdated }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (isOpen && initialParticipants) {
      // Format participants data
      const formattedParticipants = initialParticipants.map(p => ({
            participant: {
          id: p.id,
          name: p.name,
          seed: p.seed || 1,
          display_name: p.name
        }
      }));
      setParticipants(formattedParticipants);
      setLoading(false);
    }
  }, [isOpen, initialParticipants]);

  const updateSeed = (participantId, newSeed) => {
    setParticipants(prevParticipants => 
      prevParticipants.map(p => {
        if (p.participant.id === participantId) {
        return {
          ...p,
          participant: {
            ...p.participant,
            seed: newSeed
          }
        };
      }
      return p;
      })
    );
  };

  const saveParticipantSeeds = async () => {
    setIsSaving(true);
    setSuccess('');
    setError('');
    
    try {
      // Filter peserta yang valid
      const validParticipants = participants.filter(p => p.participant && p.participant.id);
      
      if (validParticipants.length === 0) {
        throw new Error('Tidak ada peserta valid untuk disimpan');
      }
      
      // Simpan seed untuk setiap peserta
      const savePromises = validParticipants.map(p => {
        const payload = {
          tournamentId: tournament.tournament.id,
          participantId: p.participant.id,
          seed: p.participant.seed
        };
        
        return fetch('/api/challonge/participants', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }).then(async response => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gagal menyimpan peserta ${p.participant.name}: ${errorData.error || 'Terjadi kesalahan'}`);
          }
          return response;
        });
      });
      
      await Promise.all(savePromises);
      setSuccess('Posisi peserta berhasil disimpan');
      
      if (typeof onPositionsUpdated === 'function') {
        onPositionsUpdated();
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saat menyimpan posisi peserta:', err);
      setError(`Gagal menyimpan posisi peserta: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !isBrowser) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2b2b2b] rounded-lg shadow-xl w-full max-w-4xl">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Edit Posisi Peserta</h2>
          <button 
            onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f26522] border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm mb-4">
                Atur posisi peserta dengan mengubah nomor seed. Nomor seed yang lebih kecil akan ditempatkan lebih tinggi dalam bracket.
              </p>
              
              {participants.map((p) => (
                <div 
                  key={p.participant.id}
                  className="bg-[#3b3b3b] p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#f26522] text-white rounded-full w-8 h-8 flex items-center justify-center">
                      {p.participant.seed}
                        </div>
                    <span className="text-white">{p.participant.name}</span>
                      </div>
                        <input
                          type="number"
                          min="1"
                    value={p.participant.seed}
                    onChange={(e) => updateSeed(p.participant.id, parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-1 bg-[#2b2b2b] border border-gray-600 rounded text-white text-center"
                        />
                      </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={saveParticipantSeeds}
              disabled={isSaving || participants.length === 0}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isSaving || participants.length === 0
                ? 'bg-[#f26522]/50 cursor-not-allowed'
                : 'bg-[#f26522] hover:bg-[#f26522]/80'
            } text-white`}
            >
              {isSaving ? (
                <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                <span>Menyimpan...</span>
                </>
              ) : (
                <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                <span>Simpan Posisi</span>
                </>
              )}
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
} 