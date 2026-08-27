import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import Coupon from "../models/Coupon.js";

// Helper for date ranges
const getDateNDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thirtyDaysAgo = getDateNDaysAgo(30);
    const sixtyDaysAgo = getDateNDaysAgo(60);

    // Total Users
    const totalUsers = await User.countDocuments({ role: "user" });
    const usersLast30 = await User.countDocuments({ role: "user", createdAt: { $gte: thirtyDaysAgo } });
    const usersPrev30 = await User.countDocuments({ role: "user", createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    // Products
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ countInStock: { $gt: 0, $lte: 10 } });
    const outOfStockProducts = await Product.countDocuments({ countInStock: 0 });

    // Orders
    const allOrders = await Order.find();
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length;
    const deliveredOrders = allOrders.filter(o => o.status === "Delivered").length;
    const cancelledOrders = allOrders.filter(o => o.status === "Cancelled").length;
    
    // Revenue
    const validOrders = allOrders.filter(o => o.status !== "Cancelled");
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const todayOrders = validOrders.filter(o => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const yesterdayOrders = validOrders.filter(o => new Date(o.createdAt) >= yesterday && new Date(o.createdAt) < today);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const revenueLast30 = validOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const revenuePrev30 = validOrders.filter(o => new Date(o.createdAt) >= sixtyDaysAgo && new Date(o.createdAt) < thirtyDaysAgo).reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      todayRevenue: {
        value: todayRevenue,
        previous: yesterdayRevenue
      },
      totalRevenue: {
        value: totalRevenue,
        last30: revenueLast30,
        prev30: revenuePrev30
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders
      },
      users: {
        total: totalUsers,
        last30: usersLast30,
        prev30: usersPrev30
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

// @desc    Get revenue chart data
// @route   GET /api/admin/charts/revenue
// @access  Private/Admin
export const getRevenueChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = getDateNDaysAgo(days);

    const orders = await Order.find({ createdAt: { $gte: startDate }, status: { $ne: "Cancelled" } });
    
    const dataMap = {};
    for (let i = 0; i < days; i++) {
      const d = getDateNDaysAgo(days - 1 - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
      if (dataMap[dateStr]) {
        dataMap[dateStr].revenue += (o.totalAmount || 0);
        dataMap[dateStr].orders += 1;
      }
    });

    res.json(Object.values(dataMap));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch revenue chart data" });
  }
};

// @desc    Get orders chart data
// @route   GET /api/admin/charts/orders
// @access  Private/Admin
export const getOrdersChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = getDateNDaysAgo(days);

    const orders = await Order.find({ createdAt: { $gte: startDate } });
    
    const dataMap = {};
    for (let i = 0; i < days; i++) {
      const d = getDateNDaysAgo(days - 1 - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap[dateStr] = { date: dateStr, count: 0 };
    }

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
      if (dataMap[dateStr]) {
        dataMap[dateStr].count += 1;
      }
    });

    res.json(Object.values(dataMap));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders chart data" });
  }
};

// @desc    Get new users chart data
// @route   GET /api/admin/charts/users
// @access  Private/Admin
export const getNewUsersChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = getDateNDaysAgo(days);

    const users = await User.find({ createdAt: { $gte: startDate }, role: "user" });
    
    const dataMap = {};
    for (let i = 0; i < days; i++) {
      const d = getDateNDaysAgo(days - 1 - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap[dateStr] = { date: dateStr, count: 0 };
    }

    users.forEach(u => {
      const dateStr = new Date(u.createdAt).toISOString().split('T')[0];
      if (dataMap[dateStr]) {
        dataMap[dateStr].count += 1;
      }
    });

    res.json(Object.values(dataMap));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users chart data" });
  }
};

// @desc    Get sales by category
// @route   GET /api/admin/charts/categories
// @access  Private/Admin
export const getSalesByCategory = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "Cancelled" } }).populate('orderItems.product');
    
    const categoryMap = {};
    
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        let category = "Unknown";
        if (item.product && item.product.category) {
            category = item.product.category;
        } else if (item.category) {
            category = item.category;
        }

        if (!categoryMap[category]) {
          categoryMap[category] = { category, revenue: 0, units: 0 };
        }
        categoryMap[category].revenue += (item.price * item.quantity);
        categoryMap[category].units += item.quantity;
      });
    });

    res.json(Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category sales" });
  }
};

// @desc    Get payment method distribution
// @route   GET /api/admin/charts/payments
// @access  Private/Admin
export const getPaymentMethodDistribution = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "Cancelled" } });
    
    const paymentMap = {};
    
    orders.forEach(order => {
      const method = order.paymentMethod || "COD";
      if (!paymentMap[method]) {
        paymentMap[method] = { method, count: 0, revenue: 0 };
      }
      paymentMap[method].count += 1;
      paymentMap[method].revenue += (order.totalAmount || 0);
    });

    res.json(Object.values(paymentMap));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment distribution" });
  }
};

// @desc    Get top selling products
// @route   GET /api/admin/top-products
// @access  Private/Admin
export const getTopSellingProducts = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "Cancelled" } }).populate('orderItems.product');
    
    const productMap = {};
    
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const p = item.product;
        if (!p) return;
        
        const id = p._id.toString();
        if (!productMap[id]) {
          productMap[id] = {
            id,
            name: p.name,
            image: p.image,
            category: p.category,
            countInStock: p.countInStock,
            averageRating: p.averageRating,
            units: 0,
            revenue: 0
          };
        }
        productMap[id].units += item.quantity;
        productMap[id].revenue += (item.price * item.quantity);
      });
    });

    const sortedProducts = Object.values(productMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 10);

    res.json(sortedProducts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch top selling products" });
  }
};

// @desc    Get recent orders
// @route   GET /api/admin/recent-orders
// @access  Private/Admin
export const getRecentOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = {};
    if (status && status !== "All") {
      query.status = status;
    }
    
    // We fetch and populate, then filter by search locally if needed for customer name/email, 
    // or we could use $lookup for more complex queries. For simplicity:
    let orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 first
      
    if (search) {
      const lowerSearch = search.toLowerCase();
      orders = orders.filter(o => 
        (o._id.toString().toLowerCase().includes(lowerSearch)) ||
        (o.shippingAddress?.name?.toLowerCase().includes(lowerSearch)) ||
        (o.user?.email?.toLowerCase().includes(lowerSearch))
      );
    }

    res.json(orders.slice(0, 10)); // return top 10 matching
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recent orders" });
  }
};

// @desc    Get inventory alerts (low stock)
// @route   GET /api/admin/inventory-alerts
// @access  Private/Admin
export const getInventoryAlerts = async (req, res) => {
  try {
    const products = await Product.find({ countInStock: { $lte: 10 } })
      .sort({ countInStock: 1 })
      .limit(20);
      
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory alerts" });
  }
};

// ==========================================
// NEW ADMIN USERS CONTROLLERS
// ==========================================

export const getAdminUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { role: "user" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "blocked") {
      query.isBlocked = true;
    } else if (status === "active") {
      query.isBlocked = { $ne: true };
    }

    const totalFilteredUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const userIds = users.map(u => u._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds }, status: { $ne: "Cancelled" } } },
      { $group: { _id: "$user", count: { $sum: 1 }, totalSpent: { $sum: "$totalAmount" } } }
    ]);

    const statsMap = {};
    orderStats.forEach(s => {
      statsMap[s._id.toString()] = s;
    });

    const populatedUsers = users.map(u => {
      const stats = statsMap[u._id.toString()] || { count: 0, totalSpent: 0 };
      return {
        ...u.toObject(),
        ordersCount: stats.count,
        totalSpent: stats.totalSpent
      };
    });

    const totalUsers = await User.countDocuments({ role: "user" });
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await User.countDocuments({ role: "user", createdAt: { $gte: startOfMonth } });
    const activeUsers = await User.countDocuments({ role: "user", isBlocked: { $ne: true } });
    const blockedUsers = await User.countDocuments({ role: "user", isBlocked: true });

    res.json({
      users: populatedUsers,
      totalPages: Math.ceil(totalFilteredUsers / parseInt(limit)),
      currentPage: parseInt(page),
      totalResults: totalFilteredUsers,
      kpis: {
        total: totalUsers,
        newThisMonth,
        active: activeUsers,
        blocked: blockedUsers
      }
    });
  } catch (error) {
    console.error("Error in getAdminUsers:", error);
    res.status(500).json({ message: "Failed to fetch admin users" });
  }
};

export const getAdminUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otp -otpExpires");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });

    res.json({
      user,
      orders
    });
  } catch (error) {
    console.error("Error in getAdminUserById:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);
    if (!userToBlock) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userToBlock.role === "admin") {
      return res.status(400).json({ message: "Cannot block an admin account" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select("-password");
    
    res.json({ message: "User blocked successfully", user });
  } catch (error) {
    console.error("Error in blockUser:", error);
    res.status(500).json({ message: "Failed to block user" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userToUnblock = await User.findById(req.params.id);
    if (!userToUnblock) {
      return res.status(404).json({ message: "User not found" });
    }
    if (userToUnblock.role === "admin") {
      return res.status(400).json({ message: "Cannot unblock an admin account" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    ).select("-password");
    
    res.json({ message: "User unblocked successfully", user });
  } catch (error) {
    console.error("Error in unblockUser:", error);
    res.status(500).json({ message: "Failed to unblock user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete an admin account" });
    }
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// ==========================================
// NEW ADMIN REVIEWS CONTROLLERS
// ==========================================

export const getAdminReviews = async (req, res) => {
  try {
    const { search, rating, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (rating) filter.rating = Number(rating);

    if (search) {
      const userQuery = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
      const productQuery = await Product.find({ name: { $regex: search, $options: "i" } }).select("_id");
      const userIds = userQuery.map(u => u._id);
      const productIds = productQuery.map(p => p._id);
      filter.$or = [
        { comment: { $regex: search, $options: "i" } },
        { user: { $in: userIds } },
        { product: { $in: productIds } }
      ];
    }

    const totalFilteredReviews = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate("user", "name email profilePicture")
      .populate("product", "name image category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments();
    const avg = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);
    const averageRating = avg.length > 0 ? parseFloat(avg[0].avgRating.toFixed(1)) : 0;

    const counts = await Review.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } }
    ]);
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    counts.forEach(c => {
      if (ratingCounts[c._id] !== undefined) ratingCounts[c._id] = c.count;
    });

    res.json({
      reviews,
      totalPages: Math.ceil(totalFilteredReviews / parseInt(limit)),
      currentPage: parseInt(page),
      totalResults: totalFilteredReviews,
      kpis: {
        totalReviews,
        averageRating,
        ratingCounts
      }
    });
  } catch (error) {
    console.error("Error in getAdminReviews:", error);
    res.status(500).json({ message: "Failed to fetch admin reviews" });
  }
};

export const toggleHideReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    review.isHidden = !review.isHidden;
    await review.save();
    res.json({ message: `Review ${review.isHidden ? 'hidden' : 'made visible'} successfully`, review });
  } catch (error) {
    console.error("Error in toggleHideReview:", error);
    res.status(500).json({ message: "Failed to toggle review visibility" });
  }
};

export const deleteAdminReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    await review.deleteOne();
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAdminReview:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
};

// ==========================================
// NEW ADMIN COUPONS CONTROLLERS
// ==========================================

export const getAdminCoupons = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query.code = { $regex: search, $options: "i" };
    }

    if (status === "active") {
      query.isActive = true;
      query.expiry = { $gt: new Date() };
    } else if (status === "expired") {
      query.expiry = { $lte: new Date() };
    } else if (status === "inactive") {
      query.isActive = false;
    }

    const totalFilteredCoupons = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true, expiry: { $gt: new Date() } });
    const expiredCoupons = await Coupon.countDocuments({ expiry: { $lte: new Date() } });
    
    const usageSum = await Coupon.aggregate([
      { $group: { _id: null, total: { $sum: "$usedCount" } } }
    ]);
    const totalUsage = usageSum.length > 0 ? usageSum[0].total : 0;

    const discountSum = await Order.aggregate([
      { $match: { couponCode: { $ne: "" }, status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$discountAmount" } } }
    ]);
    const totalDiscount = discountSum.length > 0 ? discountSum[0].total : 0;

    res.json({
      coupons,
      totalPages: Math.ceil(totalFilteredCoupons / parseInt(limit)),
      currentPage: parseInt(page),
      totalResults: totalFilteredCoupons,
      kpis: {
        total: totalCoupons,
        active: activeCoupons,
        expired: expiredCoupons,
        totalUsage,
        totalDiscount
      }
    });
  } catch (error) {
    console.error("Error in getAdminCoupons:", error);
    res.status(500).json({ message: "Failed to fetch admin coupons" });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, discount, discountType, expiry, minimumOrder, usageLimit, description } = req.body;
    if (!code || !discount || !expiry) {
      return res.status(400).json({ message: "Code, discount, and expiry are required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }

    const coupon = new Coupon({
      code: cleanCode,
      discount: Number(discount),
      discountType: discountType || "percentage",
      expiry: new Date(expiry),
      minimumOrder: Number(minimumOrder) || 0,
      usageLimit: Number(usageLimit) || 100,
      description: description || ""
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error) {
    console.error("Error in createCoupon:", error);
    res.status(500).json({ message: "Failed to create coupon", error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { code, discount, discountType, expiry, minimumOrder, usageLimit, description, isActive } = req.body;
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (code) {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: cleanCode });
        if (existing) {
          return res.status(400).json({ message: "Coupon code already exists." });
        }
        coupon.code = cleanCode;
      }
    }

    if (discount !== undefined) coupon.discount = Number(discount);
    if (discountType) coupon.discountType = discountType;
    if (expiry) coupon.expiry = new Date(expiry);
    if (minimumOrder !== undefined) coupon.minimumOrder = Number(minimumOrder);
    if (usageLimit !== undefined) coupon.usageLimit = Number(usageLimit);
    if (description !== undefined) coupon.description = description;
    if (isActive !== undefined) coupon.isActive = isActive;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } catch (error) {
    console.error("Error in updateCoupon:", error);
    res.status(500).json({ message: "Failed to update coupon" });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    await coupon.deleteOne();
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error in deleteCoupon:", error);
    res.status(500).json({ message: "Failed to delete coupon" });
  }
};

export const toggleActiveCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`, coupon });
  } catch (error) {
    console.error("Error in toggleActiveCoupon:", error);
    res.status(500).json({ message: "Failed to toggle coupon status" });
  }
};

export const getCouponPerformance = async (req, res) => {
  try {
    const orderStats = await Order.aggregate([
      { $match: { couponCode: { $ne: "" }, status: { $ne: "Cancelled" } } },
      { $group: { 
          _id: "$couponCode", 
          usageCount: { $sum: 1 }, 
          revenueGenerated: { $sum: "$totalAmount" }, 
          discountGiven: { $sum: "$discountAmount" } 
      } }
    ]);

    const coupons = await Coupon.find();
    const performance = coupons.map(c => {
      const stats = orderStats.find(s => s._id.toUpperCase() === c.code.toUpperCase()) || {
        usageCount: 0,
        revenueGenerated: 0,
        discountGiven: 0
      };
      return {
        _id: c._id,
        code: c.code,
        discount: c.discount,
        discountType: c.discountType,
        expiry: c.expiry,
        isActive: c.isActive,
        usedCount: c.usedCount,
        realUsageCount: stats.usageCount,
        revenueGenerated: stats.revenueGenerated,
        discountGiven: stats.discountGiven
      };
    });

    res.json(performance);
  } catch (error) {
    console.error("Error in getCouponPerformance:", error);
    res.status(500).json({ message: "Failed to fetch coupon performance metrics" });
  }
};
