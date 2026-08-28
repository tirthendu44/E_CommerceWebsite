import User from "../../models/users.js";

// Must run AFTER verifyToken — relies on req.userId being set already.
export default async function verifyAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isAdmin) return res.status(403).json({ message: "Admin access required" });
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}