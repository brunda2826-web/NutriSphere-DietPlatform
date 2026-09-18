import mongoose from "mongoose";
const item = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    unit: String,
    price: Number,
    quantity: Number,
  },
  { _id: false },
);
const event = new mongoose.Schema(
  {
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false },
);
const s = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [item],
    dietBoxItems: [
      {
        dietBox: { type: mongoose.Schema.Types.ObjectId, ref: "DietBox" },
        name: String,
        price: Number,
        timeSlot: String,
      },
    ],
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    subscriptionDelivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionDelivery",
      default: null,
    },
    source: {
      type: String,
      enum: ["cart", "subscription-diet"],
      default: "cart",
    },
    scheduledFor: Date,
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      landmark: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      latitude: Number,
      longitude: Number,
    },
    subtotal: Number,
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: Number,
    paymentMethod: {
      type: String,
      enum: ["demo", "razorpay"],
      default: "demo",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentReference: String,
    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Placed",
    },
    tracking: [event],
    estimatedArrivalAt: Date,
    nearDeliverySmsSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export default mongoose.model("Order", s);
