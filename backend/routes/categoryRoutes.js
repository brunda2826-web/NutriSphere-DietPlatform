import express from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";
const r = express.Router();
r.get("/", getCategories);
r.get("/:idOrSlug", getCategory);
r.post("/", protect, ownerOnly, createCategory);
r.put("/:id", protect, ownerOnly, updateCategory);
r.delete("/:id", protect, ownerOnly, deleteCategory);
export default r;
