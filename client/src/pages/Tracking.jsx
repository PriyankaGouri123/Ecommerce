import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Tracking() {
  const { orderId } = useParams();
  const { user, token, openAuthModal } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderTracking = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          setTrackingData(data.trackingHistory || []);
        } else {
          const errData = await res.json();
          setError(errData.message || "Failed to fetch order tracking");
        }
      } catch (err) {
        console.error("Fetch tracking error:", err);
        setError("Unable to connect to server");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderTracking();
    }
  }, [orderId, user, token]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Log in to track your order
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Please log in to view shipment status and delivery tracking.
        </p>
        <button
          onClick={() => openAuthModal("login")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
        >
          Login Now
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Loading tracking history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">{error}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You may not have permission to view this order or the order does not exist.
        </p>
        <Link
          to="/orders"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
        >
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  const trackingHistory = trackingData || [];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/orders" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            Order Shipment Tracking
          </h1>
        </div>
        <span className="text-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          ID: {order?._id || orderId}
        </span>
      </div>

      {/* Order Info Summary */}
      {order && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-md mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">Status</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{order.status || "Order Placed"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">Placed On</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">Total Amount</span>
            <span className="font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</span>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-md">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b pb-3 dark:border-gray-700">
          Tracking Timeline
        </h2>

        {trackingHistory.length === 0 ? (
          <div className="py-6 text-center">
            <div className="inline-block p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-3xl mb-3">
              📦
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Order Placed</h3>
            <p className="text-sm text-gray-500 mt-1">Your order has been recorded in our system.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-blue-500 dark:border-blue-400 ml-4 space-y-8 pl-6 py-2">
            {trackingHistory.map((step, idx) => (
              <div key={step._id || idx} className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-gray-800 shadow" />

                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {step.status || "Order Placed"}
                  </h3>
                  {step.date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(step.date).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                  {step.location && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                      📍 {step.location}
                    </p>
                  )}
                  {step.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchased Items List in Order */}
      {order?.orderItems && order.orderItems.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-md">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Items in this Shipment ({order.orderItems.length})
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {order.orderItems.map((item, i) => (
              <div key={item._id || i} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4 text-sm">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border" />
                )}
                <div className="flex-grow">
                  <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
