import mongoose from "mongoose";
const s = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    channel: { type: String, enum: ["email", "sms"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);
s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
s.index({ user: 1, channel: 1 }, { unique: true });
export default mongoose.model("OtpVerification", s);
