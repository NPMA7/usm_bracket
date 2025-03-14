import StartTournamentButton from "./StartTournamentButton";

const TournamentInfoCard = ({
  tournament,
  tournamentStarted,
  participantsCount,
  id,
  onTournamentStarted,
  isAdmin,
}) => {
  return (
    <div className="bg-[#2b2b2b] rounded-lg shadow-xl mb-8">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {tournament.name}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span>{tournament.participants_count || 0} Peserta</span>
              </div>
              <div className="flex items-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Status:{" "}
                  {tournament.state === "pending"
                    ? "Belum Dimulai"
                    : tournament.state === "underway"
                    ? "Sedang Berlangsung"
                    : tournament.state === "awaiting_review"
                    ? "Menunggu Review"
                    : tournament.state === "complete"
                    ? "Selesai"
                    : tournament.state}
                </span>
              </div>
              <div className="flex items-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Dibuat{" "}
                  {new Date(tournament.created_at).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>
          </div>
          {!tournamentStarted && isAdmin && (
            <StartTournamentButton
              tournamentId={id}
              onTournamentStarted={onTournamentStarted}
              disabled={participantsCount < 2}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentInfoCard; 