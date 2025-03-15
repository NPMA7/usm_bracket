const UpdateMatchForm = ({
  selectedMatch,
  getParticipantName,
  scores,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onUpdateMatch,
  onReopenMatch,
  isProcessing,
  onClose
}) => {
  if (!selectedMatch) return null;

  const player1Name = getParticipantName(selectedMatch.match.player1_id);
  const player2Name = getParticipantName(selectedMatch.match.player2_id);
  const isComplete = selectedMatch.match.state === "complete";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2b2b2b] rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 text-[#f26522]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            {isComplete ? 'Buka Kembali Pertandingan' : 'Update Skor Pertandingan'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Player 1
              </label>
              <p className="text-white">{player1Name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Player 2
              </label>
              <p className="text-white">{player2Name}</p>
            </div>
          </div>

          {/* Score Sets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-400">
                Set Scores
              </label>
              {!isComplete && (
                <button
                  onClick={onAddSet}
                  className="text-[#f26522] hover:text-[#ff7b3d] transition-colors text-sm flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Tambah Set
                </button>
              )}
            </div>

            <div className="space-y-4">
              {scores.map((set, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <span className="text-gray-400 text-sm">Set {index + 1}</span>
                  <input
                    type="number"
                    value={set.player1}
                    onChange={(e) =>
                      onSetChange(index, "player1", e.target.value === '' ? 0 : parseInt(e.target.value))
                    }
                    disabled={isComplete}
                    min="0"
                    className="bg-[#3b3b3b] text-white px-3 py-2 rounded-lg w-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={set.player2}
                    onChange={(e) =>
                      onSetChange(index, "player2", e.target.value === '' ? 0 : parseInt(e.target.value))
                    }
                    disabled={isComplete}
                    min="0"
                    className="bg-[#3b3b3b] text-white px-3 py-2 rounded-lg w-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!isComplete && scores.length > 1 && (
                    <button
                      onClick={() => onRemoveSet(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Batal
            </button>
            {isComplete ? (
              <button
                onClick={() => {
                  onReopenMatch(selectedMatch);
                }}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                {isProcessing ? "Membuka Kembali..." : "Buka Kembali"}
              </button>
            ) : (
              <button
                onClick={() => {
                  onUpdateMatch();
                  onClose();
                }}
                disabled={isProcessing}
                className="bg-[#f26522] hover:bg-[#ff7b3d] disabled:bg-[#f26522]/50 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {isProcessing ? "Menyimpan..." : "Simpan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateMatchForm; 