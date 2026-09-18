import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as auth from "../services/authService.js";
import LandingLayout from "../components/LandingLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
export default function VerifyOtp() {
  const nav = useNavigate();
  const { login } = useAuth();
  const id = sessionStorage.getItem("ns_signup_user");
  const [emailOtp, setEmail] = useState(""),
    [smsOtp, setSms] = useState(""),
    [loading, setLoading] = useState(false);
  if (!id)
    return (
      <LandingLayout>
        <div className="max-w-md mx-auto p-8">No pending verification.</div>
      </LandingLayout>
    );
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const d = await auth.verifyRegistration({ userId: id, emailOtp, smsOtp });
      login(d);
      sessionStorage.removeItem("ns_signup_user");
      nav("/onboarding");
    } catch (e) {
      toast.error(e.friendlyMessage || "Verification failed");
    } finally {
      setLoading(false);
    }
  };
  const resend = async () => {
    try {
      await auth.resendOtp(id);
      toast.success("New OTPs sent");
    } catch (e) {
      toast.error(e.friendlyMessage || "Could not resend");
    }
  };
  return (
    <LandingLayout>
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="card p-7">
          <h1 className="font-serif text-3xl font-bold">Verify your account</h1>
          <p className="text-sm text-ink-soft mt-2">
            Enter the code sent to your email and mobile.
          </p>
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <label className="label">Email OTP</label>
              <input
                className="input tracking-widest"
                maxLength="6"
                value={emailOtp}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">SMS OTP</label>
              <input
                className="input tracking-widest"
                maxLength="6"
                value={smsOtp}
                onChange={(e) => setSms(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
          </form>
          <button
            onClick={resend}
            className="text-brand font-semibold text-sm mt-4"
          >
            Resend OTPs
          </button>
        </div>
      </div>
    </LandingLayout>
  );
}
