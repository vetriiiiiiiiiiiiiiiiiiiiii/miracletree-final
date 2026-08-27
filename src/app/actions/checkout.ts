"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import {
  InsufficientStockError,
  commitStock,
  nextOrderNumber,
  releaseStock,
  reserveStock,
} from "@/lib/inventory";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  razorpayPublicKey,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { checkoutSchema, fieldErrors, razorpayVerifySchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";

export type CheckoutResult =
  | { ok: false; error: string; errors?: Record<string, string> }
  | { ok: true; kind: "cod"; orderNumber: string }
  | {
      ok: true;
      kind: "razorpay";
      orderId: string;
      orderNumber: string;
      razorpayOrderId: string;
      amount: number;
      keyId: string;
      prefill: { name: string; email: string; contact: string };
    };

/**
 * Places an order.
 *
 * Everything monetary is recomputed here from the database. The client sends
 * only the address, the contact details and the payment method — never a price,
 * a total or a discount. Stock is reserved inside the same transaction that
 * creates the order, so two shoppers cannot both claim the last unit.
 */
export async function placeOrderAction(formData: FormData): Promise<CheckoutResult> {
  const limit = await rateLimit({
    key: `checkout:${await clientIp()}`,
    limit: 12,
    windowSeconds: 600,
  });
  if (!limit.ok) {
    return { ok: false, error: "Too many attempts. Please wait a moment and try again." };
  }

  const parsed = checkoutSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country") || "India",
    notes: formData.get("notes"),
    paymentMethod: formData.get("paymentMethod"),
    saveAddress: formData.get("saveAddress") === "on",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const cart = await getCart();

  if (!cart.id || cart.lines.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }

  if (input.paymentMethod === "razorpay" && !isRazorpayConfigured()) {
    return {
      ok: false,
      error: "Card and UPI payments are unavailable right now. Please choose cash on delivery.",
    };
  }

  const user = await getCurrentUser();
  const stockLines = cart.lines.map((line) => ({
    variantId: line.variantId,
    quantity: line.quantity,
  }));

  const orderNumber = await nextOrderNumber();

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Throws if any line no longer has stock, rolling the whole order back.
      await reserveStock(tx, stockLines, orderNumber, user?.id);

      let addressId: string | null = null;
      if (user && input.saveAddress) {
        const address = await tx.address.create({
          data: {
            userId: user.id,
            firstName: input.firstName,
            lastName: input.lastName || "",
            line1: input.line1,
            line2: input.line2 || null,
            city: input.city,
            state: input.state,
            postalCode: input.postalCode,
            country: input.country,
            phone: input.phone,
          },
        });
        addressId = address.id;
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          email: input.email,
          phone: input.phone,
          status: "pending",
          paymentStatus: "unpaid",
          fulfillmentStatus: "unfulfilled",

          // Server-side totals — the only ones that exist.
          subtotal: cart.totals.subtotal,
          discountTotal: cart.totals.discountTotal,
          shippingTotal: cart.totals.shippingTotal,
          taxTotal: cart.totals.taxTotal,
          grandTotal: cart.totals.grandTotal,
          couponCode: cart.coupon?.code ?? null,

          addressId,
          shippingName: `${input.firstName} ${input.lastName ?? ""}`.trim(),
          shippingLine1: input.line1,
          shippingLine2: input.line2 || null,
          shippingCity: input.city,
          shippingState: input.state,
          shippingPostalCode: input.postalCode,
          shippingCountry: input.country,
          shippingPhone: input.phone,

          paymentProvider: input.paymentMethod,
          notes: input.notes || null,

          items: {
            create: cart.lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              productName: line.productName,
              variantName: line.variantName,
              sku: line.sku,
              imageUrl: line.imageUrl,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
            })),
          },
          events: {
            create: {
              status: "pending",
              message: `Order placed — ${input.paymentMethod === "cod" ? "cash on delivery" : "awaiting payment"}.`,
            },
          },
        },
        select: { id: true, orderNumber: true, grandTotal: true },
      });

      if (cart.coupon) {
        await tx.coupon.update({
          where: { code: cart.coupon.code },
          data: { usageCount: { increment: 1 } },
        });
      }

      return created;
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return { ok: false, error: error.message };
    }
    console.error("[checkout] order creation failed", error);
    return { ok: false, error: "We couldn't place that order. Please try again." };
  }

  await recordAudit({
    actorId: user?.id,
    action: "order.placed",
    entity: "Order",
    entityId: order.id,
    meta: { orderNumber: order.orderNumber, total: order.grandTotal },
  });

  // Cash on delivery is complete at this point.
  if (input.paymentMethod === "cod") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "confirmed",
        events: { create: { status: "confirmed", message: "Cash on delivery confirmed." } },
      },
    });
    await clearCart(cart.id);
    return { ok: true, kind: "cod", orderNumber: order.orderNumber };
  }

  // Card / UPI: hand off to Razorpay for the amount we computed.
  try {
    const rzp = await createRazorpayOrder({
      amount: order.grandTotal,
      receipt: order.orderNumber,
      notes: { orderId: order.id, orderNumber: order.orderNumber },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentOrderId: rzp.id },
    });

    return {
      ok: true,
      kind: "razorpay",
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzp.id,
      amount: order.grandTotal,
      keyId: razorpayPublicKey()!,
      prefill: {
        name: `${input.firstName} ${input.lastName ?? ""}`.trim(),
        email: input.email,
        contact: input.phone,
      },
    };
  } catch (error) {
    console.error("[checkout] razorpay order failed", error);
    // The gateway never took the order, so the stock must go back.
    await prisma.$transaction(async (tx) => {
      await releaseStock(tx, stockLines, order.orderNumber);
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          paymentStatus: "failed",
          events: {
            create: { status: "cancelled", message: "Payment could not be started." },
          },
        },
      });
    });

    return {
      ok: false,
      error: "We couldn't reach the payment gateway. Try again, or choose cash on delivery.",
    };
  }
}

/**
 * Confirms a Razorpay payment. The signature is verified server-side before
 * anything is marked paid — the browser's word is never taken for it.
 */
export async function verifyPaymentAction(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string }> {
  const parsed = razorpayVerifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That payment could not be verified." };

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: {
      id: true,
      orderNumber: true,
      paymentOrderId: true,
      paymentStatus: true,
      items: { select: { variantId: true, quantity: true } },
    },
  });

  if (!order) return { ok: false, error: "We couldn't find that order." };

  // Already handled, most likely by the webhook arriving first.
  if (order.paymentStatus === "paid") {
    return { ok: true, orderNumber: order.orderNumber };
  }

  if (order.paymentOrderId !== parsed.data.razorpay_order_id) {
    return { ok: false, error: "That payment does not match this order." };
  }

  const valid = verifyPaymentSignature({
    razorpayOrderId: parsed.data.razorpay_order_id,
    razorpayPaymentId: parsed.data.razorpay_payment_id,
    signature: parsed.data.razorpay_signature,
  });

  if (!valid) {
    await recordAudit({
      action: "payment.signature_invalid",
      entity: "Order",
      entityId: order.id,
    });
    return { ok: false, error: "That payment could not be verified. You have not been charged twice — contact us if the amount was debited." };
  }

  await markOrderPaid(order.id, parsed.data.razorpay_payment_id);

  const cart = await getCart();
  if (cart.id) await clearCart(cart.id);

  return { ok: true, orderNumber: order.orderNumber };
}

/** Shared by the verify action and the webhook, so both routes agree. */
export async function markOrderPaid(orderId: string, paymentRef: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      items: { select: { variantId: true, quantity: true } },
    },
  });
  if (!order || order.paymentStatus === "paid") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        status: "confirmed",
        paymentRef,
        events: { create: { status: "confirmed", message: "Payment received." } },
      },
    });
    // The units are sold now, not merely spoken for.
    await commitStock(tx, order.items.filter((i) => i.variantId).map((i) => ({
      variantId: i.variantId!,
      quantity: i.quantity,
    })), order.orderNumber);
  });

  await recordAudit({
    action: "order.paid",
    entity: "Order",
    entityId: order.id,
    meta: { orderNumber: order.orderNumber },
  });
}

/** Marks a gateway failure and returns the reserved units to stock. */
export async function markOrderFailed(orderId: string, reason: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      paymentStatus: true,
      items: { select: { variantId: true, quantity: true } },
    },
  });
  if (!order || order.paymentStatus === "paid") return;

  await prisma.$transaction(async (tx) => {
    await releaseStock(
      tx,
      order.items.filter((i) => i.variantId).map((i) => ({
        variantId: i.variantId!,
        quantity: i.quantity,
      })),
      order.orderNumber,
    );
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "failed",
        status: "cancelled",
        events: { create: { status: "cancelled", message: reason } },
      },
    });
  });
}

async function clearCart(cartId: string): Promise<void> {
  await prisma.cartItem.deleteMany({ where: { cartId } });
  await prisma.cart.update({ where: { id: cartId }, data: { couponId: null } });
  // A fresh token means the next visit starts a clean bag.
  const store = await cookies();
  store.delete("mt_cart");
}
