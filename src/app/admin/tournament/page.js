"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import ChartContainer from "@/components/admin/ChartContainer";
import DashboardCard from "@/components/admin/DashboardCard";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

// Dynamically import Chart components to avoid SSR issues
const DoughnutChart = dynamic(
  () => {
    return import("chart.js").then(({ Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement }) => {
      Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
      return import("react-chartjs-2").then((mod) => mod.Doughnut);
    });
  },
  { ssr: false }
);

const BarChart = dynamic(
  () => {
    return import("chart.js").then(({ Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend }) => {
      Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
      return import("react-chartjs-2").then((mod) => mod.Bar);
    });
  },
  { ssr: false }
);

function AdminTournament() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
          label: "Jumlah Turnamen",
          data: [0, 0, 0],
          backgroundColor: ["#f59e0b", "#10b981", "#6366f1"],
          borderColor: ["#f59e0b", "#10b981", "#6366f1"],
          borderWidth: 1,
        },
      ],
    },
    participantDistribution: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899"],
          borderColor: ["#2563eb", "#059669", "#d97706", "#4f46e5", "#db2777"],
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    },
  });
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
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
          boxWidth: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 30, 30, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "#4b5563",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== undefined) {
              label += context.parsed;
            } else if (context.raw !== undefined) {
              label += context.raw;
            }
            return label;
          }
        }
      },
    },
    cutout: '60%',
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 10,
          },
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <AdminLayout
      title="Dashboard Turnamen"
      subtitle="Kelola turnamen dan pengguna dari satu tempat"
      loading={loading}
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
        <StatCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 md:h-5 md:w-5 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          }
          title="Total Tim"
          value={formatNumber(dashboardData.totalTeams)}
          subtitle="Dari semua turnamen"
          bgColor="bg-blue-500/20"
          iconColor="text-blue-500"
          subtitleColor="text-green-500"
        />

        <StatCard
          icon={
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
          }
          title="Turnamen Aktif"
          value={dashboardData.activeTournaments}
          subtitle={`${dashboardData.newTournaments} baru`}
          bgColor="bg-orange-500/20"
          iconColor="text-orange-500"
          subtitleColor="text-orange-500"
        />

        <StatCard
          icon={
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
          }
          title="Total Turnamen"
          value={formatNumber(dashboardData.totalMatches)}
          subtitle={`${dashboardData.recentMatches} dalam 45 hari`}
          bgColor="bg-purple-500/20"
          iconColor="text-purple-500"
          subtitleColor="text-purple-500"
        />

        <StatCard
          icon={
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
          }
          title="Turnamen Selesai"
          value={dashboardData.completionRate}
          subtitle="Total selesai"
          bgColor="bg-green-500/20"
          iconColor="text-green-500"
          subtitleColor="text-green-500"
        />
      </div>

      {/* Charts & Recent Tournaments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Turnamen Chart */}
        <ChartContainer title="Status Turnamen">
          {chartReady && typeof window !== "undefined" && (
            <BarChart
              data={chartData.tournamentStatus}
              options={barChartOptions}
            />
          )}
        </ChartContainer>

        {/* Distribusi Tim Chart */}
        <ChartContainer title="Distribusi Tim per Turnamen">
          {chartReady && typeof window !== "undefined" && (
            <DoughnutChart
              data={chartData.participantDistribution}
              options={chartOptions}
            />
          )}
        </ChartContainer>
      </div>

      {/* Recent Tournaments */}
      <DashboardCard 
        title="Turnamen Terbaru" 
        actionText="Lihat Semua" 
        onActionClick={() => router.push("/")}
      >
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
      </DashboardCard>
    </AdminLayout>
  );
}

export default AdminTournament;
