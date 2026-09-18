import crypto from "crypto";
import Razorpay from "razorpay";
export const mode = () =>
  String(process.env.PAYMENT_MODE || "demo").toLowerCase();
export const razorpayConfigured = () =>
  !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export async function createPaymentOrder({ amount, receipt }) {
  if (mode() === "razorpay") {
    if (!razorpayConfigured())
      throw new Error("Razorpay credentials are not configured");
    const rp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await rp.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
    });
    return { provider: "razorpay", order };
  }
  return {
    provider: "demo",
    order: {
      id: `demo_${crypto.randomBytes(6).toString("hex")}`,
      amount,
      currency: "INR",
      receipt,
    },
  };
}
export function verifyRazorpay({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
