import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
const cart = async (id) => {
  let c = await Cart.findOne({ user: id });
  if (!c) c = await Cart.create({ user: id, items: [] });
  return c;
};
export const getCart = asyncHandler(async (req, res) => {
  const c = await cart(req.user._id);

  await c.populate("items.product");

  // Remove products that no longer exist
  const validItems = c.items.filter((item) => item.product);

  if (validItems.length !== c.items.length) {
    c.items = validItems;
    await c.save();
  }

  res.json({
    success: true,
    data: c,
  });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body,
    p = await Product.findById(productId);
  if (!p || !p.isActive) {
    res.status(404);
    throw new Error("Product not found");
  }
  if (p.stock < 1) {
    res.status(400);
    throw new Error(`${p.name} is out of stock`);
  }
  const c = await cart(req.user._id),
    x = c.items.find((i) => i.product.toString() === productId),
    n = (x?.quantity || 0) + Number(quantity);
  if (n > p.stock) {
    res.status(400);
    throw new Error(`Only ${p.stock} available`);
  }
  if (x) x.quantity = n;
  else c.items.push({ product: productId, quantity: Number(quantity) });
  await c.save();
  await c.populate("items.product");
  res.json({ success: true, data: c });
});
export const updateCartItem = asyncHandler(async (req, res) => {
  const c = await cart(req.user._id),
    x = c.items.find((i) => i.product.toString() === req.params.productId);
  if (!x) {
    res.status(404);
    throw new Error("Item not in cart");
  }
  const q = Number(req.body.quantity);
  if (q <= 0)
    c.items = c.items.filter(
      (i) => i.product.toString() !== req.params.productId,
    );
  else {
    x.quantity = q;
    const p = await Product.findById(req.params.productId);
    if (!p || q > p.stock) {
      res.status(400);
      throw new Error("Quantity exceeds availability");
    }
  }
  await c.save();
  await c.populate("items.product");
  res.json({ success: true, data: c });
});
export const removeFromCart = asyncHandler(async (req, res) => {
  const c = await cart(req.user._id);
  c.items = c.items.filter(
    (i) => i.product.toString() !== req.params.productId,
  );
  await c.save();
  await c.populate("items.product");
  res.json({ success: true, data: c });
});
export const clearCart = asyncHandler(async (req, res) => {
  const c = await cart(req.user._id);
  c.items = [];
  await c.save();
  res.json({ success: true, data: c });
});
