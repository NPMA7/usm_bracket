"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import Chart components to avoid SSR issues
const DoughnutChart = dynamic(
  () =>
    import("react-chartjs-2").then((mod) => {
      // Import and register all necessary chart components
      import("chart.js").then(
        ({
          Chart,
          ArcElement,
          Tooltip,
          Legend,
          CategoryScale,
          LinearScale,
          BarElement,
        }) => {
          Chart.register(
            ArcElement,
            Tooltip,
            Legend,
            CategoryScale,
            LinearScale,
            BarElement
          );
        }
      );
      return mod.Doughnut;
    }),
  { ssr: false }
);

const BarChart = dynamic(
  () =>
    import("react-chartjs-2").then((mod) => {
      // Import and register all necessary chart components
      import("chart.js").then(
        ({
          Chart,
          BarElement,
          CategoryScale,
          LinearScale,
          Tooltip,
          Legend,
        }) => {
          Chart.register(
            BarElement,
            CategoryScale,
            LinearScale,
            Tooltip,
            Legend
          );
        }
      );
      return mod.Bar;
    }),
  { ssr: false }
);

function AdminTournamentContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { isOpen } = useSidebar();
  const [dashboardData, setDashboardData] = useState({
    totalTeams: 0,
    activeTournaments: 0,
    newTournaments: 0,
    totalMatches: 0,
    recentMatches: 0,
    completionRate: 0,
  });
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState({
    tournamentStatus: {
      labels: ["Berlangsung", "Selesai", "Lainnya"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ["#f59e0b", "#10b981", "#6366f1"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    participantDistribution: {
      labels: [],
      datasets: [
        {
          label: "Jumlah Tim",
          data: [],
          backgroundColor: "#3b82f6",
          borderColor: "#2563eb",
          borderWidth: 1,
        },
      ],
    },
  });
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    // Periksa status login
    const adminUser = localStorage.getItem("adminUser");
    if (!adminUser) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(adminUser);
    if (!["admin", "owner"].includes(user.role)) {
      localStorage.removeItem("adminUser");
      window.location.href = "/login";
      return;
    }

    // Ambil data dashboard dari database
    fetchDashboardData();

    // Set chart ready after component mounts
    setChartReady(true);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Ambil data turnamen dari API Challonge
      const tournamentsResponse = await fetch("/api/challonge");
      const tournamentsData = await tournamentsResponse.json();

      // Hitung total tim terdaftar dari semua turnamen
      const totalTeams = tournamentsData.reduce((total, tournament) => {
        return total + (tournament.tournament.participants_count || 0);
      }, 0);

      // Hitung jumlah turnamen yang sedang berlangsung
      const activeTournaments = tournamentsData.filter(
        (t) =>
          t.tournament.state === "underway" || t.tournament.state === "pending"
      ).length;

      // Hitung turnamen baru (dibuat dalam 7 hari terakhir)
      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const newTournaments = tournamentsData.filter(
        (t) => new Date(t.tournament.created_at) > lastWeekDate
      ).length;

      // Hitung total turnamen
      const totalTournaments = tournamentsData.length;

      // Hitung turnamen dalam 45 hari terakhir
      const last45Days = new Date();
      last45Days.setDate(last45Days.getDate() - 45);
      const recentTournaments45 = tournamentsData.filter(
        (t) => new Date(t.tournament.created_at) > last45Days
      ).length;

      // Hitung turnamen yang sudah selesai
      const completedTournaments = tournamentsData.filter(
        (t) => t.tournament.state === "complete"
      ).length;

      // Hitung turnamen dengan status lainnya
      const otherTournaments =
        totalTournaments - activeTournaments - completedTournaments;

      // Ambil data aktivitas terkini dari Supabase
      const { data: recentActivitiesData, error: recentActivitiesError } =
        await supabase
          .from("activities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

      // Update state dengan data yang diambil
      setDashboardData({
        totalTeams: totalTeams,
        activeTournaments: activeTournaments,
        newTournaments: newTournaments,
        totalMatches: totalTournaments,
        recentMatches: recentTournaments45,
        completionRate: completedTournaments,
      });

      // Persiapkan data untuk chart status turnamen
      setChartData((prevState) => ({
        ...prevState,
        tournamentStatus: {
          ...prevState.tournamentStatus,
          datasets: [
            {
              ...prevState.tournamentStatus.datasets[0],
              data: [activeTournaments, completedTournaments, otherTournaments],
            },
          ],
        },
        participantDistribution: {
          labels: tournamentsData.slice(0, 5).map((t) => t.tournament.name),
          datasets: [
            {
              ...prevState.participantDistribution.datasets[0],
              data: tournamentsData
                .slice(0, 5)
                .map((t) => t.tournament.participants_count || 0),
            },
          ],
        },
      }));

      // Format data turnamen terbaru
      if (tournamentsData && tournamentsData.length > 0) {
        const sortedTournaments = [...tournamentsData]
          .sort(
            (a, b) =>
              new Date(b.tournament.created_at) -
              new Date(a.tournament.created_at)
          )
          .slice(0, 5);

        setRecentTournaments(
          sortedTournaments.map((tournament) => ({
            id: tournament.tournament.id,
            name: tournament.tournament.name,
            participantsCount: tournament.tournament.participants_count || 0,
            createdAt: tournament.tournament.created_at,
          }))
        );
      }

      // Format data aktivitas terkini
      if (recentActivitiesData) {
        setRecentActivities(
          recentActivitiesData.map((activity) => ({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            createdAt: new Date(activity.created_at).toLocaleString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
          }))
        );
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f26522] border-t-transparent mb-4"></div>
          <p className="text-white">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Format angka dengan pemisah ribuan
  const formatNumber = (num) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  // Fungsi untuk menghitung waktu relatif
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} detik yang lalu`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    }
  };

  // Konfigurasi chart
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#e5e7eb",
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 30, 30, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "#4b5563",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-[#1a1a1a]">
      <Sidebar />

      <div
        className={`flex-1 transition-all duration-300 ${
          isOpen ? "sm:ml-64" : "sm:ml-0"
        }`}
      >
        <Header />

        <main className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">
              Selamat Datang di Dashboard Turnamen
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Kelola turnamen dan pengguna dari satu tempat
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
            <div className="bg-[#2b2b2b] rounded-xl p-3 md:p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Total Tim</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {formatNumber(dashboardData.totalTeams)}
              </h3>
              <p className="text-green-500 text-xs mt-1">Dari semua turnamen</p>
            </div>

            <div className="bg-[#2b2b2b] rounded-xl p-3 md:p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-orange-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Turnamen Aktif</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {dashboardData.activeTournaments}
              </h3>
              <p className="text-orange-500 text-xs mt-1">
                {dashboardData.newTournaments} baru
              </p>
            </div>

            <div className="bg-[#2b2b2b] rounded-xl p-3 md:p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-purple-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Total Turnamen</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {formatNumber(dashboardData.totalMatches)}
              </h3>
              <p className="text-purple-500 text-xs mt-1">
                {dashboardData.recentMatches} dalam 45 hari
              </p>
            </div>

            <div className="bg-[#2b2b2b] rounded-xl p-3 md:p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-gray-400">Turnamen Selesai</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                {dashboardData.completionRate}
              </h3>
              <p className="text-green-500 text-xs mt-1">Total selesai</p>
            </div>
          </div>

          {/* Charts & Recent Tournaments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status Turnamen Chart */}
            <div className="bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Status Turnamen
                </h2>
              </div>
              <div className="h-64">
                {chartReady && typeof window !== "undefined" && (
                  <DoughnutChart
                    data={chartData.tournamentStatus}
                    options={chartOptions}
                  />
                )}
              </div>
            </div>

            {/* Distribusi Tim Chart */}
            <div className="bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Distribusi Tim per Turnamen
                </h2>
              </div>
              <div className="h-64">
                {chartReady && typeof window !== "undefined" && (
                  <BarChart
                    data={chartData.participantDistribution}
                    options={barChartOptions}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Recent Tournaments */}
          <div className="bg-[#2b2b2b] rounded-xl p-4 md:p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Turnamen Terbaru
              </h2>
              <button
                onClick={() => router.push("/")}
                className="text-blue-500 hover:text-blue-400 text-xs md:text-sm"
              >
                Lihat Semua
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-[#363636]">
                  <tr>
                    <th scope="col" className="px-4 py-3 rounded-l-lg">
                      Nama Turnamen
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Tim
                    </th>
                    <th scope="col" className="px-4 py-3 rounded-r-lg">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTournaments.length > 0 ? (
                    recentTournaments.map((tournament) => (
                      <tr
                        key={tournament.id}
                        className="bg-[#2b2b2b] border-b border-[#3b3b3b] hover:bg-[#333333]"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {tournament.name}
                        </td>
                        <td className="px-4 py-3">
                          {tournament.participantsCount}
                        </td>
                        <td className="px-4 py-3">
                          {getRelativeTime(tournament.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-center">
                        Belum ada turnamen
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminTournament() {
  return (
    <SidebarProvider>
      <AdminTournamentContent />
    </SidebarProvider>
  );
}
