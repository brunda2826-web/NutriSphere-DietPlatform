import asyncHandler from "express-async-handler";
import crypto from "crypto";


import User from "../models/User.js";
import {
  createNotification,
  createNotifications,
} from "../services/notificationService.js";


import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";

import { assertDeliveryHours, assertServiceArea } from "../utils/delivery.js";

import { sendNearDeliverySms } from "../services/smsService.js";
import SubscriptionDelivery from "../models/SubscriptionDelivery.js";

const statuses = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const next = {
  Placed: ["Confirmed", "Cancelled"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const num = () =>
  `NS${Date.now().toString().slice(-7)}${crypto.randomInt(10, 99)}`;

export const createOrder = asyncHandler(async (req, res) => {
  await assertDeliveryHours();

  const { addressId, paymentMethod = "demo", paymentReference = "" } = req.body;

  const address = await Address.findOne({
    _id: addressId,
    user: req.user._id,
  });

  if (!address) {
    res.status(400);
    throw new Error("Please select a valid saved delivery address.");
  }

  await assertServiceArea(address.latitude, address.longitude);

  const cart = await Cart.findOne({
    user: req.user._id,
  }).populate("items.product");

  // Remove cart items whose product no longer exists
  if (cart) {
    cart.items = cart.items.filter((item) => item.product);

    await cart.save();
  }

  if (!cart || !cart.items.length) {
    res.status(400);
    throw new Error("Your cart is empty. Please add available products again.");
  }

  let subtotal = 0;
  const items = [];
for (const x of cart.items) {
  const p = x.product;

  if (!p) {
    res.status(400);
    throw new Error(
      "A product in your cart no longer exists. Please remove it and add the product again.",
    );
  }

  if (!p.isActive) {
    res.status(400);
    throw new Error(`${p.name} is currently unavailable.`);
  }

  if (Number(p.stock) < Number(x.quantity)) {
    res.status(400);
    throw new Error(
      `${p.name} has only ${p.stock} available, but your cart has ${x.quantity}.`,
    );
  }

  const price = Math.max(
    0,
    p.price - (p.price * (p.discountPercent || 0)) / 100,
  );

  subtotal += price * x.quantity;

  items.push({
    product: p._id,
    name: p.name,
    unit: p.unit,
    price,
    quantity: x.quantity,
  });
}

  const deliveryFee = Number(process.env.DELIVERY_FEE || 0);

  const order = await Order.create({
    orderNumber: num(),
    user: req.user._id,

    items,

    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
    },

    subtotal,
    deliveryFee,
    totalAmount: subtotal + deliveryFee,

    paymentMethod,
    paymentStatus: "paid",
    paymentReference,

    tracking: [
      {
        status: "Placed",
        note: "Order placed successfully",
      },
    ],
  });

  for (const x of cart.items) {
    await Product.findByIdAndUpdate(x.product._id, {
      $inc: {
        stock: -x.quantity,
      },
    });
  }

  const orderItemsText = items
    .map((item) => `${item.name} × ${item.quantity}`)
    .join(", ");

  const owners = await User.find({
    role: "OWNER/SELLER",
    isDeleted: false,
  }).select("_id");

  await createNotifications({
    recipients: owners.map((owner) => owner._id),
    title: "New Order Received",
    message: `Order #${order.orderNumber} placed by ${
      req.user.name || "a customer"
    }: ${orderItemsText}`,
    type: "ORDER",
  });
  cart.items = [];
  await cart.save();

  res.status(201).json({
    success: true,
    data: order,
  });
});
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
    "items.0": { $exists: true },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const q =
    req.user.role === "OWNER/SELLER"
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          user: req.user._id,
        };

  const o = await Order.findOne(q)
    .populate("items.product", "name images unit")
    .populate("dietBoxItems.dietBox");

  if (!o) {
    res.status(404);
    throw new Error("Order not found");
  }

  res.json({
    success: true,
    data: o,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id);

  if (!o) {
    res.status(404);
    throw new Error("Order not found");
  }

  const status = req.body.status;

  if (!statuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid order status");
  }

  if (!next[o.orderStatus].includes(status)) {
    res.status(400);
    throw new Error(`Cannot move order from ${o.orderStatus} to ${status}`);
  }

  o.orderStatus = status;

  o.tracking.push({
    status,
    note: req.body.note || "",
  });

  if (status === "Out for Delivery") {
    o.estimatedArrivalAt = new Date(
      Date.now() +
        Number(process.env.DEFAULT_ETA_AFTER_DISPATCH_MINUTES || 15) * 60000,
    );
  }

  if (status === "Delivered") {
    o.estimatedArrivalAt = null;
  }

  await o.save();
await createNotification(o.user, {
  title: "Order Updated",
  message: `Order #${o.orderNumber} is now ${status}.`,
  type: "ORDER",
});
  if (o.subscriptionDelivery) {
    const map = {
      Confirmed: "accepted",
      Preparing: "preparing",
      "Out for Delivery": "out_for_delivery",
      Delivered: "delivered",
      Cancelled: "cancelled",
    };

    if (map[status]) {
      const patch = {
        status: map[status],
      };

      if (status === "Delivered") {
        patch.deliveredAt = new Date();
      }

      await SubscriptionDelivery.findByIdAndUpdate(
        o.subscriptionDelivery,
        patch,
      );
    }
  }

  res.json({
    success: true,
    data: o,
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: await Order.find().populate("user", "name email phone").sort({
      createdAt: -1,
    }),
  });
});

export const runNearDeliveryAlerts = async () => {
  const max = new Date(Date.now() + 5 * 60000);

  const orders = await Order.find({
    orderStatus: "Out for Delivery",
    estimatedArrivalAt: {
      $ne: null,
      $lte: max,
    },
    nearDeliverySmsSent: false,
  }).populate("user");

  for (const o of orders) {
    const sent = await sendNearDeliverySms(
      o.shippingAddress.phone || o.user.phone,
      o.orderNumber,
    );

    if (sent) {
      o.nearDeliverySmsSent = true;
      await o.save();
    }
  }
};
