import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockValues, setStockValues] = useState({});
  const [updating, setUpdating] = useState({});
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        const initStock = {};
        data.forEach((p) => { initStock[p._id] = p.countInStock; });
        setStockValues(initStock);
      }
    } catch (error) {
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (id, val) => {
    setStockValues((prev) => ({ ...prev, [id]: val }));
  };

  const updateStock = async (id) => {
    const newStock = Number(stockValues[id]);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Please enter a valid stock number");
      return;
    }
    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ countInStock: newStock }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Stock updated to ${newStock}`);
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, countInStock: newStock } : p))
        );
      } else {
        toast.error(data.message || "Failed to update stock");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <div className="p-6 text-gray-600 dark:text-gray-300">Loading inventory...</div>;

  const lowStockThreshold = 10;
  const lowStockItems = products.filter((p) => p.countInStock > 0 && p.countInStock <= lowStockThreshold).length;
  const outOfStockItems = products.filter((p) => p.countInStock === 0).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{products.length}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-800">
          <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">Low Stock (≤10)</h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{lowStockItems}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Out of Stock</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{outOfStockItems}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Update Stock</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-lg object-cover" src={product.image} alt="" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {product.countInStock === 0 ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300">Out of Stock</span>
                    ) : product.countInStock <= lowStockThreshold ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300">Low Stock</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300">In Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    {product.countInStock} units
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={stockValues[product._id] ?? product.countInStock}
                        onChange={(e) => handleStockChange(product._id, e.target.value)}
                        className="w-20 p-1.5 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={() => updateStock(product._id)}
                        disabled={updating[product._id]}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {updating[product._id] ? "Saving..." : "Update"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
