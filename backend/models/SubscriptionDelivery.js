import mongoose from "mongoose";
const s = new mongoose.Schema(
  {
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scheduledFor: { type: Date, required: true },
    boxes: [
      {
        dietBox: { type: mongoose.Schema.Types.ObjectId, ref: "DietBox" },
        timeSlot: String,
        price: Number,
      },
    ],
    value: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "scheduled",
        "accepted",
        "preparing",
        "out_for_delivery",
        "delivered",
        "skipped",
        "cancelled",
        "paused",
      ],
      default: "scheduled",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    deliveredAt: Date,
  },
  { timestamps: true },
);
s.index({ subscription: 1, scheduledFor: 1 }, { unique: true });
export default mongoose.model("SubscriptionDelivery", s);
