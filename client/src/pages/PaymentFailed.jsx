import { useContext, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { StoreContext } from "../context/StoreContext";
import { payWithRazorpay } from "../utils/payment";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function PaymentFailed() {
  const { orderId } = useParams();
  const { user, token } = useContext(AuthContext);
  const { clearCart } = useContext(StoreContext);
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
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

  const handleRetryPayment = async () => {
    if (retrying || !order) return;
    setRetrying(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/retry-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to initiate payment retry");
        setRetrying(false);
        return;
      }

      await payWithRazorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        razorpayOrderId: data.razorpayOrderId,
        orderId: data.orderId,
        prefillName: order.shippingAddress?.name || user?.name || "",
        prefillPhone: order.shippingAddress?.phone || user?.phone || "",
        prefillEmail: user?.email || "",
        token: token,
        onSuccess: () => {
          clearCart();
          navigate(`/payment/success/${orderId}`);
        },
        onDismiss: () => {
          setRetrying(false);
        },
        onError: () => {
          setRetrying(false);
        }
      });
    } catch (err) {
      console.error("Retry error:", err);
      toast.error("Could not load payment popup");
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 font-semibold text-lg">Loading order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Order Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "Order was not found"}</p>
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
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 ring-8 ring-red-50 dark:ring-red-900/20">
            ✕
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            Payment Incomplete
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto text-sm sm:text-base">
            Your payment was not completed or was cancelled. Your items are safe and this order is saved in your account.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-6 mb-8 border border-gray-100 dark:border-gray-800 space-y-4 text-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Order ID:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-200/60 dark:bg-gray-800 px-2 py-0.5 rounded">
              {order._id}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Payment Status:</span>
            <span className="font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
              ● {order.paymentStatus || "Pending / Failed"}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <span className="text-gray-500 font-medium">Amount Due:</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              ₹{order.totalAmount}
            </span>
          </div>

          {orderItems.length > 0 && (
            <div className="pt-2">
              <span className="text-gray-500 font-medium block mb-2">Order Items:</span>
              <div className="space-y-1">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                    <span className="truncate pr-2">{item.name} (×{item.quantity})</span>
                    <span className="font-semibold">₹{item.quantity * item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:bg-blue-400 flex items-center justify-center gap-2"
          >
            {retrying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Opening Checkout...</span>
              </>
            ) : (
              <>
                <span>💳</span>
                <span>Retry Payment Now</span>
              </>
            )}
          </button>
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
