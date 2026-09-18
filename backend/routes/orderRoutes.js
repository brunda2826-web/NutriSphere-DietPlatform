import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
} from "../controllers/orderController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";
const r = express.Router();
r.use(protect);
r.get("/owner/all", ownerOnly, getAllOrders);
r.post("/", createOrder);
r.get("/", getMyOrders);
r.get("/:id", getOrder);
r.put("/:id/status", ownerOnly, updateOrderStatus);
export default r;
