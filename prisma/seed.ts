/**
 * Seeds the database from the real Miracletree Life Science catalogue.
 *
 * Product names, descriptions, variants, prices and imagery are ingested from
 * `data/shopify-products.json`, captured from the live store's public
 * products.json feed. Nothing about the products is invented here: benefits are
 * lifted from the brand's own bullet copy, and no reviews are fabricated —
 * the review table starts empty so only genuine submissions ever appear.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ACCOLADES, CREDITS, MILESTONES } from "./story";
import { LEADERS } from "./leadership";

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------------ helpers

const rupeesToPaise = (v: string | number) => Math.round(Number(v) * 100);

/** Word-boundary truncation, mirroring src/lib/utils.ts. */
function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  const slice = input.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,;:.—-]+$/, "")}…`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pulls the brand's own <li> bullets out of the Shopify description. */
function extractBullets(html: string): { title: string; body: string | null }[] {
  const items = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
    stripHtml(m[1]!),
  );
  return items
    .filter((t) => t.length > 3 && t.length < 320)
    .slice(0, 6)
    .map((text) => {
      // A bare hyphen only separates a title from a body when it has space
      // around it. Treating any hyphen as a separator turned the bullet
      // "Anti-Inflammatory" into the title "Anti" with the body
      // "Inflammatory", which is how it rendered on the product page.
      const split = text.match(/^([^:–—]{3,48})\s*(?::|\s-\s|[–—])\s*(.+)$/);
      return split
        ? { title: split[1]!.trim(), body: split[2]!.trim() }
        : { title: text.length > 64 ? `${text.slice(0, 61)}…` : text, body: null };
    });
}

/** Removes the bullet list so the long description does not repeat the benefits. */
function descriptionWithoutBullets(html: string): string {
  return html.replace(/<ul[\s\S]*?<\/ul>/gi, "").trim();
}

function cleanTitle(raw: string): string {
  // Live titles are keyword-stuffed with pipes ("X | 24 Tea Bags | Weight Loss").
  // The first segment is the product; the rest becomes the short description.
  return raw
    .split("|")[0]!
    .replace(/™/g, "™")
    .replace(/�/g, "™")
    .trim();
}

function subtitleFrom(raw: string): string | null {
  const parts = raw.split("|").slice(1).map((p) => p.trim()).filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/™/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------- catalogue organisation

/** Collection membership, read from the live store's collection endpoints. */
const CATEGORY_BY_HANDLE: Record<string, string> = {
  "mogo-moringa-energy-bar": "healthy-snacks",
  "colostrum-protein-bar-200-gms": "healthy-snacks",
  "movita-sprouted-multi-grain-laddus-250-gms-no-added-sugar-richness-of-moringa":
    "healthy-snacks",

  "moringa-leaf-powder-hpd-dried": "herbal-supplements",
  "moringa-amla-tablets": "herbal-supplements",
  "moringa-leaf-tablet-100-tablets": "herbal-supplements",
  "moringa-flower-tablets-healthy-glowing-skin": "herbal-supplements",
  "moringa-leaf-powder-capsules-60-capsules": "herbal-supplements",
  "moringa-gum-gond-powder-100-grams": "herbal-supplements",
  "moringa-seed-capsule-90-capsules": "herbal-supplements",

  "moringa-rolled-plain-tea-100-gms-50-servings-approx": "moringa-tea",
  "moringa-rolled-masala-chai-100-gms-50-servings-approx-description": "moringa-tea",
  "moringa-plain-herbal-tea-24-tea-bags-weight-management": "moringa-tea",
  "moringa-with-orange-herbal-tea-24-tea-bags": "moringa-tea",
  "moringa-rolled-ginger-and-lemon-infused-tea-100-gms-50-servings-approx":
    "moringa-tea",
  "moringa-with-ginger-herbal-tea-24-tea-bags": "moringa-tea",
  "moringa-with-peppermint-herbal-tea-24-tea-bags": "moringa-tea",
  "moringa-with-cinnamon-infused-herbal-tea-24-tea-bags": "moringa-tea",

  "drumstick-pulp-soup-instant-soup-10-sachets": "super-foods",
  "moringa-idly-chutney-powder": "super-foods",
  "moringa-rice-mix-powder": "super-foods",
  "movita-multi-grain-health-mix-flavored": "super-foods",
  "movita-multi-grain-health-mix-plain": "super-foods",
  "moringa-leaf-dried-50gms-pack-of-2": "super-foods",

  "moringa-seed-oil-hair-strengthening-oil": "essential-oils",
  "beauty-drops-skin-food-hydrates-skin": "essential-oils",
};

const CATEGORIES = [
  {
    slug: "super-foods",
    name: "Super Foods",
    description:
      "Soups, mixes and powders for the Indian kitchen, built around the moringa leaf.",
    position: 1,
  },
  {
    slug: "herbal-supplements",
    name: "Herbal Supplements",
    description:
      "Leaf, seed, flower and gum in their most concentrated forms: powders, tablets and capsules.",
    position: 2,
  },
  {
    slug: "moringa-tea",
    name: "Moringa Tea",
    description:
      "Rolled leaf and infused blends, from plain single-origin leaf to masala, ginger and citrus.",
    position: 3,
  },
  {
    slug: "healthy-snacks",
    name: "Healthy Snacks",
    description: "Bars and laddus built for real hunger, sweetened without refined sugar.",
    position: 4,
  },
  {
    slug: "essential-oils",
    name: "Oils & Skin",
    description: "Cold-pressed moringa seed oil and skin preparations.",
    position: 5,
  },
];

const COLLECTIONS = [
  { slug: "bestsellers", name: "Bestsellers", position: 1 },
  { slug: "new-arrivals", name: "New Arrivals", position: 2 },
  { slug: "combos", name: "Combos & Value Packs", position: 3 },
  { slug: "daily-ritual", name: "The Daily Ritual", position: 4 },
];

const BESTSELLER_HANDLES = new Set([
  "mogo-moringa-energy-bar",
  "movita-sprouted-multi-grain-laddus-250-gms-no-added-sugar-richness-of-moringa",
  "moringa-leaf-tablet-100-tablets",
  "beauty-drops-skin-food-hydrates-skin",
]);

const FEATURED_HANDLES = new Set([
  "moringa-leaf-powder-hpd-dried",
  "mogo-moringa-energy-bar",
  "moringa-rolled-plain-tea-100-gms-50-servings-approx",
  "moringa-seed-oil-hair-strengthening-oil",
]);

/**
 * Category codes for stock-keeping units, and the codes themselves.
 *
 * A variant's SKU used to be the product slug's first twelve characters plus
 * the variant position, which is not a keeping unit at all. Four of the herbal
 * teas are "moringa-with-..." — ginger, orange, peppermint, cinnamon — so all
 * four carried MT-MORINGA-WITH-2, and moringa seed oil shared a code with
 * moringa seed capsules. Ten of thirty-two codes named more than one product,
 * covering half the catalogue. The admin's inventory table then adjusted
 * whichever duplicate happened to sort first, and a warehouse picking by code
 * would have shipped the wrong tea.
 *
 * Building the code from the category and the product's place in the
 * catalogue makes it distinct by construction rather than by luck, and it is
 * what a real SKU looks like anyway: an identifier, not a compressed name. The
 * product name sits in the column beside it wherever the code is shown.
 */
const SKU_CATEGORY_CODE: Record<string, string> = {
  "super-foods": "SUP",
  "herbal-supplements": "HRB",
  "moringa-tea": "TEA",
  "healthy-snacks": "SNK",
  "essential-oils": "OIL",
};

const issuedSkus = new Set<string>();

function variantSku(
  explicit: string | undefined,
  categorySlug: string,
  productIndex: number,
  position: number,
) {
  const code =
    explicit ||
    `MT-${SKU_CATEGORY_CODE[categorySlug] ?? "GEN"}-${String(productIndex + 1).padStart(3, "0")}-${position}`;
  // Loud rather than silent: a duplicate here is the bug this replaced.
  if (issuedSkus.has(code)) {
    throw new Error(`duplicate SKU ${code} (product #${productIndex + 1}, variant ${position})`);
  }
  issuedSkus.add(code);
  return code;
}

const PRODUCT_TYPE_BY_CATEGORY: Record<string, string> = {
  "super-foods": "mix",
  "herbal-supplements": "supplement",
  "moringa-tea": "tea",
  "healthy-snacks": "snack",
  "essential-oils": "oil",
};

/**
 * Botanical source notes. These describe the plant part used — deliberately
 * descriptive, never therapeutic. Admin can edit or extend them.
 */
const INGREDIENTS = [
  {
    slug: "moringa-leaf",
    name: "Moringa Leaf",
    origin: "Madurai, Tamil Nadu",
    description:
      "Hand-picked leaflets of Moringa oleifera, dried in a controlled low-temperature closed chamber to keep the leaf green rather than khaki.",
  },
  {
    slug: "moringa-seed",
    name: "Moringa Seed",
    origin: "Madurai, Tamil Nadu",
    description:
      "The winged seed from the mature pod. Cold-pressed for its oil, or milled whole for capsules.",
  },
  {
    slug: "moringa-flower",
    name: "Moringa Flower",
    origin: "Madurai, Tamil Nadu",
    description:
      "Cream-white blossoms gathered in the short flowering window and dried the same day.",
  },
  {
    slug: "moringa-gum",
    name: "Moringa Gum (Gond)",
    origin: "Madurai, Tamil Nadu",
    description: "Resin that sets on the bark of the tree, collected by hand and milled.",
  },
  {
    slug: "drumstick-pod",
    name: "Drumstick Pod",
    origin: "Madurai, Tamil Nadu",
    description: "The green pod of the same tree, pulped for soups and mixes.",
  },
  {
    slug: "amla",
    name: "Amla",
    origin: "India",
    description: "Indian gooseberry, dried and powdered, blended with moringa leaf.",
  },
  {
    slug: "millets",
    name: "Sprouted Millets",
    origin: "Tamil Nadu",
    description: "Multi-grain millet base, sprouted before roasting.",
  },
];

const INGREDIENTS_BY_CATEGORY: Record<string, string[]> = {
  "super-foods": ["moringa-leaf", "drumstick-pod", "millets"],
  "herbal-supplements": ["moringa-leaf", "moringa-seed", "moringa-flower", "moringa-gum"],
  "moringa-tea": ["moringa-leaf"],
  "healthy-snacks": ["moringa-leaf", "millets"],
  "essential-oils": ["moringa-seed"],
};

/**
 * Ingredients for a specific product, where the category's list is wrong for it.
 *
 * Ingredients are otherwise assigned by category, which left Amla listed as an
 * ingredient with nothing using it: the amla tablets sit in herbal-supplements,
 * and that category's list is leaf, seed, flower and gum. A product named after
 * an ingredient has to be linked to it.
 */
const INGREDIENTS_BY_HANDLE: Record<string, string[]> = {
  "moringa-amla-tablets": ["moringa-leaf", "amla"],
};

/**
 * Price corrections supplied by MiracleTree, in rupees.
 *
 * The Shopify export these products are imported from carries prices the
 * company has since revised. Rather than edit the export — which is the record
 * of what was exported — the corrections are applied here, keyed by product
 * handle and variant title, so the source file stays untouched and every
 * correction is visible in one place.
 */
const PRICE_OVERRIDES: Record<string, Record<string, number>> = {
  "mogo-moringa-energy-bar": { "Pack of 10": 400 },
  "colostrum-protein-bar-200-gms": { "Default Title": 400 },
  "drumstick-pulp-soup-instant-soup-10-sachets": { "10 Sachets Per Box": 560 },
};

/** The corrected price for a variant, or its exported price. */
function variantPrice(handle: string, title: string, exported: string | number): number {
  const override = PRICE_OVERRIDES[handle]?.[title];
  return override ?? Number(exported);
}

/** Preparation steps by category — practical instructions, no claims. */
const USAGE_BY_CATEGORY: Record<string, { title: string; body: string }[]> = {
  "moringa-tea": [
    { title: "Measure", body: "One teaspoon of rolled leaf, or one tea bag, per cup." },
    { title: "Steep", body: "Pour water just off the boil and steep for 3–4 minutes." },
    { title: "Strain & serve", body: "Strain and drink plain, or with a little honey and lemon." },
  ],
  "herbal-supplements": [
    { title: "Start small", body: "Begin with the smallest serving on the label." },
    { title: "Take with water", body: "Swallow with a full glass of water, ideally with a meal." },
    { title: "Keep it daily", body: "Consistency matters more than quantity." },
  ],
  "super-foods": [
    { title: "Measure", body: "Two tablespoons per serving." },
    { title: "Mix", body: "Stir into hot water, milk or your usual batter until smooth." },
    { title: "Rest", body: "Let it stand two minutes before serving." },
  ],
  "healthy-snacks": [
    { title: "Unwrap", body: "One bar or laddu makes a serving." },
    { title: "When", body: "Mid-morning, before a workout, or whenever the afternoon dips." },
    { title: "Store", body: "Keep sealed in a cool, dry place." },
  ],
  "essential-oils": [
    { title: "Warm", body: "Rub three to four drops between your palms." },
    { title: "Apply", body: "Work into the scalp or skin in slow circles." },
    { title: "Leave in", body: "Leave for 30 minutes, or overnight, then rinse as usual." },
  ],
};

// -------------------------------------------------------- editorial content

const FAQS = [
  {
    category: "moringa",
    question: "What exactly is moringa?",
    answer:
      "Moringa oleifera is a fast-growing tree native to South India and grown widely across Tamil Nadu, where it is better known as the drumstick tree. Almost every part of it is edible — leaf, pod, flower, seed and gum — and each part is used differently across our range.",
  },
  {
    category: "moringa",
    question: "Why does your leaf powder look bright green rather than dull?",
    answer:
      "Colour is the clearest signal of how a leaf was dried. Rather than drying in open sun, we use ULTCD and CLHPD — controlled low-temperature closed-chamber drying developed in-house. It is slower and costs more, and it keeps the leaf green instead of turning it khaki.",
  },
  {
    category: "products",
    question: "Which product should I start with?",
    answer:
      "Most people start with either the Moringa Leaf Powder, if they cook, or the Moringa Tablets, if they would rather not think about it each morning. If you want the gentlest introduction, start with one of the teas.",
  },
  {
    category: "products",
    question: "Are your products vegetarian?",
    answer:
      "Everything in the range is vegetarian apart from the Colostrum Protein Bar, which contains bovine colostrum. Each product page lists what is inside it.",
  },
  {
    category: "usage",
    question: "How much should I take each day?",
    answer:
      "Follow the serving stated on the pack. If you are pregnant, nursing, taking prescribed medication or managing a health condition, speak to your doctor before adding any supplement to your routine.",
  },
  {
    category: "usage",
    question: "Can I cook with the leaf powder?",
    answer:
      "Yes. Stir it into dal, rasam, chapati dough, smoothies or curd rice. Add it towards the end of cooking rather than at the start, so it keeps its colour.",
  },
  {
    category: "storage",
    question: "How should I store these products?",
    answer:
      "Keep every pack sealed, in a cool dry place, away from direct sunlight. Powders and teas do not need refrigeration. Use the oil within six months of opening.",
  },
  {
    category: "shipping",
    question: "What does shipping cost?",
    answer:
      "Shipping is free on orders above ₹699. Below that a flat ₹60 applies. We ship across India.",
  },
  {
    category: "shipping",
    question: "How long will my order take?",
    answer:
      "Orders are packed within one to two working days. Delivery usually takes three to seven working days depending on your pin code.",
  },
  {
    category: "orders",
    question: "How do I track my order?",
    answer:
      "Sign in and open Account → Orders. Once your parcel is handed to the courier, the tracking number appears there and in your confirmation email.",
  },
  {
    category: "returns",
    question: "Can I return a product?",
    answer:
      "Because these are agricultural food products, we cannot accept returns once an order has been delivered. If something arrives damaged or incorrect, email support@miracletree.in within 48 hours of delivery with photographs and we will make it right.",
  },
  {
    category: "payments",
    question: "Which payment methods do you accept?",
    answer:
      "Cards, UPI, net banking and wallets through our payment gateway, and cash on delivery where available for your pin code.",
  },
  {
    category: "ingredients",
    question: "Do you add preservatives or colouring?",
    answer:
      "No. The leaf powders and teas are single-ingredient. Where a product is a blend, every component is printed on the pack and listed on its product page.",
  },
  {
    category: "general",
    question: "Do you supply in bulk or wholesale?",
    answer:
      "Yes. Bulk and export enquiries are handled through indiamoringa.com, or write to info@miracletree.in.",
  },
];

/** Real customer quotes carried over from the existing site. Nothing invented. */
const TESTIMONIALS = [
  {
    authorName: "Vedha Varshini S",
    body: "Being a 5 year user, this is the best product I have ever used.",
    rating: 5,
    position: 1,
  },
  {
    authorName: "Shree",
    body: "I've been using beauty drops for 6 years. It has helped me reduce black spots and acne.",
    rating: 5,
    position: 2,
  },
];

const ARTICLES = [
  {
    title: "Why the drumstick tree is called the miracle tree",
    slug: "why-the-drumstick-tree-is-called-the-miracle-tree",
    category: "Moringa",
    excerpt:
      "It grows in poor soil, survives drought, and every part of it is useful. A short field guide to the tree that grows in half the backyards in Tamil Nadu.",
    content: `<p>Walk through any village in Madurai district and you will pass it a dozen times without looking up: a thin, untidy tree with pale bark and small round leaflets, usually leaning over a compound wall. Nobody plants it ceremonially. It simply appears, and then it feeds people.</p>
<p><em>Moringa oleifera</em> got the name "miracle tree" for practical reasons. It grows in thin, sandy soil. It survives a failed monsoon. It reaches harvestable height in under a year, which for a tree is close to impatience.</p>
<h2>Every part has a use</h2>
<p>The <strong>leaf</strong> is the part most people outside India now recognise, dried and milled into powder. The <strong>pod</strong> — the drumstick itself — goes into sambar across South India. The <strong>flower</strong> appears in a short window and is gathered the same day. The <strong>seed</strong> is cold-pressed for oil. Even the <strong>gum</strong> that sets on the bark is collected and milled.</p>
<h2>What growing it well actually requires</h2>
<p>The difference between good moringa and forgettable moringa is almost entirely in the drying. A leaf laid out in direct sun loses its colour within hours and turns the dull khaki you see in cheap powder. Controlled low-temperature closed-chamber drying takes longer and costs more, and it is the reason a good powder is still green when it reaches you.</p>
<p>That is the whole craft, more or less. Grow it where it wants to grow, pick it in the morning, and do not cook it on the way to the pack.</p>`,
  },
  {
    title: "Reading a moringa label: what the numbers actually mean",
    slug: "reading-a-moringa-label",
    category: "Guides",
    excerpt:
      "Mesh size, harvest date, leaf-only versus whole-plant. A plain-language guide to telling one green powder from another.",
    content: `<p>Two packs of moringa leaf powder can look identical and be completely different products. Here is what to look at.</p>
<h2>Leaf only, or leaf and stem?</h2>
<p>Stem is cheaper to grow and heavier to sell, so it finds its way into a lot of powder. Leaf-only powder is finer, greener, and tastes noticeably less woody. If a label does not say, it is usually because the answer is not "leaf only".</p>
<h2>Colour</h2>
<p>Fresh leaf powder dried at low temperature is a deep green with a slight grey cast. Bright emerald usually means colouring. Khaki or olive means heat — either sun-drying or a hot mill.</p>
<h2>Mesh size</h2>
<p>Mesh describes how finely the leaf was milled. An 80-mesh powder dissolves into liquid; a coarse grind settles at the bottom of the glass. Neither is wrong, but they suit different uses — fine for drinks, coarse for cooking.</p>
<h2>Harvest and pack date</h2>
<p>Dried leaf is stable but not immortal. A pack date within the last six months is a reasonable expectation, and a manufacturer who prints one is telling you they turn over stock.</p>`,
  },
  {
    title: "Six ways to put moringa into food you already cook",
    slug: "six-ways-to-cook-with-moringa",
    category: "Kitchen",
    excerpt:
      "Dal, rasam, chapati dough, curd rice, podi and buttermilk. Six Indian dishes that take a spoon of leaf powder well.",
    content: `<p>Most moringa advice assumes you own a blender and drink your breakfast. Here is what to do if you cook the way most Indian households actually cook.</p>
<h2>1. Dal</h2>
<p>Stir a teaspoon in after you take the pot off the heat. Added earlier, it dulls.</p>
<h2>2. Rasam</h2>
<p>Add with the coriander at the end. It sits well against tamarind.</p>
<h2>3. Chapati dough</h2>
<p>A teaspoon per cup of atta. The dough turns faintly green and the rotis stay soft a little longer.</p>
<h2>4. Curd rice</h2>
<p>Half a teaspoon, mixed in cold. Mild enough that children do not negotiate.</p>
<h2>5. Podi</h2>
<p>Add to your usual idli podi after roasting, never during.</p>
<h2>6. Buttermilk</h2>
<p>A quarter teaspoon in a glass of spiced <em>neer mor</em>, especially in summer.</p>
<p>The rule underneath all six: add it late, keep the heat off it, and it will taste like the dish rather than like a supplement.</p>`,
  },
];

const HOMEPAGE_SECTIONS = [
  {
    key: "hero",
    kind: "hero",
    title: "From the Miracle Tree.",
    subtitle:
      "Moringa grown, dried and milled in Madurai. Twenty-seven products, all from one tree.",
    ctaLabel: "Explore the collection",
    ctaHref: "/shop",
    data: JSON.stringify({ secondaryLabel: "Discover moringa", secondaryHref: "/moringa" }),
    position: 1,
  },
  {
    key: "tree",
    kind: "tree",
    title: "One tree. Every part of it.",
    subtitle:
      "Leaf, pod, flower, seed and gum. Scroll to follow the moringa through a full season.",
    position: 2,
  },
  {
    key: "why-moringa",
    kind: "why",
    title: "Why moringa",
    subtitle:
      "It grows in poor soil with little water, and almost every part of it is usable.",
    position: 3,
  },
  {
    key: "farm-to-product",
    kind: "process",
    title: "Farm to pack",
    subtitle: "Seven steps from the field to the pack. The drying is the one that matters most.",
    position: 4,
  },
  {
    key: "collection",
    kind: "collection",
    title: "The collection",
    subtitle: "Powders, teas, capsules, oils, bars and snacks.",
    ctaLabel: "View all products",
    ctaHref: "/shop",
    position: 5,
  },
  {
    key: "ingredients",
    kind: "ingredients",
    title: "What's inside",
    subtitle: "Leaf, pod, flower, seed and gum, and what we make from each.",
    position: 6,
  },
  {
    key: "reviews",
    kind: "reviews",
    title: "In their words",
    subtitle: "From people who have been buying from us for years.",
    position: 7,
  },
  {
    key: "story",
    kind: "story",
    title: "Twenty years under the same tree",
    subtitle:
      "Miracletree Life Science has worked with moringa growers around Madurai for more than two decades.",
    ctaLabel: "Our story",
    ctaHref: "/about",
    position: 8,
  },
  {
    key: "journal",
    kind: "journal",
    title: "The Journal",
    subtitle: "Field notes on the tree, the harvest and the kitchen.",
    ctaLabel: "Read the field notes",
    ctaHref: "/about#field-notes",
    position: 9,
  },
  {
    key: "faq",
    kind: "faq",
    title: "Questions, answered",
    position: 10,
  },
  {
    key: "final-cta",
    kind: "cta",
    title: "Discover the miracle",
    subtitle: "It started as a seed.",
    ctaLabel: "Shop now",
    ctaHref: "/shop",
    position: 11,
  },
];

const NAVIGATION = [
  { group: "header", label: "Shop", href: "/shop", position: 1 },
  { group: "header", label: "Ritual", href: "/ritual", position: 2 },
  { group: "header", label: "Moringa", href: "/moringa", position: 3 },
  { group: "header", label: "Innovation", href: "/innovation", position: 4 },
  { group: "header", label: "Contact", href: "/contact", position: 5 },

  // The company pages sit behind one "Company" menu in the header rather than
  // as four more top-level links. Leadership and the gallery were previously
  // reachable only from the footer, which is why nobody could find them.
  { group: "header-company", label: "Our story", href: "/about", position: 1 },
  { group: "header-company", label: "Leadership", href: "/leadership", position: 2 },
  { group: "header-company", label: "Innovation", href: "/innovation", position: 3 },
  { group: "header-company", label: "Gallery", href: "/gallery", position: 4 },
  { group: "header-company", label: "Certifications", href: "/innovation#certifications", position: 5 },

  { group: "footer-shop", label: "All products", href: "/shop", position: 1 },
  { group: "footer-shop", label: "Super Foods", href: "/shop/super-foods", position: 2 },
  { group: "footer-shop", label: "Herbal Supplements", href: "/shop/herbal-supplements", position: 3 },
  { group: "footer-shop", label: "Moringa Tea", href: "/shop/moringa-tea", position: 4 },
  { group: "footer-shop", label: "Healthy Snacks", href: "/shop/healthy-snacks", position: 5 },
  { group: "footer-shop", label: "Oils & Skin", href: "/shop/essential-oils", position: 6 },

  { group: "footer-company", label: "Our story", href: "/about", position: 1 },
  { group: "footer-company", label: "Leadership", href: "/leadership", position: 2 },
  { group: "footer-company", label: "Innovation", href: "/innovation", position: 3 },
  { group: "footer-company", label: "Gallery", href: "/gallery", position: 4 },
  { group: "footer-company", label: "Discover moringa", href: "/moringa", position: 5 },
  { group: "footer-company", label: "Field notes", href: "/about#field-notes", position: 6 },
  { group: "footer-company", label: "Become a distributor", href: "/contact?topic=distributor", position: 7 },
  { group: "footer-company", label: "Bulk & export", href: "https://indiamoringa.com", position: 8 },

  { group: "footer-support", label: "Track your order", href: "/track", position: 1 },
  { group: "footer-support", label: "Contact", href: "/contact", position: 2 },
  { group: "footer-support", label: "FAQ", href: "/faq", position: 3 },
  { group: "footer-support", label: "Shipping", href: "/shipping", position: 4 },
  { group: "footer-support", label: "Returns & refunds", href: "/returns", position: 5 },
  { group: "footer-support", label: "Privacy policy", href: "/privacy", position: 6 },
  { group: "footer-support", label: "Terms of service", href: "/terms", position: 7 },
];

const SETTINGS: Record<string, string> = {
  "shipping.freeThreshold": "69900",
  "shipping.flatFee": "6000",
  "shipping.copy": "Free shipping on orders above ₹699",
  "checkout.codEnabled": "true",
  "seo.defaultTitle": "Miracle Tree — Moringa superfoods from Madurai",
  "seo.defaultDescription":
    "Moringa leaf powder, teas, tablets and superfoods grown in Madurai, Tamil Nadu and dried in-house at low temperature. From the miracle tree.",
  "brand.tagline": "From the Miracle Tree.",
  "brand.foundedYearsCopy": "20+ years working with moringa",
};

// ------------------------------------------------------------------- runner

type ShopifyProduct = {
  handle: string;
  title: string;
  body_html: string;
  published_at: string;
  created_at: string;
  variants: {
    title: string;
    sku: string;
    price: string;
    compare_at_price: string | null;
    grams: number;
    available: boolean;
    position: number;
    featured_image?: { src: string } | null;
  }[];
  images: { src: string; width: number; height: number; position: number; alt: string | null }[];
};

async function main() {
  console.log("→ clearing existing seed data");
  // Order matters: children before parents.
  await prisma.$transaction([
    prisma.orderEvent.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.productRelation.deleteMany(),
    prisma.productCollection.deleteMany(),
    prisma.productIngredient.deleteMany(),
    prisma.productTag.deleteMany(),
    prisma.productBenefit.deleteMany(),
    prisma.usageStep.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.review.deleteMany(),
    prisma.faq.deleteMany(),
    prisma.product.deleteMany(),
    prisma.ingredient.deleteMany(),
    prisma.collection.deleteMany(),
    prisma.category.deleteMany(),
    prisma.article.deleteMany(),
    prisma.articleCategory.deleteMany(),
    prisma.testimonial.deleteMany(),
    prisma.homepageSection.deleteMany(),
    prisma.navigationItem.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.siteSetting.deleteMany(),
    prisma.milestone.deleteMany(),
    prisma.accolade.deleteMany(),
    prisma.credit.deleteMany(),
    // Highlights first: the cascade would handle it, but the delete order in
    // this block is explicit everywhere else and staying consistent is worth
    // more than the one saved line.
    prisma.leaderHighlight.deleteMany(),
    prisma.leader.deleteMany(),
  ]);

  // ---- categories, collections, ingredients
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        position: c.position,
        seoTitle: c.name,
        seoDescription: c.description,
      },
    });
    categoryIds.set(c.slug, row.id);
  }

  const collectionIds = new Map<string, string>();
  for (const c of COLLECTIONS) {
    const row = await prisma.collection.create({
      data: { name: c.name, slug: c.slug, position: c.position },
    });
    collectionIds.set(c.slug, row.id);
  }

  const ingredientIds = new Map<string, string>();
  for (const i of INGREDIENTS) {
    const row = await prisma.ingredient.create({ data: i });
    ingredientIds.set(i.slug, row.id);
  }

  // ---- products
  const raw = JSON.parse(
    readFileSync(join(here, "data", "shopify-products.json"), "utf-8"),
  ) as { products: ShopifyProduct[] };

  console.log(`→ importing ${raw.products.length} products`);

  const productIdsByCategory = new Map<string, string[]>();
  let imported = 0;

  for (const [index, p] of raw.products.entries()) {
    const categorySlug = CATEGORY_BY_HANDLE[p.handle] ?? "super-foods";
    const isCombo = !CATEGORY_BY_HANDLE[p.handle];
    const name = cleanTitle(p.title);
    const subtitle = subtitleFrom(p.title);
    const plain = stripHtml(p.body_html);
    const bullets = extractBullets(p.body_html);
    // The card shows the cheapest variant's price, so the strike-through must
    // come from that same variant. Taking the highest compare-at across all
    // variants produced nonsense like "-96% off" on multi-size products.
    const cheapestVariant = p.variants.reduce((low, v) =>
      variantPrice(p.handle, v.title, v.price) < variantPrice(p.handle, low.title, low.price)
        ? v
        : low,
    );
    const cheapest = rupeesToPaise(
      variantPrice(p.handle, cheapestVariant.title, cheapestVariant.price),
    );
    const cheapestCompare = cheapestVariant.compare_at_price
      ? rupeesToPaise(cheapestVariant.compare_at_price)
      : 0;
    const compareAt = cheapestCompare > cheapest ? cheapestCompare : 0;

    const product = await prisma.product.create({
      data: {
        name,
        slug: p.handle.replace(/[^a-z0-9-]/gi, "").toLowerCase() || slugify(name),
        productType: PRODUCT_TYPE_BY_CATEGORY[categorySlug] ?? "mix",
        categoryId: categoryIds.get(categorySlug)!,
        shortDescription: subtitle ?? truncate(plain, 160),
        description: descriptionWithoutBullets(p.body_html) || p.body_html,
        price: cheapest,
        compareAtPrice: compareAt || null,
        weightGrams: p.variants[0]?.grams ?? null,
        status: "published",
        publishedAt: new Date(p.published_at),
        isFeatured: FEATURED_HANDLES.has(p.handle),
        isBestSeller: BESTSELLER_HANDLES.has(p.handle),
        isOnSale: compareAt > 0,
        isNew: false,
        position: index,
        seoTitle: name,
        seoDescription: truncate(plain, 155),
        ogImageUrl: p.images[0]?.src ?? null,
        images: {
          create: p.images.map((img) => ({
            url: img.src,
            alt: img.alt ?? name,
            width: img.width,
            height: img.height,
            position: img.position,
          })),
        },
        benefits: {
          create: bullets.map((b, i) => ({ title: b.title, body: b.body, position: i })),
        },
        usageSteps: {
          create: (USAGE_BY_CATEGORY[categorySlug] ?? []).map((s, i) => ({
            step: i + 1,
            title: s.title,
            body: s.body,
          })),
        },
        ingredients: {
          create: (
            INGREDIENTS_BY_HANDLE[p.handle] ??
            INGREDIENTS_BY_CATEGORY[categorySlug] ?? ["moringa-leaf"]
          ).map(
            (slug, i) => ({ ingredientId: ingredientIds.get(slug)!, position: i }),
          ),
        },
      },
    });

    // Variants + inventory. Stock is opening stock for a fresh install; the
    // live store does not expose real quantities, only availability.
    for (const v of p.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          name: v.title === "Default Title" ? "Standard" : v.title,
          sku: variantSku(v.sku, categorySlug, index, v.position),
          price: rupeesToPaise(variantPrice(p.handle, v.title, v.price)),
          compareAtPrice: v.compare_at_price
            ? rupeesToPaise(v.compare_at_price) > rupeesToPaise(v.price)
              ? rupeesToPaise(v.compare_at_price)
              : null
            : null,
          weightGrams: v.grams || null,
          imageUrl: v.featured_image?.src ?? p.images[0]?.src ?? null,
          position: v.position,
          isActive: true,
        },
      });
      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          onHand: v.available ? 40 : 0,
          reserved: 0,
          lowStockAt: 10,
        },
      });
    }

    // Collections
    const memberships: string[] = ["daily-ritual"];
    if (BESTSELLER_HANDLES.has(p.handle)) memberships.push("bestsellers");
    if (isCombo) memberships.push("combos");
    for (const [pos, slug] of memberships.entries()) {
      await prisma.productCollection.create({
        data: {
          productId: product.id,
          collectionId: collectionIds.get(slug)!,
          position: pos,
        },
      });
    }

    const bucket = productIdsByCategory.get(categorySlug) ?? [];
    bucket.push(product.id);
    productIdsByCategory.set(categorySlug, bucket);
    imported++;
  }

  // ---- related products: same category, wrapping neighbours
  for (const ids of productIdsByCategory.values()) {
    for (const [i, sourceId] of ids.entries()) {
      const targets = [ids[(i + 1) % ids.length], ids[(i + 2) % ids.length]].filter(
        (t): t is string => Boolean(t) && t !== sourceId,
      );
      for (const [pos, targetId] of targets.entries()) {
        await prisma.productRelation.upsert({
          where: { sourceId_targetId_kind: { sourceId, targetId, kind: "related" } },
          create: { sourceId, targetId, kind: "related", position: pos },
          update: {},
        });
      }
    }
  }

  console.log(`✓ ${imported} products imported`);

  // ---- content
  await prisma.faq.createMany({
    data: FAQS.map((f, i) => ({ ...f, position: i, isActive: true })),
  });
  await prisma.testimonial.createMany({ data: TESTIMONIALS });

  for (const a of ARTICLES) {
    const category = await prisma.articleCategory.upsert({
      where: { slug: slugify(a.category) },
      create: { name: a.category, slug: slugify(a.category) },
      update: {},
    });
    const words = stripHtml(a.content).split(/\s+/).length;
    await prisma.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        categoryId: category.id,
        status: "published",
        publishedAt: new Date(),
        readingMinutes: Math.max(1, Math.round(words / 220)),
        seoTitle: a.title,
        seoDescription: a.excerpt,
      },
    });
  }

  for (const s of HOMEPAGE_SECTIONS) {
    await prisma.homepageSection.create({ data: { ...s, isActive: true } });
  }
  for (const n of NAVIGATION) {
    await prisma.navigationItem.create({ data: { ...n, isActive: true } });
  }
  await prisma.announcement.create({
    data: { message: "Free shipping on orders above ₹699", position: 1, isActive: true },
  });

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.siteSetting.create({ data: { key, value } });
  }

  // ---- promotions
  await prisma.coupon.createMany({
    data: [
      {
        code: "FIRSTLEAF",
        description: "10% off your first order",
        kind: "percentage",
        value: 10,
        appliesTo: "first_order",
        maxDiscount: 30000,
        isActive: true,
      },
      {
        code: "SHIPFREE",
        description: "Free shipping, any order value",
        kind: "free_shipping",
        value: 0,
        appliesTo: "all",
        isActive: true,
      },
      {
        // The promotion the ritual builder unlocks. It is an ordinary coupon
        // rather than a special case in the pricing code, so the saving the
        // builder quotes and the saving the cart applies are the same number
        // evaluated by the same function — they cannot drift apart, and an
        // admin can retire it without a deploy.
        code: "RITUAL",
        description: "10% off when you build a ritual",
        kind: "percentage",
        value: 10,
        minSubtotal: 49900,
        maxDiscount: 40000,
        appliesTo: "all",
        isActive: true,
      },
      {
        code: "MORINGA15",
        description: "15% off orders above ₹1,200",
        kind: "percentage",
        value: 15,
        minSubtotal: 120000,
        maxDiscount: 50000,
        isActive: true,
      },
    ],
  });

  // ---- admin account
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@miracletree.in";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      firstName: "Miracle",
      lastName: "Tree",
      role: "admin",
      emailVerified: true,
    },
    update: { role: "admin" },
  });

  // --- our story: researched history, each row carrying its source
  await prisma.milestone.createMany({
    data: MILESTONES.map((m, i) => ({ ...m, position: i, isActive: true })),
  });
  await prisma.accolade.createMany({
    data: ACCOLADES.map((a, i) => ({ ...a, position: i, isActive: true })),
  });
  await prisma.credit.createMany({
    data: CREDITS.map((c, i) => ({ ...c, position: i, isActive: true })),
  });
  console.log(
    `✓ story: ${MILESTONES.length} milestones, ${ACCOLADES.length} accolades, ${CREDITS.length} credits`,
  );

  // --- leadership: full profiles, with each leader's record as child rows.
  // Written one at a time rather than with createMany so the nested highlights
  // come along; there are five of them, so the round trips do not matter.
  for (const [i, leader] of LEADERS.entries()) {
    const { slugKey: _slugKey, highlights, ...fields } = leader;
    await prisma.leader.create({
      data: {
        ...fields,
        position: i,
        isActive: true,
        highlights: {
          create: highlights.map((h, j) => ({ ...h, position: j })),
        },
      },
    });
  }
  console.log(
    `✓ leadership: ${LEADERS.length} profiles, ${LEADERS.reduce((n, l) => n + l.highlights.length, 0)} highlights`,
  );

  console.log(`✓ admin ready: ${email}`);
  console.log("✓ seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
