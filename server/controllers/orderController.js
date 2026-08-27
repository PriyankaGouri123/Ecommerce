import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { sendOtpEmail, sendPasswordChangedEmail, sendOrderPlacedEmail, sendOrderCancelledEmail, sendOrderStatusEmail, sendOrderShippedEmail, sendOrderDeliveredEmail } from "../config/emailService.js";
// @desc    Get all orders (Admin only)
// @route   GET /api/orders/all
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items provided" });
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({ message: "Invalid shipping address" });
    }

    const initialTracking = [
      {
        status: "Order Placed",
        date: new Date(),
        location: shippingAddress.city || "Hub",
        description: "Your order has been placed successfully."
      }
    ];

    // Validate and check product stock availability
    for (const item of orderItems) {
      const productId = item.product || item.id;
      const productDoc = await Product.findOne({
        $or: [
          { _id: typeof productId === "string" && productId.length === 24 ? productId : null },
          { id: typeof productId === "number" ? productId : (isNaN(Number(productId)) ? null : Number(productId)) }
        ].filter(Boolean)
      });

      if (!productDoc) {
        return res.status(404).json({ message: `Product "${item.name}" not found.` });
      }

      if (productDoc.countInStock < item.quantity) {
        return res.status(400).json({
          message: `Cannot place order. Requested quantity (${item.quantity}) for "${item.name}" exceeds available stock (${productDoc.countInStock}).`
        });
      }
    }

    // Calculate subtotal & delivery charges server-side
    const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const delivery = subtotal > 999 ? 0 : 99;

    let discountAmount = 0;
    let appliedCoupon = null;

    // Server-side Coupon Re-validation (Never trust frontend discount)
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
        return res.status(400).json({
          message: `Minimum order amount of ₹${appliedCoupon.minimumOrder} required for coupon "${cleanCode}".`
        });
      }

      // Calculate server-side discount
      if (appliedCoupon.discountType === "percentage") {
        discountAmount = Math.round((subtotal * appliedCoupon.discount) / 100);
      } else {
        discountAmount = Math.min(subtotal, appliedCoupon.discount);
      }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount + delivery);

    // Deduct product stock
    for (const item of orderItems) {
      const productId = item.product || item.id;
      await Product.updateOne(
        {
          $or: [
            { _id: typeof productId === "string" && productId.length === 24 ? productId : null },
            { id: typeof productId === "number" ? productId : (isNaN(Number(productId)) ? null : Number(productId)) }
          ].filter(Boolean)
        },
        { $inc: { countInStock: -item.quantity } }
      );
    }

    // Atomically increment coupon usedCount if coupon applied
    if (appliedCoupon) {
      await Coupon.updateOne({ _id: appliedCoupon._id }, { $inc: { usedCount: 1 } });
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: "COD", // Force COD for this route, online payments go through /api/payments
      paymentStatus: "COD",
      totalAmount: finalTotal,
      couponCode: appliedCoupon ? appliedCoupon.code : "",
      discountAmount,
      status: "Order Placed",
      trackingHistory: initialTracking
    });

    const createdOrder = await order.save();

    // Send order placed email (non‑blocking, log errors only)
    if (req.user.email) {
      try {
        await sendOrderPlacedEmail(req.user.email, createdOrder);
      } catch (emailErr) {
        console.error('Failed to send order placed email:', emailErr);
      }
    }

    // Clear user's MongoDB cart after order is placed
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

// @desc    Get order by ID (Only owner can access)
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Access control check: user must own the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied: You cannot view another user's order" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
};

// @desc    Get order tracking status (Only owner can access)
// @route   GET /api/orders/:id/tracking
// @access  Private
export const getOrderTracking = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Access control check: user must own the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied: You cannot view another user's order tracking" });
    }

    res.json({
      orderId: order._id,
      status: order.status,
      trackingHistory: order.trackingHistory || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Failed to fetch tracking data", error: error.message });
  }
};
// @desc    Cancel an order (Only owner can cancel if not already Delivered or Cancelled)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Access control check: user must own the order or be an admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: You cannot cancel another user's order" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Cannot cancel a delivered order" });
    }

    // Restore inventory stock
    for (const item of order.orderItems) {
      const productId = item.product || item.id;
      await Product.updateOne(
        {
          $or: [
            { _id: typeof productId === "string" && productId.length === 24 ? productId : null },
            { id: typeof productId === "number" ? productId : (isNaN(Number(productId)) ? null : Number(productId)) }
          ].filter(Boolean)
        },
        { $inc: { countInStock: item.quantity } }
      );
    }

    // Update order status
    order.status = "Cancelled";
    order.trackingHistory.push({
      status: "Cancelled",
      date: new Date(),
      location: order.shippingAddress?.city || "Hub",
      description: "The order has been cancelled by the customer. Stock returned to inventory."
    });

    const updatedOrder = await order.save();

    // Notify user about cancellation
    try {
      await sendOrderCancelledEmail(req.user.email, updatedOrder);
    } catch (emailErr) {
      console.error('Failed to send order cancelled email:', emailErr);
    }
    // Also send generic status update (optional)
    try {
      await sendOrderStatusEmail(req.user.email, updatedOrder._id, updatedOrder.status);
    } catch (emailErr) {
      console.error('Failed to send order status email:', emailErr);
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error cancelling order:", error);
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(500).json({ message: "Failed to cancel order", error: error.message });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: You cannot update another user\'s order' });
    }
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      return res.status(400).json({ message: `Cannot update status of a ${order.status} order` });
    }
    order.status = status;
    order.trackingHistory.push({
      status,
      date: new Date(),
      location: order.shippingAddress?.city || 'Hub',
      description: `Order status updated to ${status}`
    });
    const updatedOrder = await order.save();
    
    // Send status update email
    try {
      await sendOrderStatusEmail(req.user.email, updatedOrder._id, updatedOrder.status);
    } catch (emailErr) {
      console.error('Failed to send order status email:', emailErr);
    }
    
    // Send shipped or delivered specific emails
    if (status === 'Shipped') {
      try {
        await sendOrderShippedEmail(req.user.email, updatedOrder);
      } catch (emailErr) {
        console.error('Failed to send order shipped email:', emailErr);
      }
    } else if (status === 'Delivered') {
      try {
        await sendOrderDeliveredEmail(req.user.email, updatedOrder);
      } catch (emailErr) {
        console.error('Failed to send order delivered email:', emailErr);
      }
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};
