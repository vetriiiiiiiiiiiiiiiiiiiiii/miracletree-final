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
  ["heroSlides", prisma.heroSlide, content.heroSlides],
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

// One-off content changes for databases that already hold the old rows.
// Each runs once, recorded by its marker, so if the business puts something
// back from the admin afterwards it stays put.
const ONE_OFFS = [
  {
    // "Innovation" came off the top-level navbar; the page is still in the
    // Company menu and the footer.
    marker: "oneoff.nav-remove-innovation",
    run: () =>
      prisma.navigationItem.deleteMany({
        where: { group: "header", href: "/innovation" },
      }),
  },
  {
    // The ritual builder is hidden: off every menu, still reachable by URL.
    marker: "oneoff.nav-remove-ritual",
    run: () =>
      prisma.navigationItem.deleteMany({ where: { href: "/ritual" } }),
  },
  {
    // The business's Mogo photograph, for the Mogo slide — only where no
    // background has been uploaded in the admin yet.
    marker: "oneoff.hero-mogo-photo",
    run: async () => {
      const slides = await prisma.heroSlide.findMany({
        where: { title: "Mogo" },
        select: { id: true, imageUrl: true },
      });
      const bare = slides.filter((s) => !s.imageUrl).map((s) => s.id);
      return prisma.heroSlide.updateMany({
        where: { id: { in: bare } },
        data: { imageUrl: "/hero/mogo-energy-bar.webp" },
      });
    },
  },
  {
    // "Free shipping on orders above ₹699" only means something if orders
    // below it pay for shipping. The live flat fee had been saved as 0, so
    // every order shipped free and the threshold never did anything. Set the
    // standard ₹60 once where it is 0 or blank; any later change made in
    // Admin → Settings is left alone.
    marker: "oneoff.shipping-flat-fee",
    run: async () => {
      const row = await prisma.siteSetting.findUnique({
        where: { key: "shipping.flatFee" },
      });
      const value = row?.value?.trim() ?? "";
      if (value !== "" && Number(value) !== 0) return { count: 0 };
      await prisma.siteSetting.upsert({
        where: { key: "shipping.flatFee" },
        create: { key: "shipping.flatFee", value: "6000" },
        update: { value: "6000" },
      });
      return { count: 1 };
    },
  },
  {
    // The parent group is Uyirmei Farms, not Vedha Farms. Renames the credit
    // (and the name in its line) once; later edits in the admin stand.
    marker: "oneoff.credit-uyirmei-farms",
    run: async () => {
      const rows = await prisma.credit.findMany({ where: { name: "Vedha Farms" } });
      for (const row of rows) {
        await prisma.credit.update({
          where: { id: row.id },
          data: {
            name: "Uyirmei Farms",
            body: row.body ? row.body.replaceAll("Vedha Farms", "Uyirmei Farms") : row.body,
          },
        });
      }
      return { count: rows.length };
    },
  },
  {
    // The importer used to cut long benefit bullets at 61 characters and add
    // "…", so sentences ended mid-word on the product page. Restores each
    // clipped title from the brand's own bullet in the Shopify feed.
    marker: "oneoff.benefit-full-titles",
    run: async () => {
      const feedPath = "prisma/data/shopify-products.json";
      if (!existsSync(feedPath)) return { count: 0 };
      const feed = JSON.parse(readFileSync(feedPath, "utf8"));
      const plain = (html) =>
        html
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
      const bullets = (feed.products ?? feed).flatMap((p) =>
        [...String(p.body_html ?? "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => plain(m[1])),
      );
      const rows = await prisma.productBenefit.findMany({ where: { title: { endsWith: "…" } } });
      let count = 0;
      for (const row of rows) {
        const prefix = row.title.slice(0, -1).trim();
        const full = bullets.find((b) => b.length > prefix.length && b.startsWith(prefix));
        if (!full) continue;
        await prisma.productBenefit.update({ where: { id: row.id }, data: { title: full } });
        count++;
      }
      return { count };
    },
  },
  {
    // Two new pages under Company — farm consultancy and third-party
    // manufacturing — appended to the header Company menu and the footer's
    // Company column, and Customer reviews to the footer's Support column;
    // after whatever is there, skipped where already present.
    marker: "oneoff.nav-services-pages",
    run: async () => {
      const pages = [
        { href: "/international-farm-consultancy", header: "International Farm Consultancy", footer: "Farm consultancy" },
        { href: "/third-party-manufacturing", header: "Third Party Manufacturing", footer: "Third party manufacturing" },
      ];
      let count = 0;
      const additions = {
        "header-company": pages.map((p) => ({ href: p.href, label: p.header })),
        "footer-company": pages.map((p) => ({ href: p.href, label: p.footer })),
        "footer-support": [{ href: "/reviews", label: "Customer reviews" }],
      };
      for (const [group, items] of Object.entries(additions)) {
        const rows = await prisma.navigationItem.findMany({ where: { group } });
        let position = rows.reduce((max, r) => Math.max(max, r.position), 0);
        for (const page of items) {
          if (rows.some((r) => r.href === page.href)) continue;
          position += 1;
          await prisma.navigationItem.create({
            data: {
              group,
              label: page.label,
              href: page.href,
              position,
              isActive: true,
            },
          });
          count++;
        }
      }
      return { count };
    },
  },
  {
    // The founders' names as they want them shown: Sujatha Kumaran and
    // Saravana Kumaran Rajendran. Rewrites every text field that carries them.
    marker: "oneoff.founder-names",
    run: async () => {
      const pairs = [
        ["Saravanakumaran Rajendran", "Saravana Kumaran Rajendran"],
        ["R. Saravanakumaran", "Saravana Kumaran Rajendran"],
        ["Sujatha Rajendran", "Sujatha Kumaran"],
        ["Saravanakumaran", "Saravana Kumaran"],
      ];
      const fix = (text) =>
        typeof text === "string" ? pairs.reduce((t, [from, to]) => t.replaceAll(from, to), text) : text;
      const tables = [
        [prisma.leader, ["name", "role", "credential", "bio", "longBio", "quote"]],
        [prisma.leaderHighlight, ["title", "body"]],
        [prisma.credit, ["name", "role", "body"]],
        [prisma.milestone, ["title", "body"]],
        [prisma.accolade, ["title", "body"]],
      ];
      let count = 0;
      for (const [table, fields] of tables) {
        for (const row of await table.findMany()) {
          const data = {};
          for (const field of fields) {
            const next = fix(row[field]);
            if (next !== row[field]) data[field] = next;
          }
          if (Object.keys(data).length) {
            await table.update({ where: { id: row.id }, data });
            count++;
          }
        }
      }
      return { count };
    },
  },
  {
    // Every contact address is now info@miracletree.in. FAQ answers saved in
    // the database still named the old ones.
    marker: "oneoff.contact-email-info",
    run: async () => {
      const old = /support@miracletree\.in|miracletree\.in@gmail\.com/gi;
      let count = 0;
      for (const row of await prisma.faq.findMany()) {
        const answer = row.answer.replace(old, "info@miracletree.in");
        if (answer === row.answer) continue;
        await prisma.faq.update({ where: { id: row.id }, data: { answer } });
        count++;
      }
      return { count };
    },
  },
  {
    // Contact-form messages used to be kept only in the audit log. Copies
    // them into the Enquiries inbox, with their original dates, as new.
    marker: "oneoff.enquiries-from-audit",
    run: async () => {
      const rows = await prisma.auditLog.findMany({ where: { action: "contact.submitted" } });
      let count = 0;
      for (const row of rows) {
        let meta;
        try {
          meta = JSON.parse(row.meta ?? "{}");
        } catch {
          continue;
        }
        if (!meta.name || !meta.email || !meta.message) continue;
        await prisma.enquiry.create({
          data: {
            name: String(meta.name),
            email: String(meta.email),
            phone: meta.phone ? String(meta.phone) : null,
            topic: meta.topic ? String(meta.topic) : null,
            message: String(meta.message),
            createdAt: row.createdAt,
          },
        });
        count++;
      }
      return { count };
    },
  },
  {
    // Beauty Drops, Chaitree and Movita join the hero, in that order, right
    // after the Soup slide (after Mogo if there is no Soup slide). Slides
    // already in the admin keep their order around them; photos can be
    // uploaded later in Admin → Hero banner.
    marker: "oneoff.hero-beauty-chaitree-movita",
    run: async () => {
      const additions = [
        {
          "eyebrow": "Skin food · Cold-pressed moringa seed oil",
          "title": "Beauty Drops",
          "subtitle": "Skin Food",
          "tagline": "Hydrated skin, a fresh glow.",
          "body": "Cold-pressed virgin moringa seed oil with extra virgin coconut oil, sweet orange peel oil and moringa root extract — a few drops to hydrate and protect the skin.",
          "features": "leaf | Cold-pressed moringa seed oil\nheart | Deep moisturising\nshield | Protects and tones",
          "ctaLabel": "Shop Beauty Drops",
          "ctaHref": "/product/beauty-drops-skin-food-hydrates-skin",
          "secondaryLabel": "Read reviews",
          "secondaryHref": "/reviews?product=beauty-drops-skin-food-hydrates-skin#all",
          "productSlug": "beauty-drops-skin-food-hydrates-skin",
          "imageUrl": null,
          "videoUrl": null,
          "videoLabel": null,
          "isActive": true
        },
        {
          "eyebrow": "Moringa loose-leaf infusion",
          "title": "Chaitree®",
          "subtitle": "Moringa Masala Chai",
          "tagline": "Robust, spicy, and moringa green.",
          "body": "Rolled moringa leaves with ginger, cardamom, cloves, cinnamon, nutmeg and black pepper — spices from organic farms, about 50 cups in every 100 g.",
          "features": "leaf | Organic moringa leaves\nsun | Warming whole spices\nbolt | Quick energy",
          "ctaLabel": "Shop Chaitree",
          "ctaHref": "/product/moringa-rolled-masala-chai-100-gms-50-servings-approx-description",
          "secondaryLabel": "All moringa teas",
          "secondaryHref": "/shop/moringa-tea",
          "productSlug": "moringa-rolled-masala-chai-100-gms-50-servings-approx-description",
          "imageUrl": null,
          "videoUrl": null,
          "videoLabel": null,
          "isActive": true
        },
        {
          "eyebrow": "Multi-grain nutrition with moringa",
          "title": "Movita",
          "subtitle": "Health Mix & Laddus",
          "tagline": "Sprouted grains, the goodness of moringa.",
          "body": "Moringa leaf, flower and seed with flax, almond, palm jaggery and 21 sprouted pulses and grains — a health drink for children and adults, and laddus with no added sugar.",
          "features": "leaf | Moringa leaf, flower & seed\nheart | 21 sprouted pulses & grains\nshield | No preservatives",
          "ctaLabel": "Shop Movita",
          "ctaHref": "/shop?q=Movita",
          "secondaryLabel": "Health Mix",
          "secondaryHref": "/product/movita-multi-grain-health-mix-flavored",
          "productSlug": "movita-multi-grain-health-mix-flavored",
          "imageUrl": null,
          "videoUrl": null,
          "videoLabel": null,
          "isActive": true
        }
      ];
      const slides = await prisma.heroSlide.findMany({ orderBy: { position: "asc" } });
      const fresh = additions.filter((a) => !slides.some((s) => s.productSlug === a.productSlug));
      if (!fresh.length) return { count: 0 };
      const find = (re) =>
        slides.findIndex((s) => re.test(`${s.title} ${s.subtitle ?? ""} ${s.productSlug ?? ""}`));
      let at = find(/soup/i);
      if (at < 0) at = find(/mogo/i);
      // Re-number everything: slides up to the anchor, the new ones, the rest.
      const ordered = [...slides.slice(0, at + 1), ...fresh, ...slides.slice(at + 1)];
      for (const [position, slide] of ordered.entries()) {
        if (slide.id) await prisma.heroSlide.update({ where: { id: slide.id }, data: { position } });
        else await prisma.heroSlide.create({ data: { ...slide, position } });
      }
      return { count: fresh.length };
    },
  },
  {
    // Free shipping moves from ₹699 to ₹1,499, and orders from ₹2,499 get an
    // automatic 10% off. Updates the settings, the shipping FAQ answer and
    // the ₹699 announcement, and adds a 10%-off announcement.
    marker: "oneoff.offers-1499-2499",
    run: async () => {
      const settings = {
        "shipping.freeThreshold": "149900",
        "shipping.copy": "Free shipping above ₹1,499 · 10% off above ₹2,499",
        "discount.autoThreshold": "249900",
        "discount.autoPercent": "10",
      };
      for (const [key, value] of Object.entries(settings)) {
        await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
      let count = Object.keys(settings).length;
      for (const row of await prisma.faq.findMany()) {
        if (!row.answer.includes("₹699")) continue;
        let answer = row.answer.replaceAll("₹699", "₹1,499");
        if (!answer.includes("10%")) answer = answer.replace(/(Below that a flat ₹\d+ applies\.)/, "$1 Orders above ₹2,499 also get 10% off automatically.");
        await prisma.faq.update({ where: { id: row.id }, data: { answer } });
        count++;
      }
      const announcements = await prisma.announcement.findMany({ orderBy: { position: "asc" } });
      for (const row of announcements) {
        if (!row.message.includes("₹699")) continue;
        await prisma.announcement.update({
          where: { id: row.id },
          data: { message: row.message.replaceAll("₹699", "₹1,499") },
        });
        count++;
      }
      if (!announcements.some((row) => /10%/.test(row.message))) {
        const position = announcements.reduce((max, row) => Math.max(max, row.position), 0) + 1;
        await prisma.announcement.create({
          data: { message: "10% off on orders above ₹2,499", position, isActive: true },
        });
        count++;
      }
      return { count };
    },
  },
  {
    // Queued email was never being sent on this server. Now that it is, the
    // backlog must not go out late — months-old receipts and alerts. Anything
    // still pending from more than a day ago is marked expired, not sent.
    marker: "oneoff.expire-stale-mail",
    run: () =>
      prisma.emailJob.updateMany({
        where: {
          status: "pending",
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        data: { status: "expired", error: "Expired: queued before email sending was switched on" },
      }),
  },
];
for (const { marker, run } of ONE_OFFS) {
  if (await prisma.siteSetting.findUnique({ where: { key: marker } })) continue;
  const result = await run();
  await prisma.siteSetting.create({
    data: { key: marker, value: new Date().toISOString() },
  });
  console.log(`  ${marker}: ${result?.count ?? 0} changed`);
}

console.log(
  filled || settingsAdded
    ? `[content] filled from snapshot ${content.version}.`
    : "[content] nothing missing.",
);
await prisma.$disconnect();
