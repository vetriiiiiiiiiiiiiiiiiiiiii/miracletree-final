/**
 * Writes the editorial content out of the freshly seeded build database into
 * one JSON file, so a running container can be brought up to date without
 * needing the TypeScript seed or its dev dependencies.
 *
 * Runs in the image build, right after the seed. See sync-content.mjs for the
 * other half and for why this exists at all.
 *
 * Every scalar column is taken and the plumbing stripped afterwards, rather
 * than each field being named here: a field list is one more place to forget
 * when the schema grows, and forgetting one means content that silently stops
 * being published.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();

/** Ids, timestamps and foreign keys belong to the row, not to the content. */
const PLUMBING = new Set(["id", "createdAt", "updatedAt", "leaderId", "categoryId"]);
const clean = (row) =>
  Object.fromEntries(Object.entries(row).filter(([k]) => !PLUMBING.has(k)));

const content = {
  // Bumped by hand when the repo's copy should be pushed over whatever a
  // deployed database is holding. See sync-content.mjs.
  version: process.env.CONTENT_VERSION ?? "2026-09-20.2",
  articles: (
    await prisma.article.findMany({ include: { category: true } })
  ).map(({ category, ...a }) => ({
    ...clean(a),
    category: category ? { name: category.name, slug: category.slug } : null,
  })),
  sections: (await prisma.homepageSection.findMany()).map(clean),
  faqs: (await prisma.faq.findMany()).map(clean),
  milestones: (await prisma.milestone.findMany()).map(clean),
  accolades: (await prisma.accolade.findMany()).map(clean),
  credits: (await prisma.credit.findMany()).map(clean),
  navigation: (await prisma.navigationItem.findMany()).map(clean),
  testimonials: (await prisma.testimonial.findMany()).map(clean),
  leaders: (
    await prisma.leader.findMany({ include: { highlights: true } })
  ).map(({ highlights, ...l }) => ({
    ...clean(l),
    highlights: highlights.map(clean),
  })),
};

writeFileSync("./content-snapshot.json", JSON.stringify(content));
const counts = Object.entries(content)
  .filter(([, v]) => Array.isArray(v))
  .map(([k, v]) => `${v.length} ${k}`)
  .join(", ");
console.log(`✓ content snapshot ${content.version}: ${counts}`);
await prisma.$disconnect();
