"use client";

import { useState, useEffect } from "react";
import TournamentList from "@/components/TournamentList";
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#f26522] border-t-transparent shadow-lg"></div>
      </div>
    );
  }

  const isAdmin = user && ['admin', 'owner'].includes(user.role);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#2d2d2d]">
        
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-16 text-center"
      >
        <h1 className="text-5xl font-extrabold mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-[#f26522] to-[#ff8f53]">
          Selamat Datang di Tournament Bracket USM
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Platform turnamen terbaik untuk mengorganisir dan mengelola kompetisi Anda dengan mudah dan profesional.
        </p>
      </motion.div>

      {/* Tournament Section */}
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-[#2b2b2b] rounded-2xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-90"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Daftar Turnamen</h2>
          </div>
          <TournamentList tournaments={tournaments} isAdmin={isAdmin} />
        </motion.div>
      </div>

    </div>
  );
}
