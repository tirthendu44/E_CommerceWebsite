import express from "express";
import mongoose from "mongoose";
import User from "../models/users.js";
import Product from "../models/product.js";
import verifyToken from "../config/middleware/verifyToken.js";

const router = express.Router();

// Matches a product by _id whether it's stored as a legacy plain string
// or a real ObjectId - same helper used in products.js / admin.js.
function idQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { _id: new mongoose.Types.ObjectId(id) }] };
  }
  return { _id: id };
}

// GET /orders - fetch the logged-in user's order history, most recent first
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const orders = [...user.orderHistory]
      .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt))
      .map((order) => ({
        orderId: order.orderId.toString(),
        totalAmount: order.totalAmount,
        status: order.status,
        orderedAt: order.orderedAt,
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          color: item.color,
          size: item.size,
        })),
      }));

    res.status(200).json({ orders });
  } catch (err) {
    console.error("Fetch order history error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /orders/buy-again - unique products the signed-in user has previously
// bought, most recently purchased first.
// Must come BEFORE /:id, or Express matches "buy-again" as an :id value instead.
router.get("/buy-again", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const sortedOrders = [...user.orderHistory].sort(
      (a, b) => new Date(b.orderedAt) - new Date(a.orderedAt)
    );

    // Flatten every item across every past order, keeping only the first
    // (i.e. most recent) occurrence of each product
    const seen = new Set();
    const uniqueItems = [];
    for (const order of sortedOrders) {
      for (const item of order.items) {
        const key = item.productId?.toString();
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueItems.push(item);
        }
      }
    }

    // Look up current product data (price/images may have changed since
    // purchase) - fall back to the snapshot stored at purchase time if the
    // product was since deleted.
    const products = await Promise.all(
      uniqueItems.map(async (item) => {
        const productId = item.productId?.toString();
        const product = productId
          ? await Product.collection.findOne(idQuery(productId))
          : null;

        if (product) {
          product._id = product._id.toString();
          return product;
        }

        return {
          _id: productId,
          name: item.name,
          price: item.price,
          images: item.image ? [{ src: item.image, alt: item.name }] : [],
        };
      })
    );

    res.json({ products });
  } catch (err) {
    console.error("Buy again fetch error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /orders/:id - fetch one order (matched on the orderId field) plus the
// user's current address/email, since shipping details aren't snapshotted
// per-order in this schema
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = user.orderHistory.find(
      (o) => o.orderId.toString() === req.params.id
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({
      order: {
        orderId: order.orderId.toString(),
        totalAmount: order.totalAmount,
        status: order.status,
        orderedAt: order.orderedAt,
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          color: item.color,
          size: item.size,
        })),
      },
      address: {
        firstName: user.firstName,
        lastName: user.lastName,
        streetAddress: user.streetAddress,
        city: user.city,
        region: user.region,
        postalCode: user.postalCode,
        country: user.country,
      },
      email: user.email,
    });
  } catch (err) {
    console.error("Fetch order detail error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;