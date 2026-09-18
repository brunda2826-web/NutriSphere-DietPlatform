import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Layout from "../components/Layout.jsx";
import * as ps from "../services/productService.js";
import { useCart } from "../context/CartContext.jsx";
import { resolveImage } from "../constants/imageMap.js";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [p, setP] = useState(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const product = await ps.getProduct(id);
        setP(product);
      } catch (e) {
        toast.error(e.friendlyMessage || "Could not load product");
      }
    };

    loadProduct();
  }, [id]);

  if (!p) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="p-10 text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  const img = resolveImage(p.images?.[0]);

  const finalPrice = p.price - (p.price * (p.discountPercent || 0)) / 100;

  const isAvailable = p.stock > 0;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="btn-outline text-sm mb-6"
        >
          ← Back
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* IMAGE */}
          <div className="card overflow-hidden">
            <img
              src={img}
              alt={p.name}
              className="w-full aspect-square object-cover"
            />
          </div>

          {/* DETAILS */}
          <div>
            <div className="text-sm text-ink-soft">{p.category?.name}</div>

            <h1 className="font-serif text-4xl font-bold mt-2">{p.name}</h1>

            <p className="mt-3 text-ink-soft">{p.description}</p>

            {/* PRICE */}
            <div className="text-2xl font-bold text-brand mt-5">
              ₹{finalPrice.toFixed(0)}
              <span className="text-sm text-ink-soft"> / {p.unit}</span>
            </div>

            {/* AVAILABILITY */}
            <div className="card p-5 mt-6">
              <b>Availability</b>

              <p
                className={`text-sm mt-2 font-semibold ${
                  isAvailable ? "text-green-600" : "text-red-500"
                }`}
              >
                {isAvailable ? "● Available" : "● Currently unavailable"}
              </p>
            </div>

            {/* NUTRITION */}
            {p.nutrition && (
              <div className="card p-5 mt-5">
                <h2 className="font-semibold text-lg">Nutrition</h2>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  {p.nutrition.calories != null && (
                    <NutritionItem
                      label="Calories"
                      value={`${p.nutrition.calories} kcal`}
                    />
                  )}

                  {p.nutrition.protein != null && (
                    <NutritionItem
                      label="Protein"
                      value={`${p.nutrition.protein} g`}
                    />
                  )}

                  {p.nutrition.carbohydrates != null && (
                    <NutritionItem
                      label="Carbohydrates"
                      value={`${p.nutrition.carbohydrates} g`}
                    />
                  )}

                  {p.nutrition.fat != null && (
                    <NutritionItem label="Fat" value={`${p.nutrition.fat} g`} />
                  )}

                  {p.nutrition.fiber != null && (
                    <NutritionItem
                      label="Fiber"
                      value={`${p.nutrition.fiber} g`}
                    />
                  )}

                  {p.nutrition.sugar != null && (
                    <NutritionItem
                      label="Sugar"
                      value={`${p.nutrition.sugar} g`}
                    />
                  )}

                  {p.nutrition.calcium != null && (
                    <NutritionItem
                      label="Calcium"
                      value={`${p.nutrition.calcium} mg`}
                    />
                  )}

                  {p.nutrition.iron != null && (
                    <NutritionItem
                      label="Iron"
                      value={`${p.nutrition.iron} mg`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* INGREDIENTS */}
            {p.ingredients?.length > 0 && (
              <div className="card p-5 mt-5">
                <h2 className="font-semibold text-lg">Ingredients</h2>

                <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                  {p.ingredients.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* BENEFITS */}
            {p.benefits?.length > 0 && (
              <div className="card p-5 mt-5">
                <h2 className="font-semibold text-lg">Benefits</h2>

                <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                  {p.benefits.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ADD TO CART */}
            <button
              disabled={!isAvailable}
              onClick={() =>
                addItem(p._id)
                  .then(() => toast.success("Added to cart"))
                  .catch((e) =>
                    toast.error(
                      e.friendlyMessage || "Could not add item to cart",
                    ),
                  )
              }
              className="btn-primary mt-6 w-full disabled:opacity-40"
            >
              {isAvailable ? "Add to Cart" : "Currently Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function NutritionItem({ label, value }) {
  return (
    <div className="rounded-xl bg-brand-tint/40 p-3">
      <div className="text-xs text-ink-soft">{label}</div>

      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
