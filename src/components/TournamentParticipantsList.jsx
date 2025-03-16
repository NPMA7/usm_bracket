const TournamentParticipantsList = ({
  participants,
  tournament,
  onEditClick,
  onDeleteClick
}) => {
  if (participants.length === 0) {
    return (
      <div className="bg-[#3b3b3b] rounded-lg p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-4 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-gray-400">Belum ada peserta yang ditambahkan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {participants.map((participant) => (
        <div
          key={participant.participant?.id || participant.participant?.challonge_id || participant.id}
          className="bg-[#3b3b3b] rounded-lg p-3 hover:bg-[#404040] transition-colors"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-medium text-white">{participant.participant?.name || participant.name}</h3>
              {(participant.participant?.final_rank || participant.final_rank) && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
                  #{participant.participant?.final_rank || participant.final_rank}
                </span>
              )}
            </div>

            {/* Tombol aksi hanya ditampilkan jika turnamen masih pending */}
            {tournament?.tournament?.state === "pending" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onEditClick(participant)}
                  className="px-2 py-1 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-md text-xs flex items-center transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => onDeleteClick(participant)}
                  className="px-2 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-md text-xs flex items-center transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TournamentParticipantsList; 