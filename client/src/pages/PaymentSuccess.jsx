import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { StoreContext } from "../context/StoreContext";
import { formatPaymentMethod } from "../utils/payment";

const API_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function PaymentSuccess() {
  const { orderId } = useParams();
  const { token } = useContext(AuthContext);
  const { clearCart } = useContext(StoreContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If order succeeded, clear local cart state
    clearCart();

    const fetchOrder = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          const errData = await res.json();
          setError(errData.message || "Failed to load order details");
        }
      } catch (err) {
        console.error(err);
        setError("Network error loading order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 font-semibold text-lg">Verifying your order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Order Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Could not retrieve order details."}</p>
        <Link
          to="/orders"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
        >
          ← Go to My Orders
        </Link>
      </div>
    );
  }

  const orderItems = order.orderItems || order.items || [];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ring-8 ring-green-50 dark:ring-green-900/20 animate-pulse">
            ✓
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Your payment was confirmed and your order has been placed. We’re preparing your package for shipment.
          </p>
        </div>

        {/* Order Details Grid */}
        <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-6 mb-8 border border-gray-100 dark:border-gray-800 space-y-4 text-sm">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Order ID:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-200/60 dark:bg-gray-800 px-2 py-0.5 rounded">
              {order._id}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Payment Status:</span>
            <span className="font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
              ● {order.paymentStatus || "Paid"}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Order Status:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
              ● {order.status || "Order Placed"}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Payment Method:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {formatPaymentMethod(order.paymentMethod)}
            </span>
          </div>

          {order.razorpayPaymentId && (
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
              <span className="text-gray-500 font-medium">Razorpay Payment ID:</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {order.razorpayPaymentId}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Total Paid:</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              ₹{order.totalAmount}
            </span>
          </div>

          {order.shippingAddress && (
            <div className="pt-2">
              <span className="text-gray-500 font-medium block mb-1">Delivering To:</span>
              <div className="font-medium text-gray-800 dark:text-gray-200 leading-relaxed text-xs sm:text-sm">
                <span className="font-bold">{order.shippingAddress.name}</span> (Ph: {order.shippingAddress.phone}) <br />
                {order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
              </div>
            </div>
          )}
        </div>

        {/* Purchased Items Preview */}
        {orderItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Items Ordered ({orderItems.length})
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-white dark:bg-gray-900/40">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">
                    ₹{item.quantity * item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/orders/${order._id}/tracking`}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-center transition flex items-center justify-center gap-2"
          >
            <span>📍</span> Track Order
          </Link>
          <Link
            to="/orders"
            className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-center transition flex items-center justify-center gap-2"
          >
            <span>📦</span> My Orders
          </Link>
          <Link
            to="/"
            className="flex-1 py-3 px-6 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-center transition flex items-center justify-center gap-2"
          >
            <span>🛍️</span> Keep Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
