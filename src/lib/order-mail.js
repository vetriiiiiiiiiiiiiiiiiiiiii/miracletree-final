import { prisma } from "@/lib/prisma";
import { sendInBackground, opsRecipient } from "@/lib/mail";
import { orderConfirmation, newOrderAlert } from "@/lib/mail-templates";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { orderStatusUpdate } from "@/lib/mail-templates";
/**
 * Order email, driven from the order row rather than from whatever the caller
 * happened to have in scope.
 *
 * Both places an order can become real — cash on delivery at checkout, and a
 * Razorpay `payment.captured` webhook — need to send the same receipt. Reading
 * it back from the database in one place means the two paths cannot drift, and
 * the webhook (which has only a payment id to go on) does not need its own
 * assembly logic.
 */
const PAYMENT_LABELS = {
  cod: "Cash on delivery",
  razorpay: "Card / UPI",
};
async function load(orderNumber) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      email: true,
      subtotal: true,
      discountTotal: true,
      shippingTotal: true,
      grandTotal: true,
      paymentProvider: true,
      shippingName: true,
      shippingLine1: true,
      shippingLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingPostalCode: true,
      shippingCountry: true,
      items: {
        select: {
          productName: true,
          variantName: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    customerName: order.shippingName,
    email: order.email,
    items: order.items.map((item) => ({
      name:
        item.variantName && item.variantName !== item.productName
          ? `${item.productName} — ${item.variantName}`
          : item.productName,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    grandTotal: order.grandTotal,
    // `paymentProvider` is nullable on the model — an order can exist before a
    // method is chosen — so it has to be narrowed before it indexes anything.
    paymentMethod: order.paymentProvider
      ? (PAYMENT_LABELS[order.paymentProvider] ?? order.paymentProvider)
      : "Not recorded",
    shippingAddress: [
      order.shippingName,
      order.shippingLine1,
      order.shippingLine2,
      `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
      order.shippingCountry,
    ].filter((line) => Boolean(line && line.trim())),
  };
}
/**
 * Receipt to the shopper, alert to ops. Both in the background: the order is
 * already committed, and neither the checkout response nor a webhook 200
 * should wait on a mail API.
 */
export async function sendOrderPlacedEmails(orderNumber) {
  const data = await load(orderNumber);
  if (!data) {
    console.error(`[order-mail] no order ${orderNumber} to email about`);
    return;
  }
  sendInBackground(orderConfirmation(data));
  const ops = opsRecipient();
  if (ops) sendInBackground(newOrderAlert(data, ops));
}
/** Tell the shopper their order moved — shipped, delivered, cancelled. */
export async function sendOrderStatusEmail(orderNumber, status, message) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      email: true,
      shippingName: true,
      trackingNumber: true,
      trackingUrl: true,
    },
  });
  if (!order) return;
  sendInBackground(
    orderStatusUpdate({
      orderNumber: order.orderNumber,
      email: order.email,
      customerName: order.shippingName,
      statusLabel: ORDER_STATUS_LABELS[status] ?? status,
      message,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    }),
  );
}
/**
 * Statuses worth an email. `pending` and `confirmed` are covered by the receipt
 * the shopper already has, and `processing` / `packed` are internal states that
 * would only add noise to an inbox.
 */
export function statusDeservesEmail(status) {
  return (
    status === "shipped" ||
    status === "out_for_delivery" ||
    status === "delivered" ||
    status === "cancelled" ||
    status === "refunded"
  );
}
