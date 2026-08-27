import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { RitualBuilder, type RitualStep } from "@/components/ritual/RitualBuilder";
import { RITUAL_COUPON } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Build your ritual",
  description:
    "Assemble a daily moringa routine — morning tea, something nourishing, something to carry, something for after — and add the lot to your bag in one go.",
  path: "/ritual",
});

/**
 * The steps are structure, not content: each names a category and supplies the
 * copy that frames it. Everything shown inside a step — the products, their
 * prices, their stock — is read from the database, and a step whose category is
 * empty simply does not render.
 */
const STEP_PLAN: { key: string; category: string; eyebrow: string; title: string; blurb: string }[] =
  [
    {
      key: "morning",
      category: "moringa-tea",
      eyebrow: "Morning",
      title: "Start the day with a cup",
      blurb:
        "Rolled leaf or a tea bag, plain or spiced. This is the gentlest way into moringa and the one most people keep up.",
    },
    {
      key: "nourish",
      category: "super-foods",
      eyebrow: "At the table",
      title: "Something that goes into a meal",
      blurb:
        "Powders and mixes that disappear into what you already cook — idly chutney, rice, a health mix, a soup.",
    },
    {
      key: "support",
      category: "herbal-supplements",
      eyebrow: "Daily support",
      title: "A measured dose",
      blurb:
        "Capsules and tablets, for when you would rather not think about quantities. Take them with food.",
    },
    {
      key: "carry",
      category: "healthy-snacks",
      eyebrow: "On the move",
      title: "Something to carry",
      blurb: "For the middle of the afternoon, when the alternative is whatever is nearest.",
    },
    {
      key: "after",
      category: "essential-oils",
      eyebrow: "After",
      title: "For skin and hair",
      blurb: "Cold-pressed seed oil and skin drops — the part of the tree that never goes in a cup.",
    },
  ];

export default async function RitualPage() {
  const [categories, coupon] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, slug: { in: STEP_PLAN.map((s) => s.category) } },
      select: {
        slug: true,
        products: {
          where: { status: "published" },
          orderBy: [{ isFeatured: "desc" }, { position: "asc" }],
          select: {
            name: true,
            slug: true,
            shortDescription: true,
            images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
            variants: {
              where: { isActive: true },
              orderBy: { position: "asc" },
              take: 1,
              select: {
                id: true,
                name: true,
                price: true,
                inventory: {
                  select: { onHand: true, reserved: true, trackInventory: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.coupon.findUnique({ where: { code: RITUAL_COUPON } }),
  ]);

  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const steps: RitualStep[] = STEP_PLAN.map((plan) => {
    const category = bySlug.get(plan.category);

    const choices = (category?.products ?? []).flatMap((product) => {
      // One entry per product, using its cheapest active option — a builder is
      // for deciding what goes in the routine, not for choosing a size. Sizes
      // are still changed later, in the bag or on the product page.
      const variant = product.variants[0];
      if (!variant) return [];

      const inv = variant.inventory;
      const inStock = !inv || !inv.trackInventory || inv.onHand - inv.reserved > 0;

      return [
        {
          variantId: variant.id,
          productSlug: product.slug,
          productName: product.name,
          variantName: variant.name,
          price: variant.price,
          imageUrl: product.images[0]?.url ?? null,
          shortDescription: product.shortDescription,
          inStock,
        },
      ];
    });

    return { key: plan.key, eyebrow: plan.eyebrow, title: plan.title, blurb: plan.blurb, choices };
  }).filter((step) => step.choices.length > 0);

  // Only offered when it is actually live and in date. A retired promotion
  // leaves the builder working and simply quoting no saving.
  const now = new Date();
  const live =
    coupon &&
    coupon.isActive &&
    coupon.kind === "percentage" &&
    (!coupon.startsAt || coupon.startsAt <= now) &&
    (!coupon.endsAt || coupon.endsAt >= now) &&
    (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit);

  const promo = live
    ? {
        code: coupon.code,
        percent: coupon.value,
        minSubtotal: coupon.minSubtotal,
        maxDiscount: coupon.maxDiscount,
      }
    : null;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Build your ritual", path: "/ritual" },
  ];

  return (
    <>
      <JsonLd id="ritual-breadcrumb" data={breadcrumbSchema(crumbs)} />

      <Container className="py-14 md:py-20">
        <Breadcrumbs items={crumbs} />

        <header className="mt-10 max-w-3xl">
          <p className="eyebrow text-cream-400/70">Build your ritual</p>
          <h1 className="mt-5 text-hero text-cream-50">A day around the tree</h1>
          <p className="mt-7 max-w-[54ch] text-[1.1rem] leading-relaxed text-cream-300">
            Moringa works by being ordinary — a cup in the morning, a spoon into
            what you already cook, something in your bag at four o&rsquo;clock.
            Put together the version of that you would actually keep up.
          </p>
          {promo ? (
            <p className="mt-5 text-sm text-emerald-300">
              {promo.percent}% off once your ritual passes{" "}
              {new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(promo.minSubtotal / 100)}
              .
            </p>
          ) : null}
        </header>

        <div className="mt-16">
          <RitualBuilder steps={steps} promo={promo} />
        </div>
      </Container>
    </>
  );
}
