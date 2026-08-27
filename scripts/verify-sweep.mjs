/**
 * Proves the sweep: plants an unpaid order that is older than the TTL, checks
 * its stock really is reserved, sweeps, then checks the reservation came back
 * and the order was cancelled.
 */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const prisma = new PrismaClient();

const variant = await prisma.productVariant.findFirst({
  where: { inventory: { trackInventory: true } },
  include: { inventory: true, product: true },
});
if (!variant) throw new Error("no tracked variant to test with");

const before = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
console.log(`start        onHand=${before.onHand} reserved=${before.reserved}`);

// An order placed two hours ago, never paid.
const placedAt = new Date(Date.now() - 120 * 60_000);
const order = await prisma.order.create({
  data: {
    orderNumber: `MT-SWEEP-${Date.now().toString().slice(-5)}`,
    email: "sweep-test@example.com",
    status: "pending",
    paymentStatus: "unpaid",
    subtotal: variant.price, grandTotal: variant.price,
    shippingName: "Sweep Test", shippingLine1: "1 Test Road",
    shippingCity: "Madurai", shippingState: "Tamil Nadu",
    shippingPostalCode: "625001", shippingPhone: "9000000000",
    placedAt,
    items: {
      create: {
        productId: variant.productId, variantId: variant.id,
        productName: variant.product.name, variantName: variant.name,
        unitPrice: variant.price, quantity: 2, lineTotal: variant.price * 2,
      },
    },
  },
});

await prisma.inventory.update({
  where: { variantId: variant.id },
  data: { reserved: { increment: 2 } },
});

const held = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
console.log(`reserved     onHand=${held.onHand} reserved=${held.reserved}   (order ${order.orderNumber}, placed 2h ago, unpaid)`);

execSync("node scripts/sweep-reservations.mjs", { stdio: "inherit" });

const after = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
const swept = await prisma.order.findUnique({
  where: { id: order.id },
  include: { events: { orderBy: { createdAt: "desc" }, take: 1 } },
});
console.log(`after sweep  onHand=${after.onHand} reserved=${after.reserved}`);
console.log(`order status ${swept.status} — "${swept.events[0]?.message ?? ""}"`);

const ok = after.reserved === before.reserved && swept.status === "cancelled";
console.log(ok ? "\nPASS: reservation released and order cancelled" : "\nFAIL");

// Leave no test data behind.
await prisma.orderEvent.deleteMany({ where: { orderId: order.id } });
await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
await prisma.order.delete({ where: { id: order.id } });
await prisma.inventoryMovement.deleteMany({ where: { reference: order.orderNumber } });
await prisma.$disconnect();
process.exit(ok ? 0 : 1);
