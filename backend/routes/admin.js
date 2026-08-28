import express from "express";
import mongoose from "mongoose";
import Product from "../models/product.js";
import User from "../models/users.js";
import verifyToken from "../config/middleware/verifyToken.js";
import verifyAdmin from "../config/middleware/verifyAdmin.js";

const router = express.Router();

// Matches a product by _id whether it's stored as a legacy plain string
// or a real ObjectId.
function idQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { _id: new mongoose.Types.ObjectId(id) }] };
  }
  return { _id: id };
}

// Every route below requires a valid token AND isAdmin === true
router.use(verifyToken, verifyAdmin);

// ---------- PRODUCTS ----------

// POST /admin/products - create a new product
router.post("/products", async (req, res) => {
  try {
    const newProduct = {
      _id: new mongoose.Types.ObjectId().toString(), // 24-char hex string, stored as a plain String
      ...req.body,
    };
    await Product.collection.insertOne(newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /admin/products/:id - update an existing product
router.put("/products/:id", async (req, res) => {
  try {
    const updated = await Product.collection.findOneAndUpdate(
      idQuery(req.params.id),
      { $set: req.body },
      { returnDocument: "after" }
    );
    if (!updated) return res.status(404).json({ message: "Product not found" });
    updated._id = updated._id.toString();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /admin/products/:id - delete a product
router.delete("/products/:id", async (req, res) => {
  try {
    const result = await Product.collection.deleteOne(idQuery(req.params.id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- ORDERS ----------

// GET /admin/orders - list every order across every user
router.get("/orders", async (req, res) => {
  try {
    const users = await User.find({ "orderHistory.0": { $exists: true } }).select(
      "username email orderHistory"
    );

    // Flatten into one list of orders, each tagged with who placed it
    const orders = users.flatMap((user) =>
      user.orderHistory.map((order) => ({
        userId: user._id,
        username: user.username,
        email: user.email,
        orderId: order.orderId,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        orderedAt: order.orderedAt,
      }))
    );

    // Most recent first
    orders.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /admin/orders/:userId/:orderId - update an order's status
router.patch("/orders/:userId/:orderId", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = user.orderHistory.find(
      (o) => o.orderId?.toString() === req.params.orderId
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await user.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;