import type { Metadata } from "next";
import {
  getArticles,
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
import { WorldChapters, type WorldChapter } from "@/components/world/WorldChapters";
import { WhyMoringa } from "@/components/home/WhyMoringa";
import { ProcessSection } from "@/components/home/ProcessSection";
import { CollectionRail } from "@/components/home/CollectionRail";
import { IngredientExplorer } from "@/components/home/IngredientExplorer";
import { SocialProof, type ProofItem } from "@/components/home/SocialProof";
import { BrandStory } from "@/components/home/BrandStory";
import { JournalRail } from "@/components/home/JournalRail";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCta } from "@/components/home/FinalCta";

// The homepage is fully CMS-driven, so it revalidates rather than being static.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const base = buildMetadata({
    title: settings.get("seo.defaultTitle") ?? `${SITE.name} — Moringa superfoods from Madurai`,
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
const WORLD_CHAPTERS: WorldChapter[] = [
  {
    index: "01",
    eyebrow: "The seed",
    title: "From the Miracle Tree.",
    body: "It begins as a winged seed, no larger than a thumbnail, sown at the edge of a field in Madurai before the rains.",
  },
  {
    index: "02",
    eyebrow: "Germination",
    title: "Down, before up.",
    body: "Roots go first, and they go deep — which is how this tree survives a monsoon that never arrives.",
  },
  {
    index: "03",
    eyebrow: "The rise",
    title: "Head height in a year.",
    body: "Soft-wooded and impatient. Moringa reaches harvestable height faster than almost anything else that feeds people.",
  },
  {
    index: "04",
    eyebrow: "Flower and pod",
    title: "The drumstick tree.",
    body: "Cream blossom first, then the pods it is named for — murungakkai, the vegetable in half the sambar in Tamil Nadu. Leaf, flower and pod are all eaten.",
  },
  {
    index: "05",
    eyebrow: "Inside the leaf",
    title: "Where the green lives.",
    body: "Chloroplasts, suspended in cytoplasm. Everything worth keeping is in here — and heat is what destroys it.",
  },
  {
    index: "06",
    eyebrow: "Below 40°C",
    title: "Dried slowly, in shade.",
    body: "Sun-drying is faster and cheaper, and it is why most moringa powder is olive rather than green. This is the corner we don't cut.",
  },
  {
    index: "07",
    eyebrow: "Your kitchen",
    title: "One tree, twenty-seven ways.",
    body: "Leaf, pod, flower, seed and gum — milled, rolled, pressed and packed within a few weeks of the harvest.",
  },
];

export default async function HomePage() {
  const [sections, products, ingredients, reviews, testimonials, articles, faqs] =
    await Promise.all([
      getHomepageSections(),
      getFeaturedProducts(10),
      getIngredients(),
      getFeaturedReviews(6),
      getTestimonials(6),
      getArticles({ take: 3 }),
      getFaqs(),
    ]);

  // The hero resolves into a real photograph of the featured product rather
  // than a stock image, which is what makes the seed→product idea land.
  const heroSection = sections.get("hero");
  const heroProduct = await prisma.product.findFirst({
    where: { status: "published", isFeatured: true },
    orderBy: { position: "asc" },
    select: {
      name: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
    },
  });

  const heroExtra = safeJson(heroSection?.data);
  // Hero copy still comes from the CMS section; the world renders it as
  // chapter 01 rather than as a separate hero block.
  const hero: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryLabel: string | null;
    secondaryHref: string | null;
    image: { url: string; alt: string } | null;
  } = {
    title: heroSection?.title ?? "From the Miracle Tree.",
    subtitle:
      heroSection?.subtitle ??
      "Moringa grown, dried and milled in Madurai — from a single seed to what reaches your kitchen.",
    ctaLabel: heroSection?.ctaLabel ?? "Explore the collection",
    ctaHref: heroSection?.ctaHref ?? "/shop",
    secondaryLabel: (heroExtra.secondaryLabel as string) ?? "Discover moringa",
    secondaryHref: (heroExtra.secondaryHref as string) ?? "/moringa",
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
  const proof: ProofItem[] = [
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
      {/* 01–07 — The Moringa World: one WebGL scene, travelled by scrolling.
          Replaces the old hero and tree sections; both of those lived in the
          same narrative space and now share one camera path. */}
      <WorldChapters
        chapters={WORLD_CHAPTERS}
        ctaLabel={hero.ctaLabel}
        ctaHref={hero.ctaHref}
        secondaryLabel={hero.secondaryLabel}
        secondaryHref={hero.secondaryHref}
        poster={hero.image}
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
function isActive(
  sections: Awaited<ReturnType<typeof getHomepageSections>>,
  key: string,
): boolean {
  const section = sections.get(key);
  return section ? section.isActive : true;
}

function safeJson(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
