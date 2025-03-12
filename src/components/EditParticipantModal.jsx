'use client';

import { useState, useEffect } from 'react';

export default function EditParticipantModal({ 
  isOpen, 
  onClose, 
  participant, 
  tournamentId, 
  onParticipantUpdated 
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (participant) {
      setFormData({
        name: participant.name || '',
        email: participant.email || '',
      });
    }
  }, [participant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!participant) {
        throw new Error('Data peserta tidak valid');
      }



      const participantId = participant.participant_id || participant.id;

      const response = await fetch('/api/challonge/participants', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          participantId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengupdate peserta');
      }

      const data = await response.json();
      
      if (onParticipantUpdated) {
        onParticipantUpdated(data);
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-[#2b2b2b] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-white" id="modal-headline">
                  Edit Peserta
                </h3>
                
                <div className="mt-4">
                  {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Nama Peserta
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                        placeholder="Masukkan nama peserta"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Email (Opsional)
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                        placeholder="Masukkan email peserta"
                      />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#222222] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#f26522] text-base font-medium text-white hover:bg-[#ff7b3d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f26522] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Menyimpan...
                </div>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-4 py-2 bg-[#3b3b3b] text-base font-medium text-gray-300 hover:bg-[#444444] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 