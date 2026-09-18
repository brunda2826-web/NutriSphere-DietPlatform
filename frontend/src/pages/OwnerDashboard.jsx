import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import OwnerLayout from "../components/OwnerLayout.jsx";
import api from "../services/api.js";
export default function OwnerDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/owner/dashboard");
        setD(response.data.data);
      } catch (e) {
        toast.error(e.friendlyMessage || "Could not load dashboard");
      }
    };

    loadDashboard();
  }, []);
  return (
    <OwnerLayout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between">
          <div>
            <span className="badge">Owner / Seller</span>
            <h1 className="font-serif text-4xl font-bold mt-2">
              NutriSphere Operations
            </h1>
          </div>
          
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-7">
          {[
            ["Customers", d?.customers],
            ["Orders", d?.orders],
            ["Products", d?.products],
            ["Reviews", d?.reviews],
          ].map(([n, v]) => (
            <div className="card p-6" key={n}>
              <div className="text-sm text-ink-soft">{n}</div>
              <div className="text-3xl font-serif font-bold mt-2">
                {v ?? "—"}
              </div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-7">
          {["orders", "products", "customers", "reviews", "subscriptions"].map(
            (x) => (
              <Link
                className="card p-5 font-bold hover:border-brand border"
                key={x}
                to={`/owner/${x}`}
              >
                {x[0].toUpperCase() + x.slice(1)} →
              </Link>
            ),
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
