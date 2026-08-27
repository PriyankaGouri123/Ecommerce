import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const { user, token, logout } = useContext(AuthContext);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setPendingOrders(data.orders?.pending || 0);
        }
      } catch (error) {
        console.error("Failed to fetch pending orders", error);
      }
    };
    if (token) fetchPendingOrders();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate(`/admin/orders?search=${e.target.value.trim()}`);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10 p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg items-center text-gray-500 dark:text-gray-300 w-full max-w-md focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <span className="text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Search orders, customers, or products... (Press Enter)" 
            className="bg-transparent border-none focus:outline-none ml-2 text-sm w-full dark:text-white"
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link to="/" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline hidden sm:block">
          Go to Main Store
        </Link>
        
        <Link to="/admin/orders" className="relative text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <span className="text-2xl">🔔</span>
          {pendingOrders > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800">
              {pendingOrders > 99 ? '99+' : pendingOrders}
            </span>
          )}
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition-opacity"
          >
            <img
              src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name || "Admin"}&background=random`}
              alt="Admin"
              className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
            />
            <div className="hidden sm:block text-sm text-left">
              <p className="font-bold text-gray-800 dark:text-white line-clamp-1">{user?.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">{user?.role}</p>
            </div>
            <span className="text-gray-400 text-xs hidden sm:block">▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                My Profile
              </Link>
              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
