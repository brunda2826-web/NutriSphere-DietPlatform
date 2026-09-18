import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import * as sub from "../services/subscriptionService.js";
import * as auth from "../services/authService.js";
import * as os from "../services/orderService.js";
export default function Profile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [s, setS] = useState(null),
    [orders, setOrders] = useState([]);
  useEffect(() => {
    sub
      .getSubscription()
      .then(setS)
      .catch(() => {});
    os.getOrders()
      .then(setOrders)
      .catch(() => {});
  }, []);
  const doDelete = async () => {
    if (!confirm("Delete your NutriSphere account permanently?")) return;
    try {
      await auth.deleteAccount();
      logout();
      nav("/");
    } catch (e) {
      toast.error(e.friendlyMessage);
    }
  };
  const yearlyDecision = async (decision, dontAskAgain = false) => {
    try {
      const d = await sub.yearlyMonthlyDecision({ decision, dontAskAgain });
      if (d.action === "pay-monthly") {
        toast.success(
          `Yearly switch processed. Eligible refund: ₹${d.refundAmount}`,
        );
      } else
        toast.success(
          decision === "stop" ? "Subscription stopped" : "Continuation saved",
        );
      setS(await sub.getSubscription());
    } catch (e) {
      toast.error(e.friendlyMessage);
    }
  };
  const cancel = async () => {
    if (!confirm("Cancel this monthly subscription?")) return;
    try {
      const d = await sub.cancelMonthly("Customer requested cancellation");
      toast.success(
        `Cancellation processed. Eligible refund: ₹${d.refundAmount}`,
      );
      setS(await sub.getSubscription());
    } catch (e) {
      toast.error(e.friendlyMessage);
    }
  };
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-end">
          <div>
            <span className="badge">Account</span>
            <h1 className="font-serif text-4xl font-bold mt-2">{user?.name}</h1>
            <p className="text-ink-soft mt-1">
              {user?.email} · {user?.phone}
            </p>
          </div>
          <Link to="/edit-profile" className="btn-outline">
            Edit Profile
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-5 mt-7">
          <div className="card p-6">
            <h2 className="font-serif text-2xl font-bold">Profile</h2>
            <div className="text-sm text-ink-soft mt-3 space-y-1">
              <p>Age: {user?.age || "—"}</p>
              <p>Height: {user?.height || "—"} cm</p>
              <p>Current weight: {user?.weight || "—"} kg</p>
              <p>Goal: {user?.goal || "—"}</p>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-serif text-2xl font-bold">Quick actions</h2>
            <div className="grid gap-2 mt-4">
              <Link className="btn-outline" to="/addresses">
                Manage Address
              </Link>
              <Link className="btn-outline" to="/orders">
                View Orders & Track
              </Link>
            </div>
          </div>
        </div>
        <div className="card p-6 mt-5">
          <h2 className="font-serif text-2xl font-bold">Subscription</h2>
          {s?.subscription ? (
            <>
              <p className="mt-3">
                <b>{s.subscription.planCode}</b> · ₹{s.subscription.amountPaid}{" "}
                · {s.subscription.status}
              </p>
              <p className="text-sm text-ink-soft">
                Started{" "}
                {new Date(s.subscription.startedAt).toLocaleDateString()} · Ends{" "}
                {new Date(s.subscription.endsAt).toLocaleDateString()}
              </p>
              <p className="text-sm mt-2">
                Continuation preference: {s.subscription.continuationPreference}
              </p>
              {s.subscription.planCode === "yearly" &&
                s.subscription.monthlyPromptDueAt && (
                  <div className="bg-brand-tint rounded-xl p-4 mt-4">
                    <b>Monthly continuation decision</b>
                    <p className="text-sm text-ink-soft mt-1">
                      Choose whether you want the next month's diet box to
                      continue. If you don't respond, future diet-box deliveries
                      pause.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        className="btn-primary text-sm"
                        onClick={() => yearlyDecision("continue", false)}
                      >
                        Yes, continue
                      </button>
                      <button
                        className="btn-outline text-sm"
                        onClick={() => yearlyDecision("continue", true)}
                      >
                        Yes, continue — Don’t ask me again
                      </button>
                      <button
                        className="btn-outline text-sm"
                        onClick={() => yearlyDecision("change-to-monthly")}
                      >
                        Change to monthly
                      </button>
                      <button
                        className="text-red-600 text-sm font-semibold"
                        onClick={() => yearlyDecision("stop")}
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                )}
              <div className="flex flex-wrap gap-2 mt-4">
                {s.subscription.planCode === "monthly" && (
                  <button onClick={cancel} className="btn-outline">
                    Cancel monthly
                  </button>
                )}
                {s.subscription.planCode === "yearly" && (
                  <button
                    onClick={() =>
                      sub
                        .setContinuation("auto")
                        .then(() => {
                          toast.success("Auto-continue enabled");
                          setS({
                            ...s,
                            subscription: {
                              ...s.subscription,
                              continuationPreference: "auto",
                            },
                          });
                        })
                        .catch((e) => toast.error(e.friendlyMessage))
                    }
                    className="btn-outline"
                  >
                    Yes, continue — Don’t ask me again
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-ink-soft mt-3">No active subscription.</p>
          )}
        </div>
        <div className="card p-6 mt-5">
          <h2 className="font-serif text-2xl font-bold">Recent Orders</h2>
          {orders.slice(0, 5).map((o) => (
            <Link
              key={o._id}
              to={`/orders/${o._id}`}
              className="flex justify-between py-3 border-b last:border-0"
            >
              <span>#{o.orderNumber}</span>
              <span className="text-brand font-semibold">{o.orderStatus}</span>
            </Link>
          ))}
          {!orders.length && (
            <p className="text-sm text-ink-soft mt-3">No orders yet.</p>
          )}
        </div>
        <div className="flex justify-end gap-4 mt-7">
          <button
            onClick={() => {
              logout();
              nav("/");
            }}
            className="btn-outline"
          >
            Log Out
          </button>
          <button onClick={doDelete} className="text-red-600 font-semibold">
            Delete Account
          </button>
        </div>
      </div>
    </Layout>
  );
}
