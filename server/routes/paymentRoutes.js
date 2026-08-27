import express from "express";
import { createRazorpayOrder, verifyPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/create-order").post(protect, createRazorpayOrder);
router.route("/verify").post(protect, verifyPayment);

export default router;
