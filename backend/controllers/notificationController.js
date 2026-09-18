import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    recipient: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    data: notifications,
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipient: req.user._id,
    },
    {
      read: true,
    },
    {
      new: true,
    },
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json({
    success: true,
    data: notification,
  });
});

export const clearNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json({
    success: true,
    message: "Notification cleared",
  });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    recipient: req.user._id,
  });

  res.json({
    success: true,
    message: "All notifications cleared",
  });
});
