import asyncHandler from "express-async-handler";
import { notifyCustomers } from "../services/notificationService.js";
import Subscription from "../models/Subscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import DietBox from "../models/DietBox.js";
import SubscriptionDelivery from "../models/SubscriptionDelivery.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import {
  createPaymentOrder,
  verifyRazorpay,
  mode,
} from "../services/paymentService.js";
import { sendCancellationPromptSms } from "../services/smsService.js";
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const activeFilter = { status: { $in: ["active", "paused"] } };
async function active(userId) {
  return Subscription.findOne({ user: userId, ...activeFilter }).populate(
    "plan",
  );
}
async function schedule(sub, goal) {
  const boxes = await DietBox.find({ goal, isActive: true });
  const by = {};
  for (const b of boxes) (by[b.timeSlot] ??= []).push(b);
  const max = Math.min(
    sub.planCode === "monthly" ? 30 : 365,
    Math.ceil((sub.endsAt - sub.startedAt) / 86400000) + 1,
  );
  for (let i = 0; i < max; i++) {
    const date = new Date(sub.startedAt);
    date.setDate(date.getDate() + i);
    if (date > sub.endsAt) break;
    const arr = ["Morning", "Mid-morning", "Afternoon", "Evening"]
      .map((t) => by[t]?.[0])
      .filter(Boolean);
    if (!arr.length) continue;
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    await SubscriptionDelivery.updateOne(
      { subscription: sub._id, scheduledFor: day },
      {
        subscription: sub._id,
        user: sub.user,
        scheduledFor: day,
        boxes: arr.map((b) => ({
          dietBox: b._id,
          timeSlot: b.timeSlot,
          price: b.price,
        })),
        value: arr.reduce((x, b) => x + b.price, 0),
      },
      { upsert: true },
    );
  }
}
export const getSubscription = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: {
      subscription: await active(req.user._id),
      plans: await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 }),
    },
  }),
);
export const checkout = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOne({
    code: req.body.planCode,
    isActive: true,
  });
  if (!plan) {
    res.status(404);
    throw new Error("Subscription plan unavailable");
  }
  if (await active(req.user._id)) {
    res.status(400);
    throw new Error("You already have an active subscription.");
  }
  res.json({
    success: true,
    data: {
      plan,
      result: await createPaymentOrder({
        amount: plan.price,
        receipt: `sub_${req.user._id}_${Date.now()}`,
      }),
    },
  });
});
export const activate = asyncHandler(async (req, res) => {
  const { planCode, paymentId, signature, orderId } = req.body;
  const plan = await SubscriptionPlan.findOne({
    code: planCode,
    isActive: true,
  });
  if (!plan) {
    res.status(404);
    throw new Error("Plan unavailable");
  }
  if (await active(req.user._id)) {
    res.status(400);
    throw new Error("You already have an active subscription.");
  }
  if (
    mode() === "razorpay" &&
    !verifyRazorpay({ orderId, paymentId, signature })
  ) {
    res.status(400);
    throw new Error("Payment verification failed");
  }
  const first = !(await Subscription.exists({ user: req.user._id }));
  const start = new Date(),
    end = addDays(start, plan.durationDays);
  const sub = new Subscription({
    user: req.user._id,
    plan: plan._id,
    planCode,
    amountPaid: plan.price,
    startedAt: start,
    endsAt: end,
    status: "active",
    isFirstSubscription: first,
  });
  await sub.save();
  await schedule(sub, req.user.goal);
  res
    .status(201)
    .json({
      success: true,
      data: await Subscription.findById(sub._id).populate("plan"),
    });
});
export const continuation = asyncHandler(async (req, res) => {
  const sub = await active(req.user._id);
  if (!sub || sub.planCode !== "yearly") {
    res.status(400);
    throw new Error("No active yearly subscription.");
  }
  const pref = req.body.preference;
  if (!["auto", "ask"].includes(pref)) {
    res.status(400);
    throw new Error("Invalid continuation preference");
  }
  sub.continuationPreference = pref;
  sub.respondedAt = new Date();
  sub.status = "active";
  sub.monthlyPromptDueAt = null;
  await sub.save();
  await SubscriptionDelivery.updateMany(
    {
      subscription: sub._id,
      status: "paused",
      scheduledFor: { $gt: new Date() },
    },
    { status: "scheduled" },
  );
  res.json({ success: true, data: sub });
});
async function usedValue(subId) {
  const rows = await SubscriptionDelivery.find({
    subscription: subId,
    status: { $in: ["delivered", "out_for_delivery", "accepted", "preparing"] },
  });
  return rows.reduce((x, d) => x + d.value, 0);
}
export const monthlyCancel = asyncHandler(async (req, res) => {
  const sub = await active(req.user._id);
  if (!sub || sub.planCode !== "monthly") {
    res.status(400);
    throw new Error("No active monthly subscription.");
  }
  if (Date.now() - sub.startedAt.getTime() < 7 * 86400000) {
    res.status(400);
    throw new Error(
      "Monthly subscription can be cancelled/refunded only after completing at least one week.",
    );
  }
  const used = await usedValue(sub._id),
    deduction = sub.isFirstSubscription ? 0 : 600,
    refund = Math.max(0, sub.amountPaid - used - deduction);
  sub.usedValue = used;
  sub.refundAmount = refund;
  sub.status = "cancelled";
  sub.cancelledAt = new Date();
  sub.cancellationReason = req.body.reason || "Customer requested cancellation";
  await sub.save();
  res.json({
    success: true,
    data: {
      subscription: sub,
      refundAmount: refund,
      usedValue: used,
      deduction,
    },
  });
});
export const yearlyToMonthly = asyncHandler(async (req, res) => {
  const old = await active(req.user._id);
  if (!old || old.planCode !== "yearly") {
    res.status(400);
    throw new Error("No active yearly subscription.");
  }
  if (Date.now() - old.startedAt.getTime() < 30 * 86400000) {
    res.status(400);
    throw new Error(
      "Yearly subscription can be changed only after completing one month.",
    );
  }
  const used = await usedValue(old._id),
    refund = Math.max(0, old.amountPaid - used - 1500);
  old.usedValue = used;
  old.refundAmount = refund;
  old.status = "switched";
  old.cancelledAt = new Date();
  old.cancellationReason = "Changed from yearly to monthly";
  await old.save();
  res.json({
    success: true,
    data: { refundAmount: refund, usedValue: used, switchingDeduction: 1500 },
  });
});
export const monthlyEndDecision = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({
    user: req.user._id,
    planCode: "monthly",
  }).sort({ createdAt: -1 });
  if (!sub) {
    res.status(404);
    throw new Error("No monthly subscription history.");
  }
  if (req.body.decision === "stop") {
    sub.status = "cancelled";
    sub.cancelledAt = new Date();
    await sub.save();
    return res.json({ success: true, data: sub });
  }
  if (req.body.decision === "change")
    return res.json({ success: true, data: { action: "choose-plan" } });
  return res.json({
    success: true,
    data: {
      action: "payment-required",
      message: "Continue requires payment for the next monthly period.",
    },
  });
});
export const yearlyMonthlyDecision = asyncHandler(async (req, res) => {
  const sub = await active(req.user._id);
  if (!sub || sub.planCode !== "yearly") {
    res.status(400);
    throw new Error("No active yearly subscription.");
  }
  if (req.body.decision === "continue") {
    sub.continuationPreference = req.body.dontAskAgain ? "auto" : "ask";
    sub.respondedAt = new Date();
    sub.monthlyPromptDueAt = null;
    sub.status = "active";
    await sub.save();
    await SubscriptionDelivery.updateMany(
      {
        subscription: sub._id,
        status: "paused",
        scheduledFor: { $gt: new Date() },
      },
      { status: "scheduled" },
    );
    return res.json({ success: true, data: sub });
  }
  if (req.body.decision === "stop") {
    sub.status = "cancelled";
    sub.cancelledAt = new Date();
    await sub.save();
    return res.json({ success: true, data: sub });
  }
  if (req.body.decision === "change-to-monthly") {
    const used = await usedValue(sub._id),
      refund = Math.max(0, sub.amountPaid - used - 1500);
    sub.usedValue = used;
    sub.refundAmount = refund;
    sub.status = "switched";
    sub.cancelledAt = new Date();
    await sub.save();
    return res.json({
      success: true,
      data: {
        action: "pay-monthly",
        refundAmount: refund,
        usedValue: used,
        switchingDeduction: 1500,
      },
    });
  }
  res.status(400);
  throw new Error("Invalid decision");
});
export const ownerPlans = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await SubscriptionPlan.find().sort({ price: 1 }),
  }),
);
export const ownerUpdatePlan = asyncHandler(async (req, res) => {
  const p = await SubscriptionPlan.findByIdAndUpdate(
    req.params.id,
    {
      price: Number(req.body.price),
      description: req.body.description,
      isActive: req.body.isActive,
    },
    { new: true, runValidators: true },
  );

  if (!p) {
    res.status(404);
    throw new Error("Plan not found");
  }

  await notifyCustomers({
    title: "Subscription Plan Updated",
    message: `${p.name || p.code} subscription plan has been updated. Please check the latest plan details.`,
    type: "PLAN",
  });

  res.json({
    success: true,
    data: p,
  });
});
export const ownerSubscriptions = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await Subscription.find()
      .populate("user", "name email phone goal")
      .populate("plan")
      .sort({ createdAt: -1 }),
  }),
);
export const ownerSendCancellationPrompt = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id).populate("user");
  if (!sub) {
    res.status(404);
    throw new Error("Subscription not found");
  }
  await sendCancellationPromptSms(sub.user.phone);
  res.json({ success: true });
});
export async function runSubscriptionLifecycle() {
  const now = new Date();
  const yearly = await Subscription.find({
    planCode: "yearly",
    status: "active",
  }).populate("user");
  for (const sub of yearly) {
    if (sub.continuationPreference === "auto") continue;
    const monthNo = Math.floor((now - sub.startedAt) / (30 * 86400000));
    if (monthNo < 1) continue;
    const boundary = new Date(sub.startedAt);
    boundary.setDate(boundary.getDate() + monthNo * 30);
    if (
      now >= boundary &&
      (!sub.lastMonthlyPromptAt || sub.lastMonthlyPromptAt < boundary)
    ) {
      sub.lastMonthlyPromptAt = now;
      sub.monthlyPromptDueAt = addDays(now, 7);
      sub.respondedAt = null;
      await sub.save();
      await SubscriptionDelivery.updateMany(
        { subscription: sub._id, scheduledFor: { $gte: boundary } },
        { status: "paused" },
      );
    }
    if (
      sub.monthlyPromptDueAt &&
      now >= sub.monthlyPromptDueAt &&
      !sub.respondedAt
    ) {
      sub.status = "paused";
      await sub.save();
      await sendCancellationPromptSms(sub.user.phone);
    }
  }
}
export async function createSubscriptionDeliveryOrders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await SubscriptionDelivery.find({
    scheduledFor: today,
    status: "scheduled",
  })
    .populate("subscription")
    .populate("user");
  for (const d of rows) {
    if (!d.subscription || !["active"].includes(d.subscription.status))
      continue;
    const address = await Address.findOne({
      user: d.user._id,
      isDefault: true,
    });
    if (!address) {
      continue;
    }
    const items = [];
    const dietBoxes = await DietBox.find({
      _id: { $in: d.boxes.map((x) => x.dietBox) },
    }).populate("items.product");
    for (const box of dietBoxes)
      for (const x of box.items) {
        const p = x.product;
        items.push({
          product: p._id,
          name: p.name,
          unit: p.unit,
          price: 0,
          quantity: x.quantity,
        });
      }
    const order = await Order.create({
      orderNumber: `NS${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`,
      user: d.user._id,
      items,
      dietBoxItems: d.boxes.map((x) => ({
        dietBox: x.dietBox,
        name: "Scheduled diet box",
        price: x.price,
        timeSlot: x.timeSlot,
      })),
      subscription: d.subscription._id,
      subscriptionDelivery: d._id,
      source: "subscription-diet",
      scheduledFor: d.scheduledFor,
      shippingAddress: address.toObject(),
      subtotal: d.value,
      deliveryFee: 0,
      totalAmount: 0,
      paymentMethod: "demo",
      paymentStatus: "paid",
      orderStatus: "Placed",
      tracking: [{ status: "Placed", note: "Scheduled diet-box delivery" }],
    });
    d.order = order._id;
    d.status = "accepted";
    await d.save();
  }
}
