import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, openAuthModal, logout } = useContext(AuthContext);
  const context = useContext(StoreContext);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const cart = context?.cart || [];
  const wishlist = context?.wishlist || [];
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-white dark:bg-gray-800 w-full">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-black text-white text-center text-xs md:text-sm py-2 px-4 font-medium flex items-center justify-center gap-2">
        {/* <span>🎉 Flipkart & Amazon Style Shopping Experience</span> */}
        <span className="hidden md:inline">• Free Express Shipping on Orders Above ₹999</span>
      </div>

      {/* Main Navbar */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-3.5">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            <span className="bg-blue-600 text-white text-lg font-extrabold px-2 py-0.5 rounded shadow">S</span>
            <span className="text-gray-900 dark:text-white">My<span className="text-blue-600 dark:text-blue-400">Store</span></span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-6 text-gray-700 dark:text-gray-200 font-semibold text-sm">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Home</Link>
            <Link to="/men" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Men</Link>
            <Link to="/women" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Women</Link>
            <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition">About</Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xs md:max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Right Action Icons & User Dropdown */}
          <div className="flex gap-4 md:gap-6 text-xl items-center">
            
            {/* Wishlist Icon */}
            <Link to="/wishlist" className="relative p-1 hover:scale-110 transition" title="Wishlist">
              ❤️
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link to="/cart" className="relative p-1 hover:scale-110 transition" title="Cart">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* FLIPKART/AMAZON USER AUTH SECTION */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              {user ? (
                // LOGGED IN USER BADGE
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <span className="text-sm font-bold truncate max-w-[100px] hidden sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="text-xs">▾</span>
                </button>
              ) : (
                // LOGGED OUT FLIPKART LOGIN BUTTON
                <button
                  onClick={() => openAuthModal("login")}
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-md shadow transition flex items-center gap-1.5"
                >
                  <span>Login</span>
                </button>
              )}

              {/* DROPDOWN MENU */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full pt-2 w-56 z-50 animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 text-sm text-gray-800 dark:text-gray-200">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                          <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email || user.phone}</p>
                        </div>

                        {user.role === "admin" ? (
                          <>
                            <Link
                              to="/admin"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-bold text-blue-600 dark:text-blue-400"
                            >
                              ⚙️ <span>Admin Dashboard</span>
                            </Link>
                            <Link
                              to="/admin/products"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                            >
                              📦 <span>Products</span>
                            </Link>
                            <Link
                              to="/admin/orders"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                            >
                              🚚 <span>Orders</span>
                            </Link>
                            <Link
                              to="/admin/inventory"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                            >
                              🏢 <span>Inventory</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/profile"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                            >
                              👤 <span>My Profile</span>
                            </Link>

                            <Link
                              to="/orders"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                            >
                              📦 <span>Orders & Tracking</span>
                            </Link>

                            <Link
                              to="/wishlist"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                            >
                              ❤️ <span>Wishlist</span>
                            </Link>
                          </>
                        )}

                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold transition"
                        >
                          🚪 <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">New customer?</span>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              openAuthModal("signup");
                            }}
                            className="text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
                          >
                            Sign Up
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            openAuthModal("login");
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                        >
                          🔑 <span>Login via Password</span>
                        </button>

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            openAuthModal("login");
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition font-medium"
                        >
                          📱 <span>Login via Mobile OTP</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="text-2xl focus:outline-none transition-transform hover:scale-110"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}