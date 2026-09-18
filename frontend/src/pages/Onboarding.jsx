import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../components/Layout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import * as auth from "../services/authService.js";
import * as sub from "../services/subscriptionService.js";

export default function Onboarding() {
  const { user, save } = useAuth();
  const nav = useNavigate();

  const [plans, setPlans] = useState([]);
  const [f, setF] = useState({
    name: user?.name || "",
    age: user?.age || "",
    gender: user?.gender || "Female",
    height: user?.height || "",
    weight: user?.weight || "",
    goal: user?.goal || "weight-gain",
  });

  const [planCode, setPlanCode] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);

  useEffect(() => {
    sub
      .getSubscription()
      .then((d) => setPlans(d.plans || []))
      .catch(() => {});
  }, []);

  const selectedPlan = plans.find((p) => p.code === planCode);

  const continueToPayment = async (e) => {
    e.preventDefault();

    if (!plans.length) {
      toast.error("Subscription plans are unavailable");
      return;
    }

    if (!selectedPlan) {
      toast.error("Please choose a subscription plan");
      return;
    }

    setPaymentStep(true);
  };

  const completeDemoPayment = async () => {
    setLoading(true);

    try {
      const u = await auth.updateProfile({
        ...f,
        profileCompleted: false,
      });

      save(u);

      const c = await sub.checkout(planCode);

      if (c.result.provider === "demo") {
        await sub.activate({
          planCode,
          orderId: c.result.order?.id,
          paymentId: c.result.order?.id,
          signature: "",
        });

        const completed = await auth.updateProfile({
          profileCompleted: true,
        });

        save(completed);

        toast.success("Payment successful — subscription activated");

        nav("/recommend");
        return;
      }

      const r = c.result.order;

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!key) {
        throw new Error(
          "VITE_RAZORPAY_KEY_ID is required for Razorpay checkout.",
        );
      }

      await new Promise((resolve, reject) => {
        const existing = document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
        );

        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement("script");

        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = resolve;

        script.onerror = () =>
          reject(new Error("Could not load Razorpay checkout."));

        document.body.appendChild(script);
      });

      const rz = new window.Razorpay({
        key,
        amount: r.amount,
        currency: r.currency || "INR",
        name: "NutriSphere",
        description: c.plan.name,
        prefill: {
          name: u.name,
          email: u.email,
          contact: u.phone,
        },
        order_id: r.id,

        handler: async (response) => {
          try {
            await sub.activate({
              planCode,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            const completed = await auth.updateProfile({
              profileCompleted: true,
            });

            save(completed);

            toast.success("Payment successful — subscription activated");

            nav("/recommend");
          } catch (err) {
            toast.error(
              err.friendlyMessage || "Subscription activation failed",
            );
          }
        },

        modal: {
          ondismiss: () => toast.error("Payment cancelled"),
        },
      });

      rz.open();
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not complete payment");
    } finally {
      setLoading(false);
    }
  };

  const backToPlans = () => {
    if (!loading) {
      setPaymentStep(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {!paymentStep ? (
          <>
            <div className="mb-7">
              <span className="badge">Profile setup</span>

              <h1 className="font-serif text-4xl font-bold mt-2">
                Tell us what you need
              </h1>

              <p className="text-ink-soft mt-2">
                No dietary-preference questionnaire — just the profile details
                needed for your goal.
              </p>
            </div>

            <form onSubmit={continueToPayment} className="card p-7 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["name", "Name"],
                  ["age", "Age"],
                  ["height", "Height (cm)"],
                  ["weight", "Current weight (kg)"],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="label">{l}</label>

                    <input
                      className="input"
                      type={k === "name" ? "text" : "number"}
                      value={f[k]}
                      onChange={(e) =>
                        setF({
                          ...f,
                          [k]: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Gender</label>

                <select
                  className="input"
                  value={f.gender}
                  onChange={(e) =>
                    setF({
                      ...f,
                      gender: e.target.value,
                    })
                  }
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="label">Your goal</label>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    ["weight-gain", "Weight Gain"],
                    ["weight-loss", "Weight Loss"],
                    ["fitness", "Physical Fitness / Gym"],
                    ["pcos", "PCOS / PCOD"],
                  ].map(([v, l]) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() =>
                        setF({
                          ...f,
                          goal: v,
                        })
                      }
                      className={`p-4 rounded-xl border text-left ${
                        f.goal === v
                          ? "border-brand bg-brand-tint"
                          : "border-black/10"
                      }`}
                    >
                      <b>{l}</b>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Choose your diet subscription</label>

                <div className="grid sm:grid-cols-2 gap-4">
                  {plans.map((p) => (
                    <button
                      type="button"
                      key={p.code}
                      onClick={() => setPlanCode(p.code)}
                      className={`card p-5 text-left border-2 ${
                        planCode === p.code
                          ? "border-brand"
                          : "border-transparent"
                      }`}
                    >
                      <b>{p.name}</b>

                      <div className="text-2xl font-serif font-bold mt-2">
                        ₹{p.price}
                      </div>

                      <p className="text-xs text-ink-soft mt-1">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Continue to Payment
              </button>
            </form>
          </>
        ) : (
          <div className="max-w-lg mx-auto">
            <button
              type="button"
              onClick={backToPlans}
              disabled={loading}
              className="btn-outline text-sm mb-6"
            >
              ← Back to Plans
            </button>

            <div className="card p-7">
              <span className="badge">Subscription Payment</span>

              <h1 className="font-serif text-3xl font-bold mt-3">
                Complete your payment
              </h1>

              <p className="text-ink-soft mt-2">
                Review your selected plan before activating your NutriSphere
                subscription.
              </p>

              {selectedPlan && (
                <div className="rounded-2xl bg-brand-tint p-5 mt-6">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-sm text-ink-soft">Selected plan</p>

                      <h2 className="text-xl font-semibold mt-1">
                        {selectedPlan.name}
                      </h2>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-ink-soft">Amount</p>

                      <div className="text-2xl font-bold text-brand-dark">
                        ₹{selectedPlan.price}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-black/10 mt-5 pt-4 text-sm text-ink-soft">
                    <div className="flex justify-between">
                      <span>Subscription</span>
                      <span>₹{selectedPlan.price}</span>
                    </div>

                    <div className="flex justify-between mt-2">
                      <span>Payment mode</span>
                      <span>Demo Payment</span>
                    </div>

                    <div className="flex justify-between mt-3 font-bold text-ink">
                      <span>Total</span>
                      <span>₹{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-black/10 p-4 mt-5 text-sm text-ink-soft">
                <b className="text-ink">Demo payment</b>

                <p className="mt-1">
                  This is a simulated payment for the NutriSphere project. No
                  real money will be charged.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={completeDemoPayment}
                className="btn-primary w-full mt-6"
              >
                {loading
                  ? "Processing Payment..."
                  : `Pay ₹${selectedPlan?.price || 0} & Activate`}
              </button>

              <p className="text-xs text-center text-ink-soft mt-4">
                Your subscription will be activated only after successful
                payment.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
