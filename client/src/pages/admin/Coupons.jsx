import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Coupons() {
  const { token } = useContext(AuthContext);

  // Tab State
  const [activeTab, setActiveTab] = useState("all"); // "all" or "performance"

  // Coupon Data States
  const [coupons, setCoupons] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, active: 0, expired: 0, totalUsage: 0, totalDiscount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Coupon Performance Data States
  const [performance, setPerformance] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState(false);

  // Pagination & Filters (for All Coupons tab)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount: "",
    discountType: "percentage",
    expiry: "",
    minimumOrder: "",
    usageLimit: "",
    description: ""
  });

  // Action / Delete States
  const [actionLoading, setActionLoading] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/coupons?page=${page}&limit=8&search=${search}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons(data.coupons || []);
        setTotalPages(data.totalPages || 1);
        setKpis(data.kpis || { total: 0, active: 0, expired: 0, totalUsage: 0, totalDiscount: 0 });
      } else {
        toast.error(data.message || "Failed to load coupons");
        setError(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading coupons");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    setPerfLoading(true);
    setPerfError(false);
    try {
      const res = await fetch("/api/admin/coupons/performance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPerformance(data || []);
      } else {
        toast.error(data.message || "Failed to load coupon metrics");
        setPerfError(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading coupon performance metrics");
      setPerfError(true);
    } finally {
      setPerfLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === "all") {
        fetchCoupons();
      } else {
        fetchPerformance();
      }
    }
  }, [token, page, statusFilter, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCoupons();
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discount: "",
      discountType: "percentage",
      expiry: "",
      minimumOrder: "0",
      usageLimit: "100",
      description: ""
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    // Format expiry date string for HTML date input: YYYY-MM-DD
    const expDate = new Date(coupon.expiry).toISOString().split("T")[0];
    setFormData({
      code: coupon.code,
      discount: coupon.discount.toString(),
      discountType: coupon.discountType,
      expiry: expDate,
      minimumOrder: coupon.minimumOrder.toString(),
      usageLimit: coupon.usageLimit.toString(),
      description: coupon.description || ""
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon._id}` 
        : "/api/admin/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          discount: Number(formData.discount),
          minimumOrder: Number(formData.minimumOrder),
          usageLimit: Number(formData.usageLimit)
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingCoupon ? "Coupon updated successfully" : "Coupon created successfully");
        setIsFormOpen(false);
        fetchCoupons();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error submitting coupon details");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon._id}/toggle-active`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(coupon.isActive ? "Coupon deactivated successfully" : "Coupon activated successfully");
        fetchCoupons();
      } else {
        toast.error(data.message || "Failed to update coupon status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error updating coupon status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${couponToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Coupon deleted successfully");
        setCouponToDelete(null);
        fetchCoupons();
      } else {
        toast.error(data.message || "Failed to delete coupon");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error deleting coupon");
    } finally {
      setActionLoading(false);
    }
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return "inactive";
    if (new Date() > new Date(coupon.expiry)) return "expired";
    return "active";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Coupons & Discounts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create promotional codes, monitor redemption statistics, and optimize coupon performance.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Create Coupon
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { title: "Total Coupons", value: kpis.total, icon: "🎫" },
          { title: "Active & Valid", value: kpis.active, icon: "✅" },
          { title: "Expired Coupons", value: kpis.expired, icon: "⏳" },
          { title: "Total Redemptions", value: kpis.totalUsage, icon: "👥" },
          { title: "Total Discount Given", value: `₹${kpis.totalDiscount.toLocaleString()}`, icon: "💰" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.title}</h3>
              <span className="text-lg bg-gray-50 dark:bg-gray-700 p-1.5 rounded">{kpi.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-100 dark:border-gray-700 flex gap-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === "all" 
              ? "border-blue-600 text-blue-600 dark:text-blue-400" 
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Manage Coupons
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === "performance" 
              ? "border-blue-600 text-blue-600 dark:text-blue-400" 
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Coupon Performance Metrics
        </button>
      </div>

      {/* Tab 1: Manage Coupons */}
      {activeTab === "all" && (
        <div className="space-y-6">
          {/* Search/Filter */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
              <span className="text-gray-400 mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search by coupon code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white"
              />
              <button type="submit" className="hidden" />
            </form>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active & Valid</option>
                <option value="expired">Expired only</option>
                <option value="inactive">Deactivated Only</option>
              </select>
              <button 
                onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); fetchCoupons(); }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <p className="text-red-500 font-medium mb-4">Error loading coupon directories.</p>
              <button onClick={fetchCoupons} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">No coupons registered yet.</p>
              <p className="text-sm mt-1">Click "Create Coupon" above to launch a new promotion.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Code</th>
                      <th className="px-6 py-4 font-semibold">Discount</th>
                      <th className="px-6 py-4 font-semibold">Min Order</th>
                      <th className="px-6 py-4 font-semibold">Usage Limit</th>
                      <th className="px-6 py-4 font-semibold">Expiry</th>
                      <th className="px-6 py-4 font-semibold">Description</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {coupons.map((coupon) => {
                      const status = getCouponStatus(coupon);
                      return (
                        <tr key={coupon._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{coupon.code}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-semibold">
                            {coupon.discountType === "percentage" ? `${coupon.discount}%` : `₹${coupon.discount}`}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">₹{coupon.minimumOrder || 0}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                            {coupon.usedCount} / {coupon.usageLimit}
                          </td>
                          <td className="px-6 py-4 text-gray-500">{new Date(coupon.expiry).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={coupon.description}>{coupon.description || "—"}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                              status === "expired" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" :
                              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}>
                              {status === "active" ? "Active" : status === "expired" ? "Expired" : "Deactivated"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button 
                                disabled={actionLoading}
                                onClick={() => handleToggleActive(coupon)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  coupon.isActive 
                                    ? "text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                    : "text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                                }`}
                              >
                                {coupon.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button 
                                onClick={() => handleOpenEdit(coupon)}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => setCouponToDelete(coupon)}
                                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
        </div>
      )}

      {/* Tab 2: Coupon Performance Metrics */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          {perfLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 space-y-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
              ))}
            </div>
          ) : perfError ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <p className="text-red-500 font-medium mb-4">Error loading coupon metrics.</p>
              <button onClick={fetchPerformance} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
            </div>
          ) : performance.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500">
              <p className="text-lg font-medium">No performance data available.</p>
              <p className="text-sm mt-1">Once coupons are applied on checkouts, usage statistics will populate here.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Coupon Code</th>
                      <th className="px-6 py-4 font-semibold">Promotion Rate</th>
                      <th className="px-6 py-4 font-semibold text-center">Used Count</th>
                      <th className="px-6 py-4 font-semibold text-right">Revenue Generated</th>
                      <th className="px-6 py-4 font-semibold text-right">Total Discount Given</th>
                      <th className="px-6 py-4 font-semibold text-center">Expiry</th>
                      <th className="px-6 py-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {performance.map((perf) => {
                      const status = getCouponStatus(perf);
                      return (
                        <tr key={perf._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{perf.code}</td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {perf.discountType === "percentage" ? `${perf.discount}% OFF` : `₹${perf.discount} OFF`}
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
                            {perf.realUsageCount || 0} times
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-bold">
                            ₹{(perf.revenueGenerated || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-red-600 font-bold">
                            - ₹{(perf.discountGiven || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-500">
                            {new Date(perf.expiry).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                              status === "expired" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" :
                              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}>
                              {status === "active" ? "Active" : status === "expired" ? "Expired" : "Deactivated"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCoupon ? "Edit Coupon Settings" : "Create New Coupon"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SAVE20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={formData.discountType === "percentage" ? "e.g. 20" : "e.g. 150"}
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={formData.expiry}
                      onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minimumOrder}
                      onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Usage Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase dark:text-gray-400 mb-1">Description (Optional)</label>
                  <textarea
                    rows="2"
                    placeholder="Describe this promotion..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  {formLoading ? "Saving..." : editingCoupon ? "Save Changes" : "Launch Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {couponToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Coupon Code?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to permanently delete **{couponToDelete.code}**? This coupon will immediately become unusable in checkouts.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setCouponToDelete(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleDeleteCoupon}
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
