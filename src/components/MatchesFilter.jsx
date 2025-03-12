const MatchesFilter = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onFinalizeTournament,
  tournament,
  isProcessing
}) => {
  return (
    <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Cari Pertandingan
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari berdasarkan nama pemain atau ronde..."
                className="w-full bg-[#3b3b3b] text-white placeholder-gray-500 px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f26522]"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-400 mb-1"
            >
              Filter Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full bg-[#3b3b3b] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f26522]"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="open">Sedang Berlangsung</option>
              <option value="complete">Selesai</option>
            </select>
          </div>
        </div>

        {/* Finalize Button */}
        {tournament?.tournament?.state === "awaiting_review" && (
          <button
            onClick={onFinalizeTournament}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
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
            {isProcessing ? "Menyelesaikan..." : "Selesaikan Turnamen"}
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchesFilter; 