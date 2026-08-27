import { createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

export const AuthContext = createContext();

const API_BASE_URL = "/api/auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [loading, setLoading] = useState(true);

  // Restore user session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const openAuthModal = (mode = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Persist session data
  const handleAuthSuccess = (userData, userToken, message) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userToken);
    toast.success(message, {
      icon: "🎉",
      style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
    });
    closeAuthModal();
  };

  // ─────────── PASSWORD LOGIN ───────────
  const loginWithPassword = async (identifier, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok) {
        handleAuthSuccess(data, data.token, `Welcome back, ${data.name}!`);
        return { success: true };
      } else {
        toast.error(data.message || "Login failed. Please try again.", {
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });
        return { success: false, message: data.message };
      }
    } catch {
      toast.error("Cannot connect to server. Please make sure the server is running.", {
        style: { borderRadius: "10px", background: "#7f1d1d", color: "#fff" },
        duration: 5000,
      });
      return { success: false, message: "Server unavailable" };
    }
  };

  // ─────────── SEND OTP (Real Email) ───────────
  const sendOtp = async (identifier) => {
    try {
      const res = await fetch(`${API_BASE_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `OTP sent to ${identifier}!`, {
          icon: "📧",
          duration: 5000,
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });
        return { success: true };
      } else {
        toast.error(data.message || "Failed to send OTP. Please try again.", {
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });
        return { success: false, message: data.message };
      }
    } catch {
      toast.error("Cannot connect to server. Please make sure the server is running.", {
        style: { borderRadius: "10px", background: "#7f1d1d", color: "#fff" },
        duration: 5000,
      });
      return { success: false, message: "Server unavailable" };
    }
  };

  // ─────────── VERIFY OTP ───────────
  const verifyOtp = async (identifier, otp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        handleAuthSuccess(data, data.token, `Verified! Welcome, ${data.name} 🎉`);
        return { success: true };
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.", {
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });
        return { success: false, message: data.message };
      }
    } catch {
      toast.error("Cannot connect to server. Please make sure the server is running.", {
        style: { borderRadius: "10px", background: "#7f1d1d", color: "#fff" },
        duration: 5000,
      });
      return { success: false, message: "Server unavailable" };
    }
  };

  // ─────────── REGISTER ───────────
  const register = async (name, identifier, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, identifier, password }),
      });

      const data = await res.json();

      if (res.ok) {
        handleAuthSuccess(data, data.token, `Account created! Welcome, ${data.name} 🎉`);
        return { success: true };
      } else {
        toast.error(data.message || "Registration failed. Please try again.", {
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });
        return { success: false, message: data.message };
      }
    } catch {
      toast.error("Cannot connect to server. Please make sure the server is running.", {
        style: { borderRadius: "10px", background: "#7f1d1d", color: "#fff" },
        duration: 5000,
      });
      return { success: false, message: "Server unavailable" };
    }
  };

  // ─────────── UPDATE PROFILE ───────────
  const updateProfile = async (updatedFields) => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFields),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data);
        if (data.token) {
          setToken(data.token);
          localStorage.setItem("token", data.token);
        }
        localStorage.setItem("user", JSON.stringify(data));
        toast.success("Profile updated successfully!", {
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });
        return { success: true };
      } else {
        toast.error(data.message || "Failed to update profile.", {
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
        });
        return { success: false };
      }
    } catch {
      toast.error("Cannot connect to server.", {
        style: { borderRadius: "10px", background: "#7f1d1d", color: "#fff" },
      });
      return { success: false };
    }
  };

  // ─────────── LOGOUT ───────────
  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("wishlist");
    toast("Logged out successfully", {
      icon: "👋",
      style: { borderRadius: "10px", background: "#1e293b", color: "#fff" },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        loginWithPassword,
        sendOtp,
        verifyOtp,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
