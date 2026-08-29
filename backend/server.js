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
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server calls)
    if (!origin) return callback(null, true);

    const allowed =
      origin === "http://localhost:5173" || // local dev
      origin === "https://e-commerce-website-blue-omega.vercel.app" || // stable production alias
      /^https:\/\/e-commerce-website(-[a-z0-9]+)*-tirthendusekhar-6557s-projects\.vercel\.app$/.test(origin); // any git-branch or preview deployment

    callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
  },
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