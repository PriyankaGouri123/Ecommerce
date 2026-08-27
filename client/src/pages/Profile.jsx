import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, updateProfile, openAuthModal } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("personal"); // 'personal' | 'addresses' | 'security'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setProfilePicture(user.profilePicture || "");
    }
  }, [user]);

  // New Address Form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Please Log In to Access Profile
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Access your orders, saved addresses, and personal recommendations.
        </p>
        <button
          onClick={() => openAuthModal("login")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    const success = await updateProfile({ name, email, phone, profilePicture });
    setSaving(false);
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const success = await updateProfile({ password });
    if (success) {
      setPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.street || !newAddr.pincode) {
      toast.error("Please fill required address fields");
      return;
    }

    const updatedAddresses = [...(user.addresses || []), { ...newAddr, isDefault: (user.addresses || []).length === 0 }];
    await updateProfile({ addresses: updatedAddresses });
    setShowAddAddress(false);
    setNewAddr({ fullName: "", phone: "", street: "", city: "", state: "", pincode: "" });
  };

  const handleDeleteAddress = async (addrId) => {
    const updatedAddresses = (user.addresses || []).filter((a) => a._id !== addrId);
    await updateProfile({ addresses: updatedAddresses });
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Page Title & Flipkart/Amazon Account Layout */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        👤 My Account Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Navigation Sidebar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700 h-fit">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3 text-center">
            <div className="relative group">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-blue-500 shadow">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition duration-200">
                <span className="text-xs font-bold">📷</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="overflow-hidden w-full">
              <span className="text-xs text-gray-400 uppercase tracking-wider block">Hello,</span>
              <h3 className="font-bold text-gray-800 dark:text-white truncate">{user.name}</h3>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            <button
              onClick={() => setActiveTab("personal")}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-3 transition ${
                activeTab === "personal"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              👤 Personal Information
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-3 transition ${
                activeTab === "addresses"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              🏠 Manage Addresses
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-3 transition ${
                activeTab === "security"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              🔒 Security & Password
            </button>
            <Link
              to="/orders"
              className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition block"
            >
              📦 My Orders
            </Link>
            <Link
              to="/wishlist"
              className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition block"
            >
              ❤️ My Wishlist
            </Link>
          </nav>
        </div>

        {/* Right Main Content */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
          
          {/* PERSONAL INFO TAB */}
          {activeTab === "personal" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-3 dark:border-gray-700">
                Personal Information
              </h2>

              <form onSubmit={handleSavePersonal} className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-3 dark:border-gray-700">
                Security & Password
              </h2>

              <form onSubmit={handleSaveSecurity} className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
                >
                  {saving ? "Saving..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b pb-3 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Manage Delivery Addresses
                </h2>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow hover:bg-blue-700 transition"
                >
                  {showAddAddress ? "Cancel" : "+ Add New Address"}
                </button>
              </div>

              {/* Add Address Form */}
              {showAddAddress && (
                <form onSubmit={handleAddAddress} className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-blue-200 dark:border-gray-700 mb-6 space-y-4">
                  <h3 className="font-bold text-gray-800 dark:text-white">New Delivery Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      required
                      value={newAddr.fullName}
                      onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                      className="p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="10-digit mobile number *"
                      required
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      className="p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      required
                      value={newAddr.pincode}
                      onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                      className="p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="City/District *"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      required
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Flat, House no., Building, Street *"
                      required
                      value={newAddr.street}
                      onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                      className="p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded shadow text-sm"
                  >
                    SAVE ADDRESS
                  </button>
                </form>
              )}

              {/* Address List */}
              <div className="space-y-4">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((addr) => (
                    <div
                      key={addr._id || Math.random()}
                      className="p-4 border rounded-lg border-gray-200 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-900/50"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white">{addr.fullName}</span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-semibold">
                            {addr.isDefault ? "DEFAULT" : "HOME"}
                          </span>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{addr.phone}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {addr.street}, {addr.city}, {addr.state} - <strong className="text-gray-800 dark:text-gray-200">{addr.pincode}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-red-50 dark:bg-red-950/40 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No saved addresses found. Click "+ Add New Address" above.</p>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
