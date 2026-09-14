/**
 * Makes variant SKUs unique, in place, before the unique index is applied.
 *
 * The old SKU scheme was the product slug's first twelve characters plus the
 * variant position, which collided the moment two products shared a prefix:
 * four herbal teas all carried MT-MORINGA-WITH-2 and moringa seed oil shared a
 * code with moringa seed capsules. The seed no longer produces those, but a
 * database created by an older image still holds them, and `prisma db push`
 * cannot add a unique index over duplicates — it fails, the schema stays
 * behind, and the app throws on the first query against a table the old
 * database does not have.
 *
 * So this runs first. Duplicates keep the row that was created earliest and
 * the rest get a numbered suffix, which is deterministic and touches nothing
 * else: no row is deleted, no other column is written. On a database that is
 * already clean it does nothing at all, so it is safe on every boot.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const variants = await prisma.productVariant.findMany({
    select: { id: true, sku: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Set();
  const fixes = [];

  for (const variant of variants) {
    if (!variant.sku) continue;
    if (!seen.has(variant.sku)) {
      seen.add(variant.sku);
      continue;
    }
    // Taken: find the first free suffix rather than assuming -2 is available.
    let n = 2;
    let candidate = `${variant.sku}-${n}`;
    while (seen.has(candidate)) candidate = `${variant.sku}-${++n}`;
    seen.add(candidate);
    fixes.push({ id: variant.id, from: variant.sku, to: candidate });
  }

  if (!fixes.length) {
    console.log("SKUs are already unique; nothing to repair.");
  } else {
    for (const fix of fixes) {
      await prisma.productVariant.update({
        where: { id: fix.id },
        data: { sku: fix.to },
      });
      console.log(`  ${fix.from} -> ${fix.to}`);
    }
    console.log(`Repaired ${fixes.length} duplicate SKU(s).`);
  }
} catch (error) {
  // A database that predates the ProductVariant table, or has no database at
  // all yet, is not a failure worth stopping a boot for — the schema sync that
  // runs next is what creates it.
  console.warn("SKU repair skipped:", error.message.split("\n")[0]);
} finally {
  await prisma.$disconnect();
}
