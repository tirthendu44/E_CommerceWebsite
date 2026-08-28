import express from "express";
import mongoose from "mongoose";
import Product from "../models/product.js";

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

export default router;