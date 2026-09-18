import mongoose from "mongoose";
const item = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, min: 1, required: true },
    portion: String,
  },
  { _id: false },
);
const s = new mongoose.Schema(
  {
    name: { type: String, required: true },
    goal: {
      type: String,
      enum: ["weight-gain", "weight-loss", "fitness", "pcos"],
      required: true,
    },
    timeSlot: {
      type: String,
      enum: ["Morning", "Mid-morning", "Afternoon", "Evening"],
      required: true,
    },
    description: String,
    items: [item],
    price: { type: Number, min: 0, required: true },
    nutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      fiber: Number,
    },
    transparency: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export default mongoose.model("DietBox", s);
