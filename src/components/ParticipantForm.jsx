"use client";

import { useState } from "react";

export default function ParticipantForm({ tournamentId, onParticipantAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [bulkData, setBulkData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("single"); // 'single' atau 'bulk'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBulkChange = (e) => {
    setBulkData(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (activeTab === "single") {
        // Proses penambahan peserta tunggal
        const response = await fetch("/api/challonge/participants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tournamentId,
            name: formData.name,
            email: formData.email,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal menambahkan peserta");
        }

        const data = await response.json();
        setFormData({
          name: "",
          email: "",
        });

        if (onParticipantAdded) {
          onParticipantAdded(data);
        }
      } else {
        // Proses penambahan peserta secara bulk
        if (!bulkData.trim()) {
          throw new Error("Daftar peserta tidak boleh kosong");
        }

        // Split berdasarkan baris baru dan filter baris kosong
        const participants = bulkData
          .split("\n")
          .map((name) => name.trim())
          .filter((name) => name.length > 0);

        if (participants.length === 0) {
          throw new Error("Daftar peserta tidak boleh kosong");
        }

        const response = await fetch("/api/challonge/participants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tournamentId,
            bulkParticipants: participants,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal menambahkan peserta");
        }

        const data = await response.json();
        setBulkData("");

        if (onParticipantAdded) {
          onParticipantAdded();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-6">
        <button
          type="button"
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "single"
              ? "text-[#f26522] border-b-2 border-[#f26522]"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("single")}
        >
          Tambah Satu Peserta
        </button>
        <button
          type="button"
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "bulk"
              ? "text-[#f26522] border-b-2 border-[#f26522]"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("bulk")}
        >
          Tambah Banyak Peserta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "single" ? (
          <>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Nama Peserta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                  placeholder="Masukkan nama peserta"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email (Opsional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522]"
                  placeholder="Masukkan email peserta"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Daftar Peserta
            </label>
            <div className="mb-2">
              <small className="text-gray-400">
                Masukkan satu nama peserta per baris
              </small>
            </div>
            <textarea
              value={bulkData}
              onChange={handleBulkChange}
              className="w-full px-4 py-2 bg-[#3b3b3b] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#f26522] focus:ring-1 focus:ring-[#f26522] min-h-[150px]"
              placeholder={`Contoh:
Tim A
Tim B
Tim C`}
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#f26522] hover:bg-[#ff7b3d] text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:ring-offset-2 focus:ring-offset-[#2b2b2b] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              {activeTab === "single"
                ? "Menambahkan Peserta..."
                : "Menambahkan Banyak Peserta..."}
            </div>
          ) : activeTab === "single" ? (
            "Tambah Peserta"
          ) : (
            "Tambah Banyak Peserta"
          )}
        </button>
      </form>
    </div>
  );
}
