import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cors from "cors";
import cartRoutes from "./routes/cart.js";
import paymentRouter from "./routes/payment.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173", // local dev
    "https://e-commerce-website-git-main-tirthendusekhar-6557s-projects.vercel.app", // git-branch domain
    "https://e-commerce-website-cp3ubnml2-tirthendusekhar-6557s-projects.vercel.app", // preview domain
    "https://e-commerce-website-blue-omega.vercel.app" // stable production alias - this was the missing one
  ],
  credentials: true
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/payment", paymentRouter);
app.use("/orders", orderRoutes);
app.use("/admin", adminRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));