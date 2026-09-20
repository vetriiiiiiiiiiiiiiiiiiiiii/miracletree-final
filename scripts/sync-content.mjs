/**
 * Brings a deployed database's editorial content up to date with the image.
 *
 * The container copies the seeded database into its volume only when the
 * volume is empty. That is right for orders, customers and stock — nobody
 * wants a deploy to wipe those — but it also meant that after the very first
 * deploy, no copy change ever reached the site again. Corrections made weeks
 * earlier and confirmed locally kept showing the old wording in production,
 * because the schema was being pushed on every start and the content never
 * was.
 *
 * So: content is versioned. The image carries a snapshot and a version
 * string; the database records the version it last applied. They match on
 * almost every start and this does nothing. When they differ, the editorial
 * tables are brought in line and the new version recorded.
 *
 * What it touches: articles, homepage sections, FAQs, the timeline, the
 * awards shelf, credits, leadership, navigation and testimonials — the things
 * written in the repo.
 *
 * What it never touches: products, variants, inventory, orders, customers,
 * reviews, carts, coupons, settings and media. Those belong to the shop.
 *
 * Because the version only changes when someone changes it in the repo, edits
 * made in the admin between two deploys survive. A version bump is a
 * deliberate statement that the repo's copy should win.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";

const SNAPSHOT = process.env.CONTENT_SNAPSHOT ?? "./content-snapshot.json";
const VERSION_KEY = "content.version";

if (!existsSync(SNAPSHOT)) {
  console.log(`[content] no snapshot at ${SNAPSHOT}; nothing to sync.`);
  process.exit(0);
}

const prisma = new PrismaClient();
const content = JSON.parse(readFileSync(SNAPSHOT, "utf8"));

const applied = await prisma.siteSetting
  .findUnique({ where: { key: VERSION_KEY }, select: { value: true } })
  .catch(() => null);

if (applied?.value === content.version) {
  console.log(`[content] already at ${content.version}.`);
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`[content] ${applied?.value ?? "none"} → ${content.version}`);

/** Replace a table wholesale. Used only for rows with no stable natural key. */
async function replace(name, model, rows, shape) {
  await model.deleteMany();
  if (rows.length) await model.createMany({ data: rows.map(shape) });
  console.log(`  ${name}: ${rows.length}`);
}

// --- articles: keyed by slug, so a shop's own posts are left alone
let articles = 0;
for (const a of content.articles) {
  const category = a.category
    ? await prisma.articleCategory.upsert({
        where: { slug: a.category.slug },
        create: { name: a.category.name, slug: a.category.slug },
        update: {},
      })
    : null;
  const { category: _drop, ...data } = a;
  await prisma.article.upsert({
    where: { slug: a.slug },
    create: { ...data, categoryId: category?.id ?? null },
    update: { ...data, categoryId: category?.id ?? null },
  });
  articles++;
}
// Field notes the repo no longer carries should go, or the page keeps showing
// the ones that were replaced — which is the whole reason this script exists.
const keep = content.articles.map((a) => a.slug);
const removed = await prisma.article.deleteMany({ where: { slug: { notIn: keep } } });
console.log(`  articles: ${articles} synced, ${removed.count} withdrawn`);

// --- homepage sections: keyed by key
for (const s of content.sections) {
  await prisma.homepageSection.upsert({ where: { key: s.key }, create: s, update: s });
}
console.log(`  sections: ${content.sections.length}`);

// --- the rest have no stable natural key, so they are replaced as a set
await replace("faqs", prisma.faq, content.faqs, (f) => f);
await replace("milestones", prisma.milestone, content.milestones, (m) => m);
await replace("accolades", prisma.accolade, content.accolades, (a) => a);
await replace("credits", prisma.credit, content.credits, (c) => c);
await replace("navigation", prisma.navigationItem, content.navigation, (n) => n);
await replace("testimonials", prisma.testimonial, content.testimonials, (t) => t);

// --- leadership, with each profile's record as child rows
await prisma.leaderHighlight.deleteMany();
await prisma.leader.deleteMany();
for (const { highlights, ...leader } of content.leaders) {
  await prisma.leader.create({
    data: { ...leader, highlights: { create: highlights } },
  });
}
console.log(`  leaders: ${content.leaders.length}`);

await prisma.siteSetting.upsert({
  where: { key: VERSION_KEY },
  create: { key: VERSION_KEY, value: content.version },
  update: { value: content.version },
});
console.log(`[content] now at ${content.version}.`);
await prisma.$disconnect();
