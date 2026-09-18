import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";
import { useCart } from "../context/CartContext.jsx";
import * as ps from "../services/productService.js";
import * as cs from "../services/categoryService.js";
import { resolveImage } from "../constants/imageMap.js";

export default function Products() {
  const [sp] = useSearchParams();
  const { addItem } = useCart();

  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [category, setCategory] = useState(sp.get("category") || "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cs.getCategories()
      .then(setCats)
      .catch((e) =>
        toast.error(e.friendlyMessage || "Could not load categories"),
      );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);

      ps.getProducts({
        category: category || undefined,
        search: search.trim() || undefined,
      })
        .then(setProducts)
        .catch((e) =>
          toast.error(e.friendlyMessage || "Could not load products"),
        )
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [category, search]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-serif text-4xl font-bold">Browse fresh foods</h1>

        <p className="text-ink-soft mt-2">
          Choose individual items separately from your subscribed diet box.
        </p>

        {/* Search + Categories */}
          <div className="card p-5 mt-6">
          {/* <label className="label">Search products</label> */}

          <div className="relative mt-2">
            {/* <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fruits, dry fruits, juices..."
              className="input pr-10"
            /> */}

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-brand-dark"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setCategory("")}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                !category
                  ? "bg-brand text-white"
                  : "bg-brand-tint text-brand-dark"
              }`}
            >
              All
            </button>

            {cats.map((c) => (
              <button
                key={c._id}
                onClick={() => setCategory(category === c._id ? "" : c._id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  category === c._id
                    ? "bg-brand text-white"
                    : "bg-brand-tint text-brand-dark"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5 mt-6">
          <h2 className="font-serif text-2xl font-bold">Diet transparency</h2>

          <p className="text-sm text-ink-soft mt-2">
            Products show exact unit, ingredients/benefits where configured,
            price and availability. Custom Box recommendations use only Fruits,
            Dry Fruits & Nuts and normal Juices. Milkshakes are browse-only.
          </p>
        </div>

        {loading ? (
          <p className="py-10 text-ink-soft">Loading...</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-7">
            {products.map((p) => {
              const img = resolveImage(p.images?.[0]);

              const price =
                p.price - (p.price * (p.discountPercent || 0)) / 100;

              return (
                <div key={p._id} className="card overflow-hidden flex flex-col">
                  <div className="aspect-square bg-brand-tint">
                    {img && (
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="p-4 flex-1">
                    <div className="text-xs text-ink-soft">
                      {p.category?.name}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold mt-1">{p.name}</h3>

                      {p.isNewArrival && (
                        <span className="text-[10px] bg-brand-tint text-brand-dark px-2 py-1 rounded-full font-bold">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-ink-soft mt-1">{p.unit}</p>

                    <div className="mt-2 font-bold text-brand-dark">
                      ₹{price.toFixed(0)}
                    </div>

                    {p.stock <= 0 && (
                      <span className="text-xs text-red-600">Out of stock</span>
                    )}
                  </div>

                  <div className="p-4 pt-0 flex gap-2">
                    <Link
                      to={`/products/${p._id}`}
                      className="btn-outline text-xs flex-1"
                    >
                      Details
                    </Link>

                    <button
                      disabled={p.stock <= 0}
                      onClick={() =>
                        addItem(p._id)
                          .then(() => toast.success("Added to cart"))
                          .catch((e) =>
                            toast.error(
                              e.friendlyMessage || "Could not add to cart",
                            ),
                          )
                      }
                      className="btn-primary text-xs flex-1 disabled:opacity-40"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !products.length && (
          <p className="py-12 text-center text-ink-soft">
            {search
              ? `No products found for "${search}".`
              : "No products match those filters."}
          </p>
        )}
      </div>
    </Layout>
  );
}
