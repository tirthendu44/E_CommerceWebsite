import express from "express";
import User from "../models/users.js";
import verifyToken from "../config/middleware/verifyToken.js";

const router = express.Router();

// POST /cart/add - add (or increment) an item in the logged-in user's cart
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { productId, name, price, quantity, image } = req.body;

    if (!productId || !name || price === undefined) {
      return res.status(400).json({ message: "productId, name, and price are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingItem = user.cartItems.find(
      (item) => item.productId?.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      user.cartItems.push({
        productId,
        name,
        price,
        quantity: quantity || 1,
        image,
      });
    }

    await user.save();
    res.status(200).json({ message: "Added to cart", cartItems: user.cartItems });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /cart - fetch products from user's cartItems
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Transform cartItems into frontend-friendly products array.
    // Use the subdocument _id (stable) rather than array index, since
    // increment/decrement/remove need a ref that survives reordering.
    const products = user.cartItems.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      href: "#", // placeholder, can be product detail link
      color: item.color || "N/A", // optional if you store color
      price: `$${item.price}`, // format as string with currency
      quantity: item.quantity,
      imageSrc: item.image,
      imageAlt: item.name, // fallback alt text
    }));

    res.status(200).json({ products });
  } catch (err) {
    console.error("Fetch cart error:", err);
    res.status(500).json({ message: err.message });
  }
});

// helper: same shape as GET / uses, so all mutation routes can respond consistently
const toProducts = (cartItems) =>
  cartItems.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    href: "#",
    color: item.color || "N/A",
    price: `$${item.price}`,
    quantity: item.quantity,
    imageSrc: item.image,
    imageAlt: item.name,
  }));

// PATCH /cart/:id/increment - increase quantity by 1
router.patch("/:id/increment", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.cartItems.id(req.params.id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    item.quantity += 1;
    await user.save();

    res.status(200).json({ message: "Quantity increased", products: toProducts(user.cartItems) });
  } catch (err) {
    console.error("Increment cart item error:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /cart/:id/decrement - decrease quantity by 1, removing the item if it hits 0
router.patch("/:id/decrement", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.cartItems.id(req.params.id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      item.deleteOne();
    }

    await user.save();

    res.status(200).json({ message: "Quantity decreased", products: toProducts(user.cartItems) });
  } catch (err) {
    console.error("Decrement cart item error:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /cart/:id - remove an item from the cart entirely
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.cartItems.id(req.params.id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    item.deleteOne();
    await user.save();

    res.status(200).json({ message: "Item removed", products: toProducts(user.cartItems) });
  } catch (err) {
    console.error("Remove cart item error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;