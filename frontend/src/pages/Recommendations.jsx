import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";

import { useAuth } from "../context/AuthContext.jsx";
import * as rec from "../services/recommendationService.js";
import * as subs from "../services/subscriptionService.js";

export default function Recommendations() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const recommendations = await rec.getRecommendations();
        setData(recommendations);
      } catch (e) {
        toast.error(e.friendlyMessage || "Could not load recommendations");
      }

      try {
        const subscription = await subs.getMine();
        setPlans(subscription ? [subscription] : []);
      } catch (e) {
        setPlans([]);
      }
    };

    loadRecommendations();
  }, []);

  const goalLabel = {
    "weight-gain": "Weight Gain",
    "weight-loss": "Weight Loss",
    fitness: "Physical Fitness / Gym",
    pcos: "PCOS / PCOD",
  };

  if (!data) {
    return (
      <Layout>
        <div className="p-10">Loading recommendations...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <span className="badge">Personalized for you</span>

        <h1 className="font-serif text-4xl font-bold mt-3">
          Hi, {user?.name?.split(" ")[0]}
        </h1>

        {!data.goal ? (
          <div className="card p-7 mt-6">
            <p>{data.message}</p>

            <Link to="/onboarding" className="btn-primary mt-4">
              Complete profile
            </Link>
          </div>
        ) : (
          <>
            <div className="card p-6 mt-6 bg-brand-tint">
              <b>Your goal</b>

              <div className="text-2xl font-serif font-bold text-brand-dark mt-1">
                {goalLabel[data.goal]}
              </div>

              {plans[0] && (
                <p className="text-sm mt-2">
                  Active {plans[0].plan?.name} subscription · ₹
                  {plans[0].amountPaid} paid
                </p>
              )}
            </div>

            <section className="mt-8">
              <h2 className="font-serif text-2xl font-bold">
                Your Personalized Diet Boxes
              </h2>

              <p className="text-sm text-ink-soft mt-1">
                These are matched to your goal. Quantities, timing and price are
                shown for transparency.
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                {data.boxes?.map((box) => (
                  <div className="card p-5" key={box._id}>
                    <span className="text-xs font-bold text-brand">
                      {box.timeSlot}
                    </span>

                    <h3 className="font-bold mt-2">{box.name}</h3>

                    <p className="text-sm text-ink-soft mt-2">
                      {box.description}
                    </p>

                    <ul className="text-sm mt-3 space-y-1">
                      {box.items?.map((item, index) => (
                        <li key={index}>
                          • {item.product?.name} × {item.quantity}
                          <span className="text-ink-soft">
                            {" "}
                            ({item.portion})
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* <div className="mt-4 font-bold">₹{box.price}</div> */}

                    <p className="text-xs text-ink-soft mt-2">
                      {box.transparency}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6 mt-8">
              <h2 className="font-serif text-2xl font-bold">
                Diet Transparency
              </h2>

              <p className="text-sm text-ink-soft mt-2">
                NutriSphere recommends foods from your selected goal. Milkshakes
                are not included in subscription/custom diet boxes. Subscription
                pricing is separate from individual cart items.
              </p>
            </section>

            {plans[0]?.plan?.billingCycle === "yearly" && (
              <section className="card p-6 mt-5">
                <b>Yearly continuation</b>

                <p className="text-sm text-ink-soft mt-1">
                  Your yearly plan can continue automatically each month or ask
                  you before the next month. Manage this in Profile.
                </p>

                <button
                  onClick={() =>
                    subs
                      .setContinuation("auto")
                      .then(() => toast.success("Auto-continue enabled"))
                      .catch((e) => toast.error(e.friendlyMessage))
                  }
                  className="btn-outline mt-3"
                >
                  Continue automatically
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
