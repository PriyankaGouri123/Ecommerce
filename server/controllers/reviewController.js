import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";

// Max 5 photos, each up to ~5MB base64 (about 6.6MB raw)
const MAX_PHOTOS = 5;

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
  try {
    const { product, order: orderId, rating, comment, photos } = req.body;

    if (!product || !orderId || !rating) {
      return res.status(400).json({ message: "Product, order, and rating are required." });
    }

    // Validate photos if provided
    if (photos && (!Array.isArray(photos) || photos.length > MAX_PHOTOS)) {
      return res.status(400).json({ message: `You can upload at most ${MAX_PHOTOS} photos.` });
    }

    // 1. Verify that the order exists, belongs to the user, and is Delivered
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to review this order." });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "You can only review delivered products." });
    }

    // 2. Verify that the product is actually in this order
    const hasProduct = order.orderItems.some((item) => {
      const itemId = item.product || item._id || item.id;
      return itemId && itemId.toString() === product.toString();
    });

    if (!hasProduct) {
      return res.status(400).json({ message: "Product was not found in this order." });
    }

    // 3. Prevent duplicate reviews (user + product)
    const existingReview = await Review.findOne({ user: req.user._id, product });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product." });
    }

    // Create the review
    const review = new Review({
      user: req.user._id,
      product,
      order: orderId,
      rating: Number(rating),
      comment: comment || "",
      photos: photos || [],
    });

    const createdReview = await review.save();
    res.status(201).json(createdReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Failed to create review", error: error.message });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.productId)) {
      return res.status(404).json({ message: "Product not found" });
    }
    const reviews = await Review.find({ product: req.params.productId, isHidden: { $ne: true } })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

// @desc    Get the current user's reviews (keyed by productId)
// @route   GET /api/reviews/my
// @access  Private
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id });
    // Return as a map: { productId: review }
    const map = {};
    for (const r of reviews) {
      map[r.product.toString()] = r;
    }
    res.json(map);
  } catch (error) {
    console.error("Error fetching my reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res) => {
  try {
    const { rating, comment, photos } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Review not found." });
    }
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own review." });
    }

    if (photos && (!Array.isArray(photos) || photos.length > MAX_PHOTOS)) {
      return res.status(400).json({ message: `You can upload at most ${MAX_PHOTOS} photos.` });
    }

    if (rating) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;
    if (photos !== undefined) review.photos = photos;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Failed to update review", error: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Review not found." });
    }
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own review." });
    }

    await review.deleteOne();
    res.json({ message: "Review removed successfully." });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};
