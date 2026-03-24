import { Link } from "react-router-dom";
import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const context = useContext(StoreContext);

  // ✅ Prevent crash if context missing
  const cart = context?.cart || [];
  const wishlist = context?.wishlist || [];

  // ✅ Total quantity
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div className="w-full">

      {/* Top Bar */}
      <div className="bg-black text-white text-center text-sm py-2">
        Free Shipping on Orders Above ₹999
      </div>

      {/* Main Navbar */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-red-600">
            MyStore
          </Link>

          {/* Navigation */}
          <div className="flex gap-6 text-gray-700 font-medium">
            <Link to="/">Home</Link>
            <Link to="/men">Men</Link>
            <Link to="/women">Women</Link>
            <Link to="/about">About</Link>
          </div>

          {/* Search */}
          <SearchBar />

          {/* Icons */}
          <div className="flex gap-6 text-xl items-center">

            {/* Wishlist */}
            <Link to="/wishlist" className="relative">
              ❤️
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-1 rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-black text-white text-xs px-1 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

          </div>

        </div>
      </div>
    </div>
  );
}