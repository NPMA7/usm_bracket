'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EditParticipantPositionModal({ isOpen, onClose, tournamentId, onSuccess }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [useRawData, setUseRawData] = useState(false);
  const [rawDataDisplay, setRawDataDisplay] = useState(null);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (isOpen && tournamentId) {
      fetchParticipants();
    }
  }, [isOpen, tournamentId, useRawData]);

  const fetchParticipants = async () => {
    setLoading(true);
    setError('');
    setRawDataDisplay(null);
    try {
      console.log('Mengambil data peserta untuk turnamen ID:', tournamentId);
      console.log('Menggunakan mode raw data:', useRawData);
      
      const url = useRawData 
        ? `/api/challonge/participants?tournamentId=${tournamentId}&raw=true`
        : `/api/challonge/participants?tournamentId=${tournamentId}`;
      
      const response = await fetch(url);
      console.log('Status respons API:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error respons API:', errorText);
        throw new Error(`Gagal mengambil data peserta: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Data peserta dari API (raw):', data);
      
      // Jika menggunakan mode raw data, tampilkan data mentah
      if (useRawData) {
        setRawDataDisplay(JSON.stringify(data, null, 2));
        
        // Coba konversi data mentah ke format yang diharapkan
        const formattedData = data.map(item => {
          // Jika item memiliki properti participant, gunakan itu
          if (item.participant) {
            return item;
          }
          
          // Jika tidak, bungkus item dalam objek participant
          return {
            participant: {
              id: item.id,
              name: item.name || item.display_name || 'Unnamed',
              seed: item.seed !== undefined ? item.seed : null,
              display_name: item.display_name || item.name || 'Unnamed'
            }
          };
        });
        
        console.log('Data yang diformat dari raw data:', formattedData);
        setParticipants(formattedData);
        setLoading(false);
        return;
      }
      
      // Pastikan data valid dan memiliki struktur yang benar
      if (!Array.isArray(data)) {
        console.error('Format data tidak valid (bukan array):', data);
        
        // Coba periksa apakah data mungkin dibungkus dalam objek
        let participantsArray = data;
        if (data && typeof data === 'object' && data.participants && Array.isArray(data.participants)) {
          participantsArray = data.participants;
          console.log('Data peserta ditemukan dalam properti participants:', participantsArray);
        } else if (data && typeof data === 'object' && data.participant && Array.isArray(data.participant)) {
          participantsArray = data.participant;
          console.log('Data peserta ditemukan dalam properti participant:', participantsArray);
        } else {
          throw new Error('Format data peserta tidak valid');
        }
        
        // Gunakan array yang ditemukan
        setParticipants(participantsArray);
        setLoading(false);
        return;
      }
      
      // Periksa struktur data dan filter item yang tidak valid
      const validParticipants = data.filter(item => {
        // Periksa apakah item adalah objek
        if (!item || typeof item !== 'object') {
          console.warn('Item bukan objek:', item);
          return false;
        }
        
        // Periksa apakah item memiliki properti participant
        if (!item.participant) {
          // Coba periksa apakah item itu sendiri adalah participant
          if (item.id && (item.name || item.display_name)) {
            // Item ini sepertinya langsung objek participant
            console.log('Item sepertinya langsung objek participant:', item);
            // Bungkus dalam format yang diharapkan
            item = { participant: item };
            return true;
          }
          
          console.warn('Item tidak memiliki properti participant:', item);
          return false;
        }
        
        // Periksa apakah participant adalah objek
        if (typeof item.participant !== 'object') {
          console.warn('Properti participant bukan objek:', item.participant);
          return false;
        }
        
        return true;
      });
      
      if (validParticipants.length === 0) {
        console.warn('Tidak ada peserta valid yang ditemukan. Data asli:', data);
        
        // Coba pendekatan alternatif jika data tidak kosong
        if (data.length > 0) {
          // Coba gunakan data langsung jika sepertinya sudah dalam format yang benar
          const directParticipants = data.map(item => {
            // Jika item sudah memiliki id dan name, anggap sebagai participant langsung
            if (item && typeof item === 'object' && (item.id || item.participant_id) && (item.name || item.display_name)) {
              return {
                participant: {
                  id: item.id || item.participant_id,
                  name: item.name || item.display_name || 'Unnamed',
                  seed: item.seed !== undefined ? item.seed : null,
                  display_name: item.display_name || item.name || 'Unnamed'
                }
              };
            }
            return item;
          });
          
          console.log('Mencoba menggunakan data langsung:', directParticipants);
          setParticipants(directParticipants);
          setLoading(false);
          return;
        }
      } else if (validParticipants.length < data.length) {
        console.warn(`Beberapa peserta difilter karena tidak valid: ${data.length - validParticipants.length} dari ${data.length}`);
      }
      
      // Urutkan peserta berdasarkan seed
      const sortedParticipants = validParticipants.sort((a, b) => {
        const seedA = a.participant && a.participant.seed ? a.participant.seed : Infinity;
        const seedB = b.participant && b.participant.seed ? b.participant.seed : Infinity;
        return seedA - seedB;
      });
      
      console.log('Peserta yang diurutkan:', sortedParticipants);
      
      setParticipants(sortedParticipants);
    } catch (err) {
      console.error('Error lengkap saat mengambil data peserta:', err);
      setError(`Gagal mengambil data peserta: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateSeed = (participantId, newSeed) => {
    const updatedParticipants = participants.map(p => {
      if (p.participant && p.participant.id === participantId) {
        return {
          ...p,
          participant: {
            ...p.participant,
            seed: newSeed
          }
        };
      }
      return p;
    });
    
    setParticipants(updatedParticipants);
  };

  const saveParticipantSeeds = async () => {
    setIsSaving(true);
    setSuccess('');
    setError('');
    
    try {
      // Filter peserta yang valid
      const validParticipants = participants.filter(p => p.participant && p.participant.id);
      
      console.log('Menyimpan posisi untuk peserta:', validParticipants);
      
      if (validParticipants.length === 0) {
        throw new Error('Tidak ada peserta valid untuk disimpan');
      }
      
      // Simpan seed untuk setiap peserta
      const savePromises = validParticipants.map(p => {
        const payload = {
          tournamentId,
          participantId: p.participant.id,
          seed: p.participant.seed !== undefined ? p.participant.seed : 1 // Pastikan seed selalu ada
        };
        
        console.log('Menyimpan data peserta:', payload);
        
        return fetch('/api/challonge/participants', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }).then(async response => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gagal menyimpan peserta ${p.participant.name || p.participant.display_name || p.participant.id}: ${errorText}`);
          }
          return response;
        });
      });
      
      await Promise.all(savePromises);
      console.log('Semua peserta berhasil disimpan');
      setSuccess('Posisi peserta berhasil disimpan');
      
      // Panggil callback onSuccess jika disediakan
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      
      // Tutup modal setelah 1.5 detik
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error lengkap saat menyimpan posisi peserta:', err);
      setError(`Gagal menyimpan posisi peserta: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Fungsi untuk memuat ulang data peserta
  const handleReloadData = () => {
    fetchParticipants();
  };

  // Fungsi untuk beralih mode data mentah
  const toggleRawDataMode = () => {
    setUseRawData(!useRawData);
  };

  if (!isOpen) return null;

  // Jika bukan di browser, jangan render apa-apa
  if (!isBrowser) return null;

  // Gunakan createPortal untuk merender modal di luar hierarki komponen
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Posisi Peserta</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
              <div className="mt-2 flex space-x-2">
                <button 
                  onClick={handleReloadData}
                  className="px-3 py-1 bg-red-200 hover:bg-red-300 rounded text-sm font-medium"
                >
                  Coba Lagi
                </button>
                <button 
                  onClick={toggleRawDataMode}
                  className="px-3 py-1 bg-red-200 hover:bg-red-300 rounded text-sm font-medium"
                >
                  {useRawData ? 'Gunakan Mode Normal' : 'Gunakan Mode Raw Data'}
                </button>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : useRawData && rawDataDisplay ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Mode Data Mentah</h3>
                <button 
                  onClick={toggleRawDataMode}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm font-medium"
                >
                  Kembali ke Mode Normal
                </button>
              </div>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs">
                {rawDataDisplay}
              </pre>
            </div>
          ) : participants.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p>Belum ada peserta dalam turnamen ini.</p>
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={handleReloadData}
                  className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-sm font-medium"
                >
                  Muat Ulang Data
                </button>
                <button 
                  onClick={toggleRawDataMode}
                  className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-sm font-medium"
                >
                  {useRawData ? 'Gunakan Mode Normal' : 'Gunakan Mode Raw Data'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Atur posisi peserta dengan mengubah nomor seed. Nomor seed yang lebih kecil akan ditempatkan lebih tinggi dalam bracket.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map((participant, index) => {
                  // Pastikan participant dan participant.participant valid
                  if (!participant || !participant.participant) {
                    console.warn(`Peserta pada indeks ${index} tidak valid:`, participant);
                    return null;
                  }
                  
                  // Pastikan participant.participant.id ada
                  if (!participant.participant.id) {
                    console.warn(`Peserta pada indeks ${index} tidak memiliki ID:`, participant);
                    return null;
                  }
                  
                  // Gunakan display_name jika tersedia, jika tidak gunakan name
                  const displayName = participant.participant.display_name || 
                                     participant.participant.name || 
                                     'Peserta Tanpa Nama';
                  
                  return (
                    <div 
                      key={participant.participant.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
                          {participant.participant.seed || '?'}
                        </div>
                        <div className="truncate">
                          <div className="font-medium">{displayName}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="1"
                          value={participant.participant.seed || ''}
                          onChange={(e) => {
                            const newSeed = parseInt(e.target.value) || 1;
                            updateSeed(participant.participant.id, newSeed);
                          }}
                          className="w-16 p-1 border rounded text-center"
                          placeholder="Seed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div>
            <button
              onClick={handleReloadData}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Muat Ulang
            </button>
          </div>
          <div className="flex">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mr-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Batal
            </button>
            <button
              onClick={saveParticipantSeeds}
              disabled={isSaving || participants.length === 0}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isSaving || participants.length === 0
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Simpan Posisi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 