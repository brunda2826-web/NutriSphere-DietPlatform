import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  getMyNotifications,
  markNotificationRead,
  clearNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";

const r = express.Router();

r.use(protect);

r.get("/", getMyNotifications);

r.put("/:id/read", markNotificationRead);

r.delete("/:id", clearNotification);

r.delete("/", clearAllNotifications);

export default r;
