import express from "express";

import {
  dashboard,
  customers,
  getDeliverySettings,
  updateDeliverySettings,
} from "../controllers/ownerController.js";

import { protect, ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, ownerOnly);

router.get("/dashboard", dashboard);

router.get("/customers", customers);

router.get("/delivery-settings", getDeliverySettings);

router.put("/delivery-settings", updateDeliverySettings);

export default router;
