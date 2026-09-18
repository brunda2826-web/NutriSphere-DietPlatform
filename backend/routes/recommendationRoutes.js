import express from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";
const r = express.Router();
r.get("/", protect, getRecommendations);
export default r;
