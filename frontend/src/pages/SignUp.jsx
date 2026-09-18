import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as auth from "../services/authService.js";
import LandingLayout from "../components/LandingLayout.jsx";
export default function SignUp() {
  const nav = useNavigate();
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const d = await auth.register(f);
      sessionStorage.setItem("ns_signup_user", d.userId);
      nav("/verify-otp");
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not create account");
    } finally {
      setLoading(false);
    }
  };
  return (
    <LandingLayout>
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="card p-7">
          <h1 className="font-serif text-3xl font-bold">Create your account</h1>
          <p className="text-sm text-ink-soft mt-2">
            We verify your email and mobile before activation.
          </p>
          <form onSubmit={submit} className="space-y-4 mt-6">
            {[
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Mobile number"],
              ["password", "Password"],
              ["confirm", "Confirm password"],
            ].map(([k, l]) => (
              <div key={k}>
                <label className="label">{l}</label>
                <input
                  className="input"
                  type={
                    k.includes("password") || k === "confirm"
                      ? "password"
                      : k === "email"
                        ? "email"
                        : "text"
                  }
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  required
                />
              </div>
            ))}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending OTP..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </LandingLayout>
  );
}
