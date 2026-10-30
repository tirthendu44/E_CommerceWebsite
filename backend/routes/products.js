import express from "express";
import mongoose from "mongoose";
import Product from "../models/product.js";
import User from "../models/users.js";
import verifyToken from "../config/middleware/verifyToken.js";

const router = express.Router();

// Matches a product by _id whether it's stored as a legacy plain string
// or a real ObjectId.
function idQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { _id: new mongoose.Types.ObjectId(id) }] };
  }
  return { _id: id };
}

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET top-selling products by buyCount, e.g. /products/top?limit=4
// Must come BEFORE /:id, or Express matches "top" as an :id value instead.
router.get("/top", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 4;
    const products = await Product.find().sort({ buyCount: -1 }).limit(limit);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /products/category/:category - products whose breadcrumbs include
// a matching category name (case-insensitive), e.g. /products/category/clothing
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
 
    const products = await Product.find({
      breadcrumbs: {
        $elemMatch: { name: { $regex: new RegExp(`^${category}$`, "i") } },
      },
    });
 
    res.status(200).json(products);
  } catch (err) {
    console.error("Fetch products by category error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET a single product by id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.collection.findOne(idQuery(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    product._id = product._id.toString();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/:id/reviews", verifyToken, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || "").trim();
 
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }
    if (comment.length > 1000) {
      return res.status(400).json({ message: "Review must be 1000 characters or fewer" });
    }
 
    const productId = req.params.id;
 
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
 
    // Only people who actually bought the product (in a non-cancelled order) can review it
    const hasPurchased = user.orderHistory.some(
      (order) =>
        order.status !== "cancelled" &&
        order.items.some((item) => item.productId?.toString() === productId)
    );
    if (!hasPurchased) {
      return res.status(403).json({ message: "You can only review products you've purchased" });
    }
 
    // Native driver + idQuery(), since most products have a plain string _id
    const product = await Product.collection.findOne(idQuery(productId));
    if (!product) return res.status(404).json({ message: "Product not found" });
 
    const userReviews = product.userReviews || [];
    const now = new Date();
    const existingIndex = userReviews.findIndex(
      (r) => r.userId?.toString() === req.userId
    );
 
    if (existingIndex >= 0) {
      // This user already reviewed it - replace their review instead of adding a duplicate
      userReviews[existingIndex] = {
        ...userReviews[existingIndex],
        username: user.username,
        rating,
        comment,
        updatedAt: now,
      };
    } else {
      userReviews.push({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(req.userId),
        username: user.username,
        rating,
        comment,
        createdAt: now,
        updatedAt: now,
      });
    }
 
    const totalCount = userReviews.length;
    const average =
      Math.round((userReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10;
 
    await Product.collection.updateOne(
      { _id: product._id },
      {
        $set: {
          userReviews,
          rating: average,
          "reviews.average": average, // keeps the star display on the product page in sync
          "reviews.totalCount": totalCount,
        },
      }
    );
 
    res.status(200).json({
      message: existingIndex >= 0 ? "Review updated" : "Review submitted",
      rating: average,
      totalCount,
    });
  } catch (err) {
    console.error("Submit review error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;