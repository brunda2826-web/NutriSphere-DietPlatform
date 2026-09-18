import mongoose from "mongoose";
const s = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    images: [String],
  },
  { timestamps: true },
);
s.index({ user: 1, order: 1, product: 1 }, { unique: true });
export default mongoose.model("Review", s);
