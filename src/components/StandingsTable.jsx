'use client';

const StandingsTable = ({ standings, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f26522] border-t-transparent"></div>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px] text-center text-gray-400">
        Belum ada data klasemen
      </div>
    );
  }

  return (
    <div className="h-full min-h-[400px] flex flex-col">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Peringkat
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nama
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              Main
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              M/K
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
              Skor
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {standings.map((participant, index) => {
            const rank = participant.final_rank || index + 1;
            const name = participant.name || "Unnamed";
            const matchesPlayed = participant.matches_played || 0;
            const wins = participant.wins || 0;
            const losses = participant.losses || 0;
            const scoreDiff = participant.score_difference || 0;

            return (
              <tr
                key={`participant-${participant.id || index}`}
                className="hover:bg-[#2d2d2d] transition-colors"
              >
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    rank === 1 ? 'bg-yellow-500/20 text-yellow-300' :
                    rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                    rank === 3 ? 'bg-orange-500/20 text-orange-300' :
                    'text-gray-400'
                  }`}>
                    {rank}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300 font-medium">
                  {name}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-400">
                  {matchesPlayed}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs font-medium">
                      {wins}
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs font-medium">
                      {losses}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    scoreDiff > 0 ? 'bg-blue-900/50 text-blue-400' :
                    scoreDiff < 0 ? 'bg-red-900/50 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                  </span>
                </td>
              </tr>
            );
          })}
          {/* Add empty rows to maintain minimum height */}
          {standings.length < 8 && Array.from({ length: 8 - standings.length }).map((_, index) => (
            <tr key={`empty-${index}`} className="h-[46px]">
              <td colSpan="5"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StandingsTable; 