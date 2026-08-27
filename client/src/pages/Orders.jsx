import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import ReviewModal from "../components/ReviewModal";
import toast from "react-hot-toast";

export default function Orders() {
  const { user, token, openAuthModal } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Map of productId → existing review object
  const [myReviews, setMyReviews] = useState({});

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [editingReview, setEditingReview] = useState(null); // null = create mode

  const fetchOrders = useCallback(async () => {
    if (!user || !token) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(await res.json());
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  const fetchMyReviews = useCallback(async () => {
    if (!user || !token) return;
    try {
      const res = await fetch("/api/reviews/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyReviews(await res.json());
      }
    } catch (err) {
      console.error("Fetch my reviews error:", err);
    }
  }, [user, token]);

  useEffect(() => {
    fetchOrders();
    fetchMyReviews();
  }, [fetchOrders, fetchMyReviews]);

  const handleOpenWriteReview = (item, orderId) => {
    setReviewProduct({
      _id: item.product || item._id || item.id,
      name: item.name,
      image: item.image,
    });
    setReviewOrderId(orderId);
    setEditingReview(null); // create mode
    setIsReviewModalOpen(true);
  };

  const handleOpenEditReview = (item, existingReview) => {
    setReviewProduct({
      _id: item.product || item._id || item.id,
      name: item.name,
      image: item.image,
    });
    setReviewOrderId(existingReview.order);
    setEditingReview(existingReview);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = (savedReview) => {
    // Update myReviews map immediately so buttons change without a full reload
    setMyReviews((prev) => ({
      ...prev,
      [savedReview.product.toString()]: savedReview,
    }));
    setIsReviewModalOpen(false);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Log in to view your orders</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Track shipments, view order history and download invoices.</p>
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
      <div className="max-w-5xl mx-auto py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Fetching your orders from server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">{error}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Please check your server connection and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No Orders Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't placed any orders yet.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          📦 My Orders ({orders.length})
        </h1>
        <Link to="/" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          Continue Shopping →
        </Link>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const orderItems = order.orderItems || order.items || [];
          const formattedDate = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })
            : "Recently Placed";

          return (
            <div
              key={order._id || order.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gray-50 dark:bg-gray-900/80 p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Order Placed</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Total Amount</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Order ID</span>
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{order._id || order.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Payment</span>
                    <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                      {order.paymentMethod || "COD"} 
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        order.paymentStatus === "Paid" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                          : order.paymentStatus === "Pending"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {order.paymentStatus || "Pending"}
                      </span>
                    </span>
                    {order.razorpayPaymentId && (
                      <span className="block text-[10px] text-gray-400 mt-0.5 font-mono">
                        TXN: {order.razorpayPaymentId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    ● {order.status || "Order Placed"}
                  </span>
                  {order.status !== "Delivered" && order.status !== "Cancelled" && (
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to cancel this order?")) {
                          try {
                            const res = await fetch(`/api/orders/${order._id || order.id}/cancel`, {
                              method: "PUT",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.ok) {
                              toast.success("Order cancelled successfully!");
                              fetchOrders();
                            } else {
                              const errData = await res.json();
                              toast.error(errData.message || "Failed to cancel order");
                            }
                          } catch (err) {
                            console.error("Cancel order error:", err);
                            toast.error("Unable to cancel order");
                          }
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-800 dark:text-gray-200 mr-2">📍 Deliver To:</span>
                  {order.shippingAddress.name}, {order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.pincode} (Ph: {order.shippingAddress.phone})
                </div>
              )}

              {/* Order Items */}
              <div className="p-4 divide-y divide-gray-100 dark:divide-gray-700">
                {orderItems.map((item, idx) => {
                  // Look up the product MongoDB ObjectId to check for an existing review
                  const productId = item.product
                    ? item.product.toString()
                    : (item._id || item.id || "").toString();
                  const existingReview = myReviews[productId] || null;

                  return (
                    <div key={item._id || item.id || idx} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">🛍️</div>
                      )}
                      <div className="flex-grow">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">₹{item.price}</p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[110px]">
                        {order.status === "Delivered" ? (
                          existingReview ? (
                            // Already reviewed — show "See Review" + "Edit Review"
                            <>
                              <div className="flex text-yellow-400 text-xs justify-center gap-0.5">
                                {[1,2,3,4,5].map((s) => (
                                  <span key={s}>{s <= existingReview.rating ? "★" : "☆"}</span>
                                ))}
                              </div>
                              <button
                                onClick={() => handleOpenEditReview(item, existingReview)}
                                className="px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition text-center"
                              >
                                ✏️ Edit Review
                              </button>
                            </>
                          ) : (
                            // Not reviewed yet
                            <button
                              onClick={() => handleOpenWriteReview(item, order._id || order.id)}
                              className="px-3 py-2 text-xs font-bold bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 rounded-lg hover:bg-green-100 transition text-center"
                            >
                              ✍️ Write Review
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => navigate(`/orders/${order._id || order.id}/tracking`)}
                            className="px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 transition text-center"
                          >
                            Track Order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal — handles both create & edit */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        product={reviewProduct}
        orderId={reviewOrderId}
        existingReview={editingReview}
        onReviewSuccess={handleReviewSuccess}
      />
    </div>
  );
}
