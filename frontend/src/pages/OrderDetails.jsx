import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../components/Layout.jsx";
import * as os from "../services/orderService.js";
import * as rs from "../services/reviewService.js";

export default function OrderDetails() {
  const { id } = useParams();

  const [o, setO] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [submittedFeedback, setSubmittedFeedback] = useState({});

  const getProductId = (product) => {
    if (!product) return null;

    if (typeof product === "object") {
      return product._id || null;
    }

    return product;
  };

  const load = async () => {
    try {
      const order = await os.getOrder(id);
      setO(order);
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not load order.");
      return;
    }

    // Load existing reviews separately.
    // A review-loading error should NOT make the order itself fail.
    try {
      const reviews = await rs.getMyReviews();

      const submitted = {};

      reviews
        .filter((review) => {
          const reviewOrderId =
            typeof review.order === "object" ? review.order?._id : review.order;

          return reviewOrderId?.toString() === id?.toString();
        })
        .forEach((review) => {
          const productId =
            typeof review.product === "object"
              ? review.product?._id
              : review.product;

          if (productId) {
            submitted[productId.toString()] = true;
          }
        });

      setSubmittedFeedback(submitted);
    } catch (e) {
      console.error("Could not load existing reviews:", e);
    }
  };

  useEffect(() => {
    load();

    const t = setInterval(load, 20000);

    return () => clearInterval(t);
  }, [id]);

  if (!o) {
    return (
      <Layout>
        <div className="p-10">Loading...</div>
      </Layout>
    );
  }

  const reviewable = o.orderStatus === "Delivered";

  const submit = async (productId) => {
    if (!productId) {
      toast.error("Product information is unavailable.");
      return;
    }

    const currentFeedback = feedback[productId] || {
      rating: 5,
      comment: "",
    };

    try {
      //console.log("FEEDBACK BEING SENT:", currentFeedback.comment);

      await rs.createReview({
        orderId: id,
        productId,
        rating: currentFeedback.rating,
        comment: currentFeedback.comment,
      });

      toast.success("Thanks for your feedback!");

      // Hide this product's feedback form
      setSubmittedFeedback((prev) => ({
        ...prev,
        [productId.toString()]: true,
      }));

      // Clear this product's entered feedback
      setFeedback((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not submit feedback.");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* ORDER TITLE */}
        <h1 className="font-serif text-4xl font-bold">
          Order #{o.orderNumber}
        </h1>

        {/* ORDER TRACKING */}
        <div className="card p-6 mt-6">
          <div className="text-brand font-bold">{o.orderStatus}</div>

          <div className="mt-5 space-y-3">
            {o.tracking?.map((e, index) => (
              <div
                key={`${e.status}-${e.timestamp || index}`}
                className="flex gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-brand mt-2" />

                <div>
                  <b>{e.status}</b>

                  <div className="text-xs text-ink-soft">
                    {new Date(e.timestamp).toLocaleString()}
                  </div>

                  {e.note && <p className="text-sm text-ink-soft">{e.note}</p>}
                </div>
              </div>
            ))}
          </div>

          {o.estimatedArrivalAt && (
            <p className="text-sm mt-5">
              Estimated arrival:{" "}
              <b>{new Date(o.estimatedArrivalAt).toLocaleTimeString()}</b>
            </p>
          )}
        </div>

        {/* ORDER ITEMS */}
        <div className="card p-6 mt-5">
          <h2 className="font-serif text-2xl font-bold">Items</h2>

          {o.items?.map((item, index) => {
            const productId = getProductId(item.product);

            return (
              <div
                key={productId || `${item.name || "item"}-${index}`}
                className="py-3 border-b last:border-0 flex justify-between"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

                <b>₹{item.price * item.quantity}</b>
              </div>
            );
          })}

          <div className="flex justify-between pt-4">
            <b>Total</b>
            <b>₹{o.totalAmount}</b>
          </div>
        </div>

        {/* CUSTOMER FEEDBACK */}
        {reviewable && (
          <div className="card p-6 mt-5">
            <h2 className="font-serif text-2xl font-bold">Rate & Feedback</h2>

            <p className="text-sm text-ink-soft mt-1">
              A quick rating helps us improve.
            </p>

            {o.items?.map((item, index) => {
              const productId = getProductId(item.product);
              const productKey = productId?.toString();

              const currentFeedback = feedback[productKey] || {
                rating: 5,
                comment: "",
              };

              const alreadySubmitted = submittedFeedback[productKey] === true;

              return (
                <div
                  key={
                    productId || `${item.name || "product"}-feedback-${index}`
                  }
                  className="border-t mt-4 pt-4"
                >
                  <b>{item.name}</b>

                  {alreadySubmitted ? (
                    <p className="text-sm text-brand font-medium mt-3">
                      ✓ Feedback submitted. Thank you!
                    </p>
                  ) : (
                    <>
                      {/* STAR RATING */}
                      <div className="flex gap-1 text-2xl mt-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              setFeedback((prev) => ({
                                ...prev,
                                [productKey]: {
                                  ...currentFeedback,
                                  rating: n,
                                },
                              }))
                            }
                            className={
                              n <= currentFeedback.rating
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      {/* COMMENT */}
                      <textarea
                        className="input mt-3"
                        rows="2"
                        placeholder="Short feedback (optional)"
                        value={currentFeedback.comment}
                        onChange={(e) =>
                          setFeedback((prev) => ({
                            ...prev,
                            [productKey]: {
                              ...currentFeedback,
                              comment: e.target.value,
                            },
                          }))
                        }
                      />

                      {/* SUBMIT */}
                      <button
                        type="button"
                        onClick={() => submit(productId)}
                        className="btn-primary mt-3"
                        disabled={!productId}
                      >
                        Submit feedback
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
