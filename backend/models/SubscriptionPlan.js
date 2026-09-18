import mongoose from "mongoose";
const s = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: ["monthly", "yearly"],
      unique: true,
      required: true,
    },
    name: String,
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    description: String,
  },
  { timestamps: true },
);
export default mongoose.model("SubscriptionPlan", s);
