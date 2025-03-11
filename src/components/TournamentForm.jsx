'use client';

import { useState } from 'react';

export default function TournamentForm({ onTournamentCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    tournamentType: 'single elimination',
    description: '',
    gameType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch('/api/challonge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat turnamen');
      }

      const data = await response.json();
      setFormData({
        name: '',
        tournamentType: 'single elimination',
        description: '',
        gameType: '',
      });
      
      if (onTournamentCreated) {
        onTournamentCreated(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Nama Turnamen
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
            placeholder="Masukkan nama turnamen"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Tipe Turnamen
          </label>
          <select
            name="tournamentType"
            value={formData.tournamentType}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
          >
            <option value="single elimination">Single Elimination</option>
            <option value="double elimination">Double Elimination</option>
            <option value="round robin">Round Robin</option>
            <option value="swiss">Swiss</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
            rows="3"
            placeholder="Masukkan deskripsi turnamen (opsional)"
          ></textarea>
        </div>
        
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Jenis Game
          </label>
          <input
            type="text"
            name="gameType"
            value={formData.gameType}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
            placeholder="Contoh: Mobile Legends, PUBG Mobile, dll"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#f26522] hover:bg-[#ff7b3d] text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:ring-offset-2 focus:ring-offset-[#2b2b2b] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Membuat Turnamen...
            </div>
          ) : (
            'Buat Turnamen'
          )}
        </button>
      </form>
    </div>
  );
} 