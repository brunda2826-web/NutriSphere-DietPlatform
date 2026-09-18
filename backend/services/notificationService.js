import crypto from "crypto";
import bcrypt from "bcryptjs";

import OtpVerification from "../models/OtpVerification.js";

import { sendOtpEmail } from "./emailService.js";
import { sendOtpSms } from "./smsService.js";

import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ======================================================
// OTP
// ======================================================

export function createOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function issueOtp(user) {
  const expires = new Date(
    Date.now() + Number(process.env.OTP_EXPIRES_MINUTES || 10) * 60000,
  );

  const cooldown = Number(process.env.OTP_RESEND_SECONDS || 60) * 1000;

  const channels = [
    ["email", user.email],
    ["sms", user.phone],
  ];

  const results = [];

  for (const [channel] of channels) {
    const existing = await OtpVerification.findOne({
      user: user._id,
      channel,
    });

    if (existing && Date.now() - existing.lastSentAt.getTime() < cooldown) {
      throw new Error(
        `Please wait before requesting another OTP for ${channel}.`,
      );
    }

    const code = createOtp();

    const codeHash = await bcrypt.hash(code, 10);

    await OtpVerification.findOneAndUpdate(
      {
        user: user._id,
        channel,
      },
      {
        codeHash,
        expiresAt: expires,
        lastSentAt: new Date(),
        attempts: 0,
      },
      {
        upsert: true,
        new: true,
      },
    );

    let sent = false;

    if (channel === "email") {
      sent = await sendOtpEmail(user.email, code);
    } else {
      sent = await sendOtpSms(user.phone, code);
    }

    results.push({
      channel,
      sent,
    });
  }

  return results;
}

export async function verifyOtp(userId, channel, code) {
  const rec = await OtpVerification.findOne({
    user: userId,
    channel,
  });

  if (!rec || rec.expiresAt < new Date()) {
    throw new Error("OTP expired. Request a new one.");
  }

  if (rec.attempts >= 5) {
    throw new Error("Too many OTP attempts. Request a new one.");
  }

  rec.attempts++;

  await rec.save();

  if (!(await bcrypt.compare(String(code), rec.codeHash))) {
    throw new Error("Invalid OTP.");
  }

  await OtpVerification.deleteOne({
    _id: rec._id,
  });

  return true;
}

// ======================================================
// IN-APP NOTIFICATIONS
// ======================================================

export const createNotification = async ({
  recipient,
  title,
  message,
  type = "GENERAL",
}) => {
  if (!recipient) return null;

  return Notification.create({
    recipient,
    title,
    message,
    type,
  });
};

// Send the same notification to many users
export const createNotifications = async ({
  recipients,
  title,
  message,
  type = "GENERAL",
}) => {
  const ids = [
    ...new Set((recipients || []).filter(Boolean).map((id) => id.toString())),
  ];

  if (!ids.length) return [];

  return Notification.insertMany(
    ids.map((recipient) => ({
      recipient,
      title,
      message,
      type,
    })),
  );
};

// Notify all customers
export const notifyCustomers = async ({ title, message, type = "GENERAL" }) => {
  const customers = await User.find({
    role: "CUSTOMER",
    isDeleted: false,
  }).select("_id");

  return createNotifications({
    recipients: customers.map((customer) => customer._id),
    title,
    message,
    type,
  });
};

// Notify all owners/sellers
export const notifyOwners = async ({ title, message, type = "GENERAL" }) => {
  const owners = await User.find({
    role: "OWNER/SELLER",
    isDeleted: false,
  }).select("_id");

  return createNotifications({
    recipients: owners.map((owner) => owner._id),
    title,
    message,
    type,
  });
};
