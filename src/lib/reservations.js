import "server-only";
import { prisma } from "./prisma";
import { releaseStock } from "./inventory";
/**
 * Stale reservation sweep.
 *
 * Placing an order reserves its stock; dispatching commits it and cancelling
 * releases it. An order that is never paid and never cancelled does neither, so
 * its reservation is held for ever. Enough abandoned checkouts and a product
 * reports itself sold out while the shelves are full — the stock is not gone,
 * merely spoken for by carts nobody will ever return to.
 *
 * The sweep expires those. It is deliberately conservative:
 *
 *   - only orders still `pending` AND still `unpaid` are touched. A paid order
 *     is never swept, however old, and neither is one an admin has moved on.
 *   - the window is generous. A shopper who opens the gateway, fetches their
 *     card and comes back twenty minutes later must still find their stock.
 *   - release and status change happen in one transaction, so an order cannot
 *     end up cancelled with its stock still reserved, or the reverse.
 *   - the order is cancelled rather than deleted. The record of an abandoned
 *     attempt is worth keeping, and `MT-YYMM-0001` numbers must not be reused.
 */
/** How long an unpaid order may hold its stock. */
export const RESERVATION_TTL_MINUTES = 45;
export async function releaseStaleReservations(ttlMinutes = RESERVATION_TTL_MINUTES) {
  const cutoff = new Date(Date.now() - ttlMinutes * 60_000);
  const stale = await prisma.order.findMany({
    where: {
      status: "pending",
      paymentStatus: "unpaid",
      placedAt: { lt: cutoff },
    },
    select: {
      id: true,
      orderNumber: true,
      items: { select: { variantId: true, quantity: true } },
    },
    // Bounded so one sweep cannot turn into an unbounded transaction after a
    // long outage; the next run picks up whatever is left.
    take: 100,
  });
  const orderNumbers = [];
  for (const order of stale) {
    // `variantId` is nullable: deleting a variant sets it null on historical
    // order items. There is no inventory row left to credit in that case, so
    // those lines are skipped rather than guessed at.
    const lines = order.items
      .filter((item) => item.variantId !== null)
      .map((item) => ({ variantId: item.variantId, quantity: item.quantity }));
    await prisma.$transaction(async (tx) => {
      await releaseStock(tx, lines, order.orderNumber);
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          events: {
            create: {
              status: "cancelled",
              message: `Reservation expired after ${ttlMinutes} minutes without payment.`,
            },
          },
        },
      });
    });
    orderNumbers.push(order.orderNumber);
  }
  return { released: stale.length, orderNumbers };
}
/**
 * Runs the sweep occasionally, from ordinary traffic.
 *
 * A cron job is the better answer and `scripts/sweep-reservations.mjs` is there
 * for one. This exists so a deployment without any scheduler still cannot leak
 * stock indefinitely — at roughly one run in fifty requests it costs almost
 * nothing and never blocks the response.
 */
export function sweepOpportunistically() {
  if (Math.random() > 0.02) return;
  void releaseStaleReservations().catch(() => {
    // A failed sweep must never surface to a shopper; the next one retries.
  });
}
