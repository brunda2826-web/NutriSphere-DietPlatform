import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
import DietBox from "../models/DietBox.js";
import Subscription from "../models/Subscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
export const getRecommendations = asyncHandler(async (req, res) => {
  if (!req.user.profileCompleted || !req.user.goal) {
    return res.json({
      success: true,
      data: {
        goal: null,
        message:
          "Complete your profile setup to see your personalized diet boxes.",
      },
    });
  }
  const boxes = await DietBox.find({
    goal: req.user.goal,
    isActive: true,
  }).populate("items.product", "name images price unit nutritionalInfo");
  const grouped = {
    Morning: [],
    "Mid-morning": [],
    Afternoon: [],
    Evening: [],
  };
  boxes.forEach((b) => grouped[b.timeSlot].push(b));
  const sub = await Subscription.findOne({
    user: req.user._id,
    status: { $in: ["active", "paused"] },
  }).populate("plan");
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({
    price: 1,
  });
  res.json({
    success: true,
    data: {
      goal: req.user.goal,
      boxes,
      grouped,
      subscription: sub,
      plans,
      categories: await Category.find({ isActive: true }).sort({ name: 1 }),
    },
  });
});
