import {
  getArticles,
  getCategories,
  getFaqs,
  getFeaturedProducts,
  getFeaturedReviews,
  getHomepageSections,
  getIngredients,
  getSettings,
  getTestimonials,
} from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { WhyMoringa } from "@/components/home/WhyMoringa";
import { ProcessSection } from "@/components/home/ProcessSection";
import { CollectionRail } from "@/components/home/CollectionRail";
import { IngredientExplorer } from "@/components/home/IngredientExplorer";
import { SocialProof } from "@/components/home/SocialProof";
import { BrandStory } from "@/components/home/BrandStory";
import { JournalRail } from "@/components/home/JournalRail";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";
import { HomeHero } from "@/components/home/HomeHero";
import { InnovationStrip } from "@/components/home/InnovationStrip";
import { FounderBlock } from "@/components/home/FounderBlock";
import { TrustSignals } from "@/components/home/TrustSignals";
import { ExportReach } from "@/components/home/ExportReach";
// The homepage is fully CMS-driven, so it revalidates rather than being static.
/**
 * The packs in the hero: a flagship, and six the three small cells cycle
 * through so the composition is never showing the same range twice.
 *
 * Most of the catalogue's photography has a white background baked into the
 * image rather than a transparent one, which reads as a white card stuck onto
 * the hero's ground. Nine of the twenty-seven are genuine cut-outs and these
 * are four of them. The first is the MOGO group shot — several products in one
 * frame, which does more work as the flagship than a single pack would. The
 * two tea cartons are cut out but photographed as light boxes, so they are
 * left out: on the dark ground they read as cards rather than as products.
 */
const HERO_PRODUCT_SLUGS = [
  "mogo-moringa-energy-bar-movita-r",
  "movita-multi-grain-health-mix-flavored",
  "moringa-leaf-dried-50gms-pack-of-2",
  "moringa-seed-oil-hair-strengthening-oil",
  "moringa-leaf-powder-capsules-60-capsules",
  "moringa-gum-gond-powder-100-grams",
  "moringa-seed-capsule-90-capsules",
];
export const revalidate = 300;
export async function generateMetadata() {
  const settings = await getSettings();
  const base = buildMetadata({
    title:
      settings.get("seo.defaultTitle") ??
      `${SITE.name} — Moringa superfoods from Madurai`,
    description: settings.get("seo.defaultDescription") ?? SITE.description,
    path: "/",
  });
  // The root layout appends "— Miracle Tree" to every title. The homepage title
  // already carries the brand, so it opts out of the template rather than
  // rendering it twice.
  return { ...base, title: { absolute: String(base.title) } };
}
/**
 * The seven chapters of the journey. Their indices line up with CHAPTER_STOPS
 * in the scene, so the copy and the camera are describing the same moment.
 */
export default async function HomePage() {
  const [
    sections,
    products,
    ingredients,
    reviews,
    testimonials,
    articles,
    faqs,
    categories,
    heroPacks,
    founder,
    accolades,
  ] = await Promise.all([
    getHomepageSections(),
    getFeaturedProducts(10),
    getIngredients(),
    getFeaturedReviews(6),
    getTestimonials(6),
    getArticles({ take: 3 }),
    getFaqs(),
    // The same row /leadership features, so the two pages cannot disagree
    // about who runs the company or what he said.
    getCategories(),
    prisma.product.findMany({
      where: { slug: { in: HERO_PRODUCT_SLUGS }, status: "published" },
      select: {
        name: true,
        slug: true,
        images: { select: { url: true }, take: 1 },
        variants: { select: { price: true }, orderBy: { price: "asc" }, take: 1 },
      },
    }),
    prisma.leader.findFirst({
      where: { isActive: true, isFounder: true },
      select: { name: true, role: true, quote: true, imageUrl: true },
    }),
    prisma.accolade.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
      select: { title: true, issuer: true, year: true },
    }),
  ]);
  // The hero resolves into a real photograph of the featured product rather
  // than a stock image, which is what makes the seed→product idea land.
  const heroSection = sections.get("hero");
  const heroProduct = await prisma.product.findFirst({
    where: { status: "published", isFeatured: true },
    orderBy: { position: "asc" },
    select: {
      name: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true, alt: true },
      },
    },
  });
  const heroExtra = safeJson(heroSection?.data);
  // Hero copy still comes from the CMS section; the world renders it as
  // chapter 01 rather than as a separate hero block.
  const hero = {
    title: heroSection?.title ?? "From the Miracle Tree.",
    subtitle:
      heroSection?.subtitle ??
      "Moringa grown, dried and milled in Madurai — from a single seed to what reaches your kitchen.",
    ctaLabel: heroSection?.ctaLabel ?? "Explore the collection",
    ctaHref: heroSection?.ctaHref ?? "/shop",
    secondaryLabel: heroExtra.secondaryLabel ?? "Discover moringa",
    secondaryHref: heroExtra.secondaryHref ?? "/moringa",
    image: heroSection?.mediaUrl
      ? { url: heroSection.mediaUrl, alt: "" }
      : heroProduct?.images[0]
        ? {
            url: heroProduct.images[0].url,
            alt: heroProduct.images[0].alt ?? heroProduct.name,
          }
        : null,
  };
  // Real reviews first; brand testimonials fill the rest. Nothing invented.
  const proof = [
    ...reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      isVerified: r.isVerified,
      createdAt: r.createdAt,
      product: r.product,
    })),
    ...testimonials.map((t) => ({
      id: t.id,
      authorName: t.authorName,
      location: t.location,
      rating: t.rating,
      body: t.body,
      createdAt: t.createdAt,
    })),
  ].slice(0, 6);
  const storySection = sections.get("story");
  return (
    <>
      {/* One screen, laid out as a grid of panels: the statement, the flagship,
            the world-first, the record, three more products, the certifications. */}
      <HomeHero
        title={hero.title}
        subtitle={hero.subtitle}
        products={HERO_PRODUCT_SLUGS.map((slug) =>
          heroPacks.find((p) => p.slug === slug),
        )
          .filter((p) => p?.images[0]?.url)
          .map((p) => ({
            name: p.name,
            slug: p.slug,
            image: p.images[0].url,
            price: p.variants[0]?.price ?? null,
          }))}
      />

      {/* 03 — Why moringa */}
      {isActive(sections, "why-moringa") ? (
        <WhyMoringa
          title={sections.get("why-moringa")?.title ?? "Why moringa"}
          subtitle={sections.get("why-moringa")?.subtitle ?? null}
        />
      ) : null}

      {/* 04 — Farm to pack */}
      {isActive(sections, "farm-to-product") ? (
        <ProcessSection
          title={sections.get("farm-to-product")?.title ?? "Farm to pack"}
          subtitle={sections.get("farm-to-product")?.subtitle ?? null}
        />
      ) : null}

      {/* Innovation — placed immediately after "farm to pack", because the
            process section ends on the drying step and that is the moment ULTCD
            and CLHPD actually land. */}
      <InnovationStrip />

      {/* 05/06 — The collection */}
      {isActive(sections, "collection") ? (
        <CollectionRail
          title={sections.get("collection")?.title ?? "The collection"}
          subtitle={sections.get("collection")?.subtitle ?? null}
          ctaLabel={sections.get("collection")?.ctaLabel ?? "View all products"}
          ctaHref={sections.get("collection")?.ctaHref ?? "/shop"}
          products={products}
        />
      ) : null}

      {/* The founder, after the range: the products raise the question of who
            is behind them, and this answers it. */}
      {founder ? (
        <FounderBlock
          name={founder.name}
          role={founder.role}
          quote={founder.quote}
          imageUrl={founder.imageUrl}
        />
      ) : null}

      {/* 07 — Ingredients */}
      {isActive(sections, "ingredients") ? (
        <IngredientExplorer
          title={sections.get("ingredients")?.title ?? "What's inside"}
          subtitle={sections.get("ingredients")?.subtitle ?? null}
          ingredients={ingredients.map((i) => ({
            id: i.id,
            name: i.name,
            slug: i.slug,
            description: i.description,
            origin: i.origin,
            productCount: i._count.products,
          }))}
        />
      ) : null}

      {/* 08 — Where the moringa goes */}
      <ExportReach />

      {/* 09 — What the company can prove: certificates, recognition, visitors */}
      <TrustSignals accolades={accolades} />

      {/* 08 — Social proof */}
      {isActive(sections, "reviews") ? (
        <SocialProof
          title={sections.get("reviews")?.title ?? "In their words"}
          subtitle={sections.get("reviews")?.subtitle ?? null}
          items={proof}
        />
      ) : null}

      {/* 09 — Brand story */}
      {isActive(sections, "story") ? (
        <BrandStory
          title={storySection?.title ?? "Twenty years under the same tree"}
          subtitle={storySection?.subtitle ?? null}
          ctaLabel={storySection?.ctaLabel ?? "Our story"}
          ctaHref={storySection?.ctaHref ?? "/about"}
          image={
            storySection?.mediaUrl
              ? { url: storySection.mediaUrl, alt: "" }
              : products[1]?.images[0]
                ? {
                    url: products[1].images[0].url,
                    alt: products[1].images[0].alt ?? products[1].name,
                  }
                : null
          }
        />
      ) : null}

      {/* 10 — Journal */}
      {isActive(sections, "journal") ? (
        <JournalRail
          title={sections.get("journal")?.title ?? "The Journal"}
          subtitle={sections.get("journal")?.subtitle ?? null}
          ctaLabel={sections.get("journal")?.ctaLabel ?? "Read the journal"}
          ctaHref={sections.get("journal")?.ctaHref ?? "/about#field-notes"}
          articles={articles}
        />
      ) : null}

      {/* 11 — FAQ */}
      {isActive(sections, "faq") ? (
        <FaqSection
          title={sections.get("faq")?.title ?? "Questions, answered"}
          subtitle={sections.get("faq")?.subtitle}
          faqs={faqs.slice(0, 6)}
        />
      ) : null}

      {/* 12 — Return to the seed */}
      {isActive(sections, "final-cta") ? (
        <FinalCta
          title={sections.get("final-cta")?.title ?? "Discover the miracle"}
          subtitle={sections.get("final-cta")?.subtitle ?? null}
          ctaLabel={sections.get("final-cta")?.ctaLabel ?? "Shop now"}
          ctaHref={sections.get("final-cta")?.ctaHref ?? "/shop"}
        />
      ) : null}
    </>
  );
}
/** A section absent from the CMS still renders; only an explicit disable hides it. */
function isActive(sections, key) {
  const section = sections.get(key);
  return section ? section.isActive : true;
}
function safeJson(value) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
