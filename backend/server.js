import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { runNearDeliveryAlerts } from "./controllers/orderController.js";
import {
  runSubscriptionLifecycle,
  createSubscriptionDeliveryOrders,
} from "./controllers/subscriptionController.js";
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "NutriSphere API is running" }),
);
app.get("/api/config", async (req, res, next) => {
  try {
    const DeliverySettings = (await import("./models/DeliverySettings.js"))
      .default;

    const settings = await DeliverySettings.findOne();

    res.json({
      success: true,
      data: {
        deliveryRadiusKm:
          settings?.radiusKm ?? Number(process.env.DELIVERY_RADIUS_KM || 8),

        deliveryStartHour:
          settings?.deliveryStartHour ??
          Number(process.env.DELIVERY_START_HOUR || 6),

        deliveryEndHour:
          settings?.deliveryEndHour ??
          Number(process.env.DELIVERY_END_HOUR || 20),

        deliveryFee:
          settings?.deliveryFee ?? Number(process.env.DELIVERY_FEE || 0),

        serviceAddress: settings?.serviceAddress || "",

        serviceLatitude: settings?.serviceLatitude ?? null,

        serviceLongitude: settings?.serviceLongitude ?? null,

        mapProvider: process.env.MAP_PROVIDER || "google",
      },
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);;
const PORT = Number(process.env.PORT || 5000);
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`NutriSphere API listening on ${PORT}`));
    setInterval(() => runNearDeliveryAlerts().catch(console.error), 60000);
    setInterval(() => runSubscriptionLifecycle().catch(console.error), 3600000);
    setInterval(
      () => createSubscriptionDeliveryOrders().catch(console.error),
      60000,
    );
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
