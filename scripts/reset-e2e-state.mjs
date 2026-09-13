/**
 * Returns the database to a state the e2e suite can run against again.
 *
 * Two things accumulate across runs and eventually break tests that have
 * nothing wrong with them:
 *
 * The rate-limit table. The login limiter caps attempts per account, which is
 * correct in production and hostile to a suite that signs in on every run.
 *
 * Stock reservations. Every checkout test places a real order, and an order
 * that is never fulfilled or cancelled holds its units forever — correct
 * behaviour, but after forty-odd runs the demo variant had forty-four of its
 * forty-five units reserved and the product page stopped saying "In stock".
 * Releasing the holds is a fixture reset, not a change to how reservations
 * work: the orders themselves are left alone.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const { count: limits } = await prisma.rateLimit.deleteMany({});
const { count: held } = await prisma.inventory.updateMany({
  where: { reserved: { not: 0 } },
  data: { reserved: 0 },
});

console.log(`cleared ${limits} rate-limit rows, released ${held} stock reservations`);
await prisma.$disconnect();
