import express from "express";
import {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Must be before /:id routes
router.route("/my").get(protect, getMyReviews);

router.route("/").post(protect, createReview);

router.route("/product/:productId").get(getProductReviews);

router.route("/:id")
  .put(protect, updateReview)
  .delete(protect, deleteReview);

export default router;
