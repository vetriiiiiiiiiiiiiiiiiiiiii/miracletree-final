/**
 * Gives a deployed database the editorial content it is missing.
 *
 * The image carries a snapshot of the repo's content (built by
 * build-content-snapshot.ts). On start, each content table that is *empty* is
 * filled from it — a fresh or never-seeded database gets the whole site.
 *
 * A table that already has rows is left exactly as it is. The admin is where
 * this content is managed — navigation, homepage sections, FAQs, the story,
 * leadership portraits, gallery photos — and an earlier version of this script
 * replaced those tables wholesale whenever the content version changed, which
 * would have wiped every photo and edit made in the admin on the next deploy.
 * To push the repo's copy over a table on purpose, empty it in the admin (or
 * the database) and restart.
 *
 * What it never touches: products, variants, inventory, orders, customers,
 * reviews, carts, coupons and media. Those belong to the shop.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";

const SNAPSHOT = process.env.CONTENT_SNAPSHOT ?? "./content-snapshot.json";

if (!existsSync(SNAPSHOT)) {
  console.log(`[content] no snapshot at ${SNAPSHOT}; nothing to sync.`);
  process.exit(0);
}

const prisma = new PrismaClient();
const content = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
let filled = 0;

/** Fill a table from the snapshot only when it holds nothing at all. */
async function fillIfEmpty(name, model, rows, write) {
  if (!rows?.length) return;
  if ((await model.count()) > 0) return;
  await write(rows);
  filled++;
  console.log(`  ${name}: ${rows.length} (was empty)`);
}

await fillIfEmpty("articles", prisma.article, content.articles, async (rows) => {
  for (const { category, ...data } of rows) {
    const cat = category
      ? await prisma.articleCategory.upsert({
          where: { slug: category.slug },
          create: { name: category.name, slug: category.slug },
          update: {},
        })
      : null;
    await prisma.article.create({ data: { ...data, categoryId: cat?.id ?? null } });
  }
});

await fillIfEmpty("sections", prisma.homepageSection, content.sections, (rows) =>
  prisma.homepageSection.createMany({ data: rows }),
);

for (const [name, model, rows] of [
  ["faqs", prisma.faq, content.faqs],
  ["milestones", prisma.milestone, content.milestones],
  ["accolades", prisma.accolade, content.accolades],
  ["credits", prisma.credit, content.credits],
  ["navigation", prisma.navigationItem, content.navigation],
  ["testimonials", prisma.testimonial, content.testimonials],
  ["announcements", prisma.announcement, content.announcements],
]) {
  await fillIfEmpty(name, model, rows, (data) => model.createMany({ data }));
}

await fillIfEmpty("leaders", prisma.leader, content.leaders, async (rows) => {
  for (const { highlights, ...leader } of rows) {
    await prisma.leader.create({
      data: { ...leader, highlights: { create: highlights } },
    });
  }
});

await fillIfEmpty("gallery", prisma.galleryGroup, content.gallery, async (rows) => {
  for (const { photos, ...group } of rows) {
    await prisma.galleryGroup.create({
      data: { ...group, photos: { create: photos } },
    });
  }
});

// Settings are keyed, so each missing key is added on its own.
let settingsAdded = 0;
for (const [key, value] of Object.entries(content.settings ?? {})) {
  const exists = await prisma.siteSetting.findUnique({ where: { key } });
  if (!exists) {
    await prisma.siteSetting.create({ data: { key, value } });
    settingsAdded++;
  }
}
if (settingsAdded) console.log(`  settings: ${settingsAdded} missing keys added`);

console.log(
  filled || settingsAdded
    ? `[content] filled from snapshot ${content.version}.`
    : "[content] nothing missing.",
);
await prisma.$disconnect();
