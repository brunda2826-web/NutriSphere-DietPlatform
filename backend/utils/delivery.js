import DeliverySettings from "../models/DeliverySettings.js";

const toRad = (n) => (n * Math.PI) / 180;

export function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371;

  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/*
  Get delivery settings from MongoDB.

  If the owner has not configured the delivery area yet,
  fall back to .env values so the application can still work.
*/
export async function getDeliverySettings() {
  const settings = await DeliverySettings.findOne();

  if (settings) {
    return settings;
  }

  const latitude = Number(process.env.SERVICE_LATITUDE);
  const longitude = Number(process.env.SERVICE_LONGITUDE);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return {
      serviceLatitude: latitude,
      serviceLongitude: longitude,
      serviceAddress: "",
      radiusKm: Number(process.env.DELIVERY_RADIUS_KM || 8),
      deliveryStartHour: Number(process.env.DELIVERY_START_HOUR || 0),
      deliveryEndHour: Number(process.env.DELIVERY_END_HOUR || 24),
      deliveryFee: Number(process.env.DELIVERY_FEE || 0),
    };
  }

  return null;
}

/*
  Check whether a customer address is inside
  the owner's configured delivery area.
*/
export async function assertServiceArea(lat, lng) {
  const settings = await getDeliverySettings();

  if (!settings) {
    return {
      distanceKm: null,
      checked: false,
      configured: false,
    };
  }

  const customerLat = Number(lat);
  const customerLng = Number(lng);

  if (!Number.isFinite(customerLat) || !Number.isFinite(customerLng)) {
    throw Object.assign(new Error("Valid map coordinates are required."), {
      statusCode: 400,
    });
  }

  const shopLat = Number(settings.serviceLatitude);
  const shopLng = Number(settings.serviceLongitude);

  if (!Number.isFinite(shopLat) || !Number.isFinite(shopLng)) {
    return {
      distanceKm: null,
      checked: false,
      configured: false,
    };
  }

  const d = distanceKm(shopLat, shopLng, customerLat, customerLng);

  const radius = Number(settings.radiusKm || 8);

  if (d > radius) {
    throw Object.assign(
      new Error(
        `This address is outside NutriSphere delivery area (${radius} km).`,
      ),
      { statusCode: 400 },
    );
  }

  return {
    distanceKm: Number(d.toFixed(2)),
    checked: true,
    configured: true,
  };
}

/*
  Check whether ordering is currently allowed
  according to the owner's saved delivery hours.
*/
export async function assertDeliveryHours(date = new Date()) {
  const settings = await getDeliverySettings();

  const start = 0;
  const end = 24;

  const h = date.getHours();

  if (h < start || h >= end) {
    throw Object.assign(
      new Error(
        `Orders are available between ${String(start).padStart(2, "0")}:00 and ${String(end).padStart(2, "0")}:00.`,
      ),
      { statusCode: 400 },
    );
  }

  return true;
}
