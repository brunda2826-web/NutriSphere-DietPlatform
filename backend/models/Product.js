import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    // Quantity of the item
    quantity: {
      type: Number,
      min: 0,
      default: 1,
    },

    // Unit is kept flexible so old seeded products also work.
    // New products can use: g, kg, ml, l, piece, pack, box
    unit: {
      type: String,
      trim: true,
      default: "piece",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },

    suitableGoals: {
      type: [String],
      enum: ["weight-gain", "weight-loss", "fitness", "pcos"],
      default: [],
    },

    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      fiber: Number,
      servingSize: String,
    },

    ingredients: {
      type: [String],
      default: [],
    },

    benefits: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

export default mongoose.model("Product", productSchema);
