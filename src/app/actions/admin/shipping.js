"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import {
  bookReturn,
  cancelShipment,
  courierOptions,
  labelFor,
  pickupAddress,
  refreshTracking,
  shipOrder,
  shippingLive,
  syncOrderToShiprocket,
} from "@/lib/shipping";
/**
 * The admin's Shiprocket controls on an order page. Every action re-reads the
 * order and reports Shiprocket's own message when something is refused.
 */
const ID = /^[0-9a-fA-F]{24}$/;

function failure(error) {
  if (error instanceof AuthError) return { ok: false, error: error.message };
  console.error("[admin/shipping]", error);
  return { ok: false, error: error instanceof Error ? error.message : "Shiprocket did not respond." };
}

async function loadOrder(orderId) {
  if (!ID.test(String(orderId))) throw new Error("Invalid order.");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new Error("That order no longer exists.");
  return order;
}

function refresh(orderId) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function syncToShiprocketAction(orderId) {
  try {
    await requireAdmin();
    if (!shippingLive()) return { ok: false, error: "Shiprocket is not set up on the server." };
    const order = await loadOrder(orderId);
    const result = await syncOrderToShiprocket(order.orderNumber);
    refresh(orderId);
    return result.ok ? { ok: true } : { ok: false, error: result.error || result.skipped };
  } catch (error) {
    return failure(error);
  }
}

export async function courierOptionsAction(orderId) {
  try {
    await requireAdmin();
    const order = await loadOrder(orderId);
    const options = await courierOptions(order);
    return { ok: true, ...options };
  } catch (error) {
    return failure(error);
  }
}

export async function shipOrderAction(orderId, courierId) {
  try {
    const admin = await requireAdmin();
    const result = await shipOrder(orderId, Number(courierId) || null, admin.id);
    refresh(orderId);
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}

export async function refreshTrackingAction(orderId) {
  try {
    await requireAdmin();
    const order = await loadOrder(orderId);
    await refreshTracking(order, { maxAgeMinutes: 0 });
    refresh(orderId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function labelAction(orderId) {
  try {
    await requireAdmin();
    const order = await loadOrder(orderId);
    const url = await labelFor(order);
    return { ok: true, url };
  } catch (error) {
    return failure(error);
  }
}

export async function cancelShipmentAction(orderId) {
  try {
    const admin = await requireAdmin();
    const order = await loadOrder(orderId);
    if (["shipped", "out_for_delivery", "delivered"].includes(order.status)) {
      return { ok: false, error: "The courier already has this parcel. Ask Shiprocket support to stop it, or book a return after delivery." };
    }
    await cancelShipment(order, admin.id);
    refresh(orderId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function bookReturnAction(orderId) {
  try {
    const admin = await requireAdmin();
    const result = await bookReturn(orderId, admin.id);
    refresh(orderId);
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}

/** Admin → Settings: checks the API user and lists the pickup addresses. */
export async function testShiprocketAction() {
  try {
    await requireAdmin();
    if (!shippingLive()) {
      return { ok: false, error: "Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD to the server's .env file, then restart." };
    }
    const pickup = await pickupAddress();
    return { ok: true, pickup: { name: pickup.name, city: pickup.city, pincode: pickup.pincode } };
  } catch (error) {
    return failure(error);
  }
}
