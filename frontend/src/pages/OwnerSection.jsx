import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import OwnerLayout from "../components/OwnerLayout.jsx";
import api from "../services/api.js";
import * as ps from "../services/productService.js";
import * as os from "../services/orderService.js";
import * as rs from "../services/reviewService.js";
import * as ss from "../services/subscriptionService.js";
import * as cs from "../services/categoryService.js";

const GOALS = [
  ["weight-gain", "Weight Gain"],
  ["weight-loss", "Weight Loss"],
  ["fitness", "Physical Fitness / Gym"],
  ["pcos", "PCOS / PCOD"],
];

const UNIT_OPTIONS = [
  ["g", "Gram (g)"],
  ["kg", "Kilogram (kg)"],
  ["ml", "Millilitre (ml)"],
  ["l", "Litre (L)"],
  ["piece", "Piece"],
];

const emptyProduct = () => ({
  name: "",
  category: "",
  quantity: "",
  unitType: "g",
  price: "",
  discountPercent: 0,
  stock: 0,
  images: [],
  description: "",
  ingredients: [],
  benefits: [],
  suitableGoals: [],
  nutritionalInfo: {
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
    servingSize: "",
  },
  isNewArrival: false,
  isActive: true,
});

function parseUnit(unit) {
  if (!unit) {
    return {
      quantity: "",
      unitType: "g",
    };
  }

  const match = String(unit)
    .trim()
    .match(/^([\d.]+)\s*(g|kg|ml|l|piece)$/i);

  if (!match) {
    return {
      quantity: "",
      unitType: "g",
    };
  }

  return {
    quantity: match[1],
    unitType: match[2].toLowerCase(),
  };
}

function productToForm(product) {
  const parsed = parseUnit(product.unit);

  return {
    ...emptyProduct(),
    ...product,
    category: product.category?._id || product.category || "",
    quantity: parsed.quantity,
    unitType: parsed.unitType,
    price: product.price ?? "",
    discountPercent: product.discountPercent ?? 0,
    stock: product.stock ?? 0,
    images: Array.isArray(product.images) ? product.images : [],
    ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
    benefits: Array.isArray(product.benefits) ? product.benefits : [],
    suitableGoals: Array.isArray(product.suitableGoals)
      ? product.suitableGoals
      : [],
    nutritionalInfo: {
      calories: product.nutritionalInfo?.calories ?? "",
      protein: product.nutritionalInfo?.protein ?? "",
      carbs: product.nutritionalInfo?.carbs ?? "",
      fats: product.nutritionalInfo?.fats ?? "",
      fiber: product.nutritionalInfo?.fiber ?? "",
      servingSize: product.nutritionalInfo?.servingSize ?? "",
    },
    isNewArrival: !!product.isNewArrival,
    isActive: product.isActive !== false,
  };
}

function makeSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function OwnerLocationPicker({ delivery, setDelivery }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!key) {
      toast.error("Google Maps API key is not configured");
      return;
    }

    if (window.google?.maps) {
      setMapReady(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-nutrisphere-google-maps="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setMapReady(true);
      });

      return;
    }

    const script = document.createElement("script");

    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.nutrisphereGoogleMaps = "true";

    script.onload = () => setMapReady(true);

    script.onerror = () => {
      toast.error("Map could not load");
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    const latitude = Number(delivery?.serviceLatitude);
    const longitude = Number(delivery?.serviceLongitude);

    const hasSavedLocation =
      Number.isFinite(latitude) && Number.isFinite(longitude);

    const center = {
      lat: hasSavedLocation ? latitude : 15.1394,
      lng: hasSavedLocation ? longitude : 76.9215,
    };

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: hasSavedLocation ? 16 : 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      map,
      position: center,
      draggable: true,
    });

    markerRef.current = marker;

    marker.addListener("dragend", () => {
      const position = marker.getPosition();

      if (!position) return;

      setDelivery((prev) => ({
        ...prev,
        serviceLatitude: position.lat(),
        serviceLongitude: position.lng(),
      }));
    });

    map.addListener("click", (event) => {
      if (!event.latLng) return;

      marker.setPosition(event.latLng);

      setDelivery((prev) => ({
        ...prev,
        serviceLatitude: event.latLng.lat(),
        serviceLongitude: event.latLng.lng(),
      }));
    });

    const input = document.getElementById("owner-service-address-search");

    if (input && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        fields: ["formatted_address", "geometry", "address_components"],
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry?.location) {
          toast.error("Please select a valid shop address");
          return;
        }

        const location = place.geometry.location;

        map.setCenter(location);
        map.setZoom(16);

        marker.setPosition(location);

        setDelivery((prev) => ({
          ...prev,
          serviceAddress: place.formatted_address || prev.serviceAddress,
          serviceLatitude: location.lat(),
          serviceLongitude: location.lng(),
        }));
      });
    }
  }, [mapReady, delivery, setDelivery]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const location = {
          lat: latitude,
          lng: longitude,
        };

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(location);
          mapInstanceRef.current.setZoom(16);
        }

        if (markerRef.current) {
          markerRef.current.setPosition(location);
        }

        setDelivery((prev) => ({
          ...prev,
          serviceLatitude: latitude,
          serviceLongitude: longitude,
        }));

        toast.success("Shop location selected");
      },
      () => {
        toast.error("Location permission was not available");
      },
    );
  };

  return (
    <div className="mt-4">
      <label className="label">Service Center / Shop Location</label>

      <div className="bg-white border border-black/10 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            id="owner-service-address-search"
            type="text"
            value={delivery?.serviceAddress || ""}
            onChange={(e) =>
              setDelivery((prev) => ({
                ...prev,
                serviceAddress: e.target.value,
              }))
            }
            placeholder="Search your shop or service center address"
            className="input flex-1"
          />

          <button
            type="button"
            onClick={useCurrentLocation}
            className="btn-outline whitespace-nowrap"
          >
            📍 Use My Current Location
          </button>
        </div>

        <div
          ref={mapRef}
          className="h-80 w-full rounded-2xl overflow-hidden bg-bone"
        >
          {!mapReady && (
            <div className="h-full grid place-items-center text-sm text-ink-soft px-6 text-center">
              Loading map...
            </div>
          )}
        </div>

        <div className="mt-3">
          {delivery?.serviceLatitude != null &&
          delivery?.serviceLongitude != null ? (
            <p className="text-sm text-brand-dark font-semibold">
              ✓ Shop location selected. The system will use this location for
              delivery-area checking.
            </p>
          ) : (
            <p className="text-sm text-ink-soft">
              Search your shop address, use your current location, or click the
              map to select the shop location.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OwnerSection() {
  const { section } = useParams();
  const [data, setData] = useState([]);
  const [edit, setEdit] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [categories, setCategories] = useState([]);

  const [delivery, setDelivery] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliverySaving, setDeliverySaving] = useState(false);

  const deliveryMapRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const [deliveryMapReady, setDeliveryMapReady] = useState(false);

  const [savingProduct, setSavingProduct] = useState(false);

  const load = async () => {
    if (section === "orders") {
      const orders = await os.ownerOrders();
      setData(orders || []);
      return;
    }

    if (section === "products") {
      const [categoryData, productResponse] = await Promise.all([
        cs.getCategories(),
        api.get("/products/owner/all"),
      ]);

      setCategories(categoryData || []);
      setData(productResponse.data.data || []);
      return;
    }

    if (section === "customers") {
      const response = await api.get("/owner/customers");
      setData(response.data.data || []);
      return;
    }

    if (section === "reviews") {
      const reviews = await rs.getOwnerReviews();
      setData(reviews || []);
      return;
    }

    if (section === "subscriptions") {
      const subscriptions = await ss.ownerSubscriptions();
      const ownerPlans = await ss.ownerPlans();

      setData(subscriptions || []);
      setPlans(ownerPlans || []);
      return;
    }

    if (section === "delivery") {
      setDeliveryLoading(true);

      try {
        const response = await api.get("/owner/delivery-settings");
        const settings = response.data.data;

        setDelivery({
          serviceLatitude: settings?.serviceLatitude ?? "",
          serviceLongitude: settings?.serviceLongitude ?? "",
          serviceAddress: settings?.serviceAddress ?? "",
          radiusKm: settings?.radiusKm ?? 8,
          deliveryStartHour: settings?.deliveryStartHour ?? 6,
          deliveryEndHour: settings?.deliveryEndHour ?? 20,
          deliveryFee: settings?.deliveryFee ?? 0,
        });
      } finally {
        setDeliveryLoading(false);
      }

      return;
    }

    setData([]);
  };

  useEffect(() => {
    load().catch((e) => {
      toast.error(e.friendlyMessage || "Could not load owner section");
    });
  }, [section]);

  const status = async (id, nextStatus) => {
    try {
      await os.updateOrderStatus(id, nextStatus);

      toast.success("Order status updated");

      await load();
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not update order status");
    }
  };

  const openNewProduct = () => {
    setEdit(emptyProduct());
  };

  const openEditProduct = (product) => {
    setEdit(productToForm(product));
  };

  const toggleGoal = (goal) => {
    setEdit((prev) => {
      if (!prev) return prev;

      const exists = prev.suitableGoals.includes(goal);

      return {
        ...prev,
        suitableGoals: exists
          ? prev.suitableGoals.filter((x) => x !== goal)
          : [...prev.suitableGoals, goal],
      };
    });
  };

  const updateNutrition = (key, value) => {
    setEdit((prev) => ({
      ...prev,
      nutritionalInfo: {
        ...prev.nutritionalInfo,
        [key]: value,
      },
    }));
  };
  const productSave = async (e) => {
    e.preventDefault();

    try {
      const name = String(edit.name || "").trim();

      if (!name) {
        toast.error("Enter item name");
        return;
      }

      if (!edit.category) {
        toast.error("Select an item category");
        return;
      }

      if (!edit.price || Number(edit.price) <= 0) {
        toast.error("Enter a valid price");
        return;
      }

      if (!edit.quantity || Number(edit.quantity) <= 0) {
        toast.error("Enter a valid quantity");
        return;
      }

      const slug =
        edit.slug ||
        name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      const body = {
        ...edit,

        name,
        slug,

        category:
          typeof edit.category === "object" ? edit.category._id : edit.category,

        price: Number(edit.price),
        discountPercent: Number(edit.discountPercent || 0),

        quantity: Number(edit.quantity),

        unit: edit.unit,

        stock: Number(edit.stock || 0),

        images: Array.isArray(edit.images)
          ? edit.images
          : String(edit.images || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),

        description: String(edit.description || "").trim(),

        ingredients: Array.isArray(edit.ingredients)
          ? edit.ingredients
          : String(edit.ingredients || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),

        benefits: Array.isArray(edit.benefits)
          ? edit.benefits
          : String(edit.benefits || "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),

        suitableGoals: Array.isArray(edit.suitableGoals)
          ? edit.suitableGoals
          : [],

        isNewArrival: !!edit.isNewArrival,
        isActive: !!edit.isActive,
      };

      if (edit._id) {
        await ps.updateProduct(edit._id, body);
      } else {
        await ps.createProduct(body);
      }

      setEdit(null);
      await load();

      toast.success(edit._id ? "Item updated" : "Item added");
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not save item");
    }
  };

  const toggleProductAvailability = async (product) => {
    try {
      const nextActive = !product.isActive;

      await ps.updateProduct(product._id, {
        isActive: nextActive,
      });

      setData((prev) =>
        prev.map((item) =>
          item._id === product._id ? { ...item, isActive: nextActive } : item,
        ),
      );

      toast.success(
        nextActive ? "Item is now available" : "Item marked unavailable",
      );
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not update item availability");
    }
  };

  const planSave = async (p) => {
    try {
      await ss.ownerUpdatePlan(p._id, {
        price: Number(p.price),
        description: p.description,
        isActive: p.isActive,
      });

      toast.success("Plan updated");

      await load();
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not update plan");
    }
  };

  const deliverySave = async (e) => {
    e.preventDefault();

    if (!delivery?.serviceAddress?.trim()) {
      toast.error("Enter the service center address");
      return;
    }

    if (delivery.serviceLatitude === "" || delivery.serviceLongitude === "") {
      toast.error("Select the service center location");
      return;
    }

    try {
      setDeliverySaving(true);

      const body = {
        serviceLatitude: Number(delivery.serviceLatitude),

        serviceLongitude: Number(delivery.serviceLongitude),

        serviceAddress: delivery.serviceAddress.trim(),

        radiusKm: Number(delivery.radiusKm),

        deliveryStartHour: Number(delivery.deliveryStartHour),

        deliveryEndHour: Number(delivery.deliveryEndHour),

        deliveryFee: Number(delivery.deliveryFee),
      };

      const response = await api.put("/owner/delivery-settings", body);

      setDelivery(response.data.data);

      toast.success("Delivery settings saved");
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not save delivery settings");
    } finally {
      setDeliverySaving(false);
    }
  };

  const downloadProductsCSV = () => {
    if (!data.length) {
      toast.error("No products available to download");
      return;
    }

    const headers = [
      "Item Name",
      "Category",
      "Quantity",
      "Unit",
      "Price",
      "Discount (%)",
      "Stock",
      "Status",
      "New Arrival",
    ];

    const rows = data.map((x) => [
      x.name || "",
      x.category?.name || "",
      x.quantity ?? "",
      x.unit || "",
      x.price ?? "",
      x.discountPercent ?? 0,
      x.stock ?? 0,
      x.isActive ? "Available" : "Disabled",
      x.isNewArrival ? "Yes" : "No",
    ]);

    const escapeCSV = (value) => `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "nutrisphere-products.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Products CSV downloaded");
  };

  return (
    <OwnerLayout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-serif text-4xl font-bold capitalize">
          {section === "delivery" ? "Delivery Area Settings" : section}
        </h1>

        {/* ================= DELIVERY ================= */}

        {section === "delivery" && (
          <div className="mt-6">
            {deliveryLoading ? (
              <div className="card p-6">
                <p className="text-ink-soft">Loading delivery settings...</p>
              </div>
            ) : (
              <form onSubmit={deliverySave} className="card p-6 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold">
                    Delivery Area Settings
                  </h2>

                  <p className="text-sm text-ink-soft mt-1">
                    Set your shop/service-center location and the area where
                    NutriSphere delivers.
                  </p>
                </div>

                <div>
                  <label className="label">Service Center / Shop Address</label>

                  <p className="text-xs text-ink-soft mb-2">
                    Search and select the exact location of your shop.
                  </p>

                  <OwnerLocationPicker
                    delivery={delivery}
                    setDelivery={setDelivery}
                  />
                </div>

                <div>
                  <label className="label">Delivery Radius</label>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      step="0.5"
                      className="input"
                      value={delivery?.radiusKm ?? 8}
                      onChange={(e) =>
                        setDelivery((prev) => ({
                          ...prev,
                          radiusKm: Number(e.target.value),
                        }))
                      }
                      required
                    />

                    <span className="font-semibold">km</span>
                  </div>

                  <p className="text-xs text-ink-soft mt-1">
                    Customers can order only when their selected delivery
                    address is within this radius from your shop.
                  </p>
                </div>

                <div>
                  <label className="label">Operating Hours</label>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-ink-soft">
                        Opening Time
                      </label>

                      <input
                        type="time"
                        className="input mt-1"
                        value={
                          delivery?.deliveryStartHour !== undefined &&
                          delivery?.deliveryStartHour !== null
                            ? `${String(delivery.deliveryStartHour).padStart(2, "0")}:00`
                            : ""
                        }
                        onChange={(e) => {
                          const hour = Number(e.target.value.split(":")[0]);

                          setDelivery((prev) => ({
                            ...prev,
                            deliveryStartHour: hour,
                          }));
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-ink-soft">
                        Closing Time
                      </label>

                      <input
                        type="time"
                        className="input mt-1"
                        value={
                          delivery?.deliveryEndHour !== undefined &&
                          delivery?.deliveryEndHour !== null
                            ? `${String(delivery.deliveryEndHour).padStart(2, "0")}:00`
                            : ""
                        }
                        onChange={(e) => {
                          const hour = Number(e.target.value.split(":")[0]);

                          setDelivery((prev) => ({
                            ...prev,
                            deliveryEndHour: hour,
                          }));
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-black/10 pt-5">
                  <button
                    type="submit"
                    disabled={deliverySaving}
                    className="btn-primary"
                  >
                    {deliverySaving ? "Saving..." : "Save Delivery Settings"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= PRODUCTS ================= */}
        {/* PRODUCTS */}
        {section === "products" && (
          <>
            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Products / Food Items
                </h2>

                <p className="text-sm text-ink-soft mt-1">
                  Add and manage the individual foods customers can browse and
                  purchase.
                </p>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setEdit({
                    name: "",
                    slug: "",
                    category: "",
                    quantity: "",
                    unit: "g",
                    price: "",
                    discountPercent: 0,
                    stock: 0,
                    images: [],
                    description: "",
                    ingredients: [],
                    benefits: [],
                    suitableGoals: [],
                    isNewArrival: true,
                    isActive: true,
                  })
                }
              >
                + Add Item
              </button>
            </div>

            {edit && (
              <form onSubmit={productSave} className="card p-6 mt-6 space-y-6">
                <div>
                  <h3 className="font-serif text-2xl font-bold">
                    {edit._id ? "Edit Item" : "Add New Item"}
                  </h3>

                  <p className="text-sm text-ink-soft mt-1">
                    Enter the information customers should see while browsing
                    this item.
                  </p>
                </div>

                {/* BASIC ITEM DETAILS */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Item name</label>

                    <input
                      className="input"
                      placeholder="Example: Fresh Apple"
                      value={edit.name || ""}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          name: e.target.value,
                          slug: e.target.value
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, ""),
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Category</label>

                    <select
                      className="input"
                      value={
                        typeof edit.category === "object"
                          ? edit.category._id
                          : edit.category || ""
                      }
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          category: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select category</option>

                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    {!categories.length && (
                      <p className="text-xs text-red-600 mt-1">
                        No categories available. Check your category data.
                      </p>
                    )}
                  </div>
                </div>

                {/* QUANTITY + PRICE */}
                <div>
                  <h4 className="font-semibold">Item quantity & pricing</h4>

                  <p className="text-xs text-ink-soft mt-1">
                    Example: 500 g, 1 kg, 250 ml or 1 piece.
                  </p>

                  <div className="grid sm:grid-cols-4 gap-4 mt-3">
                    <div>
                      <label className="label">Quantity</label>

                      <input
                        className="input"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="500"
                        value={edit.quantity ?? ""}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            quantity: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Unit</label>

                      <select
                        className="input"
                        value={edit.unit || "g"}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            unit: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="g">Gram (g)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="ml">Millilitre (ml)</option>
                        <option value="l">Litre (L)</option>
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Price (₹)</label>

                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="120"
                        value={edit.price ?? ""}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            price: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Discount (%)</label>

                      <input
                        className="input"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={edit.discountPercent ?? 0}
                        onChange={(e) =>
                          setEdit({
                            ...edit,
                            discountPercent: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* STOCK */}
                <div>
                  <label className="label">Available stock</label>

                  <input
                    className="input max-w-xs"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={edit.stock ?? 0}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        stock: e.target.value,
                      })
                    }
                  />

                  <p className="text-xs text-ink-soft mt-1">
                    This controls whether customers can add the item to cart.
                  </p>
                </div>

                {/* IMAGE */}
                <div>
                  <label className="label">Item image</label>

                  <input
                    className="input"
                    type="text"
                    placeholder="Paste image URL"
                    value={
                      Array.isArray(edit.images)
                        ? edit.images[0] || ""
                        : edit.images || ""
                    }
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        images: e.target.value ? [e.target.value.trim()] : [],
                      })
                    }
                  />

                  <p className="text-xs text-ink-soft mt-1">
                    Use the image URL for the food item. The first image is
                    shown to customers.
                  </p>

                  {edit.images?.[0] && (
                    <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden bg-brand-tint">
                      <img
                        src={edit.images[0]}
                        alt={edit.name || "Item preview"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* DIET DETAILS */}
                <div>
                  <h4 className="font-semibold">Diet details</h4>

                  <div className="mt-3">
                    <label className="label">Description</label>

                    <textarea
                      className="input"
                      rows="4"
                      placeholder="Describe the food, nutritional value, usage or other useful diet information..."
                      value={edit.description || ""}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <label className="label">Ingredients</label>

                    <input
                      className="input"
                      placeholder="Example: Apple, natural ingredients..."
                      value={
                        Array.isArray(edit.ingredients)
                          ? edit.ingredients.join(", ")
                          : edit.ingredients || ""
                      }
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          ingredients: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                    />

                    <p className="text-xs text-ink-soft mt-1">
                      Separate multiple ingredients with commas.
                    </p>
                  </div>

                  <div className="mt-4">
                    <label className="label">Benefits</label>

                    <input
                      className="input"
                      placeholder="Example: Rich in fiber, supports healthy diet"
                      value={
                        Array.isArray(edit.benefits)
                          ? edit.benefits.join(", ")
                          : edit.benefits || ""
                      }
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          benefits: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                    />

                    <p className="text-xs text-ink-soft mt-1">
                      Separate multiple benefits with commas.
                    </p>
                  </div>
                </div>

                {/* SUITABLE GOALS */}
                <div>
                  <h4 className="font-semibold">Suitable nutrition goals</h4>

                  <p className="text-xs text-ink-soft mt-1">
                    Select the goals for which this item can appear in
                    recommendations.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    {[
                      ["weight-gain", "Weight Gain"],
                      ["weight-loss", "Weight Loss"],
                      ["fitness", "Physical Fitness / Gym"],
                      ["pcos", "PCOS / PCOD"],
                    ].map(([value, label]) => (
                      <label
                        key={value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={edit.suitableGoals?.includes(value) || false}
                          onChange={(e) => {
                            const current = edit.suitableGoals || [];

                            const next = e.target.checked
                              ? [...new Set([...current, value])]
                              : current.filter((x) => x !== value);

                            setEdit({
                              ...edit,
                              suitableGoals: next,
                            });
                          }}
                        />

                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* STATUS */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!edit.isActive}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          isActive: e.target.checked,
                        })
                      }
                    />
                    Available for customers
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!edit.isNewArrival}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          isNewArrival: e.target.checked,
                        })
                      }
                    />
                    Show as New Arrival
                  </label>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary">
                    {edit._id ? "Update Item" : "Add Item"}
                  </button>

                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => setEdit(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* PRODUCT LIST */}
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="font-serif text-2xl font-bold">Current Items</h2>

                {data.length > 0 && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={downloadProductsCSV}
                  >
                    Download CSV
                  </button>
                )}
              </div>

              {!data.length ? (
                <div className="card p-8 mt-4 text-center">
                  <p className="font-semibold">No products added yet.</p>

                  <p className="text-sm text-ink-soft mt-1">
                    Add your first food item using the button above.
                  </p>
                </div>
              ) : (
                <div className="card overflow-hidden mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-black/10 text-left">
                          <th className="p-4">Item</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Pack / Quantity</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">New</th>
                        </tr>
                      </thead>

                      <tbody>
                        {data
                          .slice(0, showAllProducts ? data.length : 6)
                          .map((x) => (
                            <tr
                              key={x._id}
                              className="border-b border-black/5 last:border-0"
                            >
                              <td className="p-4">
                                <button
                                  type="button"
                                  className="text-brand font-semibold hover:underline"
                                  onClick={() =>
                                    setEdit({
                                      ...x,
                                      category:
                                        x.category?._id || x.category || "",
                                      quantity:
                                        x.quantity ||
                                        parseFloat(
                                          String(x.unit || "").match(
                                            /[\d.]+/,
                                          )?.[0] || "",
                                        ),
                                      unit:
                                        x.unit?.match(
                                          /(kg|g|ml|l|piece|pack|box)/i,
                                        )?.[0] || "g",
                                      images: x.images || [],
                                      ingredients: x.ingredients || [],
                                      benefits: x.benefits || [],
                                      suitableGoals: x.suitableGoals || [],
                                    })
                                  }
                                >
                                  {x.name}
                                </button>
                              </td>

                              <td className="p-4">{x.category?.name || "—"}</td>

                              <td className="p-4">
                                {x.quantity
                                  ? `${x.quantity} ${x.unit}`
                                  : x.unit || "—"}
                              </td>

                              <td className="p-4 font-semibold">
                                ₹
                                {(
                                  x.price -
                                  (x.price * (x.discountPercent || 0)) / 100
                                ).toFixed(0)}
                              </td>

                              <td className="p-4">{x.stock ?? 0}</td>

                              <td className="p-4">
                                <div className="flex flex-col gap-2">
                                  {x.isActive ? (
                                    <span className="text-green-700 font-semibold">
                                      Available
                                    </span>
                                  ) : (
                                    <span className="text-red-600 font-semibold">
                                      Disabled
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => toggleProductAvailability(x)}
                                    className="btn-outline text-xs whitespace-nowrap"
                                  >
                                    {x.isActive
                                      ? "Make unavailable"
                                      : "Make available"}
                                  </button>
                                </div>
                              </td>

                              <td className="p-4">
                                {x.isNewArrival ? "Yes" : "No"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {data.length > 6 && (
                      <div className="border-t border-black/10 p-4 flex justify-center">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => setShowAllProducts((prev) => !prev)}
                        >
                          {showAllProducts
                            ? "Show less"
                            : `View all ${data.length} products`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ORDERS */}
        {section === "orders" && (
          <div className="space-y-3 mt-6">
            {data.slice(0, 6).map((o) => (
              <div className="card p-5" key={o._id}>
                <div className="flex justify-between">
                  <b>#{o.orderNumber}</b>
                  <b>{o.orderStatus}</b>
                </div>

                <p className="text-sm text-ink-soft">
                  {o.user?.name} · {o.user?.phone} · ₹{o.totalAmount}
                </p>

                <div className="flex gap-2 flex-wrap mt-3">
                  {[
                    "Confirmed",
                    "Preparing",
                    "Out for Delivery",
                    "Delivered",
                    "Cancelled",
                  ]
                    .filter((s) => s !== o.orderStatus)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => status(o._id, s)}
                        className="btn-outline text-xs"
                      >
                        {s}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CUSTOMERS */}
        {section === "customers" && (
          <div className="card overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Goal</th>
                  </tr>
                </thead>

                <tbody>
                  {data.slice(0, 6).map((x) => (
                    <tr
                      key={x._id}
                      className="border-b border-black/5 last:border-0"
                    >
                      <td className="p-4">{x.name || "—"}</td>
                      <td className="p-4">{x.email || "—"}</td>
                      <td className="p-4">{x.phone || "—"}</td>
                      <td className="p-4">{x.goal || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {section === "reviews" && (
          <Table
            headers={["Customer", "Product", "Order", "Rating", "Feedback"]}
            rows={data
              .slice(0, 6)
              .map((x) => [
                x.user?.name || "—",
                x.product?.name || "—",
                x.order?.orderNumber || "—",
                `${x.rating}/5`,
                x.comment || "—",
              ])}
          />
        )}

        {/* SUBSCRIPTIONS */}
        {section === "subscriptions" && (
          <>
            <Table
              headers={["Customer", "Plan", "Paid", "Status", "Dates"]}
              rows={data
                .slice(0, 6)
                .map((x) => [
                  x.user?.name,
                  x.planCode,
                  `₹${x.amountPaid}`,
                  x.status,
                  `${new Date(x.startedAt).toLocaleDateString()} → ${new Date(
                    x.endsAt,
                  ).toLocaleDateString()}`,
                ])}
            />

            <div className="grid md:grid-cols-2 gap-4 mt-7">
              {plans.map((p) => (
                <PlanEditor key={p._id} plan={p} onSave={planSave} />
              ))}
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}

function PlanEditor({ plan, onSave }) {
  const [p, setP] = useState(plan);

  return (
    <div className="card p-5">
      <b>{p.name}</b>

      <label className="label mt-4">Price</label>

      <input
        className="input"
        type="number"
        value={p.price}
        onChange={(e) =>
          setP({
            ...p,
            price: e.target.value,
          })
        }
      />

      <label className="label mt-3">Description</label>

      <textarea
        className="input"
        rows="3"
        value={p.description || ""}
        onChange={(e) =>
          setP({
            ...p,
            description: e.target.value,
          })
        }
      />

      <label className="text-sm block mt-3">
        <input
          type="checkbox"
          checked={!!p.isActive}
          onChange={(e) =>
            setP({
              ...p,
              isActive: e.target.checked,
            })
          }
        />{" "}
        Available for new subscriptions
      </label>

      <button className="btn-primary mt-4" onClick={() => onSave(p)}>
        Save plan
      </button>
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="bg-white rounded-3xl shadow-soft overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10">
            {headers.map((header) => (
              <th
                key={header}
                className="text-left p-4 font-semibold text-ink-soft whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-black/5 last:border-0"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {!rows.length && <p className="p-6 text-ink-soft">Nothing here yet.</p>}
    </div>
  );
}
