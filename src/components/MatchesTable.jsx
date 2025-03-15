const MatchesTable = ({
  matches,
  getParticipantName,
  onSelectMatch,
  tournament,
  searchTerm,
  statusFilter
}) => {
  // Fungsi untuk menentukan prioritas status
  const getStatusPriority = (state) => {
    switch (state) {
      case 'open': return 1; // Berlangsung (prioritas tertinggi)
      case 'complete': return 2; // Selesai
      case 'pending': return 3; // Menunggu
      default: return 4;
    }
  };

  // Filter dan sort matches berdasarkan search term dan status
  const filteredMatches = matches
    .filter((match) => {
      const player1Name = getParticipantName(match.match.player1_id);
      const player2Name = getParticipantName(match.match.player2_id);
      const matchRound = match.match.round;
      const searchLower = searchTerm.toLowerCase();

      // Filter berdasarkan search term
      const matchesSearch =
        player1Name.toLowerCase().includes(searchLower) ||
        player2Name.toLowerCase().includes(searchLower) ||
        `Ronde ${matchRound}`.toLowerCase().includes(searchLower);

      // Filter berdasarkan status
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && match.match.state === "open") ||
        (statusFilter === "complete" && match.match.state === "complete") ||
        (statusFilter === "pending" && match.match.state === "pending");

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort berdasarkan status
      const statusPriorityA = getStatusPriority(a.match.state);
      const statusPriorityB = getStatusPriority(b.match.state);
      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB;
      }
      // Jika status sama, sort berdasarkan suggested_play_order
      return (a.match.suggested_play_order || 0) - (b.match.suggested_play_order || 0);
    });

  return (
    <table className="min-w-full divide-y divide-gray-700">
      <thead>
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            No
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Ronde
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Player 1
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Player 2
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Skor
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {filteredMatches.map((match, index) => {
          const player1Name = getParticipantName(match.match.player1_id);
          const player2Name = getParticipantName(match.match.player2_id);
          const isTBD = player1Name === "TBD" || player2Name === "TBD";
          const isOpen = match.match.state === "open";
          const isComplete = match.match.state === "complete";
          
          // Pertandingan dapat diedit jika:
          // 1. Status pertandingan adalah "open" (selalu diutamakan)
          // 2. Atau jika tidak TBD dan turnamen belum selesai
          const canEditMatch = isOpen || (!isTBD && tournament.tournament.state !== "complete");

          return (
            <tr
              key={match.match.id}
              className="hover:bg-[#333333] transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                  {match.match.round > 0
                    ? `Ronde ${match.match.round}`
                    : `Loser ${Math.abs(match.match.round)}`}
                </span>
              </td>
              <td
                className={`px-6 py-4 whitespace-nowrap text-sm ${
                  match.match.player1_id === match.match.winner_id
                    ? "text-green-400 font-medium"
                    : player1Name === "TBD" 
                      ? "text-blue-400 font-medium"
                      : "text-gray-300"
                }`}
              >
                {player1Name}
              </td>
              <td
                className={`px-6 py-4 whitespace-nowrap text-sm ${
                  match.match.player2_id === match.match.winner_id
                    ? "text-green-400 font-medium"
                    : player2Name === "TBD" 
                      ? "text-blue-400 font-medium"
                      : "text-gray-300"
                }`}
              >
                {player2Name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    match.match.state === "open"
                      ? "bg-blue-900/50 text-blue-400"
                      : match.match.state === "complete"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {match.match.state === "open"
                    ? "Berlangsung"
                    : match.match.state === "complete"
                    ? "Selesai"
                    : "Menunggu"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {match.match.scores_csv || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                <div className="flex space-x-2">
                  {canEditMatch && !isComplete && (
                    <button
                      onClick={() => onSelectMatch(match)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="Edit Skor"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  )}
                  {isComplete && (
                    <button
                      onClick={() => onSelectMatch(match)}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="Buka Kembali"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default MatchesTable; 