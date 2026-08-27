import express from "express";
import {
  getAllOrders,
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  cancelOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/all").get(protect, admin, getAllOrders);

router.route("/")
  .post(protect, createOrder)
  .get(protect, getMyOrders);

router.route("/:id")
  .get(protect, getOrderById);

router.route("/:id/cancel")
  .put(protect, cancelOrder);

router.route("/:id/tracking")
  .get(protect, getOrderTracking);

// Route to update order status
router.route("/:id/status")
  .patch(protect, updateOrderStatus);

export default router;
