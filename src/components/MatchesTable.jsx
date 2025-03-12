const MatchesTable = ({
  matches,
  getParticipantName,
  onSelectMatch,
  tournament,
  searchTerm,
  statusFilter
}) => {
  // Filter matches berdasarkan search term dan status
  const filteredMatches = matches.filter((match) => {
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
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {filteredMatches.map((match, index) => {
          const player1Name = getParticipantName(match.match.player1_id);
          const player2Name = getParticipantName(match.match.player2_id);
          const isTBD = player1Name === "TBD" || player2Name === "TBD";
          const isOpen = match.match.state === "open";
          
          // Pertandingan dapat diedit jika:
          // 1. Status pertandingan adalah "open" (selalu diutamakan)
          // 2. Atau jika tidak TBD dan turnamen belum selesai
          const canEditMatch = isOpen || (!isTBD && tournament.tournament.state !== "complete");

          return (
            <tr
              key={match.match.id}
              className="hover:bg-[#333333] transition-colors"
              onClick={() => canEditMatch && onSelectMatch(match)}
              style={{ cursor: canEditMatch ? "pointer" : "default" }}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {match.match.suggested_play_order || index + 1}
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
                    match.match.state === "complete"
                      ? "bg-green-900/50 text-green-400"
                      : match.match.state === "open"
                      ? "bg-blue-900/50 text-blue-400"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {match.match.state === "complete"
                    ? "Selesai"
                    : match.match.state === "open"
                    ? "Sedang Berlangsung"
                    : "Menunggu"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {match.match.scores_csv || "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default MatchesTable; 