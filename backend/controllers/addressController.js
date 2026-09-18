import asyncHandler from "express-async-handler";
import Address from "../models/Address.js";
import { assertServiceArea } from "../utils/delivery.js";

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({
    user: req.user._id,
  }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.json({
    success: true,
    data: addresses,
  });
});

function clean(body) {
  return {
    fullName: body.fullName,
    phone: body.phone,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    landmark: body.landmark,
    city: body.city,
    state: body.state,
    postalCode: body.postalCode,
    country: body.country,
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    label: body.label,
    isDefault: body.isDefault,
  };
}

export const createAddress = asyncHandler(async (req, res) => {
  const data = clean(req.body);

  if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
    res.status(400);
    throw new Error("Map latitude and longitude are required.");
  }

  const area = await assertServiceArea(data.latitude, data.longitude);

  data.distanceKm = area.distanceKm;

  if (data.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({
    ...data,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: address,
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  const data = clean({
    ...address.toObject(),
    ...req.body,
  });

  if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
    res.status(400);
    throw new Error("Map latitude and longitude are required.");
  }

  const area = await assertServiceArea(data.latitude, data.longitude);

  data.distanceKm = area.distanceKm;

  if (data.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  Object.assign(address, data);

  await address.save();

  res.json({
    success: true,
    data: address,
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error("Address not found");
  }

  res.json({
    success: true,
    data: {
      deleted: true,
    },
  });
});
