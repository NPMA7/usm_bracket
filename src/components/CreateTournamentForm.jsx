import { useState } from "react";
import { useRouter } from "next/navigation";

const CreateTournamentForm = ({ onTournamentCreated }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    tournament_type: "single elimination",
    description: "",
    game_name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/challonge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Gagal membuat turnamen");
      }

      const data = await response.json();
      onTournamentCreated();
      router.push(`/admin/tournament/${data.tournament.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Nama Turnamen
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
          placeholder="Masukkan nama turnamen"
        />
      </div>

      <div>
        <label
          htmlFor="tournament_type"
          className="block text-sm font-medium text-gray-300"
        >
          Tipe Turnamen
        </label>
        <select
          id="tournament_type"
          name="tournament_type"
          value={formData.tournament_type}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
        >
          <option value="single elimination">Single Elimination</option>
          <option value="double elimination">Double Elimination</option>
          <option value="round robin">Round Robin</option>
          <option value="swiss">Swiss</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-300"
        >
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
          placeholder="Masukkan deskripsi turnamen (opsional)"
        />
      </div>

      <div>
        <label
          htmlFor="game_name"
          className="block text-sm font-medium text-gray-300"
        >
          Nama Game
        </label>
        <input
          type="text"
          id="game_name"
          name="game_name"
          value={formData.game_name}
          onChange={handleChange}
          className="mt-1 block w-full bg-[#3b3b3b] border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f26522] focus:border-transparent"
          placeholder="Masukkan nama game (opsional)"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#f26522] hover:bg-[#ff7b3d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f26522] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Membuat Turnamen...
          </>
        ) : (
          "Buat Turnamen"
        )}
      </button>
    </form>
  );
};

export default CreateTournamentForm; 