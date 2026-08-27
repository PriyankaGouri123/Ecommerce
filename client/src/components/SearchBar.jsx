import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e?.preventDefault();

    const searchTerm = search.trim();

    if (!searchTerm) return;

    navigate(`/search/${encodeURIComponent(searchTerm)}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500"
    >
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="flex-1 min-w-0 px-3 py-2 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
        autoComplete="off"
      />

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
      >
        🔍
      </button>
    </form>
  );
}