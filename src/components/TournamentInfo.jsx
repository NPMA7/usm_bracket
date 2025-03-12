const TournamentInfo = ({ tournament, title, description, matches = [] }) => {
  // Format tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Mendapatkan status turnamen dalam bahasa Indonesia
  const getTournamentStatus = (state) => {
    const statusMap = {
      pending: "Menunggu",
      underway: "Sedang Berlangsung",
      complete: "Selesai",
    };
    return statusMap[state] || state;
  };

  // Mendapatkan total pertandingan dari jumlah matches
  const getTotalMatches = (matches) => {
    if (!matches || !Array.isArray(matches)) return 0;
    return matches.length;
  };

  // Menentukan apakah harus menampilkan total pertandingan
  const shouldShowMatches = Array.isArray(matches) && matches.length > 0;

  // Mendapatkan warna status
  const getStatusColor = (state) => {
    const colorMap = {
      pending: "text-yellow-500",
      underway: "text-green-500",
      complete: "text-blue-500",
    };
    return colorMap[state] || "text-gray-500";
  };

  return (
    <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-[#363636] p-4 border-b border-[#404040]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {tournament?.tournament?.name}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament?.tournament?.state)}`}>
            {getTournamentStatus(tournament?.tournament?.state)}
          </span>
        </div>
        <p className="text-gray-400 mt-2 text-sm">{description}</p>
      </div>

      {/* Info Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Peserta */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#404040] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#f26522]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Peserta</p>
              <p className="text-base font-bold text-white">
                {tournament?.tournament?.participants_count || 0}
              </p>
            </div>
          </div>

          {/* Total Pertandingan */}
          {shouldShowMatches && (
            <div className="flex items-center space-x-3">
              <div className="bg-[#404040] p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#f26522]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Pertandingan</p>
                <p className="text-base font-bold text-white">
                  {getTotalMatches(matches)}
                </p>
              </div>
            </div>
          )}

          {/* Game Type */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#404040] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#f26522]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tipe Game</p>
              <p className="text-base font-bold text-white">
                {tournament?.tournament?.game_name || "Tidak Ada"}
              </p>
            </div>
          </div>

          {/* Tanggal Dibuat */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#404040] p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-[#f26522]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tanggal Dibuat</p>
              <p className="text-base font-bold text-white">
                {formatDate(tournament?.tournament?.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentInfo;
