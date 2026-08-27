/**
 * Releases stock held by unpaid orders that were never completed.
 *
 * Intended for cron — every ten minutes is ample:
 *   *\/10 * * * * cd /srv/miracle && node scripts/sweep-reservations.mjs
 *
 * Safe to run repeatedly: it only ever touches orders that are still pending
 * and still unpaid, and it is a no-op when there are none.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TTL_MINUTES = Number(process.env.RESERVATION_TTL_MINUTES ?? 45);

const cutoff = new Date(Date.now() - TTL_MINUTES * 60_000);

const stale = await prisma.order.findMany({
  where: { status: "pending", paymentStatus: "unpaid", placedAt: { lt: cutoff } },
  select: {
    id: true,
    orderNumber: true,
    items: { select: { variantId: true, quantity: true } },
  },
  take: 100,
});

for (const order of stale) {
  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      // Null once the variant has been deleted — nothing left to credit.
      if (!item.variantId) continue;

      const inventory = await tx.inventory.findUnique({
        where: { variantId: item.variantId },
      });
      if (!inventory || !inventory.trackInventory) continue;

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reserved: Math.max(0, inventory.reserved - item.quantity) },
      });
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          delta: item.quantity,
          reason: "release",
          reference: order.orderNumber,
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "cancelled",
        events: {
          create: {
            status: "cancelled",
            message: `Reservation expired after ${TTL_MINUTES} minutes without payment.`,
          },
        },
      },
    });
  });

  console.log(`released ${order.orderNumber}`);
}

console.log(`sweep complete: ${stale.length} order(s) released`);
await prisma.$disconnect();
