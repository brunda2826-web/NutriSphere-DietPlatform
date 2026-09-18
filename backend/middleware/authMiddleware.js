import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
export const protect = asyncHandler(async (req, res, next) => {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Authentication required");
  }
  try {
    const decoded = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      res.status(401);
      throw new Error("User no longer exists");
    }
    if (req.user.isDeleted) {
      res.status(401);
      throw new Error("Account is deleted");
    }
    next();
  } catch (e) {
    res.status(401);
    throw new Error("Invalid or expired session");
  }
});
export const ownerOnly = (req, res, next) => {
  if (req.user?.role !== "OWNER/SELLER") {
    res.status(403);
    throw new Error("Owner access required");
  }
  next();
};
