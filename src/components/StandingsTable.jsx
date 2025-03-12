const StandingsTable = ({ standings, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f26522] border-t-transparent"></div>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Belum ada data standings
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
            Rank
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
            Participant Name
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
            Match History
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {standings.map((standing, index) => {
          const participantData = standing.participant || standing;
          const participantId =
            participantData.id || participantData.participant_id;
          const name =
            participantData.name || participantData.display_name || "Unnamed";
          const rank = index + 1;
          const wins = participantData.wins || 0;
          const losses = participantData.losses || 0;

          return (
            <tr
              key={participantId}
              className="hover:bg-[#2d2d2d] transition-colors"
            >
              <td className="px-4 py-3 text-sm text-gray-300">{rank}</td>
              <td className="px-4 py-3 text-sm text-gray-300">{name}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs font-medium">
                    W: {wins}
                  </span>
                  <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-medium">
                    L: {losses}
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default StandingsTable; 