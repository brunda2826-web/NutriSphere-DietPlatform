import mongoose from "mongoose";

const deliverySettingsSchema = new mongoose.Schema(
  {
    serviceLatitude: {
      type: Number,
      required: true,
    },

    serviceLongitude: {
      type: Number,
      required: true,
    },

    serviceAddress: {
      type: String,
      default: "",
    },

    radiusKm: {
      type: Number,
      default: 8,
      min: 0.5,
    },

    deliveryStartHour: {
      type: Number,
      default: 6,
      min: 0,
      max: 23,
    },

    deliveryEndHour: {
      type: Number,
      default: 20,
      min: 1,
      max: 24,
    },

    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const DeliverySettings =
  mongoose.models.DeliverySettings ||
  mongoose.model("DeliverySettings", deliverySettingsSchema);

export default DeliverySettings;
