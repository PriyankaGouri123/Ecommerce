import express from "express";
import { 
  getAdminStats, 
  getRevenueChart, 
  getOrdersChart, 
  getNewUsersChart, 
  getSalesByCategory, 
  getPaymentMethodDistribution, 
  getTopSellingProducts, 
  getRecentOrders, 
  getInventoryAlerts,
  getAdminUsers,
  getAdminUserById,
  blockUser,
  unblockUser,
  deleteUser,
  getAdminReviews,
  toggleHideReview,
  deleteAdminReview,
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleActiveCoupon,
  getCouponPerformance
} from "../controllers/adminController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/stats").get(protect, admin, getAdminStats);
router.route("/charts/revenue").get(protect, admin, getRevenueChart);
router.route("/charts/orders").get(protect, admin, getOrdersChart);
router.route("/charts/users").get(protect, admin, getNewUsersChart);
router.route("/charts/categories").get(protect, admin, getSalesByCategory);
router.route("/charts/payments").get(protect, admin, getPaymentMethodDistribution);
router.route("/top-products").get(protect, admin, getTopSellingProducts);
router.route("/recent-orders").get(protect, admin, getRecentOrders);
router.route("/inventory-alerts").get(protect, admin, getInventoryAlerts);

// Users Management
router.route("/users").get(protect, admin, getAdminUsers);
router.route("/users/:id")
  .get(protect, admin, getAdminUserById)
  .delete(protect, admin, deleteUser);
router.route("/users/:id/block").put(protect, admin, blockUser);
router.route("/users/:id/unblock").put(protect, admin, unblockUser);

// Reviews Management
router.route("/reviews").get(protect, admin, getAdminReviews);
router.route("/reviews/:id/toggle-hide").put(protect, admin, toggleHideReview);
router.route("/reviews/:id").delete(protect, admin, deleteAdminReview);

// Coupons Management
router.route("/coupons").get(protect, admin, getAdminCoupons).post(protect, admin, createCoupon);
router.route("/coupons/performance").get(protect, admin, getCouponPerformance);
router.route("/coupons/:id")
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);
router.route("/coupons/:id/toggle-active").put(protect, admin, toggleActiveCoupon);

export default router;
