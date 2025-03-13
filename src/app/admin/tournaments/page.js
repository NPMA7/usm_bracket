"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateTournamentForm from "@/components/CreateTournamentForm";
import TournamentList from "@/components/TournamentList";
import Sidebar from "@/components/admin/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function AdminTournamentsContent() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { isOpen } = useSidebar();

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const userData = JSON.parse(adminUser);
      setUser(userData);
      setIsOwner(userData.role === 'owner');
      setIsAdmin(['admin', 'owner'].includes(userData.role));
      if (!['admin', 'owner'].includes(userData.role)) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/challonge");
        if (!response.ok) {
          throw new Error("Gagal mengambil data turnamen");
        }
        const data = await response.json();
        setTournaments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [refreshTrigger]);

  const handleTournamentCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Sidebar/>
      <div className={`p-4 transition-all duration-300 ${isOpen ? 'sm:ml-64' : 'sm:ml-0'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section - Only show for owner */}
            {isOwner && (
              <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
                <div className="flex items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#f26522] mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h2 className="text-xl font-semibold text-white">
                    Buat Turnamen Baru
                  </h2>
                </div>

                <CreateTournamentForm onTournamentCreated={handleTournamentCreated} />
              </div>
            )}

            {/* List Section */}
            <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-[#f26522] mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-white">
                      Daftar Turnamen
                    </h2>
                  </div>
                  <span className="bg-[#3b3b3b] text-gray-400 px-3 py-1 rounded-full text-sm">
                    {tournaments.length} Turnamen
                  </span>
                </div>

                {error ? (
                  <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                ) : (
                  <TournamentList tournaments={tournaments} isAdmin={isAdmin} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTournaments() {
  return (
    <SidebarProvider>
      <AdminTournamentsContent />
    </SidebarProvider>
  );
}