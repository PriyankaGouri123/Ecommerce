import express from "express";
import { createRazorpayOrder, verifyPayment, retryRazorpayPayment, handleWebhook, markPaymentFailed } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/create-order").post(protect, createRazorpayOrder);
router.route("/verify").post(protect, verifyPayment);
router.route("/retry-payment").post(protect, retryRazorpayPayment);
router.route("/mark-failed").post(protect, markPaymentFailed);
router.route("/webhook").post(handleWebhook);

export default router;
