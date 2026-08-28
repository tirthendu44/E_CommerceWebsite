import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    country: { type: String, trim: true },
    streetAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    postalCode: { type: String, trim: true },

    // 🔐 Admin flag
    isAdmin: { type: Boolean, default: false },

    // 🛒 Cart items
    cartItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        image: String,
      },
    ],

    // 📦 Order history
    orderHistory: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId },
        items: [
          {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            name: String,
            price: Number,
            quantity: Number,
            image: String,
          },
        ],
        totalAmount: Number,
        status: {
          type: String,
          enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
          default: "pending",
        },
        orderedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);