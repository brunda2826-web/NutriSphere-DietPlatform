import mongoose from "mongoose";
const item = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, min: 1, required: true },
  },
  { _id: false },
);
const s = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    items: [item],
  },
  { timestamps: true },
);
export default mongoose.model("Cart", s);
