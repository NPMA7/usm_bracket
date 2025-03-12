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
    <div className="space-y-4">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="bg-[#3b3b3b] rounded-lg p-4 hover:bg-[#404040] transition-colors"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-white">{participant.name}</h3>
            {participant.final_rank && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
                Peringkat #{participant.final_rank}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4">
            {participant.email && (
              <div className="flex items-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>{participant.email}</span>
              </div>
            )}
          </div>

          {/* Tombol aksi hanya ditampilkan jika turnamen masih pending */}
          {tournament?.tournament?.state === "pending" && (
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => onEditClick(participant)}
                className="px-3 py-1 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded-md text-sm flex items-center transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => onDeleteClick(participant)}
                className="px-3 py-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-md text-sm flex items-center transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
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
      ))}
    </div>
  );
};

export default TournamentParticipantsList; 