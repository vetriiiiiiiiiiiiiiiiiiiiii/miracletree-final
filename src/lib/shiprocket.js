import "server-only";
import { prisma } from "./prisma";
/**
 * A thin client for Shiprocket's external API.
 *
 * Credentials are a Shiprocket *API user* (Panel → Settings → API → Create
 * API user), never the main login: SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.
 * A login token lasts ten days; it is cached in memory and in SiteSetting so
 * a restart does not log in again, and refreshed a day early or on a 401.
 *
 * Every call throws ShiprocketError with Shiprocket's own message, so the
 * admin sees "Pincode not serviceable" rather than "Request failed".
 */
const BASE = (process.env.SHIPROCKET_API_BASE || "https://apiv2.shiprocket.in/v1/external").replace(/\/$/, "");
const TOKEN_KEY = "shiprocket.token";
const TOKEN_LIFETIME_MS = 9 * 24 * 60 * 60 * 1000; // issued for 10 days
const TIMEOUT_MS = 15000;

export class ShiprocketError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ShiprocketError";
    this.status = status;
  }
}

export function shiprocketConfigured() {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

let cached = null; // { token, expiresAt }

async function login() {
  if (!shiprocketConfigured()) throw new ShiprocketError("Shiprocket is not set up on the server.");
  const response = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) {
    throw new ShiprocketError(
      data.message ? `Shiprocket login failed: ${data.message}` : "Shiprocket login failed — check the API user email and password.",
      response.status,
    );
  }
  cached = { token: data.token, expiresAt: Date.now() + TOKEN_LIFETIME_MS };
  await prisma.siteSetting
    .upsert({
      where: { key: TOKEN_KEY },
      create: { key: TOKEN_KEY, value: JSON.stringify(cached) },
      update: { value: JSON.stringify(cached) },
    })
    .catch(() => {});
  return cached.token;
}

async function token(fresh = false) {
  if (!fresh && cached && cached.expiresAt > Date.now()) return cached.token;
  if (!fresh) {
    const row = await prisma.siteSetting.findUnique({ where: { key: TOKEN_KEY } }).catch(() => null);
    try {
      const stored = row?.value ? JSON.parse(row.value) : null;
      if (stored?.token && stored.expiresAt > Date.now()) {
        cached = stored;
        return stored.token;
      }
    } catch {
      // A malformed cache entry just means logging in again.
    }
  }
  return login();
}

/** Turns Shiprocket's assorted error shapes into one readable sentence. */
function errorMessage(data, status) {
  if (data?.message && typeof data.message === "string") {
    const details = data.errors && typeof data.errors === "object"
      ? Object.values(data.errors).flat().filter((v) => typeof v === "string")
      : [];
    return details.length ? `${data.message} ${details.join(" ")}` : data.message;
  }
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  return `Shiprocket returned ${status}.`;
}

async function call(path, { method = "GET", body, query } = {}, retried = false) {
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await token()}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 401 && !retried) {
    await token(true);
    return call(path, { method, body, query }, true);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ShiprocketError(errorMessage(data, response.status), response.status);
  return data;
}

/** Couriers that serve a route, with price and delivery estimate. */
export async function serviceability({ pickupPincode, deliveryPincode, weightKg, cod, declaredValue, srOrderId }) {
  const data = await call("/courier/serviceability/", {
    query: {
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      ...(srOrderId ? { order_id: srOrderId } : { weight: weightKg, cod: cod ? 1 : 0 }),
      declared_value: declaredValue,
    },
  }).catch((error) => {
    // An unserviceable route comes back as a 404 with a message, not as an
    // empty list. That is an answer, not a failure.
    if (error instanceof ShiprocketError && error.status === 404) return { data: { available_courier_companies: [] } };
    throw error;
  });
  const list = data?.data?.available_courier_companies ?? [];
  const couriers = list
    .map((c) => ({
      id: Number(c.courier_company_id),
      name: c.courier_name,
      rate: Number(c.rate ?? c.freight_charge ?? 0),
      codCharges: Number(c.cod_charges ?? 0),
      cod: Number(c.cod) === 1,
      etd: c.etd || null,
      days: c.estimated_delivery_days ? Number(c.estimated_delivery_days) : null,
      rating: c.rating ? Number(c.rating) : null,
      surface: Boolean(c.is_surface),
    }))
    .filter((c) => c.id && Number.isFinite(c.rate));
  const recommendedId = Number(
    data?.data?.shiprocket_recommended_courier_id ?? data?.data?.recommended_courier_company_id ?? 0,
  ) || null;
  return { couriers, recommendedId };
}

/** Creates the order in Shiprocket. Returns its order and shipment ids. */
export async function createOrder(payload) {
  const data = await call("/orders/create/adhoc", { method: "POST", body: payload });
  if (!data.order_id || !data.shipment_id) throw new ShiprocketError(errorMessage(data, 200));
  return { srOrderId: Number(data.order_id), srShipmentId: Number(data.shipment_id), status: data.status };
}

/** Assigns a courier and tracking (AWB) number. Charges the Shiprocket wallet. */
export async function assignAwb(shipmentId, courierId, { isReturn = false } = {}) {
  const data = await call("/courier/assign/awb", {
    method: "POST",
    body: {
      shipment_id: shipmentId,
      ...(courierId ? { courier_id: courierId } : {}),
      ...(isReturn ? { is_return: 1 } : {}),
    },
  });
  const assigned = data?.response?.data;
  if (Number(data?.awb_assign_status) !== 1 || !assigned?.awb_code) {
    throw new ShiprocketError(
      data?.response?.data?.awb_assign_error || data?.message || "Shiprocket could not assign a courier. Check the wallet balance and try another courier.",
    );
  }
  return {
    awb: String(assigned.awb_code),
    courierId: Number(assigned.courier_company_id) || courierId || null,
    courierName: assigned.courier_name || null,
    pickupScheduledDate: assigned.pickup_scheduled_date || null,
  };
}

export async function schedulePickup(shipmentId) {
  const data = await call("/courier/generate/pickup", { method: "POST", body: { shipment_id: [shipmentId] } });
  return { scheduledFor: data?.response?.pickup_scheduled_date ?? null };
}

export async function generateLabel(shipmentId) {
  const data = await call("/courier/generate/label", { method: "POST", body: { shipment_id: [shipmentId] } });
  if (!data.label_url) throw new ShiprocketError(data.response || "Shiprocket did not return a label.");
  return data.label_url;
}

/** Live tracking for an AWB: current status, delivery estimate and scans. */
export async function trackAwb(awb) {
  const data = await call(`/courier/track/awb/${encodeURIComponent(awb)}`);
  const tracking = data?.tracking_data ?? {};
  const shipment = tracking.shipment_track?.[0] ?? {};
  return {
    currentStatus: shipment.current_status || null,
    etd: tracking.etd || shipment.edd || null,
    courierName: shipment.courier_name || null,
    trackUrl: tracking.track_url || null,
    activities: (tracking.shipment_track_activities ?? []).map((a) => ({
      date: a.date,
      activity: a.activity,
      location: a.location,
      status: a["sr-status-label"] || a.status || null,
    })),
    error: tracking.error || null,
  };
}

export async function cancelOrders(srOrderIds) {
  return call("/orders/cancel", { method: "POST", body: { ids: srOrderIds } });
}

export async function createReturnOrder(payload) {
  const data = await call("/orders/create/return", { method: "POST", body: payload });
  if (!data.order_id) throw new ShiprocketError(errorMessage(data, 200));
  return { srOrderId: Number(data.order_id), srShipmentId: Number(data.shipment_id) || null, status: data.status };
}

/** The pickup addresses saved in the Shiprocket panel. */
export async function pickupLocations() {
  const data = await call("/settings/company/pickup");
  return (data?.data?.shipping_address ?? []).map((p) => ({
    name: p.pickup_location,
    address: p.address,
    address2: p.address_2,
    city: p.city,
    state: p.state,
    country: p.country,
    pincode: p.pin_code,
    phone: p.phone,
    email: p.email,
    contact: p.name,
    primary: Number(p.is_primary_location) === 1,
  }));
}
