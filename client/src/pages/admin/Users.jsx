import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Users() {
  const { token } = useContext(AuthContext);
  
  // Data state
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, newThisMonth: 0, active: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Pagination & Filter state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=8&search=${search}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setKpis(data.kpis || { total: 0, newThisMonth: 0, active: 0, blocked: 0 });
      } else {
        toast.error(data.message || "Failed to load users");
        setError(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading users");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const fetchUserDetails = async (userId) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserDetails(data);
      } else {
        toast.error(data.message || "Failed to load user details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setUserDetails(null);
    fetchUserDetails(user._id);
  };

  const handleToggleBlock = async (user) => {
    setActionLoading(true);
    try {
      const endpoint = user.isBlocked 
        ? `/api/admin/users/${user._id}/unblock` 
        : `/api/admin/users/${user._id}/block`;
        
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(user.isBlocked ? "User unblocked successfully" : "User blocked successfully");
        fetchUsers();
        if (selectedUser && selectedUser._id === user._id) {
          setSelectedUser({ ...selectedUser, isBlocked: !user.isBlocked });
          fetchUserDetails(user._id);
        }
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error performing block/unblock action");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("User deleted successfully");
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error deleting user");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Directory</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage, inspect, and configure access for your registered customers.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Registered", value: kpis.total, icon: "👥", color: "border-blue-500 text-blue-600" },
          { title: "New This Month", value: kpis.newThisMonth, icon: "✨", color: "border-green-500 text-green-600" },
          { title: "Active Accounts", value: kpis.active, icon: "🛡️", color: "border-indigo-500 text-indigo-600" },
          { title: "Blocked Accounts", value: kpis.blocked, icon: "🚫", color: "border-red-500 text-red-600" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.title}</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{kpi.value}</p>
            </div>
            <span className={`text-2xl p-3 rounded-lg bg-gray-50 dark:bg-gray-700`}>{kpi.icon}</span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
          <span className="text-gray-400 mr-2">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email or phone..."
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
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
          <button 
            onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); fetchUsers(); }}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 space-y-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <p className="text-red-500 font-medium mb-4">Error loading customer directories.</p>
          <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">No customers found.</p>
          <p className="text-sm mt-1">Try resetting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold text-center">Orders</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Spent</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${user.name}&background=random&color=fff`} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full border border-gray-150 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{user.phone || "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center font-medium text-gray-800 dark:text-gray-200">{user.ordersCount}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">₹{(user.totalSpent || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isBlocked 
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      }`}>
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => handleOpenDetails(user)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        >
                          Inspect
                        </button>
                        <button 
                          onClick={() => handleToggleBlock(user)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            user.isBlocked 
                              ? "text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                              : "text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          }`}
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>
                        <button 
                          onClick={() => setUserToDelete(user)}
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

      {/* INSPECT DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`} 
                  alt={selectedUser.name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                  <p className="text-xs text-gray-500">{selectedUser.email || "No email"}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {detailsLoading ? (
                <div className="py-20 text-center animate-pulse text-gray-400">Loading user profile history...</div>
              ) : userDetails ? (
                <>
                  {/* Account Information & Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-white">Account Details</h4>
                      <p className="text-xs text-gray-500">Phone: <span className="font-medium text-gray-900 dark:text-gray-200">{selectedUser.phone || "None"}</span></p>
                      <p className="text-xs text-gray-500">Joined: <span className="font-medium text-gray-900 dark:text-gray-200">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></p>
                      <p className="text-xs text-gray-500">Status: 
                        <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          selectedUser.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}>
                          {selectedUser.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </p>
                      <button
                        onClick={() => handleToggleBlock(selectedUser)}
                        className={`w-full mt-4 py-2 rounded-lg text-xs font-semibold transition ${
                          selectedUser.isBlocked 
                            ? "bg-green-600 text-white hover:bg-green-700" 
                            : "bg-orange-600 text-white hover:bg-orange-700"
                        }`}
                      >
                        {selectedUser.isBlocked ? "Unblock Account" : "Suspend / Block Account"}
                      </button>
                    </div>

                    <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
                      <h4 className="font-bold text-sm text-gray-800 dark:text-white">Shipping Addresses ({userDetails.user.addresses?.length || 0})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                        {userDetails.user.addresses?.map((addr, idx) => (
                          <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-600 relative">
                            {addr.isDefault && (
                              <span className="absolute top-2 right-2 text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200">DEFAULT</span>
                            )}
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{addr.fullName}</p>
                            <p className="text-[11px] text-gray-500 mt-1">{addr.street}, {addr.city}</p>
                            <p className="text-[11px] text-gray-500">{addr.state || ""} - {addr.pincode}</p>
                            {addr.phone && <p className="text-[11px] text-gray-400 mt-1">📞 {addr.phone}</p>}
                          </div>
                        ))}
                        {(!userDetails.user.addresses || userDetails.user.addresses.length === 0) && (
                          <p className="text-xs text-gray-400 italic">No saved addresses on profile.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order History */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">Complete Order History ({userDetails.orders?.length || 0})</h4>
                    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 uppercase">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Order ID</th>
                            <th className="px-4 py-3 font-semibold">Date</th>
                            <th className="px-4 py-3 font-semibold">Method</th>
                            <th className="px-4 py-3 font-semibold text-right">Amount</th>
                            <th className="px-4 py-3 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {userDetails.orders?.map((ord) => (
                            <tr key={ord._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400">#{ord._id.slice(-6).toUpperCase()}</td>
                              <td className="px-4 py-3 text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-gray-500">{ord.paymentMethod}</td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">₹{ord.totalAmount}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                  ord.status === "Delivered" ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400" :
                                  ord.status === "Cancelled" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" :
                                  "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                }`}>
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(!userDetails.orders || userDetails.orders.length === 0) && (
                            <tr>
                              <td colSpan="5" className="px-4 py-8 text-center text-gray-400 italic">No orders found for this user.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-red-500">Failed to load details.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2 bg-gray-250 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete User Account?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to permanently delete **{userToDelete.name}**? This action is irreversible and will delete their customer record.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleDeleteUser}
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
