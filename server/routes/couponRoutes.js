import express from "express";
import { validateCoupon, getPublicCoupons } from "../controllers/couponController.js";

const router = express.Router();

// GET active coupons
router.get("/", getPublicCoupons);

// POST validate coupon code
router.post("/validate", validateCoupon);

export default router;
