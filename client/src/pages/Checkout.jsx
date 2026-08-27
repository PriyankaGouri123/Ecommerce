import { useContext, useState, useEffect } from "react";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { cart, clearCart } = useContext(StoreContext);
  const { user, token, openAuthModal } = useContext(AuthContext);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Auto open login modal if user is not logged in when accessing checkout
  useEffect(() => {
    if (!user) {
      openAuthModal("login");
    } else {
      const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      setAddress({
        name: user.name || "",
        phone: user.phone || defaultAddr?.phone || "",
        address: defaultAddr ? `${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state}` : "",
        city: defaultAddr?.city || "",
        pincode: defaultAddr?.pincode || "",
      });
    }
  }, [user]);

  // Fetch active available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("/api/coupons");
        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(data);
        }
      } catch (err) {
        console.error("Failed to fetch available coupons:", err);
      }
    };
    fetchCoupons();
  }, []);

  // Price calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const delivery = subtotal > 999 ? 0 : 99;
  const total = Math.max(0, subtotal - discountAmount + delivery);

  // Re-validate applied coupon if subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      if (subtotal < appliedCoupon.minimumOrder) {
        setAppliedCoupon(null);
        toast.error(`Coupon "${appliedCoupon.code}" removed: Minimum order of ₹${appliedCoupon.minimumOrder} required.`);
      } else {
        // Recalculate discount amount for percentage coupons
        if (appliedCoupon.discountType === "percentage") {
          const newDiscountAmount = Math.round((subtotal * appliedCoupon.discount) / 100);
          setAppliedCoupon((prev) => prev ? { ...prev, discountAmount: newDiscountAmount } : null);
        }
      }
    }
  }, [subtotal]);

  const handleApplyCoupon = async (codeToApply) => {
    const targetCode = (codeToApply || couponInput).trim();
    if (!targetCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode, subtotal }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponInput(data.code);
        toast.success(`Coupon "${data.code}" applied! Saved ₹${data.discountAmount} 🎉`, {
          icon: "🏷️",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      } else {
        toast.error(data.message || "Invalid coupon code");
      }
    } catch (err) {
      console.error("Coupon validation error:", err);
      toast.error("Failed to validate coupon code");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast("Coupon code removed", { icon: "ℹ️" });
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to place your order", { icon: "🔐" });
      openAuthModal("login");
      return;
    }

    if (
      !address.name ||
      !address.phone ||
      !address.address ||
      !address.city ||
      !address.pincode
    ) {
      toast.error("Please fill all required delivery details");
      return;
    }

    // Validate stock for all items before placing order
    for (const item of cart) {
      const stock = item.countInStock !== undefined ? Number(item.countInStock) : 0;
      if (stock <= 0) {
        toast.error(`"${item.name}" is out of stock. Please remove it from your cart.`);
        return;
      }
      if (item.quantity > stock) {
        toast.error(`Cannot place order. Requested quantity (${item.quantity}) for "${item.name}" exceeds available stock (${stock}).`);
        return;
      }
    }

    setSubmitting(true);
    const orderPayload = {
      orderItems: cart.map((item) => ({
        product: item._id || (typeof item.id === "string" && item.id.length === 24 ? item.id : null),
        id: String(item.id),
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: item.price,
      })),
      shippingAddress: {
        name: address.name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        pincode: address.pincode,
      },
      paymentMethod: paymentMethod.toUpperCase(),
      couponCode: appliedCoupon ? appliedCoupon.code : "",
    };

    if (paymentMethod === "cod") {
      // COD FLOW
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success(`Order placed successfully using COD 🎉`, { duration: 5000, icon: "📦" });
          clearCart();
          navigate("/orders");
        } else {
          toast.error(data.message || "Failed to place order. Please try again.");
        }
      } catch (err) {
        console.error("Order placement error:", err);
        toast.error("Server error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    } else {
      // ONLINE PAYMENT FLOW (Razorpay)
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setSubmitting(false);
        return;
      }

      try {
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Failed to initiate payment");
          setSubmitting(false);
          return;
        }

        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "Ecommerce Store",
          description: "Order Payment",
          order_id: data.razorpayOrderId,
          handler: async function (response) {
            // Payment success handler
            try {
              toast.loading("Verifying payment...", { id: "payment-verify" });
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: data.orderId,
                }),
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok) {
                toast.success("Payment verified and order placed! 🎉", { id: "payment-verify" });
                clearCart();
                navigate("/orders");
              } else {
                toast.error(verifyData.message || "Payment verification failed", { id: "payment-verify" });
                // We keep them on checkout or send them to orders with 'Pending Payment' status
                navigate("/orders");
              }
            } catch (err) {
              console.error("Verification error:", err);
              toast.error("Server error during verification", { id: "payment-verify" });
            }
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
              toast.error("Payment cancelled. Order saved as Pending Payment.", { duration: 4000 });
              navigate("/orders"); // Usually better to send them to orders where they can retry later
            },
          },
          prefill: {
            name: address.name,
            contact: address.phone,
            email: user.email || "",
          },
          theme: {
            color: "#2563EB", // blue-600
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          toast.error(`Payment Failed: ${response.error.description}`);
          setSubmitting(false);
        });
        rzp.open();

      } catch (err) {
        console.error("Online payment error:", err);
        toast.error("Server error initiating payment");
        setSubmitting(false);
      }
    }
  };



  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Explore our latest collection and add items to your cart.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  // PROTECTED LOGIN GATE FOR CHECKOUT
  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
          🔐
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          Login Required to Buy
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Please log in or create an account to access delivery addresses and complete your order.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => openAuthModal("login")}
            className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition transform active:scale-95"
          >
            LOG IN WITH MOBILE / EMAIL
          </button>
          <button
            onClick={() => openAuthModal("signup")}
            className="px-6 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-lg hover:bg-gray-200 transition"
          >
            CREATE ACCOUNT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-8">

      {/* LEFT: Address + Payment */}
      <div className="space-y-6">

        {/* Logged in User Bar */}
        <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">Ordering as</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name} ({user.phone || user.email})</p>
            </div>
          </div>
          <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2.5 py-1 rounded">
            ✓ Logged In
          </span>
        </div>

        {/* Delivery Address Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📍 Delivery Address
            </h2>
            {user?.addresses?.length > 0 && (
              <span className="text-xs text-blue-600 font-semibold cursor-pointer" onClick={() => navigate("/profile")}>
                Manage Saved Addresses ({user.addresses.length})
              </span>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name *"
              value={address.name}
              className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={(e) => setAddress({ ...address, name: e.target.value })}
            />

            <input
              type="text"
              placeholder="10-digit Phone Number *"
              value={address.phone}
              className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
            />

            <textarea
              placeholder="Flat, House no., Building, Street Address *"
              value={address.address}
              rows="3"
              className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              onChange={(e) => setAddress({ ...address, address: e.target.value })}
            />

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="City *"
                value={address.city}
                className="w-1/2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />

              <input
                type="text"
                placeholder="Pincode *"
                value={address.pincode}
                className="w-1/2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            💳 Payment Method
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-bold text-gray-800 dark:text-white text-sm block">💵 Cash on Delivery (COD)</span>
                <span className="text-xs text-gray-500">Pay cash upon receiving your delivery</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "upi"}
                onChange={() => setPaymentMethod("upi")}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-bold text-gray-800 dark:text-white text-sm block">📱 Instant UPI / GPay / PhonePe</span>
                <span className="text-xs text-gray-500">Fast payment via any UPI application</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-bold text-gray-800 dark:text-white text-sm block">💳 Credit / Debit Card</span>
                <span className="text-xs text-gray-500">Visa, Mastercard, RuPay cards accepted</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* RIGHT: Order Summary + Coupon Code */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-xl shadow-md h-fit space-y-5">

        <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-700">
          Order Summary ({cart.length} items)
        </h2>

        {/* Items list */}
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-gray-100 dark:divide-gray-700">
          {cart.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border" />
                )}
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* COUPON CODE SECTION */}
        <div className="bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              🏷️ Have a Coupon Code?
            </span>
            {appliedCoupon && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                ✓ Coupon Applied
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code (e.g. SAVE20)"
              value={couponInput}
              disabled={!!appliedCoupon || validatingCoupon}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              className="flex-1 uppercase font-mono border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-700"
            />
            {appliedCoupon ? (
              <button
                onClick={handleRemoveCoupon}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={() => handleApplyCoupon()}
                disabled={validatingCoupon || !couponInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold px-5 py-2 rounded-lg text-xs transition"
              >
                {validatingCoupon ? "Validating..." : "Apply"}
              </button>
            )}
          </div>

          {/* Clickable Available Coupons Pills */}
          {availableCoupons.length > 0 && !appliedCoupon && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Available Offers (Click to apply):</p>
              <div className="flex flex-wrap gap-1.5">
                {availableCoupons.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCouponInput(c.code);
                      handleApplyCoupon(c.code);
                    }}
                    className="text-xs font-mono font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 transition"
                  >
                    🏷️ {c.code} ({c.discountType === 'percentage' ? `${c.discount}% OFF` : `₹${c.discount} OFF`})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
              <span>Coupon Discount ({appliedCoupon.code})</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Delivery Charges</span>
            <span>{delivery === 0 ? <strong className="text-green-600">FREE</strong> : `₹${delivery}`}</span>
          </div>

          <div className="flex justify-between font-extrabold text-lg text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700">
            <span>Total Payable</span>
            <span className="text-blue-600 dark:text-blue-400">₹{total}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition transform active:scale-95 mt-4"
        >
          {submitting ? "PLACING ORDER..." : `CONFIRM ORDER (₹${total})`}
        </button>

        <button
          onClick={() => navigate("/cart")}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 font-semibold py-2"
        >
          ← Return to Cart
        </button>
      </div>
    </div>
  );
}