import mongoose from "mongoose";
const s = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    imageUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export default mongoose.model("Category", s);
