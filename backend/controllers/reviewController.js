import asyncHandler from "express-async-handler";
import Review from "../models/Review.js";
import Order from "../models/Order.js";

export const createReview = asyncHandler(async (req, res) => {
  const { orderId, productId, rating, comment = "", images = [] } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
    orderStatus: "Delivered",
  });

  if (!order) {
    res.status(400);
    throw new Error("Reviews are available only after delivery.");
  }

  const productExists = order.items.some(
    (i) => i.product?.toString() === productId?.toString(),
  );

  if (!productExists) {
    res.status(400);
    throw new Error("Product was not part of this order.");
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    order: orderId,
    product: productId,
  });

  if (existingReview) {
    res.status(400);
    throw new Error("You have already submitted feedback for this product.");
  }

  const r = await Review.create({
    user: req.user._id,
    order: orderId,
    product: productId,
    rating: Number(rating),
    comment: String(comment),
    images,
  });

  res.status(201).json({
    success: true,
    data: r,
  });
});
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    user: req.user._id,
  })
    .populate("product", "name")
    .populate("order", "orderNumber")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});
export const getOwnerReviews = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await Review.find()
      .populate("user", "name")
      .populate("product", "name")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 }),
  }),
);
