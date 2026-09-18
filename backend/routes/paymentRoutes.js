import express from "express";
import { createOrder, verify } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
const r = express.Router();
r.post("/create-order", protect, createOrder);
r.post("/verify", protect, verify);
export default r;
