import Coupon from "../models/Coupon.js";

// @desc    Validate coupon code against subtotal
// @route   POST /api/coupons/validate
// @access  Public / Private
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ message: "Invalid or inactive coupon code" });
    }

    // Check expiration date
    if (new Date() > new Date(coupon.expiry)) {
      return res.status(400).json({ message: "This coupon code has expired" });
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "This coupon has reached its maximum usage limit" });
    }

    // Check minimum order subtotal requirement
    const orderSubtotal = Number(subtotal) || 0;
    if (orderSubtotal < coupon.minimumOrder) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minimumOrder} required to use coupon "${coupon.code}".`
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((orderSubtotal * coupon.discount) / 100);
    } else {
      discountAmount = Math.min(orderSubtotal, coupon.discount);
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount: coupon.discount,
      discountType: coupon.discountType,
      discountAmount,
      minimumOrder: coupon.minimumOrder,
      description: coupon.description || `${coupon.discountType === 'percentage' ? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`}`
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Failed to validate coupon", error: error.message });
  }
};

// @desc    Get all available active coupons
// @route   GET /api/coupons
// @access  Public
export const getPublicCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiry: { $gt: new Date() },
      $expr: { $lt: ["$usedCount", "$usageLimit"] }
    }).select("code discount discountType minimumOrder description expiry");

    res.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Failed to fetch coupons", error: error.message });
  }
};
