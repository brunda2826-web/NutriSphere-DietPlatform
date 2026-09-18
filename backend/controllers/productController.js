import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

import { notifyCustomers } from "../services/notificationService.js";

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const makeUniqueSlug = async (name, currentId = null) => {
  const base = slugify(name) || "product";
  let slug = base;
  let count = 1;

  while (true) {
    const query = { slug };

    if (currentId) {
      query._id = { $ne: currentId };
    }

    const exists = await Product.exists(query);

    if (!exists) return slug;

    count += 1;
    slug = `${base}-${count}`;
  }
};

const normalizeProductData = (body) => {
  const data = { ...body };

  delete data.slug;

  if (data.quantity !== undefined && data.quantity !== "") {
    data.quantity = Number(data.quantity);
  }

  if (data.price !== undefined && data.price !== "") {
    data.price = Number(data.price);
  }

  if (data.discountPercent !== undefined && data.discountPercent !== "") {
    data.discountPercent = Number(data.discountPercent);
  }

  if (data.stock !== undefined && data.stock !== "") {
    data.stock = Number(data.stock);
  }

  if (typeof data.images === "string") {
    data.images = data.images.trim() ? [data.images.trim()] : [];
  }

  if (typeof data.ingredients === "string") {
    data.ingredients = data.ingredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof data.benefits === "string") {
    data.benefits = data.benefits
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(data.suitableGoals)) {
    data.suitableGoals = [];
  }

  return data;
};

const validateProductData = async (data) => {
  if (!data.name?.trim()) {
    throw new Error("Item name is required");
  }

  if (!data.category) {
    throw new Error("Please select an item category");
  }

  const category = await Category.findOne({
    _id: data.category,
    isActive: true,
  });

  if (!category) {
    throw new Error("Invalid or inactive category");
  }

  if (
    data.quantity === undefined ||
    Number.isNaN(data.quantity) ||
    data.quantity <= 0
  ) {
    throw new Error("Quantity must be greater than 0");
  }

  if (!data.unit?.trim()) {
    throw new Error("Please select a unit");
  }

  if (data.price === undefined || Number.isNaN(data.price) || data.price < 0) {
    throw new Error("Price must be 0 or greater");
  }

  if (
    data.discountPercent !== undefined &&
    (Number.isNaN(data.discountPercent) ||
      data.discountPercent < 0 ||
      data.discountPercent > 100)
  ) {
    throw new Error("Discount must be between 0 and 100%");
  }

  if (
    data.stock !== undefined &&
    (Number.isNaN(data.stock) || data.stock < 0)
  ) {
    throw new Error("Stock cannot be negative");
  }
};

export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, sort = "newest", includeInactive } = req.query;

  const isOwner =
    includeInactive === "true" && req.user?.role === "OWNER/SELLER";

  const q = isOwner ? {} : { isActive: true };

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    q.name = {
      $regex: `^${escapedSearch}`,
      $options: "i",
    };
  }

  if (category) {
    q.category = category;
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_low: { price: 1 },
    price_high: { price: -1 },
    name: { name: 1 },
  };

  const data = await Product.find(q)
    .populate("category", "name slug imageUrl")
    .sort(sortMap[sort] || sortMap.newest);

  res.json({
    success: true,
    data,
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id).populate(
    "category",
    "name slug imageUrl",
  );

  if (!p) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Customers should not access inactive products.
  if (!p.isActive && req.user?.role !== "OWNER/SELLER") {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({
    success: true,
    data: p,
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = normalizeProductData(req.body);

  await validateProductData(data);

  data.slug = await makeUniqueSlug(data.name);

  const product = await Product.create(data);

  const populated = await product.populate("category", "name slug imageUrl");

  await notifyCustomers({
    title: "New Product Available",
    message: `${product.name} is now available on NutriSphere.`,
    type: "PRODUCT",
  });

  res.status(201).json({
    success: true,
    data: populated,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findById(req.params.id);

  if (!existing) {
    res.status(404);
    throw new Error("Product not found");
  }

  const data = normalizeProductData(req.body);

  const merged = {
    ...existing.toObject(),
    ...data,
  };

  await validateProductData(merged);

  if (data.name && data.name.trim() !== existing.name) {
    data.slug = await makeUniqueSlug(data.name, existing._id);
  }

  delete data._id;
  delete data.__v;

  const updated = await Product.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  }).populate("category", "name slug imageUrl");
  await notifyCustomers({
    title: "Product Updated",
    message: `${updated.name} has been updated on NutriSphere.`,
    type: "PRODUCT",
  });

  res.json({
    success: true,
    data: updated,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  await notifyCustomers({
    title: "Product Unavailable",
    message: `${product.name} is currently unavailable.`,
    type: "PRODUCT",
  });

  res.json({
    success: true,
    data: product,
  });
});

export const getOwnerProducts = asyncHandler(async (req, res) => {
  const data = await Product.find()
    .populate("category", "name slug imageUrl")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data,
  });
});
