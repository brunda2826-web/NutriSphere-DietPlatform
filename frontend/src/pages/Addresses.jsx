import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";
import * as as from "../services/addressService.js";
import * as cs from "../services/configService.js";

const empty = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  latitude: "",
  longitude: "",
  label: "Home",
  isDefault: false,
};

export default function Addresses() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [config, setConfig] = useState(null);

  const load = () =>
    as
      .getAddresses()
      .then(setList)
      .catch((e) =>
        toast.error(e.friendlyMessage || "Could not load addresses"),
      );

  useEffect(() => {
    load();

    cs.getConfig()
      .then(setConfig)
      .catch(() => {});
  }, []);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (p) => {
        setF((x) => ({
          ...x,
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        }));

        toast.success("Location selected");
      },
      () => {
        toast.error("Please allow location access to select your location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!f.latitude || !f.longitude) {
      toast.error("Please select your location on the map.");
      return;
    }

    try {
      if (editing) {
        await as.updateAddress(editing, f);
      } else {
        await as.createAddress(f);
      }

      setF(empty);
      setEditing(null);
      await load();

      toast.success("Address saved");
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not save address");
    }
  };

  const editAddress = (a) => {
    setEditing(a._id);

    setF({
      ...empty,
      ...a,
      latitude: a.latitude ?? "",
      longitude: a.longitude ?? "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setF(empty);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* HEADER */}
        <div className="mb-8">
          <p className="text-brand text-sm font-bold tracking-wide">
            DELIVERY ADDRESS
          </p>

          <h1 className="font-serif text-4xl font-bold mt-1">Manage Address</h1>

          <p className="text-ink-soft mt-2 max-w-2xl">
            Add your delivery address and select your location on the map.
            {config?.deliveryRadiusKm
              ? ` Delivery is available within ${config.deliveryRadiusKm} km of our service area.`
              : ""}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-7">
          {/* SAVED ADDRESSES */}
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">
              Saved addresses
            </h2>

            <div className="space-y-4">
              {list.map((a) => (
                <div className="card p-5" key={a._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <b>{a.fullName}</b>

                        <span className="text-xs bg-brand-tint text-brand-dark px-2 py-1 rounded-full">
                          {a.label}
                        </span>

                        {a.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-ink-soft mt-2 leading-6">
                        {a.addressLine1}
                        {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                        {a.landmark ? `, ${a.landmark}` : ""}, {a.city},{" "}
                        {a.state} {a.postalCode}
                      </p>

                      <p className="text-sm text-ink-soft mt-1">{a.phone}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4 text-sm">
                    <button
                      className="text-brand font-semibold"
                      onClick={() => editAddress(a)}
                    >
                      Edit
                    </button>

                    <button
                      className="text-red-600"
                      onClick={() =>
                        as
                          .deleteAddress(a._id)
                          .then(load)
                          .catch((e) =>
                            toast.error(
                              e.friendlyMessage || "Could not delete address",
                            ),
                          )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!list.length && (
                <div className="card p-7 text-ink-soft">
                  No saved addresses yet.
                  <br />
                  Add your first delivery address.
                </div>
              )}
            </div>
          </section>

          {/* ADDRESS FORM */}
          <section>
            <form onSubmit={submit} className="card p-6 space-y-4">
              <div>
                <h2 className="font-serif text-2xl font-bold">
                  {editing ? "Edit address" : "Add new address"}
                </h2>

                <p className="text-sm text-ink-soft mt-1">
                  Enter your address details below.
                </p>
              </div>

              {/* NAME + PHONE */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Full name</label>

                  <input
                    className="input"
                    value={f.fullName}
                    onChange={(e) =>
                      setF({
                        ...f,
                        fullName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Phone</label>

                  <input
                    className="input"
                    value={f.phone}
                    onChange={(e) =>
                      setF({
                        ...f,
                        phone: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* HOUSE */}
              <div>
                <label className="label">House / Flat / Building</label>

                <input
                  className="input"
                  placeholder="e.g. Flat 203, Green Residency"
                  value={f.addressLine1}
                  onChange={(e) =>
                    setF({
                      ...f,
                      addressLine1: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* AREA */}
              <div>
                <label className="label">Area / Street</label>

                <input
                  className="input"
                  placeholder="e.g. 2nd Cross, Vijayanagar"
                  value={f.addressLine2}
                  onChange={(e) =>
                    setF({
                      ...f,
                      addressLine2: e.target.value,
                    })
                  }
                />
              </div>

              {/* LANDMARK */}
              <div>
                <label className="label">
                  Landmark
                  <span className="text-ink-soft font-normal"> (optional)</span>
                </label>

                <input
                  className="input"
                  placeholder="e.g. Near Apollo Pharmacy"
                  value={f.landmark}
                  onChange={(e) =>
                    setF({
                      ...f,
                      landmark: e.target.value,
                    })
                  }
                />
              </div>

              {/* CITY / STATE / PIN */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>

                  <input
                    className="input"
                    value={f.city}
                    onChange={(e) =>
                      setF({
                        ...f,
                        city: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">State</label>

                  <input
                    className="input"
                    value={f.state}
                    onChange={(e) =>
                      setF({
                        ...f,
                        state: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Pincode</label>

                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit pincode"
                  value={f.postalCode}
                  onChange={(e) =>
                    setF({
                      ...f,
                      postalCode: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  required
                />
              </div>

              {/* MAP LOCATION */}
              <div className="pt-2">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <label className="label mb-0">Delivery location</label>

                    <p className="text-xs text-ink-soft mt-1">
                      Select your current location for accurate delivery.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={locate}
                  className="btn-outline w-full"
                >
                  📍 Use my current location
                </button>

                {f.latitude && f.longitude ? (
                  <div className="mt-3">
                    <iframe
                      title="Selected delivery location"
                      className="w-full h-56 rounded-2xl border"
                      src={`https://www.google.com/maps?q=${f.latitude},${f.longitude}&z=16&output=embed`}
                      loading="lazy"
                    />

                    <p className="text-xs text-green-700 mt-2">
                      ✓ Location selected. Coordinates are stored automatically
                      for delivery-area checking.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 h-40 rounded-2xl border border-dashed border-black/10 flex items-center justify-center text-center px-5">
                    <div>
                      <p className="font-semibold">Location not selected</p>

                      <p className="text-sm text-ink-soft mt-1">
                        Tap "Use my current location" to select your delivery
                        point.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* LABEL */}
              <div>
                <label className="label">Save address as</label>

                <div className="grid grid-cols-3 gap-2">
                  {["Home", "Work", "Other"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setF({
                          ...f,
                          label,
                        })
                      }
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        f.label === label
                          ? "border-brand bg-brand-tint text-brand-dark"
                          : "border-black/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DEFAULT */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!f.isDefault}
                  onChange={(e) =>
                    setF({
                      ...f,
                      isDefault: e.target.checked,
                    })
                  }
                />
                Set as default address
              </label>

              {/* SAVE */}
              <button type="submit" className="btn-primary w-full">
                {editing ? "Update address" : "Save address"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full text-sm text-ink-soft"
                >
                  Cancel
                </button>
              )}
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
}
