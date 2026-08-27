import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateRange, setDateRange] = useState(7);
  
  const [charts, setCharts] = useState({
    revenue: [],
    orders: [],
    users: [],
    categories: [],
    payments: []
  });
  
  const { token } = useContext(AuthContext);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, revRes, ordRes, usersRes, catRes, payRes, topProdRes, recentOrdRes, invAlertsRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch(`/api/admin/charts/revenue?days=${dateRange}`, { headers }),
        fetch(`/api/admin/charts/orders?days=${dateRange}`, { headers }),
        fetch(`/api/admin/charts/users?days=${dateRange}`, { headers }),
        fetch("/api/admin/charts/categories", { headers }),
        fetch("/api/admin/charts/payments", { headers }),
        fetch("/api/admin/top-products", { headers }),
        fetch("/api/admin/recent-orders", { headers }),
        fetch("/api/admin/inventory-alerts", { headers })
      ]);

      const responses = [statsRes, revRes, ordRes, usersRes, catRes, payRes, topProdRes, recentOrdRes, invAlertsRes];
      if (responses.some(res => !res.ok)) {
        throw new Error("One or more API endpoints failed to load");
      }
      
      const [statsData, revData, ordData, usersData, catData, payData, topProdData, recentOrdData, invAlertsData] = await Promise.all(
        responses.map(res => res.json())
      );
      
      setStats(statsData);
      setCharts({
        revenue: revData,
        orders: ordData,
        users: usersData,
        categories: catData,
        payments: payData,
        topProducts: topProdData,
        ordersList: recentOrdData,
        inventoryAlerts: invAlertsData
      });
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      toast.error("Failed to load dashboard data");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-32 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-4">Failed to load dashboard data</h2>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = [
    { title: "Today's Revenue", value: `₹${(stats.todayRevenue?.value || 0).toLocaleString()}`, trend: stats.todayRevenue?.value >= stats.todayRevenue?.previous ? "up" : "down", trendText: "vs yesterday", icon: "💰" },
    { title: "Total Revenue", value: `₹${(stats.totalRevenue?.value || 0).toLocaleString()}`, trend: stats.totalRevenue?.last30 >= stats.totalRevenue?.prev30 ? "up" : "down", trendText: "last 30d", icon: "📈" },
    { title: "Total Orders", value: stats.orders?.total || 0, trend: "neutral", icon: "📦" },
    { title: "Pending Orders", value: stats.orders?.pending || 0, trend: stats.orders?.pending > 0 ? "down" : "up", trendText: "needs action", icon: "⏳" },
    { title: "Delivered Orders", value: stats.orders?.delivered || 0, trend: "up", icon: "✅" },
    { title: "Total Customers", value: stats.users?.total || 0, trend: stats.users?.last30 >= stats.users?.prev30 ? "up" : "down", trendText: "last 30d", icon: "👥" },
    { title: "Total Products", value: stats.products?.total || 0, trend: "neutral", icon: "🏷️" },
    { title: "Low Stock Products", value: stats.products?.lowStock || 0, trend: stats.products?.lowStock > 0 ? "down" : "up", trendText: stats.products?.lowStock > 0 ? "needs restock" : "all good", icon: "⚠️" }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening in your store.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === days 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.title}</h3>
              <span className="text-xl bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">{kpi.icon}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              {kpi.trend !== "neutral" && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                  kpi.trend === "up" ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30" : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30"
                }`}>
                  {kpi.trend === "up" ? "▲" : "▼"} {kpi.trendText}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Over Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{borderRadius: '8px', backgroundColor: '#1f2937', color: '#fff', border: 'none'}} itemStyle={{color: '#fff'}} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Orders Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.orders}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px', backgroundColor: '#1f2937', color: '#fff', border: 'none'}} cursor={{fill: '#374151', opacity: 0.1}} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">New Customers</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.users}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px', backgroundColor: '#1f2937', color: '#fff', border: 'none'}} />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Sales by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.categories} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="revenue" nameKey="category">
                    {charts.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} contentStyle={{borderRadius: '8px', backgroundColor: '#1f2937', color: '#fff', border: 'none'}} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payment Methods</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.payments} outerRadius={80} dataKey="count" nameKey="method">
                    {charts.payments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', backgroundColor: '#1f2937', color: '#fff', border: 'none'}} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders (takes up 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {charts.ordersList?.map((order) => (
                  <tr key={order._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">#{order._id.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 dark:text-white font-medium">{order.shippingAddress?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{order.user?.email || 'No email'}</div>
                    </td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₹{order.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!charts.ordersList || charts.ordersList.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side column for Top Products and Inventory Alerts */}
        <div className="space-y-6 flex flex-col">
          
          {/* Top Products */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Selling</h3>
              <Link to="/admin/products" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {charts.topProducts?.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="text-gray-400 font-bold w-4 text-center">{idx + 1}</div>
                  <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.units} units sold</p>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">₹{product.revenue}</div>
                </div>
              ))}
              {(!charts.topProducts || charts.topProducts.length === 0) && (
                <div className="py-4 text-center text-gray-500 text-sm">No sales data available.</div>
              )}
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Inventory Alerts <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{charts.inventoryAlerts?.length || 0}</span>
              </h3>
              <Link to="/admin/inventory" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Update</Link>
            </div>
            <div className="space-y-4">
              {charts.inventoryAlerts?.map((product) => (
                <div key={product._id} className="flex justify-between items-center border-b dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt={product.name} className="w-8 h-8 rounded-md object-cover" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                    product.countInStock === 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'bg-orange-50 text-orange-600 dark:bg-orange-900/30'
                  }`}>
                    {product.countInStock === 0 ? 'Out of Stock' : `${product.countInStock} Left`}
                  </div>
                </div>
              ))}
              {(!charts.inventoryAlerts || charts.inventoryAlerts.length === 0) && (
                <div className="py-2 text-center text-green-600 dark:text-green-400 text-sm font-medium flex items-center justify-center gap-2">
                  <span>✅</span> All products are well stocked!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
