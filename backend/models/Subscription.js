import mongoose from "mongoose";
const s = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    planCode: { type: String, enum: ["monthly", "yearly"], required: true },
    amountPaid: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "paused", "cancelled", "expired", "switched"],
      default: "pending",
    },
    cancelledAt: Date,
    cancellationReason: String,
    continuationPreference: {
      type: String,
      enum: ["ask", "auto"],
      default: "ask",
    },
    lastMonthlyPromptAt: Date,
    monthlyPromptDueAt: Date,
    respondedAt: Date,
    usedValue: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    isFirstSubscription: { type: Boolean, default: true },
    switchedFrom: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);
s.index({ user: 1, status: 1 });
export default mongoose.model("Subscription", s);
