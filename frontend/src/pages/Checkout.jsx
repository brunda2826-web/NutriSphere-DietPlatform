import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";
import * as as from "../services/addressService.js";
import * as os from "../services/orderService.js";
import * as pay from "../services/paymentService.js";
import { useCart } from "../context/CartContext.jsx";

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();

    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.body.appendChild(s);
  });

export default function Checkout() {
  const { cart, setCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [loading, setLoading] = useState(false);

 const subtotal =
   cart.items?.reduce((total, item) => {
     if (!item.product) return total;

     const price =
       item.product.price -
       (item.product.price * (item.product.discountPercent || 0)) / 100;

     return total + price * item.quantity;
   }, 0) || 0;

  // Load saved addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const data = await as.getAddresses();

        setAddresses(data);

        const defaultAddress = data.find((item) => item.isDefault);

        setAddressId(defaultAddress?._id || data[0]?._id || "");
      } catch (e) {
        toast.error(e.friendlyMessage || "Could not load addresses");
      }
    };

    loadAddresses();
  }, []);

  const place = async () => {
    if (!addressId) {
      toast.error("Select a delivery address");
      return;
    }

    if (!cart.items?.length) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);

    try {
      const payment = await pay.createPaymentOrder(subtotal);

      // Demo payment
      if (payment.provider === "demo") {
        const order = await os.createOrder({
          addressId,
          paymentMethod: "demo",
          paymentReference: payment.order.id,
        });
        setCart({items:[]});

        navigate(`/order-confirmation/${order._id}`);
        return;
      }

      // Razorpay
      await loadRazorpay();

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!key) {
        throw new Error(
          "VITE_RAZORPAY_KEY_ID is required for Razorpay checkout.",
        );
      }

      const razorpayOrder = payment.order;

      const selectedAddress = addresses.find(
        (address) => address._id === addressId,
      );

      const razorpay = new window.Razorpay({
        key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "NutriSphere",
        description: "NutriSphere food order",

        order_id: razorpayOrder.id,

        prefill: {
          name: selectedAddress?.fullName || "",
          email: "",
          contact: selectedAddress?.phone || "",
        },

        handler: async (response) => {
          try {
            await pay.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            const order = await os.createOrder({
              addressId,
              paymentMethod: "razorpay",
              paymentReference: response.razorpay_payment_id,
            });

           setCart({items:[]});

            navigate(`/order-confirmation/${order._id}`);
          } catch (e) {
            toast.error(e.friendlyMessage || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
      });

      razorpay.open();
    } catch (e) {
      toast.error(e.friendlyMessage || "Checkout failed");

      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
        >
          <span className="text-lg">←</span>
          Back
        </button>

        <h1 className="font-serif text-4xl font-bold">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-6 mt-7">
          {/* Delivery address */}
          <div className="card p-6">
            <h2 className="font-serif text-2xl font-bold">Delivery address</h2>

            {addresses.length ? (
              <div className="space-y-3 mt-5">
                {addresses.map((address) => (
                  <label
                    key={address._id}
                    className={`block border rounded-xl p-4 cursor-pointer ${
                      addressId === address._id
                        ? "border-brand bg-brand-tint"
                        : "border-black/10"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={addressId === address._id}
                      onChange={() => setAddressId(address._id)}
                    />

                    <span className="ml-2 font-semibold">{address.label}</span>

                    <p className="text-sm text-ink-soft mt-1 ml-5">
                      {address.addressLine1}, {address.city}, {address.state}{" "}
                      {address.postalCode}
                    </p>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft mt-4">
                No saved address. Add one from Profile.
              </p>
            )}
          </div>

          {/* Payment summary */}
          <div className="card p-6 h-fit">
            <h2 className="font-serif text-2xl font-bold">Payment summary</h2>

            <div className="flex justify-between mt-5">
              <span>Items</span>
              <b>₹{subtotal.toFixed(0)}</b>
            </div>

            <p className="text-xs text-ink-soft mt-4">
              Delivery fee is configured by NutriSphere. Subscription charges
              are not included.
            </p>

            <button
              type="button"
              onClick={place}
              className="btn-primary w-full mt-5"
              disabled={loading || !addresses.length}
            >
              {loading ? "Processing..." : "Pay & place order"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
