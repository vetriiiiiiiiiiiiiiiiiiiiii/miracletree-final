"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";
import { fieldErrors, formText } from "@/lib/validation";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
/**
 * Guest order lookup.
 *
 * The confirmation page is tied to the browser that placed the order, which is
 * correct but useless a week later or on a different device. This is the way
 * back in, and it deliberately asks for two things: the order number *and* the
 * email on the order. Order numbers are sequential, so the number alone proves
 * nothing — the email is what makes this a lookup rather than an enumeration.
 *
 * The response is also narrow on purpose. It returns status, dates and item
 * names; it does not return the shipping address, phone number or payment
 * details, because none of those are needed to answer "where is my order" and
 * all of them are worth stealing.
 */
const trackSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(4, "Enter the order number from your confirmation email.")
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "Order numbers look like MT-2609-0001."),
  email: z.string().trim().email("Enter the email address used for the order."),
});
export async function trackOrderAction(_prev, formData) {
  await pruneRateLimits();
  const parsed = trackSchema.safeParse({
    orderNumber: formText(formData, "orderNumber"),
    email: formText(formData, "email"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the details and try again.",
      errors: fieldErrors(parsed.error),
    };
  }
  // Tight, because this endpoint takes a guessable identifier and an email.
  // Without it the pair could be brute-forced against a known order number.
  const limit = await rateLimit({
    key: `track:${await clientIp()}`,
    limit: 8,
    windowSeconds: 900,
  });
  if (!limit.ok) {
    return {
      status: "error",
      message: "Too many attempts from this network. Try again in a few minutes.",
    };
  }
  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber.toUpperCase() },
    select: {
      orderNumber: true,
      email: true,
      status: true,
      paymentStatus: true,
      placedAt: true,
      trackingNumber: true,
      trackingUrl: true,
      items: { select: { productName: true, variantName: true, quantity: true } },
      events: {
        orderBy: { createdAt: "asc" },
        select: { status: true, message: true, createdAt: true },
      },
    },
  });
  // One message whether the order is missing or the email does not match, so
  // this cannot be used to discover which order numbers exist.
  const mismatch =
    !order || order.email.toLowerCase() !== parsed.data.email.toLowerCase();
  if (mismatch) {
    return {
      status: "error",
      message:
        "We could not find an order with that number and email address. Check both against your confirmation email.",
    };
  }
  return {
    status: "found",
    order: {
      orderNumber: order.orderNumber,
      placedAt: order.placedAt.toISOString(),
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status] ?? order.status,
      paymentStatus: order.paymentStatus,
      // The courier's own reference. A signed-in shopper already sees this on
      // the order page; a guest was told it existed in the shipping email and
      // then had nowhere to read it. It is on the order either way — no more
      // of the record is exposed than before.
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      itemCount: order.items.reduce((n, i) => n + i.quantity, 0),
      items: order.items.map((i) => ({
        // Variant names repeat the product on single-variant lines, so only
        // append one when it adds something.
        name:
          i.variantName && i.variantName !== i.productName
            ? `${i.productName} — ${i.variantName}`
            : i.productName,
        quantity: i.quantity,
      })),
      events: order.events.map((e) => ({
        status: e.status,
        label: ORDER_STATUS_LABELS[e.status] ?? e.status,
        message: e.message,
        at: e.createdAt.toISOString(),
      })),
    },
  };
}
