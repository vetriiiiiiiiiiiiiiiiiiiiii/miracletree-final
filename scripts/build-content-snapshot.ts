/**
 * Builds content-snapshot.json straight from the seed's source data, with no
 * database.
 *
 * export-content.mjs expects a freshly seeded database to read from, but the
 * image build has none — the Mongo container is not running while
 * `docker compose build` is. So the snapshot was never written, sync-content
 * found nothing to apply on every start, and a VPS database kept whatever
 * navigation and editorial content it happened to have (often none at all).
 *
 * The rows here are shaped exactly as prisma/seed.ts creates them, so a
 * deployed site ends up with the same content as a freshly seeded local one.
 *
 * Run during the image build: `npx tsx scripts/build-content-snapshot.ts`.
 */
import { writeFileSync } from "node:fs";
import {
  ARTICLES,
  FAQS,
  HOMEPAGE_SECTIONS,
  NAVIGATION,
  SETTINGS,
  TESTIMONIALS,
  slugify,
  stripHtml,
} from "../prisma/seed";
import { ACCOLADES, CREDITS, MILESTONES } from "../prisma/story";
import { LEADERS } from "../prisma/leadership";

const content = {
  // Bump when the repo's copy should be pushed over whatever a deployed
  // database is holding. See sync-content.mjs.
  version: process.env.CONTENT_VERSION ?? "2026-10-10.1",
  articles: ARTICLES.map(({ category, since, ...a }) => ({
    ...a,
    status: "published",
    publishedAt: new Date(Date.UTC(since, 0, 1)),
    readingMinutes: Math.max(1, Math.round(stripHtml(a.content).split(/\s+/).length / 220)),
    seoTitle: a.title,
    seoDescription: a.excerpt,
    category: { name: category, slug: slugify(category) },
  })),
  sections: HOMEPAGE_SECTIONS.map((s) => ({ ...s, isActive: true })),
  faqs: FAQS.map((f, i) => ({ ...f, position: i, isActive: true })),
  milestones: MILESTONES.map((m, i) => ({ ...m, position: i, isActive: true })),
  accolades: ACCOLADES.map((a, i) => ({ ...a, position: i, isActive: true })),
  credits: CREDITS.map((c, i) => ({ ...c, position: i, isActive: true })),
  navigation: NAVIGATION.map((n) => ({ ...n, isActive: true })),
  testimonials: TESTIMONIALS,
  leaders: LEADERS.map(({ slugKey: _slugKey, highlights, ...l }, i) => ({
    ...l,
    position: i,
    isActive: true,
    highlights: highlights.map((h, j) => ({ ...h, position: j })),
  })),
  // Filled only where missing, never overwritten — see sync-content.mjs.
  announcements: [
    { message: "Free shipping on orders above ₹699", position: 1, isActive: true },
  ],
  settings: SETTINGS,
};

writeFileSync("./content-snapshot.json", JSON.stringify(content));
const counts = Object.entries(content)
  .filter(([, v]) => Array.isArray(v))
  .map(([k, v]) => `${(v as unknown[]).length} ${k}`)
  .join(", ");
console.log(`✓ content snapshot ${content.version}: ${counts}`);
