import express from "express";
import {
  getSubscription,
  checkout,
  activate,
  continuation,
  monthlyCancel,
  yearlyToMonthly,
  monthlyEndDecision,
  yearlyMonthlyDecision,
  ownerSubscriptions,
  ownerSendCancellationPrompt,
  ownerPlans,
  ownerUpdatePlan,
} from "../controllers/subscriptionController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";
const r = express.Router();
r.get("/", protect, getSubscription);
r.post("/checkout", protect, checkout);
r.post("/activate", protect, activate);
r.post("/continuation", protect, continuation);
r.post("/monthly/cancel", protect, monthlyCancel);
r.post("/yearly/to-monthly", protect, yearlyToMonthly);
r.post("/monthly/end-decision", protect, monthlyEndDecision);
r.post("/yearly/month-decision", protect, yearlyMonthlyDecision);
r.get("/owner/plans", protect, ownerOnly, ownerPlans);
r.put("/owner/plans/:id", protect, ownerOnly, ownerUpdatePlan);
r.get("/owner/all", protect, ownerOnly, ownerSubscriptions);
r.post(
  "/owner/:id/cancellation-prompt",
  protect,
  ownerOnly,
  ownerSendCancellationPrompt,
);
export default r;
