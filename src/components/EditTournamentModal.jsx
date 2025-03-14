'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function EditTournamentModal({ isOpen, onClose, tournament, onSuccess }) {
  const [isBrowser, setIsBrowser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    tournament_type: 'single elimination',
    game_name: '',
    description: '',
    ranked_by: 'match wins',
    rr_iterations: 1,
    pts_for_match_win: 1.0,
    pts_for_match_tie: 0.5,
    pts_for_game_win: 0.0,
    pts_for_game_tie: 0.0,
    pts_for_bye: 1.0,
    tournament_stage: 'single', // single atau two_stage
    group_stage_format: 'round robin', // untuk two_stage
    final_stage_format: 'single elimination', // untuk two_stage
    group_size: 4, // untuk two_stage
    group_advance: 2, // untuk two_stage
    state: 'pending' // status turnamen
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cek apakah turnamen sedang berlangsung atau sudah selesai
  const isActiveOrComplete = formData.state === 'underway' || formData.state === 'complete';

  // Inisialisasi state untuk browser-side rendering
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Isi form dengan data turnamen saat modal dibuka
  useEffect(() => {
    if (tournament) {
      // Tentukan apakah ini turnamen single stage atau two stage
      const isTwoStage = tournament.tournament_type === 'league' || 
                         tournament.tournament_type === 'swiss' || 
                         tournament.group_stages_enabled;
      
      setFormData({
        name: tournament.name || '',
        url: tournament.url || '',
        tournament_type: tournament.tournament_type || 'single elimination',
        game_name: tournament.game_name || '',
        description: tournament.description || '',
        ranked_by: tournament.ranked_by || 'match wins',
        rr_iterations: tournament.rr_iterations || 1,
        pts_for_match_win: tournament.pts_for_match_win || 1.0,
        pts_for_match_tie: tournament.pts_for_match_tie || 0.5,
        pts_for_game_win: tournament.pts_for_game_win || 0.0,
        pts_for_game_tie: tournament.pts_for_game_tie || 0.0,
        pts_for_bye: tournament.pts_for_bye || 1.0,
        tournament_stage: isTwoStage ? 'two_stage' : 'single',
        group_stage_format: tournament.group_stage_format || 'round robin',
        final_stage_format: tournament.final_stage_format || 'single elimination',
        group_size: tournament.group_size || 4,
        group_advance: tournament.group_advance || 2,
        state: tournament.state || 'pending'
      });
    }
  }, [tournament, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Jika turnamen aktif/selesai, hanya izinkan perubahan pada field tertentu
    if (isActiveOrComplete && !['name', 'url', 'game_name', 'description'].includes(name)) {
      return;
    }
    
    let parsedValue = value;
    
    // Konversi nilai numerik
    if (['pts_for_match_win', 'pts_for_match_tie', 'pts_for_game_win', 'pts_for_game_tie', 'pts_for_bye'].includes(name)) {
      parsedValue = parseFloat(value);
    } else if (['rr_iterations', 'group_size', 'group_advance'].includes(name)) {
      parsedValue = parseInt(value, 10);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Buat objek data yang akan dikirim ke API
      const dataToSend = isActiveOrComplete ? 
        {
          name: formData.name,
          url: formData.url,
          game_name: formData.game_name,
          description: formData.description
        } : { ...formData };
      
      // Jika single stage dan turnamen belum dimulai, hapus properti two_stage yang tidak diperlukan
      if (!isActiveOrComplete && formData.tournament_stage === 'single') {
        delete dataToSend.group_stage_format;
        delete dataToSend.final_stage_format;
        delete dataToSend.group_size;
        delete dataToSend.group_advance;
      }
      
      const response = await fetch(`/api/challonge/${tournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengupdate turnamen');
      }

      const data = await response.json();
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cek apakah format turnamen adalah round robin atau swiss
  const isRoundRobinOrSwiss = formData.tournament_type === 'round robin' || formData.tournament_type === 'swiss';
  
  // Cek apakah format turnamen adalah swiss
  const isSwiss = formData.tournament_type === 'swiss' || 
                 (formData.tournament_stage === 'two_stage' && formData.group_stage_format === 'swiss');
  
  // Cek apakah sistem penilaian adalah custom
  const isCustomRanking = formData.ranked_by === 'custom';
  
  // Cek apakah perlu menampilkan pengaturan poin
  const shouldShowPointsSettings = 
    // Selalu tampilkan untuk format Swiss
    isSwiss || 
    // Tampilkan untuk Round Robin jika sistem penilaian adalah custom
    (isCustomRanking && 
      ((formData.tournament_stage === 'single' && formData.tournament_type === 'round robin') || 
       (formData.tournament_stage === 'two_stage' && formData.group_stage_format === 'round robin')));

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-[#2b2b2b] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Edit Turnamen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {isActiveOrComplete && (
            <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-lg mb-6">
              Turnamen sedang berlangsung atau sudah selesai. Hanya beberapa pengaturan yang dapat diubah.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Nama Turnamen
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300">
                URL Challonge
              </label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-600 bg-gray-700 text-gray-300 text-sm">
                  challonge.com/
                </span>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  className="flex-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-r-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="game_name" className="block text-sm font-medium text-gray-300">
                Game
              </label>
              <input
                type="text"
                id="game_name"
                name="game_name"
                value={formData.game_name}
                onChange={handleChange}
                className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
              />
            </div>

            {!isActiveOrComplete && (
              <>
                <div>
                  <label htmlFor="tournament_stage" className="block text-sm font-medium text-gray-300">
                    Tipe Turnamen
                  </label>
                  <div className="mt-1 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="single_stage"
                        name="tournament_stage"
                        type="radio"
                        value="single"
                        checked={formData.tournament_stage === 'single'}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#f26522] focus:ring-[#f26522] border-gray-600 bg-[#3b3b3b]"
                      />
                      <label htmlFor="single_stage" className="ml-2 block text-sm text-gray-300">
                        Single Stage Tournament
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="two_stage"
                        name="tournament_stage"
                        type="radio"
                        value="two_stage"
                        checked={formData.tournament_stage === 'two_stage'}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#f26522] focus:ring-[#f26522] border-gray-600 bg-[#3b3b3b]"
                      />
                      <label htmlFor="two_stage" className="ml-2 block text-sm text-gray-300">
                        Two Stage Tournament — groups compete separately, winners proceed to a final stage
                      </label>
                    </div>
                  </div>
                </div>

                {formData.tournament_stage === 'single' && (
                  <div>
                    <label htmlFor="tournament_type" className="block text-sm font-medium text-gray-300">
                      Format Turnamen
                    </label>
                    <select
                      id="tournament_type"
                      name="tournament_type"
                      value={formData.tournament_type}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                    >
                      <option value="single elimination">Single Elimination</option>
                      <option value="double elimination">Double Elimination</option>
                      <option value="round robin">Round Robin</option>
                      <option value="swiss">Swiss</option>
                    </select>
                  </div>
                )}

                {formData.tournament_stage === 'two_stage' && (
                  <>
                    <div>
                      <label htmlFor="group_stage_format" className="block text-sm font-medium text-gray-300">
                        Format Grup
                      </label>
                      <select
                        id="group_stage_format"
                        name="group_stage_format"
                        value={formData.group_stage_format}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                      >
                        <option value="round robin">Round Robin</option>
                        <option value="swiss">Swiss</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="group_size" className="block text-sm font-medium text-gray-300">
                          Jumlah peserta per grup
                        </label>
                        <input
                          type="number"
                          id="group_size"
                          name="group_size"
                          value={formData.group_size}
                          onChange={handleChange}
                          min="2"
                          max="20"
                          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="group_advance" className="block text-sm font-medium text-gray-300">
                          Jumlah peserta yang lolos per grup
                        </label>
                        <input
                          type="number"
                          id="group_advance"
                          name="group_advance"
                          value={formData.group_advance}
                          onChange={handleChange}
                          min="1"
                          max={formData.group_size - 1}
                          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Tampilkan pengaturan Round Robin hanya jika format turnamen adalah round robin atau swiss */}
                {((formData.tournament_stage === 'single' && isRoundRobinOrSwiss) || 
                  (formData.tournament_stage === 'two_stage' && 
                   (formData.group_stage_format === 'round robin' || formData.group_stage_format === 'swiss'))) && (
                  <>
                    {formData.tournament_type === 'round robin' && (
                      <div>
                        <label htmlFor="rr_iterations" className="block text-sm font-medium text-gray-300">
                          Peserta bermain satu sama lain
                        </label>
                        <select
                          id="rr_iterations"
                          name="rr_iterations"
                          value={formData.rr_iterations}
                          onChange={handleChange}
                          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                        >
                          <option value={1}>Sekali (once)</option>
                          <option value={2}>Dua kali (twice)</option>
                          <option value={3}>Tiga kali (3 times)</option>
                        </select>
                      </div>
                    )}

                    {/* Tampilkan sistem penilaian hanya jika bukan format Swiss */}
                    {!isSwiss && (
                      <div>
                        <label htmlFor="ranked_by" className="block text-sm font-medium text-gray-300">
                          Sistem Penilaian
                        </label>
                        <select
                          id="ranked_by"
                          name="ranked_by"
                          value={formData.ranked_by}
                          onChange={handleChange}
                          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                        >
                          <option value="match wins">Match Wins</option>
                          <option value="game wins">Game/Set Wins</option>
                          <option value="game win percentage">Game/Set Win %</option>
                          <option value="game win difference">Game/Set W/L Difference</option>
                          <option value="points scored">Points Scored</option>
                          <option value="points difference">Points Difference</option>
                          <option value="custom">Custom (points system)</option>
                        </select>
                      </div>
                    )}

                    {shouldShowPointsSettings && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="pts_for_match_win" className="block text-sm font-medium text-gray-300">
                            Poin per kemenangan pertandingan
                          </label>
                          <input
                            type="number"
                            id="pts_for_match_win"
                            name="pts_for_match_win"
                            value={formData.pts_for_match_win}
                            onChange={handleChange}
                            step="0.1"
                            className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="pts_for_match_tie" className="block text-sm font-medium text-gray-300">
                            Poin per seri pertandingan
                          </label>
                          <input
                            type="number"
                            id="pts_for_match_tie"
                            name="pts_for_match_tie"
                            value={formData.pts_for_match_tie}
                            onChange={handleChange}
                            step="0.1"
                            className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="pts_for_game_win" className="block text-sm font-medium text-gray-300">
                            Poin per kemenangan game/set
                          </label>
                          <input
                            type="number"
                            id="pts_for_game_win"
                            name="pts_for_game_win"
                            value={formData.pts_for_game_win}
                            onChange={handleChange}
                            step="0.1"
                            className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="pts_for_game_tie" className="block text-sm font-medium text-gray-300">
                            Poin per seri game/set
                          </label>
                          <input
                            type="number"
                            id="pts_for_game_tie"
                            name="pts_for_game_tie"
                            value={formData.pts_for_game_tie}
                            onChange={handleChange}
                            step="0.1"
                            className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="pts_for_bye" className="block text-sm font-medium text-gray-300">
                            Poin per bye
                          </label>
                          <input
                            type="number"
                            id="pts_for_bye"
                            name="pts_for_bye"
                            value={formData.pts_for_bye}
                            onChange={handleChange}
                            step="0.1"
                            className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Format Final selalu ditampilkan di bawah */}
                {formData.tournament_stage === 'two_stage' && (
                  <div>
                    <label htmlFor="final_stage_format" className="block text-sm font-medium text-gray-300">
                      Format Final
                    </label>
                    <select
                      id="final_stage_format"
                      name="final_stage_format"
                      value={formData.final_stage_format}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
                    >
                      <option value="single elimination">Single Elimination</option>
                      <option value="double elimination">Double Elimination</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Deskripsi
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#f26522] text-white rounded-lg hover:bg-[#ff7b3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (!isBrowser || !isOpen) {
    return null;
  }

  return createPortal(modalContent, document.getElementById('modal-root') || document.body);
} 