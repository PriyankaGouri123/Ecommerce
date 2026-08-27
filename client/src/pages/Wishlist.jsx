import { useContext } from "react";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

function Wishlist() {
  const { wishlist, wishlistLoading } = useContext(StoreContext);
  const { user, openAuthModal } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-16 px-6">
        <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Login Required to View Wishlist
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Save your favorite items across devices and access your wishlist anytime.
          </p>
          <button
            onClick={() => openAuthModal("login")}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition"
          >
            Log In / Sign Up Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Your Wishlist</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Saved items you've been eyeing</p>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-red-500 font-bold">{wishlist.length}</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm font-medium">Items</span>
          </div>
        </div>

        {wishlistLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="text-xl font-medium text-gray-600 dark:text-gray-300">Loading wishlist...</span>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-16 text-center shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your wishlist is empty.</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 mb-8">Start exploring and save your favorite products.</p>
            <Link to="/" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {wishlist.map((item) => (
              <ProductCard key={item._id || item.id} product={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;