const FinalResultBox = ({ standings }) => {
  if (!standings || standings.length === 0) return null;

  // Ambil 2 peserta teratas berdasarkan final_rank
  const topParticipants = standings
    .filter(p => p.final_rank && p.final_rank <= 2)
    .sort((a, b) => a.final_rank - b.final_rank);

  if (topParticipants.length === 0) return null;

  return (
    <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2 text-[#f26522]"
            viewBox="0 0 16 16"
          >
            <path
              d="M8 0L10.472 2.472L14 2.8944L11.416 4.8288L12.944 8L8 6.4L3.056 8L4.584 4.8288L2 2.8944L5.528 2.472L8 0Z"
              fill="currentColor"
            />
            <path
              d="M4 7.2V16H12V7.2C11.4154 7.4647 10.7701 7.6 10 7.6C9.22991 7.6 8.58459 7.4647 8 7.2C7.41541 7.4647 6.77009 7.6 6 7.6C5.22991 7.6 4.58459 7.4647 4 7.2Z"
              fill="currentColor"
            />
          </svg>
          Hasil Akhir Turnamen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topParticipants.map((participant, index) => {
            const wins = participant.wins || 0;
            const losses = participant.losses || 0;
            
            // Tentukan kelas dan gambar medali berdasarkan peringkat
            let medalClass = "";
            let medalImg = "";
            let rankTitle = "";
            
            if (index === 0) { // Juara 1
              medalClass = "bg-gradient-to-r from-[#f26522]/20 to-[#f26522]/5 border border-[#f26522]";
              medalImg = "https://assets.challonge.com/assets/icon-medal-first-9f45bab2a90d78bf720a8d196bf2dbbf260c4ba65a6e6a22c4e4c19813f7c9f2.svg";
              rankTitle = "Juara";
            } else { // Juara 2
              medalClass = "bg-gradient-to-r from-gray-700/50 to-gray-700/30 border border-gray-600";
              medalImg = "https://assets.challonge.com/assets/icon-medal-second-db37f62deb0580bc0b59a95cb799e284012340d3225eb8c88c316482f872e98e.svg";
              rankTitle = "Runner-up";
            }

            return (
              <div
                key={participant.id}
                className={`p-6 rounded-lg flex items-center justify-between ${medalClass}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img
                      src={medalImg}
                      className="h-10 w-10"
                      alt={`${rankTitle} medal`}
                    />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{participant.name}</div>
                    <div className="text-sm text-gray-400 flex items-center mt-1">
                      <span className="font-medium mr-2">
                        {rankTitle}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-400 text-xs">
                          W: {wins}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-900/50 text-red-400 text-xs">
                          L: {losses}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinalResultBox; 