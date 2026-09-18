import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";
import * as os from "../services/orderService.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await os.getOrders();
        setOrders(data);
      } catch (e) {
        toast.error(e.friendlyMessage || "Could not load orders");
      }
    };

    loadOrders();
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-semibold text-brand hover:underline"
        >
          ← Back
        </button>

        <h1 className="font-serif text-4xl font-bold">My Orders</h1>

        <div className="space-y-4 mt-7">
          {orders.map((o) => (
            <Link
              to={`/orders/${o._id}`}
              className="card p-5 flex items-center justify-between gap-4"
              key={o._id}
            >
              <div>
                <b>#{o.orderNumber}</b>

                <p className="text-sm text-ink-soft mt-1">
                  {new Date(o.createdAt).toLocaleString()}
                </p>

                <p className="text-sm mt-2">
                  {o.items?.length || 0} item(s) · ₹{o.totalAmount}
                </p>
              </div>

              <span className="text-brand font-bold text-sm">
                {o.orderStatus} →
              </span>
            </Link>
          ))}

          {!orders.length && (
            <div className="card p-8 text-center text-ink-soft">
              No orders yet.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
