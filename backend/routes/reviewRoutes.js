import express from "express";
import {
  createReview,
  getMyReviews,
  getOwnerReviews,
} from "../controllers/reviewController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";
const r = express.Router();
r.post("/", protect, createReview);
r.get("/mine", protect, getMyReviews);
r.get("/owner/all", protect, ownerOnly, getOwnerReviews);
export default r;
