import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "";

/**
 * Normalizes any stored paymentMethod value to a human-readable label.
 * "Razorpay (X)" values (set by webhook with real instrument) pass through as-is.
 * Legacy DB values from the old radio-button UI (UPI, ONLINE, RAZORPAY, CARD, etc.)
 * all map to "Razorpay (Online)" since we don't know the actual instrument used.
 */
export const formatPaymentMethod = (method) => {
  if (!method) return "Cash on Delivery";
  // Already a specific Razorpay label set by webhook — pass through
  if (method.startsWith("Razorpay (")) return method;
  const m = String(method).toUpperCase().trim();
  if (m === "COD") return "Cash on Delivery";
  // All legacy raw DB values → generic Razorpay (Online)
  if (["UPI", "CARD", "NETBANKING", "WALLET", "RAZORPAY", "ONLINE"].includes(m)) {
    return "Razorpay (Online)";
  }
  return method;
};


/**
 * Validates 10-digit Indian mobile numbers (with optional +91 or 0 prefix).
 */
export const validateIndianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    return /^[6-9]\d{9}$/.test(cleaned);
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return /^[6-9]\d{9}$/.test(cleaned.slice(2));
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return /^[6-9]\d{9}$/.test(cleaned.slice(1));
  }
  return false;
};

/**
 * Normalizes phone numbers down to the clean 10 digits for Razorpay prefill.
 */
export const getClean10DigitPhone = (phone) => {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91") && /^[6-9]\d{9}$/.test(cleaned.slice(2))) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0") && /^[6-9]\d{9}$/.test(cleaned.slice(1))) {
    return cleaned.slice(1);
  }
  return cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
};

/**
 * Loads the official Razorpay Checkout JavaScript SDK.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Reusable helper to launch Razorpay checkout modal and handle verification/cancellation.
 */
export const payWithRazorpay = async ({
  key,
  amount,
  currency,
  razorpayOrderId,
  orderId,
  prefillName,
  prefillPhone,
  prefillEmail,
  token,
  preferredMethod = "upi",
  onSuccess,
  onDismiss,
  onError,
}) => {
  const isScriptLoaded = await loadRazorpayScript();
  if (!isScriptLoaded) {
    toast.error("Razorpay SDK failed to load. Please check your internet connection.");
    if (onError) onError();
    return;
  }

  // Prevent multiple executions of callbacks
  let isSettled = false;
  const cleanPhone = getClean10DigitPhone(prefillPhone);


  const options = {
    key: key,
    amount: amount,
    currency: currency || "INR",
    name: "Modern E-Commerce Store",
    description: `Order #${orderId ? String(orderId).slice(-6) : ""}`,
    order_id: razorpayOrderId,
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true
    },
    handler: async function (response) {
      isSettled = true;
      try {
        toast.loading("Verifying payment...", { id: "payment-verify" });
        const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderId,
          }),
        });

        const verifyData = await verifyRes.json();

        if (verifyRes.ok) {
          toast.success("Payment verified successfully! 🎉", { id: "payment-verify" });
          if (onSuccess) onSuccess(verifyData);
        } else {
          toast.error(verifyData.message || "Payment verification failed", { id: "payment-verify" });
          if (onError) onError(verifyData);
        }
      } catch (err) {
        console.error("Verification error:", err);
        toast.error("Server error during payment verification", { id: "payment-verify" });
        if (onError) onError(err);
      }
    },
    modal: {
      confirm_close: true,
      ondismiss: function () {
        if (!isSettled) {
          isSettled = true;
          toast.error("Payment cancelled. Order saved as Pending Payment.", { duration: 4000 });
          // Non-blocking notification to backend
          try {
            fetch(`${API_URL}/api/payments/mark-failed`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ orderId, razorpayOrderId }),
            }).catch(() => {});
          } catch (e) {}

          if (onDismiss) onDismiss();
        }
      },
    },
    prefill: {
      name: prefillName || "",
      contact: cleanPhone || "",
      email: prefillEmail || "",
      method: preferredMethod || "upi"
    },
    notes: {
      orderId: String(orderId || ""),
    },
    theme: {
      color: "#2563EB",
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on("payment.failed", function (response) {
    if (!isSettled) {
      isSettled = true;
      const desc = response?.error?.description || "Payment was declined or failed";
      toast.error(`Payment Failed: ${desc}`, { id: "payment-verify" });

      // Notify backend of failure non-blockingly
      try {
        fetch(`${API_URL}/api/payments/mark-failed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId, razorpayOrderId }),
        }).catch(() => {});
      } catch (e) {}

      if (onError) onError(response?.error);
    }
  });

  rzp.open();
};
