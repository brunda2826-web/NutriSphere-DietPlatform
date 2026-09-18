import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
const r = express.Router();
r.use(protect);
r.get("/", getCart);
r.post("/", addToCart);
r.put("/:productId", updateCartItem);
r.delete("/:productId", removeFromCart);
r.delete("/", clearCart);
export default r;
