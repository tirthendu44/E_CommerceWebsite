import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/users.js";
import Product from "../models/product.js";
import verifyToken from "../config/middleware/verifyToken.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Matches a product by _id whether it's stored as a legacy plain string
// or a real ObjectId - same helper used in products.js / admin.js.
function idQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { _id: new mongoose.Types.ObjectId(id) }] };
  }
  return { _id: id };
}
function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  return expectedSignature === razorpay_signature;
}

// POST /payment/create-order - create a Razorpay order for the given amount
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees, e.g. 499.99

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "A valid amount is required" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise (smallest unit)
      currency: "INR",
      receipt: `receipt_${req.userId}_${Date.now()}`,
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // safe to expose - it's the public key
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST /payment/verify - verify the signature Razorpay returns after checkout
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ verified: false, message: "Invalid payment signature" });
    }

    // Signature is valid - the payment is genuinely from Razorpay.
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalAmount = user.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Snapshot the cart into orderHistory before clearing it, so the
    // purchase is recorded even though cartItems is about to be emptied.
    const purchasedItems = user.cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));

    const newOrderId = new mongoose.Types.ObjectId();
    user.orderHistory.push({
      orderId: newOrderId,
      items: purchasedItems,
      totalAmount,
      status: "paid",
    });

    user.cartItems = [];
    await user.save();
    

    // +quantity per product purchased in this order - this counts total
    // units sold. Some cart items may not have a productId (e.g. added
    // before the product existed as a catalog entry) - those are skipped.
    // Uses the native driver + idQuery() instead of findByIdAndUpdate,
    // since Mongoose's default casting would only match products whose
    // _id is a real ObjectId - most of this catalog's products have a
    // plain string _id and would silently fail to match otherwise.
    const buyCountResults = await Promise.all(
      purchasedItems
        .filter((item) => item.productId)
        .map((item) =>
          Product.collection.updateOne(
            idQuery(item.productId.toString()),
            { $inc: { buyCount: item.quantity } }
          )
        )
    );

    buyCountResults.forEach((result, i) => {
      if (result.matchedCount === 0) {
        console.warn(
          "buyCount update matched no product for productId:",
          purchasedItems[i].productId?.toString()
        );
      }
    });

    res.status(200).json({
      verified: true,
      message: "Payment verified successfully",
      orderId: newOrderId.toString(),
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: err.message });
  }
});
// POST /payment/verify-buy-now - verify a DIRECT single-product purchase
// (from a product page's "Buy Now" button). Records exactly one order
// containing just this item, and never touches the user's existing cart.
router.post("/verify-buy-now", verifyToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productId,
      name,
      price,
      quantity,
      image,
    } = req.body;
 
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification fields" });
    }
 
    if (!productId || !name || price === undefined) {
      return res.status(400).json({ message: "productId, name, and price are required" });
    }
 
    if (!verifyRazorpaySignature(req.body)) {
      return res.status(400).json({ verified: false, message: "Invalid payment signature" });
    }
 
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
 
    const qty = quantity || 1;
    const totalAmount = price * qty;
 
    const newOrderId = new mongoose.Types.ObjectId();
    user.orderHistory.push({
      orderId: newOrderId,
      items: [{ productId, name, price, quantity: qty, image }],
      totalAmount,
      status: "paid",
    });
 
    await user.save();
 
    const buyCountResult = await Product.collection.updateOne(
      idQuery(productId.toString()),
      { $inc: { buyCount: qty } }
    );
 
    if (buyCountResult.matchedCount === 0) {
      console.warn("buyCount update matched no product for productId:", productId);
    }
 
    res.status(200).json({
      verified: true,
      message: "Payment verified successfully",
      orderId: newOrderId.toString(),
    });
  } catch (err) {
    console.error("Verify buy-now payment error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;