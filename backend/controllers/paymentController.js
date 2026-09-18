import asyncHandler from "express-async-handler";
import {
  createPaymentOrder,
  verifyRazorpay,
  mode,
} from "../services/paymentService.js";
export const createOrder = asyncHandler(async (req, res) => {
  const subtotal = Number(req.body.amount),
    deliveryFee = Number(process.env.DELIVERY_FEE || 0),
    amount = subtotal + deliveryFee;
  if (!(amount > 0)) {
    res.status(400);
    throw new Error("Valid amount required");
  }
  res.json({
    success: true,
    data: {
      ...(await createPaymentOrder({
        amount,
        receipt: `cart_${req.user._id}_${Date.now()}`,
      })),
      deliveryFee,
      chargedAmount: amount,
    },
  });
});
export const verify = asyncHandler(async (req, res) => {
  if (mode() === "demo")
    return res.json({ success: true, data: { verified: true } });
  const ok = verifyRazorpay(req.body);
  if (!ok) {
    res.status(400);
    throw new Error("Payment verification failed");
  }
  res.json({ success: true, data: { verified: true } });
});
