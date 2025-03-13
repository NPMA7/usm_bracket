"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateTournamentForm from "@/components/CreateTournamentForm";
import TournamentList from "@/components/TournamentList";
import AdminLayout from "@/components/admin/AdminLayout";

function AdminCreateTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mendeteksi ukuran layar
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px adalah breakpoint untuk md di Tailwind
    };
    
    // Cek ukuran layar saat komponen dimuat
    checkScreenSize();
    
    // Set form terbuka secara default untuk layar md ke atas
    if (!isMobile) {
      setIsFormOpen(true);
    }
    
    // Tambahkan event listener untuk resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup event listener
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isMobile]);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const userData = JSON.parse(adminUser);
      setUser(userData);
      setIsAdmin(userData.role === 'owner');
      if (userData.role !== 'owner') {
        router.push('/admin/tournaments');
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
    setIsFormOpen(false);
  };

  // Fungsi untuk toggle form hanya jika di mobile
  const toggleForm = () => {
    if (isMobile) {
      setIsFormOpen(!isFormOpen);
    }
  };

  return (
    <AdminLayout 
      loading={isLoading}
      requireOwner={true}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section - Only show for owner */}
          {isAdmin && (
            <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
              <div className={`flex items-center mb-6 ${isMobile ? 'cursor-pointer' : ''}`} onClick={toggleForm}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 text-[#f26522] mr-2 ${isFormOpen ? 'rotate-45 transition-transform duration-200' : ''} ${!isMobile ? 'hidden md:block' : ''}`}
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

              {(isFormOpen || !isMobile) && (
                <CreateTournamentForm onTournamentCreated={handleTournamentCreated} />
              )}
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
    </AdminLayout>
  );
}

export default AdminCreateTournaments;