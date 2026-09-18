import asyncHandler from "express-async-handler";
import { notifyCustomers } from "../services/notificationService.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import DeliverySettings from "../models/DeliverySettings.js";

export const dashboard = asyncHandler(async (req, res) => {
  const [customers, orders, products, reviews] = await Promise.all([
    User.countDocuments({
      role: "CUSTOMER",
      isDeleted: false,
    }),

    Order.countDocuments(),

    Product.countDocuments({
      isActive: true,
    }),

    Review.countDocuments(),
  ]);

  res.json({
    success: true,
    data: {
      customers,
      orders,
      products,
      reviews,
    },
  });
});

export const customers = asyncHandler(async (req, res) => {
  const data = await User.find({
    role: "CUSTOMER",
    isDeleted: false,
  })
    .select("-password")
    .sort({
      createdAt: -1,
    });

  res.json({
    success: true,
    data,
  });
});

/*
  Get current delivery-area settings.
  There should be only one settings document.
*/
export const getDeliverySettings = asyncHandler(async (req, res) => {
  const settings = await DeliverySettings.findOne();

  res.json({
    success: true,
    data: settings,
  });
});

/*
  Owner creates or updates the delivery-area settings.
*/
export const updateDeliverySettings = asyncHandler(async (req, res) => {
  const {
    serviceLatitude,
    serviceLongitude,
    serviceAddress = "",
    radiusKm,
    deliveryStartHour,
    deliveryEndHour,
    deliveryFee,
  } = req.body;

  const latitude = Number(serviceLatitude);
  const longitude = Number(serviceLongitude);
  const radius = Number(radiusKm);
  const startHour = Number(deliveryStartHour);
  const endHour = Number(deliveryEndHour);
  const fee = Number(deliveryFee || 0);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    res.status(400);
    throw new Error(
      "Valid service center latitude and longitude are required.",
    );
  }

  if (!Number.isFinite(radius) || radius <= 0) {
    res.status(400);
    throw new Error("Delivery radius must be greater than 0 km.");
  }

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(endHour) ||
    startHour < 0 ||
    startHour > 23 ||
    endHour < 1 ||
    endHour > 24 ||
    startHour >= endHour
  ) {
    res.status(400);
    throw new Error("Please enter a valid delivery time range.");
  }

  if (!Number.isFinite(fee) || fee < 0) {
    res.status(400);
    throw new Error("Delivery fee cannot be negative.");
  }

  const settings = await DeliverySettings.findOneAndUpdate(
    {},
    {
      $set: {
        serviceLatitude: latitude,
        serviceLongitude: longitude,
        serviceAddress,
        radiusKm: radius,
        deliveryStartHour: startHour,
        deliveryEndHour: endHour,
        deliveryFee: fee,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );
  await notifyCustomers({
    title: "Delivery Area Updated",
    message:
      "NutriSphere delivery area or delivery timings have been updated. Please check your address before placing your next order.",
    type: "DELIVERY",
  });

  res.json({
    success: true,
    message: "Delivery settings updated successfully.",
    data: settings,
  });
});
