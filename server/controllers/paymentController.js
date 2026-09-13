import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { sendOrderPlacedEmail } from "../config/emailService.js";

/**
 * Universal product lookup helper supporting ObjectId, 24-char hex string, or numeric id.
 */
export const findProductByIdOrCode = async (productId) => {
  if (!productId) return null;
  const conditions = [];

  if (mongoose.Types.ObjectId.isValid(productId)) {
    conditions.push({ _id: productId });
  }
  const numericId = Number(productId);
  if (!isNaN(numericId)) {
    conditions.push({ id: numericId });
  }

  if (conditions.length === 0) return null;
  return await Product.findOne({ $or: conditions });
};

/**
 * Universal stock decrement helper.
 */
export const decrementProductStock = async (productId, quantity) => {
  const conditions = [];
  if (mongoose.Types.ObjectId.isValid(productId)) {
    conditions.push({ _id: productId });
  }
  const numericId = Number(productId);
  if (!isNaN(numericId)) {
    conditions.push({ id: numericId });
  }
  if (conditions.length === 0) return;
  return await Product.updateOne({ $or: conditions }, { $inc: { countInStock: -quantity } });
};

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cached Razorpay instance.
let _razorpayInstance = null;

function getRazorpay() {
  // Always check latest env if keys are missing
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    dotenv.config({ path: path.join(__dirname, "../.env"), override: true });
  }

  const key_id = (process.env.RAZORPAY_KEY_ID || "").trim().replace(/^["']|["']$/g, "");
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim().replace(/^["']|["']$/g, "");

  if (!key_id || !key_secret) {
    console.error(
      "❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment variables.",
      { key_id: key_id ? "set" : "MISSING", key_secret: key_secret ? "set" : "MISSING" }
    );
    throw new Error("Razorpay credentials are not configured. Check your .env file.");
  }

  if (!_razorpayInstance || _razorpayInstance.key_id !== key_id || _razorpayInstance.key_secret !== key_secret) {
    _razorpayInstance = new Razorpay({ key_id, key_secret });
    console.log("✅ Razorpay instance initialized successfully with key prefix:", key_id.substring(0, 8), "length:", key_id.length);
  }
  return _razorpayInstance;
}

/**
 * Fulfills an order idempotently.
 * Shared by both direct verify API and Razorpay webhook.
 */
export const fulfillOrder = async (razorpayOrderId, razorpayPaymentId, orderId = null, razorpayMethod = null) => {
  let order = null;
  if (razorpayOrderId) {
    order = await Order.findOne({ razorpayOrderId });
  }
  if (!order && orderId) {
    order = await Order.findById(orderId);
  }
  if (!order) {
    console.warn(`⚠️ Order not found for fulfillment: razorpayOrderId=${razorpayOrderId}, orderId=${orderId}`);
    return null;
  }

  // Idempotency check 1: If already paid, do nothing
  if (order.paymentStatus === "Paid") {
    console.log(`ℹ️ Order ${order._id} is already paid. Skipping double fulfillment.`);
    return order;
  }

  // 1. Recheck Stock availability before locking
  for (const item of order.orderItems) {
    const productDoc = await findProductByIdOrCode(item.product || item.id);
    if (!productDoc) throw new Error(`Product "${item.name}" not found.`);
    if (productDoc.countInStock < item.quantity) {
      throw new Error(`Stock for "${item.name}" ran out. Cannot fulfill.`);
    }
  }

  // 2. Atomic Lock Transition: Only transition if paymentStatus is not already "Paid"
  const lockedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: { $ne: "Paid" }
    },
    {
      $set: {
        paymentStatus: "Paid",
        status: "Order Placed",
        razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId || "",
        ...(razorpayMethod ? { paymentMethod: razorpayMethod } : {}),
        paidAt: new Date()
      },
      $push: {
        trackingHistory: {
          status: "Order Placed",
          date: new Date(),
          location: order.shippingAddress?.city || "Hub",
          description: "Payment verified successfully. Order confirmed."
        }
      }
    },
    { returnDocument: 'after' }
  );

  if (!lockedOrder) {
    console.log(`ℹ️ Order ${order._id} was already fulfilled by concurrent request. Skipping.`);
    return await Order.findById(order._id);
  }

  // 3. Deduct Inventory & Increment Coupon (Guaranteed to run only once due to atomic lock)
  for (const item of lockedOrder.orderItems) {
    await decrementProductStock(item.product || item.id, item.quantity);
  }

  if (lockedOrder.couponCode) {
    await Coupon.updateOne(
      { code: lockedOrder.couponCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  // 4. Send Confirmation Email (non-blocking)
  const userDoc = await User.findById(lockedOrder.user);
  if (userDoc && userDoc.email) {
    try {
      await sendOrderPlacedEmail(userDoc.email, lockedOrder);
    } catch (err) {
      console.error("Email notification failed:", err);
    }
  }

  // 5. Clear Cart (non-blocking)
  try {
    await Cart.findOneAndUpdate({ user: lockedOrder.user }, { items: [] });
  } catch (err) {
    console.error("Cart clear failed:", err);
  }

  return lockedOrder;
};

/**
 * Marks payment as failed if still pending.
 */
export const failOrder = async (razorpayOrderId, orderId = null) => {
  let order = null;
  if (razorpayOrderId) {
    order = await Order.findOne({ razorpayOrderId });
  }
  if (!order && orderId) {
    order = await Order.findById(orderId);
  }
  if (!order) {
    console.warn(`⚠️ Order not found for failOrder: razorpayOrderId=${razorpayOrderId}, orderId=${orderId}`);
    return null;
  }

  if (order.paymentStatus === "Pending") {
    order.paymentStatus = "Failed";
    order.status = "Payment Failed";
    order.trackingHistory.push({
      status: "Payment Failed",
      date: new Date(),
      location: order.shippingAddress?.city || "Hub",
      description: "Payment was declined, failed, or cancelled."
    });
    await order.save();
    console.log(`ℹ️ Order ${order._id} marked as Payment Failed.`);
  }
  return order;
};

// @desc    Mark payment as failed if cancelled or declined on client
// @route   POST /api/payments/mark-failed
// @access  Private
export const markPaymentFailed = async (req, res) => {
  try {
    const { orderId, razorpayOrderId } = req.body;
    if (!orderId && !razorpayOrderId) {
      return res.status(400).json({ message: "Order ID or Razorpay Order ID is required" });
    }

    const order = await failOrder(razorpayOrderId, orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order payment marked as failed", orderId: order._id });
  } catch (error) {
    console.error("❌ Error marking payment as failed:", error);
    res.status(500).json({ message: "Failed to mark payment as failed", error: error.message });
  }
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, couponCode, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({ message: "Invalid shipping address" });
    }

    // 1. Validate Product Stock and get correct database prices (Secure Server-Side Flow)
    const recalculatedOrderItems = [];
    let subtotal = 0;

    for (const item of orderItems) {
      const productDoc = await findProductByIdOrCode(item.product || item.id);
      if (!productDoc) return res.status(404).json({ message: `Product "${item.name}" not found.` });
      if (productDoc.countInStock < item.quantity) {
        return res.status(400).json({ message: `Cannot place order. Requested quantity (${item.quantity}) for "${item.name}" exceeds available stock (${productDoc.countInStock}).` });
      }

      // Lock DB price to prevent client side modification
      const actualPrice = productDoc.price;
      subtotal += actualPrice * item.quantity;

      recalculatedOrderItems.push({
        product: productDoc._id,
        id: String(productDoc.id),
        name: productDoc.name,
        quantity: item.quantity,
        image: productDoc.image || item.image,
        price: actualPrice
      });
    }

    // 2. Calculate Totals
    const delivery = subtotal > 999 ? 0 : 99;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      appliedCoupon = await Coupon.findOne({ code: cleanCode });

      if (!appliedCoupon || !appliedCoupon.isActive) {
        return res.status(400).json({ message: `Invalid or inactive coupon code "${cleanCode}".` });
      }
      if (new Date() > new Date(appliedCoupon.expiry)) {
        return res.status(400).json({ message: `Coupon "${cleanCode}" has expired.` });
      }
      if (appliedCoupon.usedCount >= appliedCoupon.usageLimit) {
        return res.status(400).json({ message: `Coupon "${cleanCode}" has reached its maximum usage limit.` });
      }
      if (subtotal < appliedCoupon.minimumOrder) {
        return res.status(400).json({ message: `Minimum order amount of ₹${appliedCoupon.minimumOrder} required for coupon "${cleanCode}".` });
      }

      if (appliedCoupon.discountType === "percentage") {
        discountAmount = Math.round((subtotal * appliedCoupon.discount) / 100);
      } else {
        discountAmount = Math.min(subtotal, appliedCoupon.discount);
      }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount + delivery);

    // 3. Create Razorpay Order
    const finalAmountInPaise = Math.round(finalTotal * 100);
    if (finalAmountInPaise < 100) {
      return res.status(400).json({ message: "Order amount must be at least ₹1.00 for online payments." });
    }

    const razorpay = getRazorpay();
    const options = {
      amount: finalAmountInPaise, // Razorpay requires integer amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${req.user._id.toString().substring(0, 5)}`
    };

    console.log("📦 Creating Razorpay order with options:", { amount: options.amount, currency: options.currency, receipt: options.receipt });
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", razorpayOrder.id);

    // 4. Create MongoDB Order in Pending Status
    const initialTracking = [{
      status: "Payment Pending",
      date: new Date(),
      location: "System",
      description: "Awaiting online payment confirmation."
    }];

    const newOrder = new Order({
      user: req.user._id,
      orderItems: recalculatedOrderItems,
      shippingAddress,
      paymentMethod: paymentMethod || "ONLINE",
      paymentStatus: "Pending",
      status: "Payment Pending",
      totalAmount: finalTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : "",
      discountAmount,
      razorpayOrderId: razorpayOrder.id,
      trackingHistory: initialTracking
    });

    const savedOrder = await newOrder.save();

    // 5. Return both Razorpay details and Mongo order ID
    res.status(201).json({
      orderId: savedOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: (process.env.RAZORPAY_KEY_ID || "").trim().replace(/^["']|["']$/g, "")
    });
  } catch (error) {
    const errorDetail =
      error.error?.description ||
      (typeof error.error === "string" ? error.error : null) ||
      error.error?.code ||
      error.description ||
      error.message ||
      (typeof error === "string" ? error : (error ? JSON.stringify(error) : "Unknown payment error"));

    console.error("❌ Error creating Razorpay order:", {
      message: error.message,
      statusCode: error.statusCode,
      name: error.name,
      code: error.code || error.error?.code,
      description: errorDetail,
      stack: error.stack
    });

    if (error.message?.includes("credentials are not configured")) {
      return res.status(500).json({ message: "Payment gateway is not configured. Please contact support." });
    }

    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    res.status(statusCode).json({
      message: "Failed to initiate payment",
      error: errorDetail,
      code: error.error?.code || error.code || error.name || null
    });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: "Missing payment verification parameters." });
    }

    // 1. Verify HMAC Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error("❌ RAZORPAY_KEY_SECRET is missing — cannot verify payment signature.");
      return res.status(500).json({ message: "Payment gateway is not configured. Please contact support." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment signature verification failed. Possible tampering." });
    }

    // 2. Fulfill Order Idempotently
    // Note: razorpay.payments.fetch() is unreliable in test mode (mock payment IDs return 404).
    // The webhook handler already captures the real method from the event payload.
    // For the verify path, we keep the order's existing paymentMethod (stored as "ONLINE").
    const order = await fulfillOrder(razorpay_order_id, razorpay_payment_id, orderId, null);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ message: "Payment verified successfully", orderId: order._id });
  } catch (error) {
    console.error("❌ Error verifying payment:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};

// @desc    Retry Razorpay Payment for existing order
// @route   POST /api/payments/retry-payment
// @access  Private
export const retryRazorpayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    // 1. Verify Stock is still available
    for (const item of order.orderItems) {
      const productDoc = await findProductByIdOrCode(item.product || item.id);
      if (!productDoc) return res.status(404).json({ message: `Product "${item.name}" not found.` });
      if (productDoc.countInStock < item.quantity) {
        return res.status(400).json({ message: `Cannot place order. Requested quantity (${item.quantity}) for "${item.name}" exceeds available stock (${productDoc.countInStock}).` });
      }
    }

    // 2. Create a new Razorpay Order for the same amount in paise
    const razorpay = getRazorpay();
    const options = {
      amount: Math.round(order.totalAmount * 100), // Razorpay works in paise
      currency: "INR",
      receipt: `rcpt_rt_${Date.now().toString().slice(-8)}_${req.user._id.toString().substring(0, 4)}`,
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      }
    };

    console.log("📦 Creating retry Razorpay order with options:", { amount: options.amount, currency: options.currency, receipt: options.receipt });
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("✅ Retry Razorpay order created:", razorpayOrder.id);

    // Update order with the new Razorpay Order ID (keeps single customer order)
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "Pending";
    order.status = "Payment Pending";
    await order.save();

    res.status(200).json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("❌ Error retrying Razorpay payment:", error);
    res.status(500).json({ message: "Failed to initiate payment retry", error: error.message });
  }
};

// @desc    Handle Razorpay Webhook Event
// @route   POST /api/payments/webhook
// @access  Public (Signature Checked)
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("❌ RAZORPAY_WEBHOOK_SECRET is missing.");
      return res.status(500).json({ message: "Webhook secret not configured" });
    }

    if (!signature) {
      console.warn("⚠️ Webhook missing x-razorpay-signature header");
      return res.status(400).json({ message: "Missing x-razorpay-signature header" });
    }

    const rawPayload = req.rawBody ? req.rawBody.toString("utf8") : (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

    if (!rawPayload) {
      console.warn("⚠️ Webhook raw body missing");
      return res.status(400).json({ message: "Missing raw request body" });
    }

    const isValid = Razorpay.validateWebhookSignature(
      rawPayload,
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.warn("⚠️ Invalid webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = typeof req.body === "object" ? req.body : JSON.parse(rawPayload);
    console.log(`✉️ Received Webhook Event: ${event.event}`);

    if (event.event === "order.paid") {
      const razorpayOrderId = event.payload?.order?.entity?.id;
      const razorpayPaymentId = event.payload?.payment?.entity?.id || "";
      const webhookMethod = event.payload?.payment?.entity?.method;
      const methodMap = { card: "Razorpay (Card)", wallet: "Razorpay (Wallet)", upi: "Razorpay (UPI)", netbanking: "Razorpay (Net Banking)", emi: "Razorpay (EMI)", paylater: "Razorpay (Pay Later)" };
      const razorpayMethod = webhookMethod ? (methodMap[webhookMethod] || `Razorpay (${webhookMethod})`) : null;
      if (razorpayOrderId) {
        await fulfillOrder(razorpayOrderId, razorpayPaymentId, null, razorpayMethod);
      }
    } else if (event.event === "payment.captured") {
      const razorpayOrderId = event.payload?.payment?.entity?.order_id;
      const razorpayPaymentId = event.payload?.payment?.entity?.id || "";
      const webhookMethod = event.payload?.payment?.entity?.method;
      const methodMap = { card: "Razorpay (Card)", wallet: "Razorpay (Wallet)", upi: "Razorpay (UPI)", netbanking: "Razorpay (Net Banking)", emi: "Razorpay (EMI)", paylater: "Razorpay (Pay Later)" };
      const razorpayMethod = webhookMethod ? (methodMap[webhookMethod] || `Razorpay (${webhookMethod})`) : null;
      if (razorpayOrderId) {
        await fulfillOrder(razorpayOrderId, razorpayPaymentId, null, razorpayMethod);
      }
    } else if (event.event === "payment.failed") {
      const razorpayOrderId = event.payload?.payment?.entity?.order_id;
      if (razorpayOrderId) {
        await failOrder(razorpayOrderId);
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ message: "Webhook handler failed", error: error.message });
  }
};

