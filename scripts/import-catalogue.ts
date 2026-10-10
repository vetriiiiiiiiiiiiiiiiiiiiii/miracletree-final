/**
 * Gives a deployed database the catalogue it was never seeded with.
 *
 * The VPS database is created empty by Mongo and the seed is never run there —
 * rightly, since it wipes orders and customers first. So the shop went live
 * with whatever had been typed into the admin, and none of the 27 real
 * products, their photos or their categories.
 *
 * This adds what is missing and nothing else: products are matched by slug and
 * skipped if present, nothing is updated or deleted. It runs once per database
 * and records that it did, so a product the business later deletes in the
 * admin is not brought back on the next restart.
 *
 * Bundled into prisma/import-catalogue.mjs during the image build (the runner
 * has no TypeScript toolchain) and run from start.sh.
 */
import { PrismaClient } from "@prisma/client";
import { importCatalogue } from "../prisma/seed";

const MARKER = "catalogue.imported";
const prisma = new PrismaClient();

try {
  const done = await prisma.siteSetting.findUnique({ where: { key: MARKER } });
  if (done) {
    console.log(`[catalogue] already imported on ${done.value}.`);
  } else {
    const imported = await importCatalogue(prisma, { onlyMissing: true });
    await prisma.siteSetting.create({
      data: { key: MARKER, value: new Date().toISOString() },
    });
    console.log(`[catalogue] done, ${imported} added.`);
  }
} finally {
  await prisma.$disconnect();
}
