import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getOwnerProducts,
} from "../controllers/productController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";
const r = express.Router();
r.get("/owner/all", protect, ownerOnly, getOwnerProducts);
r.get("/", getProducts);
r.get("/:id", getProduct);
r.post("/", protect, ownerOnly, createProduct);
r.put("/:id", protect, ownerOnly, updateProduct);
r.delete("/:id", protect, ownerOnly, deleteProduct);
export default r;
