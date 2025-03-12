'use client';

import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Komponen untuk item peserta yang bisa di-drag
const ParticipantItem = ({ participant, index, moveParticipant, updateSeed }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'PARTICIPANT',
    item: { id: participant.participant.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'PARTICIPANT',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveParticipant(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`p-3 mb-2 rounded-lg border ${
        isDragging ? 'bg-gray-100 opacity-50' : 'bg-white'
      } cursor-move flex justify-between items-center`}
    >
      <div className="flex items-center">
        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
          {participant.participant.seed || '?'}
        </div>
        <div>
          <div className="font-medium">{participant.participant.name}</div>
          {participant.participant.email && (
            <div className="text-sm text-gray-500">{participant.participant.email}</div>
          )}
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="number"
          min="1"
          value={participant.participant.seed || ''}
          onChange={(e) => updateSeed(participant.participant.id, parseInt(e.target.value) || 1)}
          className="w-16 p-1 border rounded text-center mr-2"
          placeholder="Seed"
        />
      </div>
    </div>
  );
};

export default function ParticipantManager({ tournamentId, onPositionSaved }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, [tournamentId]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/challonge/participants?tournamentId=${tournamentId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data peserta');
      }
      const data = await response.json();
      
      // Urutkan peserta berdasarkan seed
      const sortedParticipants = data.sort((a, b) => 
        (a.participant.seed || Infinity) - (b.participant.seed || Infinity)
      );
      
      setParticipants(sortedParticipants);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const moveParticipant = (fromIndex, toIndex) => {
    const updatedParticipants = [...participants];
    const [movedItem] = updatedParticipants.splice(fromIndex, 1);
    updatedParticipants.splice(toIndex, 0, movedItem);
    
    // Update seeds berdasarkan posisi baru
    const participantsWithUpdatedSeeds = updatedParticipants.map((p, index) => {
      return {
        ...p,
        participant: {
          ...p.participant,
          seed: index + 1
        }
      };
    });
    
    setParticipants(participantsWithUpdatedSeeds);
  };

  const updateSeed = (participantId, newSeed) => {
    const updatedParticipants = participants.map(p => {
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
    });
    
    setParticipants(updatedParticipants);
  };

  const saveParticipantSeeds = async () => {
    setIsSaving(true);
    setSuccess('');
    setError('');
    
    try {
      // Simpan seed untuk setiap peserta
      const savePromises = participants.map(p => 
        fetch('/api/challonge/participants', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tournamentId,
            participantId: p.participant.id,
            seed: p.participant.seed
          }),
        })
      );
      
      await Promise.all(savePromises);
      setSuccess('Posisi peserta berhasil disimpan');
      
      // Refresh data peserta
      await fetchParticipants();
      
      // Panggil callback onPositionSaved jika disediakan
      if (typeof onPositionSaved === 'function') {
        onPositionSaved();
      }
    } catch (err) {
      setError('Gagal menyimpan posisi peserta: ' + err.message);
      console.error('Error saving participant seeds:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const shuffleParticipants = async () => {
    setIsShuffling(true);
    setSuccess('');
    setError('');
    
    try {
      const response = await fetch('/api/challonge/participants', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          action: 'randomize'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal melakukan shuffle peserta');
      }
      
      setSuccess('Peserta berhasil di-shuffle');
      
      // Refresh data peserta
      await fetchParticipants();
      
      // Panggil callback onPositionSaved jika disediakan
      if (typeof onPositionSaved === 'function') {
        onPositionSaved();
      }
    } catch (err) {
      setError('Gagal melakukan shuffle peserta: ' + err.message);
      console.error('Error shuffling participants:', err);
    } finally {
      setIsShuffling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && participants.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Kelola Peserta Turnamen</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={saveParticipantSeeds}
          disabled={isSaving || participants.length === 0}
          className={`px-4 py-2 rounded-lg flex items-center ${
            isSaving || participants.length === 0
              ? 'bg-gray-300 cursor-not-allowed'
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
        
        <button
          onClick={shuffleParticipants}
          disabled={isShuffling || participants.length < 2}
          className={`px-4 py-2 rounded-lg flex items-center ${
            isShuffling || participants.length < 2
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          {isShuffling ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Shuffling...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
              </svg>
              Shuffle Peserta
            </>
          )}
        </button>
      </div>
      
      <div className="mb-2 text-sm text-gray-600">
        <p>Petunjuk:</p>
        <ul className="list-disc ml-5">
          <li>Seret dan lepas peserta untuk mengubah posisi</li>
          <li>Atau ubah nomor seed secara manual</li>
          <li>Klik "Simpan Posisi" untuk menyimpan perubahan</li>
          <li>Klik "Shuffle Peserta" untuk mengacak posisi peserta</li>
        </ul>
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Daftar Peserta ({participants.length})</h3>
        
        {participants.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Belum ada peserta dalam turnamen ini.
          </div>
        ) : (
          <DndProvider backend={HTML5Backend}>
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <ParticipantItem
                  key={participant.participant.id}
                  participant={participant}
                  index={index}
                  moveParticipant={moveParticipant}
                  updateSeed={updateSeed}
                />
              ))}
            </div>
          </DndProvider>
        )}
      </div>
    </div>
  );
} 