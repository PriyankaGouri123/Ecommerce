import Wishlist from "../models/Wishlist.js";
import mongoose from "mongoose";

const isValidObjectId = (val) =>
  typeof val === "string" &&
  mongoose.Types.ObjectId.isValid(val) &&
  String(new mongoose.Types.ObjectId(val)) === val;

// @desc    Get current user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.json(wishlist.products || []);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Failed to fetch wishlist", error: error.message });
  }
};

// @desc    Add product to user's wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, price, image, category, rating, id } = req.body;

    const targetId = String(id || productId);
    const validProductRef = isValidObjectId(productId) ? productId : null;

    const itemToAdd = {
      id: targetId,
      product: validProductRef,
      name: name || "Product",
      price: Number(price) || 0,
      image: image || "",
      category: category || "",
      rating: Number(rating) || 0,
    };

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        products: [itemToAdd],
      });
    } else {
      const exists = wishlist.products.some(
        (p) => String(p.id) === targetId || (p.product && String(p.product) === targetId)
      );

      if (!exists) {
        wishlist.products.push(itemToAdd);
      }
    }

    await wishlist.save();
    res.json(wishlist.products);
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Failed to add product to wishlist", error: error.message });
  }
};

// @desc    Remove product from user's wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.json([]);
    }

    const targetId = String(productId);
    wishlist.products = wishlist.products.filter(
      (p) => String(p.id) !== targetId && (!p.product || String(p.product) !== targetId)
    );

    await wishlist.save();
    res.json(wishlist.products);
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Failed to remove product from wishlist", error: error.message });
  }
};
