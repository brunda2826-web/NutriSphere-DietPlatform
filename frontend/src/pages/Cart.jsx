import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";
import { useCart } from "../context/CartContext.jsx";
import { resolveImage } from "../constants/imageMap.js";

export default function Cart() {
  const { cart, updateItem, removeItem, count } = useCart();
  const nav = useNavigate();

  const items = Array.isArray(cart?.items)
    ? cart.items.filter((item) => item?.product)
    : [];

  const subtotal = items.reduce(
    (total, item) =>
      total + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0),
    0,
  );

  const handleRemove = async (productId) => {
    try {
      await removeItem(productId);
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not remove item");
    }
  };

  const handleDecrease = async (productId, quantity) => {
    try {
      await updateItem(productId, quantity - 1);
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not update cart");
    }
  };

  const handleIncrease = async (productId, quantity) => {
    try {
      await updateItem(productId, quantity + 1);
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not update cart");
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back button */}
        <button
          type="button"
          onClick={() => nav(-1)}
          className="mb-6 text-sm font-semibold text-brand hover:underline"
        >
          ← Back
        </button>

        <h1 className="font-serif text-4xl font-bold">Your Cart</h1>

        {!count || items.length === 0 ? (
          <div className="card p-10 text-center mt-7">
            <p className="text-ink-soft">Your cart is empty.</p>

            <Link to="/products" className="btn-primary mt-4 inline-block">
              Browse foods
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_330px] gap-6 mt-7">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const product = item.product;
                const productId = product?._id;

                return (
                  <div
                    className="card p-4 flex gap-4 items-center"
                    key={productId}
                  >
                    <img
                      src={resolveImage(product?.images?.[0])}
                      alt={product?.name || "Product"}
                      className="w-20 h-20 rounded-xl object-cover bg-brand-tint"
                    />

                    <div className="flex-1">
                      <b>{product?.name || "Product unavailable"}</b>

                      <div className="text-sm text-ink-soft">
                        ₹{product?.price || 0}
                        {product?.unit ? ` · ${product.unit}` : ""}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          className="btn-outline px-3 py-1"
                          onClick={() =>
                            handleDecrease(productId, item.quantity)
                          }
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          className="btn-outline px-3 py-1"
                          onClick={() =>
                            handleIncrease(productId, item.quantity)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-red-600 text-sm"
                      onClick={() => handleRemove(productId)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="card p-6 h-fit">
              <h2 className="font-serif text-2xl font-bold">Summary</h2>

              <div className="flex justify-between mt-5">
                <span>Items</span>
                <b>₹{subtotal.toFixed(0)}</b>
              </div>

              <p className="text-xs text-ink-soft mt-3">
                Subscription payments are separate and are never added to this
                cart total.
              </p>

              <button
                type="button"
                onClick={() => nav("/checkout")}
                className="btn-primary w-full mt-5"
              >
                Continue to checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
