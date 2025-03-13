"use client";

import { useState, useEffect } from "react";
import HomeHeader from "@/components/HomeHeader";
import TournamentList from "@/components/TournamentList";

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      setUser(JSON.parse(adminUser));
    }
  }, []);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent"></div>
      </div>
    );
  }

  const isAdmin = user && ['admin', 'owner'].includes(user.role);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <HomeHeader />
      
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#2b2b2b] rounded-lg shadow-xl p-6">
          <TournamentList tournaments={tournaments} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
