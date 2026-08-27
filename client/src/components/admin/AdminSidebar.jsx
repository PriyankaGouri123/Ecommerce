import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function AdminSidebar() {
  const { logout } = useContext(AuthContext);

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Products", path: "/admin/products", icon: "📦" },
    { name: "Inventory", path: "/admin/inventory", icon: "🏢" },
    { name: "Orders", path: "/admin/orders", icon: "🚚" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Reviews", path: "/admin/reviews", icon: "⭐" },
    { name: "Coupons", path: "/admin/coupons", icon: "🎟️" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col transition-all h-full">
      <div className="p-6 text-2xl font-bold border-b border-gray-800 flex items-center justify-between">
        {/* <span>Seller Central</span> */}
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
