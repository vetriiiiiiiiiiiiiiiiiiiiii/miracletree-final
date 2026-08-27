/**
 * Clears the rate-limit table.
 *
 * The login limiter caps attempts per account, which is correct in production
 * and hostile to a test suite that signs in on every run. Called by the e2e
 * script rather than weakening the limiter itself.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const { count } = await prisma.rateLimit.deleteMany({});
console.log(`cleared ${count} rate-limit rows`);
await prisma.$disconnect();
