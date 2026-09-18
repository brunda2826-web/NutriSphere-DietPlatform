import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import OtpVerification from "../models/OtpVerification.js";
import generateToken from "../utils/generateToken.js";
import { issueOtp, verifyOtp } from "../services/notificationService.js";
import Subscription from "../models/Subscription.js";
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error("Name, email, phone and password are required");
  }
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user && user.isVerified) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }
  if (user) {
    user.name = name;
    user.phone = phone;
    user.password = password;
    user.isDeleted = false;
  } else user = new User({ name, email: email.toLowerCase(), phone, password });
  await user.save();
  const otp = await issueOtp(user);
  res
    .status(201)
    .json({
      success: true,
      data: {
        userId: user._id,
        channels: otp,
        message: "OTP sent to both email and SMS",
      },
    });
});
export const verifyRegistration = asyncHandler(async (req, res) => {
  const { userId, emailOtp, smsOtp } = req.body;
  if (!userId || !emailOtp || !smsOtp) {
    res.status(400);
    throw new Error("Both email and SMS OTPs are required");
  }
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("Registration not found");
  }
  await verifyOtp(user._id, "email", emailOtp);
  try {
    await verifyOtp(user._id, "sms", smsOtp);
  } catch (e) {
    res.status(400);
    throw new Error(e.message);
  }
  user.isVerified = true;
  await user.save();
  res.json({ success: true, data: { token: generateToken(user._id), user } });
});
export const resendOtp = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (!user) {
    res.status(404);
    throw new Error("Registration not found");
  }
  const results = await issueOtp(user);
  res.json({ success: true, data: { channels: results } });
});
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your email and SMS OTP before signing in.");
  }
  res.json({ success: true, data: { token: generateToken(user._id), user } });
});
export const getMe = asyncHandler(async (req, res) =>
  res.json({ success: true, data: req.user }),
);
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "age", "gender", "height", "weight"];
  for (const k of allowed)
    if (req.body[k] !== undefined) req.user[k] = req.body[k];
  if (req.body.goal && req.body.goal !== req.user.goal) {
    const active = await Subscription.findOne({
      user: req.user._id,
      status: { $in: ["active", "paused"] },
    });
    if (active) {
      res.status(400);
      throw new Error(
        "Goal cannot be changed while an active subscription is running. Manage the subscription at its allowed lifecycle point.",
      );
    }
    req.user.goal = req.body.goal;
  }
  if (req.body.profileCompleted !== undefined)
    req.user.profileCompleted = !!req.body.profileCompleted;
  await req.user.save();
  res.json({ success: true, data: req.user });
});
export const deleteAccount = asyncHandler(async (req, res) => {
  req.user.isDeleted = true;
  req.user.isVerified = false;
  req.user.email = `deleted_${req.user._id}@deleted.local`;
  req.user.phone = "deleted";
  req.user.name = "Deleted User";
  req.user.password = `deleted_${Date.now()}_${Math.random()}`;
  await req.user.save();
  res.json({ success: true, data: { deleted: true } });
});
