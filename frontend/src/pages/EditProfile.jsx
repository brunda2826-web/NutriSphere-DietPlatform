import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../components/Layout.jsx";

import { useAuth } from "../context/AuthContext.jsx";
import * as auth from "../services/authService.js";

export default function EditProfile() {
  const { user, apply } = useAuth();
  const nav = useNavigate();

  const [f, setF] = useState({
    name: user?.name || "",
    age: user?.age || "",
    gender: user?.gender || "Female",
    height: user?.height || "",
    weight: user?.weight || "",
    goal: user?.goal || "weight-gain",
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) => {
    setF((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      const updatedUser = await auth.updateProfile(f);

      /*
       * updateProfile returns the updated user.
       * Keep the existing authentication token while
       * updating the user information in AuthContext.
       */
      const token = localStorage.getItem("ns_token");

      if (token) {
        apply({
          ...updatedUser,
          token,
        });
      }

      toast.success("Profile updated successfully");
      nav("/profile");
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          type="button"
          onClick={() => nav("/profile")}
          className="mb-5 text-sm font-semibold text-brand"
        >
          ← Back to Profile
        </button>

        <p className="text-brand text-sm font-bold">ACCOUNT</p>

        <h1 className="font-serif text-4xl font-bold mt-1">Edit Profile</h1>

        <p className="text-ink-soft mt-2">
          Update your personal and nutrition profile details.
        </p>

        <form onSubmit={submit} className="card p-7 mt-6 space-y-4">
          {[
            ["name", "Name"],
            ["age", "Age"],
            ["height", "Height (cm)"],
            ["weight", "Current weight (kg)"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>

              <input
                className="input"
                value={f[key]}
                onChange={(e) => update(key, e.target.value)}
                required
                disabled={saving}
                type={
                  key === "age" || key === "height" || key === "weight"
                    ? "number"
                    : "text"
                }
                min={
                  key === "age" || key === "height" || key === "weight"
                    ? "1"
                    : undefined
                }
              />
            </div>
          ))}

          <div>
            <label className="label">Gender</label>

            <select
              className="input"
              value={f.gender}
              onChange={(e) => update("gender", e.target.value)}
              disabled={saving}
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Goal</label>

            <select
              className="input"
              value={f.goal}
              onChange={(e) => update("goal", e.target.value)}
              disabled={saving}
            >
              <option value="weight-gain">Weight Gain</option>
              <option value="weight-loss">Weight Loss</option>
              <option value="fitness">Physical Fitness / Gym</option>
              <option value="pcos">PCOS / PCOD</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
