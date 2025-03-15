import { useState, useEffect } from 'react';

export default function EditTournamentActionsModal({ isOpen, onClose, tournament, onSuccess }) {
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleReset = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset turnamen ini? Semua skor dan hasil pertandingan akan dihapus.')) {
      return;
    }

    setIsResetting(true);
    setError('');

    try {
      const response = await fetch(`/api/challonge/tournaments/${tournament.id}/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Gagal mereset turnamen');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError('Gagal mereset turnamen. Silakan coba lagi.');
      console.error('Error resetting tournament:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus turnamen ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/challonge/tournaments/${tournament.id}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus turnamen');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError('Gagal menghapus turnamen. Silakan coba lagi.');
      console.error('Error deleting tournament:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!tournament || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center">
        <div 
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
        />

        <div className="relative bg-[#2b2b2b] rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">
            Edit Turnamen
          </h2>

          <div className="space-y-4">
            <div className="bg-[#3b3b3b] rounded-lg p-4">
              <h3 className="text-white font-medium mb-2">{tournament.name}</h3>
              <p className="text-gray-400 text-sm">
                Status: {tournament.state === 'complete' ? 'Selesai' :
                        tournament.state === 'underway' ? 'Berlangsung' :
                        'Menunggu'}
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleReset}
                disabled={isResetting || isDeleting}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                {isResetting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Mereset...
                  </>
                ) : (
                  'Reset Turnamen'
                )}
              </button>

              <button
                onClick={handleDelete}
                disabled={isResetting || isDeleting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Menghapus...
                  </>
                ) : (
                  'Hapus Turnamen'
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              disabled={isResetting || isDeleting}
              className="w-full mt-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}