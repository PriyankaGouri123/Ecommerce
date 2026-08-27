import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Reviews() {
  const { token } = useContext(AuthContext);

  // Data states
  const [reviews, setReviews] = useState([]);
  const [kpis, setKpis] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Actions states
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(false);
    try {
      const ratingQuery = ratingFilter !== "all" ? `&rating=${ratingFilter}` : "";
      const res = await fetch(`/api/admin/reviews?page=${page}&limit=8&search=${search}${ratingQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setTotalPages(data.totalPages || 1);
        setKpis(data.kpis || {
          averageRating: 0,
          totalReviews: 0,
          ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        });
      } else {
        toast.error(data.message || "Failed to load reviews");
        setError(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading reviews");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReviews();
    }
  }, [token, page, ratingFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleToggleHide = async (review) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${review._id}/toggle-hide`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(review.isHidden ? "Review made visible to public" : "Review hidden from public storefront");
        fetchReviews();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error updating review status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Review deleted successfully");
        setReviewToDelete(null);
        fetchReviews();
      } else {
        toast.error(data.message || "Failed to delete review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error deleting review");
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex text-amber-400">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-sm">
            {i < rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Reviews</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Monitor customer feedback, view product ratings, and moderate reviews shown on the store.
        </p>
      </div>

      {/* KPI Cards: Star breakdown and average */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avg Rating Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between items-center text-center">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Average Rating</h3>
          <div className="my-3">
            <p className="text-5xl font-black text-gray-900 dark:text-white">{kpis.averageRating}</p>
            <div className="flex justify-center mt-2 scale-125">{renderStars(Math.round(kpis.averageRating))}</div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Based on {kpis.totalReviews} total customer reviews</p>
        </div>

        {/* Rating Counts Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Rating Breakdown</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = kpis.ratingCounts[star] || 0;
              const pct = kpis.totalReviews > 0 ? (count / kpis.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center text-xs gap-3">
                  <span className="w-10 font-bold text-gray-600 dark:text-gray-300">{star} star</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-500">{count} ({Math.round(pct)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
          <span className="text-gray-400 mr-2">🔍</span>
          <input
            type="text"
            placeholder="Search by comment, customer, or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white"
          />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">Rating:</span>
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>
          <button 
            onClick={() => { setSearch(""); setRatingFilter("all"); setPage(1); fetchReviews(); }}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-red-500 font-medium mb-4">Error loading reviews from database.</p>
          <button onClick={fetchReviews} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No reviews match your filters.</p>
          <p className="text-sm mt-1">Try adapting your search parameters or select a different star rating.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Rating</th>
                  <th className="px-6 py-4 font-semibold">Comment</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reviews.map((rev) => (
                  <tr key={rev._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      {rev.product ? (
                        <div className="flex items-center gap-3 max-w-xs">
                          <img 
                            src={rev.product.image} 
                            alt={rev.product.name} 
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                          />
                          <p className="font-semibold text-gray-900 dark:text-white truncate" title={rev.product.name}>
                            {rev.product.name}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Deleted Product</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {rev.user ? (
                        <div>
                          <p>{rev.user.name}</p>
                          <p className="text-xs text-gray-450">{rev.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Anonymous User</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{renderStars(rev.rating)}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2" title={rev.comment}>
                        {rev.comment || <span className="text-gray-400 italic">No comment provided</span>}
                      </p>
                      {rev.photos && rev.photos.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {rev.photos.slice(0, 3).map((photo, i) => (
                            <img 
                              key={i} 
                              src={photo} 
                              alt="review" 
                              className="w-6 h-6 rounded object-cover border border-gray-200" 
                            />
                          ))}
                          {rev.photos.length > 3 && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 p-1 rounded font-bold">+{rev.photos.length - 3}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(rev.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        rev.isHidden 
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      }`}>
                        {rev.isHidden ? "Hidden" : "Visible"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleToggleHide(rev)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            rev.isHidden 
                              ? "text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                              : "text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          }`}
                        >
                          {rev.isHidden ? "Unhide" : "Hide"}
                        </button>
                        <button 
                          onClick={() => setReviewToDelete(rev)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-gray-250 dark:border-gray-700 rounded text-xs font-medium bg-white dark:bg-gray-800 disabled:opacity-50 dark:text-white"
                >
                  ◀ Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-gray-250 dark:border-gray-700 rounded text-xs font-medium bg-white dark:bg-gray-800 disabled:opacity-50 dark:text-white"
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {reviewToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Customer Review?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to permanently delete this review? This action cannot be undone and will update the product's ratings immediately.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setReviewToDelete(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleDeleteReview}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
