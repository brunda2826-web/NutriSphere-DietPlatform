import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as auth from "../services/authService.js";
import LandingLayout from "../components/LandingLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
export default function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate(),
    loc = useLocation();
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const d = await auth.login({ email, password });
      login(d);
      nav(
        d.user.role === "OWNER/SELLER"
          ? "/owner"
          : d.user.profileCompleted
            ? "/recommend"
            : "/onboarding",
        { replace: true },
      );
    } catch (e) {
      toast.error(e.friendlyMessage || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <LandingLayout>
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="card p-7">
          <h1 className="font-serif text-3xl font-bold">Welcome back</h1>
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
          <p className="text-sm text-ink-soft mt-5">
            New here?{" "}
            <a href="/signup" className="text-brand font-semibold">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </LandingLayout>
  );
}
