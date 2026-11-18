import "server-only";
import { prisma } from "./prisma";
import { getSettings, settingNumber } from "./queries";
import { COMMERCE_DEFAULTS } from "./constants";
import { recordAudit } from "./audit";
import { sendOrderStatusEmail, statusDeservesEmail } from "./order-mail";
import * as sr from "./shiprocket";
/**
 * Shipping on top of the Shiprocket client: what a parcel weighs, what it
 * costs to send, and an order's life with the courier — sent to Shiprocket
 * when it is placed, dispatched from the admin in one click, and moved along
 * by tracking updates until it is delivered.
 *
 * Nothing here may break checkout. When Shiprocket is not configured or does
 * not answer, the quote falls back to the flat fee in Admin → Settings and
 * the order is still placed; syncing can be retried from the order page.
 */
export const PACKAGE_DEFAULTS = { weightGrams: 500, length: 20, breadth: 15, height: 10 };

export function shippingLive() {
  return sr.shiprocketConfigured();
}

export function trackingUrlFor(awb) {
  return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
}

async function packageSettings() {
  return {
    weightGrams: await settingNumber("shipping.defaultWeightGrams", PACKAGE_DEFAULTS.weightGrams),
    length: await settingNumber("shipping.boxLength", PACKAGE_DEFAULTS.length),
    breadth: await settingNumber("shipping.boxBreadth", PACKAGE_DEFAULTS.breadth),
    height: await settingNumber("shipping.boxHeight", PACKAGE_DEFAULTS.height),
  };
}

// The pickup address changes rarely; asking Shiprocket on every quote would
// double the latency of each one.
let pickupCache = null; // { at, value }
/**
 * The address parcels leave from: the location named in Admin → Settings,
 * else the one marked primary in the Shiprocket panel, else the first.
 */
export async function pickupAddress() {
  const settings = await getSettings();
  const wanted = (settings.get("shiprocket.pickupLocation") ?? "").trim().toLowerCase();
  if (pickupCache && Date.now() - pickupCache.at < 10 * 60 * 1000 && pickupCache.wanted === wanted) {
    return pickupCache.value;
  }
  const locations = await sr.pickupLocations();
  const value =
    (wanted && locations.find((l) => l.name?.toLowerCase() === wanted)) ||
    locations.find((l) => l.primary) ||
    locations[0];
  if (!value) throw new sr.ShiprocketError("No pickup address is saved in Shiprocket. Add one under Settings → Pickup Addresses.");
  pickupCache = { at: Date.now(), wanted, value };
  return value;
}

/** Parcel weight in kg: each variant's weight, or the default, times quantity. */
export async function parcelWeightKg(lines) {
  const { weightGrams } = await packageSettings();
  const ids = [...new Set(lines.map((l) => l.variantId).filter(Boolean))];
  const variants = ids.length
    ? await prisma.productVariant.findMany({ where: { id: { in: ids } }, select: { id: true, weightGrams: true } })
    : [];
  const weightOf = new Map(variants.map((v) => [v.id, v.weightGrams]));
  const grams = lines.reduce((sum, l) => sum + (weightOf.get(l.variantId) || weightGrams) * l.quantity, 0);
  return Math.max(0.1, Math.round(grams / 10) / 100);
}

/**
 * What shipping costs to a pincode, for checkout and the pincode checker.
 * `free` is the store's own rule (₹1,499+ or a free-shipping code): the
 * customer pays nothing, but the courier still has to serve the pincode.
 */
export async function quoteShipping({ pincode, cod, lines, subtotal, free }) {
  const flatFee = await settingNumber("shipping.flatFee", COMMERCE_DEFAULTS.flatShippingFee);
  const fallback = { ok: true, live: false, serviceable: true, codAvailable: true, amount: free ? 0 : flatFee };
  if (!/^\d{6}$/.test(String(pincode ?? ""))) return { ok: false, reason: "Enter a 6-digit PIN code." };
  if (!shippingLive()) return fallback;
  try {
    const pickup = await pickupAddress();
    const weightKg = await parcelWeightKg(lines);
    const { couriers } = await sr.serviceability({
      pickupPincode: pickup.pincode,
      deliveryPincode: pincode,
      weightKg,
      cod,
      declaredValue: Math.max(1, Math.round(subtotal / 100)),
    });
    if (!couriers.length) return { ok: true, live: true, serviceable: false, codAvailable: false };
    const codCouriers = couriers.filter((c) => c.cod);
    // Without a COD courier the price shown is the prepaid one, flagged so
    // checkout can ask for card or UPI instead.
    const usable = cod && codCouriers.length ? codCouriers : couriers;
    const cheapest = usable.reduce((low, c) => (c.rate < low.rate ? c : low), usable[0]);
    const withDays = usable.filter((c) => c.days);
    const fastest = withDays.length ? withDays.reduce((f, c) => (c.days < f.days ? c : f), withDays[0]) : null;
    return {
      ok: true,
      live: true,
      serviceable: true,
      codAvailable: codCouriers.length > 0,
      // Whole rupees, rounded up, so the store never ships at a loss to a paisa.
      amount: free ? 0 : Math.ceil(cheapest.rate) * 100,
      etd: cheapest.etd,
      days: cheapest.days,
      fastestDays: fastest?.days ?? null,
      fastestEtd: fastest?.etd ?? null,
    };
  } catch (error) {
    console.error("[shipping] quote failed, using the flat fee", error);
    return { ...fallback, degraded: true };
  }
}

// ---------------------------------------------------------------- orders

function orderDate(date) {
  // Shiprocket wants "yyyy-mm-dd HH:mm", in India's time.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function phone10(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.slice(-10);
}

/**
 * Items as Shiprocket sees them, with any discount spread across them so the
 * line prices add up to exactly what the customer owes for goods. That keeps
 * the cash-on-delivery amount the courier collects equal to the order total.
 */
function itemsForShiprocket(order) {
  const goods = order.subtotal - order.discountTotal;
  const factor = order.subtotal > 0 ? goods / order.subtotal : 1;
  let allocated = 0;
  const items = order.items.map((item, index) => {
    const isLast = index === order.items.length - 1;
    const linePaise = isLast ? goods - allocated : Math.round(item.lineTotal * factor);
    allocated += linePaise;
    return {
      name:
        item.variantName && item.variantName !== item.productName
          ? `${item.productName} - ${item.variantName}`
          : item.productName,
      sku: item.sku || item.variantId || item.id,
      units: item.quantity,
      selling_price: Math.round(linePaise / item.quantity) / 100,
      discount: 0,
      tax: 0,
    };
  });
  return { items, subTotal: goods / 100 };
}

function splitName(full) {
  const [first, ...rest] = String(full ?? "").trim().split(/\s+/);
  return { first: first || "Customer", last: rest.join(" ") };
}

/**
 * Sends an order to Shiprocket. Cash-on-delivery orders go when placed;
 * card/UPI orders once paid. Safe to call twice: an order that already has a
 * Shiprocket id is left alone. Failures are saved on the order for the admin.
 */
export async function syncOrderToShiprocket(orderNumber) {
  if (!shippingLive()) return { ok: false, skipped: "Shiprocket is not set up." };
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) return { ok: false, skipped: "No such order." };
  if (order.srOrderId) return { ok: true, srOrderId: order.srOrderId };
  if (["cancelled", "refunded"].includes(order.status)) return { ok: false, skipped: "The order is cancelled." };
  if (order.paymentProvider !== "cod" && order.paymentStatus !== "paid") {
    return { ok: false, skipped: "Waiting for payment." };
  }
  try {
    const pickup = await pickupAddress();
    const box = await packageSettings();
    const weightKg = await parcelWeightKg(order.items);
    const { first, last } = splitName(order.shippingName);
    const { items, subTotal } = itemsForShiprocket(order);
    // A cancelled Shiprocket order keeps its id for good, so a re-send needs a new one.
    const srOrderRef = order.shipmentStatus === "CANCELED" ? `${order.orderNumber}-${Date.now().toString(36)}` : order.orderNumber;
    const result = await sr.createOrder({
      order_id: srOrderRef,
      order_date: orderDate(order.placedAt),
      pickup_location: pickup.name,
      billing_customer_name: first,
      billing_last_name: last,
      billing_address: order.shippingLine1,
      billing_address_2: order.shippingLine2 || "",
      billing_city: order.shippingCity,
      billing_pincode: order.shippingPostalCode,
      billing_state: order.shippingState,
      billing_country: order.shippingCountry || "India",
      billing_email: order.email,
      billing_phone: phone10(order.shippingPhone),
      shipping_is_billing: true,
      order_items: items,
      payment_method: order.paymentProvider === "cod" ? "COD" : "Prepaid",
      shipping_charges: order.shippingTotal / 100,
      total_discount: 0,
      sub_total: subTotal,
      length: box.length,
      breadth: box.breadth,
      height: box.height,
      weight: weightKg,
      ...(order.notes ? { comment: order.notes.slice(0, 200) } : {}),
    });
    await prisma.order.update({
      where: { id: order.id },
      data: {
        srOrderId: result.srOrderId,
        srShipmentId: result.srShipmentId,
        srSyncedAt: new Date(),
        srSyncError: null,
        shipmentStatus: result.status || "NEW",
        courierId: null,
        courierName: null,
        labelUrl: null,
      },
    });
    await recordAudit({
      action: "shiprocket.order_created",
      entity: "Order",
      entityId: order.id,
      meta: { orderNumber, srOrderId: result.srOrderId, srShipmentId: result.srShipmentId },
    });
    return { ok: true, srOrderId: result.srOrderId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach Shiprocket.";
    console.error(`[shipping] could not send ${orderNumber} to Shiprocket`, error);
    // Only if no other attempt has succeeded in the meantime.
    await prisma.order.updateMany({
      where: { id: order.id, srOrderId: null },
      data: { srSyncError: message.slice(0, 500) },
    });
    return { ok: false, error: message };
  }
}

/** Fire-and-forget form for checkout and the payment webhook. */
export function syncOrderInBackground(orderNumber) {
  void syncOrderToShiprocket(orderNumber).catch((error) => {
    console.error(`[shipping] background sync failed for ${orderNumber}`, error);
  });
}

/** The couriers on offer for an order already in Shiprocket, for the admin. */
export async function courierOptions(order) {
  const pickup = await pickupAddress();
  const weightKg = await parcelWeightKg(order.items);
  const { couriers, recommendedId } = await sr.serviceability({
    pickupPincode: pickup.pincode,
    deliveryPincode: order.shippingPostalCode,
    weightKg,
    cod: order.paymentProvider === "cod",
    declaredValue: Math.max(1, Math.round(order.grandTotal / 100)),
  });
  const usable = order.paymentProvider === "cod" ? couriers.filter((c) => c.cod) : couriers;
  return {
    couriers: usable.sort((a, b) => a.rate - b.rate),
    recommendedId: usable.some((c) => c.id === recommendedId) ? recommendedId : usable[0]?.id ?? null,
    weightKg,
  };
}

// The order an order moves through; tracking can only move it forward.
const RANK = { pending: 0, confirmed: 1, processing: 2, packed: 3, shipped: 4, out_for_delivery: 5, delivered: 6 };

/**
 * Moves an order to a status with an event and, where it matters to the
 * shopper, an email. Never moves backwards, and never touches an order that
 * has been cancelled or refunded.
 */
async function advanceOrder(order, status, message, extra = {}, actorId = null) {
  if (["cancelled", "refunded"].includes(order.status)) return false;
  if ((RANK[status] ?? -1) <= (RANK[order.status] ?? -1)) {
    if (Object.keys(extra).length) await prisma.order.update({ where: { id: order.id }, data: extra });
    return false;
  }
  await prisma.order.update({
    where: { id: order.id },
    data: {
      ...extra,
      status,
      events: { create: { status, message: message || null, actorId } },
    },
  });
  if (statusDeservesEmail(status)) await sendOrderStatusEmail(order.orderNumber, status, message || null);
  return true;
}

/**
 * Dispatches an order: assigns the courier and tracking number (this is the
 * step that charges the Shiprocket wallet), books the pickup and makes the
 * label. The pickup and label are best-effort — the shipment exists either
 * way, and both can be done again from the Shiprocket panel.
 */
export async function shipOrder(orderId, courierId, actorId) {
  let order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("That order no longer exists.");
  if (["cancelled", "refunded"].includes(order.status)) throw new Error("This order is cancelled.");
  if (order.trackingNumber && order.srShipmentId && order.courierId) throw new Error("This order already has a courier.");
  if (!order.srShipmentId) {
    const synced = await syncOrderToShiprocket(order.orderNumber);
    if (!synced.ok) throw new Error(synced.error || synced.skipped || "Could not send the order to Shiprocket.");
    order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  }
  const awb = await sr.assignAwb(order.srShipmentId, courierId);
  const trackingUrl = trackingUrlFor(awb.awb);
  await prisma.order.update({
    where: { id: order.id },
    data: {
      trackingNumber: awb.awb,
      trackingUrl,
      courierId: awb.courierId,
      courierName: awb.courierName,
      fulfillmentStatus: "awaiting_pickup",
      shipmentStatus: "AWB ASSIGNED",
      srSyncError: null,
    },
  });
  let pickupNote = null;
  try {
    const pickup = await sr.schedulePickup(order.srShipmentId);
    if (pickup.scheduledFor) pickupNote = `Pickup booked for ${pickup.scheduledFor}.`;
  } catch (error) {
    pickupNote = `Pickup not booked: ${error.message}`;
  }
  let labelUrl = null;
  try {
    labelUrl = await sr.generateLabel(order.srShipmentId);
    await prisma.order.update({ where: { id: order.id }, data: { labelUrl } });
  } catch (error) {
    console.error(`[shipping] label for ${order.orderNumber}`, error);
  }
  await advanceOrder(
    order,
    "packed",
    `Booked with ${awb.courierName ?? "the courier"} — tracking number ${awb.awb}.${pickupNote ? ` ${pickupNote}` : ""}`,
    {},
    actorId,
  );
  await recordAudit({
    actorId,
    action: "shiprocket.shipped",
    entity: "Order",
    entityId: order.id,
    meta: { orderNumber: order.orderNumber, awb: awb.awb, courier: awb.courierName, courierId: awb.courierId },
  });
  return { awb: awb.awb, courierName: awb.courierName, labelUrl, pickupNote };
}

/** A fresh label link — Shiprocket's links expire. */
export async function labelFor(order) {
  if (!order.srShipmentId || !order.trackingNumber) throw new Error("Ship the order first.");
  const labelUrl = await sr.generateLabel(order.srShipmentId);
  await prisma.order.update({ where: { id: order.id }, data: { labelUrl } });
  return labelUrl;
}

// Shiprocket's labels, upper-cased, for the moments that change the order.
const SHIPPED = ["PICKED UP", "SHIPPED", "IN TRANSIT", "REACHED AT DESTINATION HUB", "MISROUTED", "DELAYED", "REACHED BACK AT SELLER CITY"];

function mergeActivities(existing, incoming) {
  const all = [...(Array.isArray(incoming) ? incoming : []), ...(Array.isArray(existing) ? existing : [])];
  const seen = new Set();
  return all
    .filter((a) => {
      const key = `${a.date}|${a.activity}`;
      if (!a?.date || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 60);
}

/**
 * Applies a tracking update — from the webhook or a live lookup — to an order:
 * the courier's status and scans, and the order's own status when the parcel
 * is picked up, out for delivery or delivered. A delivered cash-on-delivery
 * order is marked paid, because the courier has collected the money.
 */
export async function applyTrackingUpdate(order, update) {
  const status = String(update.currentStatus ?? "").trim().toUpperCase();
  const base = {
    trackedAt: new Date(),
    ...(status ? { shipmentStatus: status } : {}),
    ...(update.etd ? { shipmentEta: String(update.etd) } : {}),
    ...(update.courierName && !order.courierName ? { courierName: update.courierName } : {}),
    trackingActivities: mergeActivities(order.trackingActivities, update.activities),
  };
  if (status === "DELIVERED") {
    const paid = order.paymentProvider === "cod" && order.paymentStatus !== "paid";
    const moved = await advanceOrder(order, "delivered", "Delivered by the courier.", {
      ...base,
      fulfillmentStatus: "fulfilled",
      ...(paid ? { paymentStatus: "paid" } : {}),
    });
    if (!moved) await prisma.order.update({ where: { id: order.id }, data: base });
    return;
  }
  if (status === "OUT FOR DELIVERY") {
    const moved = await advanceOrder(order, "out_for_delivery", "Out for delivery today.", base);
    if (!moved) await prisma.order.update({ where: { id: order.id }, data: base });
    return;
  }
  if (SHIPPED.includes(status)) {
    const moved = await advanceOrder(
      order,
      "shipped",
      `Picked up by ${order.courierName ?? update.courierName ?? "the courier"}.`,
      { ...base, fulfillmentStatus: "in_transit" },
    );
    if (!moved) await prisma.order.update({ where: { id: order.id }, data: base });
    return;
  }
  if (status.startsWith("RTO") && order.shipmentStatus !== status) {
    // Returning to the store — undeliverable or refused. Logged, not emailed.
    await prisma.order.update({
      where: { id: order.id },
      data: { ...base, events: { create: { status: order.status, message: `Courier: ${update.currentStatus}.` } } },
    });
    return;
  }
  await prisma.order.update({ where: { id: order.id }, data: base });
}

/**
 * Looks tracking up live when the stored copy is older than `maxAgeMinutes`,
 * for the customer's tracking page. Errors leave the stored copy in place.
 */
export async function refreshTracking(order, { maxAgeMinutes = 30 } = {}) {
  if (!shippingLive() || !order.trackingNumber) return order;
  if (["delivered", "cancelled", "refunded"].includes(order.status)) return order;
  if (order.trackedAt && Date.now() - new Date(order.trackedAt).getTime() < maxAgeMinutes * 60 * 1000) return order;
  try {
    const live = await sr.trackAwb(order.trackingNumber);
    if (live.currentStatus || live.activities.length) await applyTrackingUpdate(order, live);
    else await prisma.order.update({ where: { id: order.id }, data: { trackedAt: new Date() } });
    return (await prisma.order.findUnique({ where: { id: order.id } })) ?? order;
  } catch (error) {
    console.error(`[shipping] live tracking for ${order.orderNumber}`, error);
    return order;
  }
}

/**
 * Cancels the order in Shiprocket (and its shipment, if not yet picked up)
 * and clears the courier, so the order can be shipped again later.
 */
export async function cancelShipment(order, actorId = null) {
  if (!order.srOrderId) return { ok: true, skipped: true };
  await sr.cancelOrders([order.srOrderId]);
  await prisma.order.update({
    where: { id: order.id },
    data: {
      srOrderId: null,
      srShipmentId: null,
      courierId: null,
      courierName: null,
      labelUrl: null,
      trackingNumber: null,
      trackingUrl: null,
      shipmentStatus: "CANCELED",
      fulfillmentStatus: "unfulfilled",
    },
  });
  await recordAudit({
    actorId,
    action: "shiprocket.cancelled",
    entity: "Order",
    entityId: order.id,
    meta: { orderNumber: order.orderNumber, srOrderId: order.srOrderId, awb: order.trackingNumber },
  });
  return { ok: true };
}

/**
 * Books a return: a reverse pickup from the customer back to the store's
 * pickup address, with a courier and pickup assigned straight away.
 */
export async function bookReturn(orderId, actorId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("That order no longer exists.");
  if (order.status !== "delivered") throw new Error("Only delivered orders can be returned.");
  if (order.returnSrOrderId) throw new Error("A return is already booked for this order.");
  const pickup = await pickupAddress();
  const box = await packageSettings();
  const weightKg = await parcelWeightKg(order.items);
  const { first, last } = splitName(order.shippingName);
  const store = splitName(pickup.contact || pickup.name);
  const { items, subTotal } = itemsForShiprocket(order);
  const created = await sr.createReturnOrder({
    order_id: `${order.orderNumber}-RET`,
    order_date: orderDate(new Date()).slice(0, 10),
    pickup_customer_name: first,
    pickup_last_name: last,
    pickup_address: order.shippingLine1,
    pickup_address_2: order.shippingLine2 || "",
    pickup_city: order.shippingCity,
    pickup_state: order.shippingState,
    pickup_country: order.shippingCountry || "India",
    pickup_pincode: order.shippingPostalCode,
    pickup_email: order.email,
    pickup_phone: phone10(order.shippingPhone),
    pickup_isd_code: "91",
    shipping_customer_name: store.first,
    shipping_last_name: store.last,
    shipping_address: pickup.address,
    shipping_address_2: pickup.address2 || "",
    shipping_city: pickup.city,
    shipping_country: pickup.country || "India",
    shipping_pincode: pickup.pincode,
    shipping_state: pickup.state,
    shipping_email: pickup.email,
    shipping_isd_code: "91",
    shipping_phone: phone10(pickup.phone),
    order_items: items,
    payment_method: "PREPAID",
    total_discount: 0,
    sub_total: subTotal,
    length: box.length,
    breadth: box.breadth,
    height: box.height,
    weight: weightKg,
  });
  let returnAwb = null;
  let note = null;
  if (created.srShipmentId) {
    try {
      returnAwb = (await sr.assignAwb(created.srShipmentId, null, { isReturn: true })).awb;
      await sr.schedulePickup(created.srShipmentId).catch(() => null);
    } catch (error) {
      note = `Return created; assign its courier in the Shiprocket panel (${error.message}).`;
    }
  }
  await prisma.order.update({
    where: { id: order.id },
    data: {
      returnSrOrderId: created.srOrderId,
      returnSrShipmentId: created.srShipmentId,
      returnAwb,
      returnStatus: created.status || "RETURN PENDING",
      events: {
        create: {
          status: order.status,
          message: returnAwb ? `Return pickup booked — tracking number ${returnAwb}.` : "Return booked.",
          actorId,
        },
      },
    },
  });
  await recordAudit({
    actorId,
    action: "shiprocket.return_booked",
    entity: "Order",
    entityId: order.id,
    meta: { orderNumber: order.orderNumber, returnSrOrderId: created.srOrderId, returnAwb },
  });
  return { returnSrOrderId: created.srOrderId, returnAwb, note };
}
