import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/search/${encodeURIComponent(search.trim())}`);
      setSearch(""); // optional: clear input
    }
  };

  return (
    <div className="flex items-center border rounded-lg overflow-hidden">
      <input
        type="text"
        placeholder="Search products..."
        className="px-3 py-1 outline-none w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <button
        onClick={handleSearch}
        className="bg-red-500 text-white px-4 py-1"
      >
        Search
      </button>
    </div>
  );
}