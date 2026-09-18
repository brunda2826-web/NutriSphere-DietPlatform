import express from "express";
import {
  registerUser,
  verifyRegistration,
  resendOtp,
  loginUser,
  getMe,
  updateProfile,
  deleteAccount,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const r = express.Router();
r.post("/register", registerUser);
r.post("/verify-registration", verifyRegistration);
r.post("/resend-otp", resendOtp);
r.post("/login", loginUser);
r.get("/me", protect, getMe);
r.put("/profile", protect, updateProfile);
r.delete("/account", protect, deleteAccount);
export default r;
