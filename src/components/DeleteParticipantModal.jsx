'use client';

import { useState } from 'react';
import Modal from "./Modal";

export default function DeleteParticipantModal({ 
  isOpen, 
  onClose, 
  participant, 
  tournamentId, 
  onParticipantDeleted 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const participantId = participant.participant?.id || participant.participant?.challonge_id || participant.id;
      
      if (!participantId) {
        throw new Error('ID peserta tidak valid');
      }

      const response = await fetch(
        `/api/challonge/participants/${participantId}?tournamentId=${tournamentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus peserta');
      }

      if (onParticipantDeleted) {
        onParticipantDeleted(participantId);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hapus Peserta"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <p className="text-gray-300">
          Apakah Anda yakin ingin menghapus peserta <span className="font-semibold text-white">{participant?.name}</span>?
        </p>
        <p className="text-gray-400 text-sm">
          Tindakan ini tidak dapat dibatalkan dan akan menghapus peserta dari turnamen.
        </p>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Menghapus...
              </div>
            ) : (
              "Hapus"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
} 