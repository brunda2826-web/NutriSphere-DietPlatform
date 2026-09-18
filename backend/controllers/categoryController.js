import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
export const getCategories = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await Category.find({ isActive: true }).sort({ name: 1 }),
  }),
);
export const getCategory = asyncHandler(async (req, res) => {
  const q = req.params.idOrSlug;
  const c = await Category.findOne({
    $or: [{ slug: q }, { _id: /^[0-9a-f]{24}$/i.test(q) ? q : null }],
  });
  if (!c) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, data: c });
});
export const createCategory = asyncHandler(async (req, res) =>
  res
    .status(201)
    .json({ success: true, data: await Category.create(req.body) }),
);
export const updateCategory = asyncHandler(async (req, res) => {
  const c = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!c) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, data: c });
});
export const deleteCategory = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    ),
  }),
);
