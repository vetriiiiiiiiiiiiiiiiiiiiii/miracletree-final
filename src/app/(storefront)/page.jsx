import {
  getArticles,
  getCatalogue,
  getCategories,
  getFaqs,
  getFeaturedProducts,
  getFeaturedReviews,
  getHomepageSections,
  getSettings,
  getTestimonials,
} from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { SITE } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { WhyMoringa } from "@/components/home/WhyMoringa";
import { SocialProof } from "@/components/home/SocialProof";
import { JournalRail } from "@/components/home/JournalRail";
import { FaqSection } from "@/components/home/FaqSection";
import { FounderBlock } from "@/components/home/FounderBlock";
import { TrustSignals } from "@/components/home/TrustSignals";
import { HeroBanner } from "@/components/home/HeroBanner";
import { CategoryCircles } from "@/components/home/CategoryCircles";
import { UspStrip } from "@/components/home/UspStrip";
import { ProductTabs } from "@/components/home/ProductTabs";
import { PromoTiles } from "@/components/home/PromoTiles";
// The homepage is fully CMS-driven, so it revalidates rather than being static.
/**
 * The packs in the hero.
 *
 * Which products appear is the shop's decision, not this file's: tick
 * "Homepage hero" on a product in the admin and it appears here, ordered by
 * the product's own sort order — lowest fills the large panel, the rest cycle
 * through the three small cells.
 *
 * This list is what the hero falls back to when nothing is ticked, so a fresh
 * install and a shop that has just untick-ed its last pack both still render a
 * hero rather than a hole. Picking these is not arbitrary: most of the
 * catalogue's photography has a white background baked into the image rather
 * than a transparent one, which reads as a white card stuck onto the hero's
 * dark ground. Nine of the twenty-seven are genuine cut-outs and these are
 * four of them. The two tea cartons are cut out but photographed as light
 * boxes, so they are left out for the same reason.
 *
 * The MOGO group shot led this list and filled the large cell, because several
 * packs in one frame carry a big panel better than one does. It is gone on
 * instruction: the hero shows one product at a time, never a bundle.
 */
const FALLBACK_HERO_SLUGS = [
  "movita-multi-grain-health-mix-flavored",
  "moringa-leaf-dried-50gms-pack-of-2",
  "moringa-seed-oil-hair-strengthening-oil",
  "moringa-leaf-powder-capsules-60-capsules",
  "moringa-gum-gond-powder-100-grams",
  "moringa-seed-capsule-90-capsules",
];
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
    catalogue,
    reviews,
    testimonials,
    articles,
    faqs,
    categories,
    heroPacks,
    founder,
    heroSlides,
    accolades,
  ] = await Promise.all([
    getHomepageSections(),
    getFeaturedProducts(10),
    getCatalogue(),
    getFeaturedReviews(9),
    getTestimonials(6),
    getArticles({ take: 3 }),
    getFaqs(),
    // The same row /leadership features, so the two pages cannot disagree
    // about who runs the company or what he said.
    getCategories(),
    prisma.product.findMany({
      where: {
        status: "published",
        OR: [{ isHeroPack: true }, { slug: { in: FALLBACK_HERO_SLUGS } }],
      },
      orderBy: { position: "asc" },
      select: {
        name: true,
        slug: true,
        shortDescription: true,
        isHeroPack: true,
        category: { select: { name: true } },
        images: { select: { url: true }, take: 1 },
        variants: {
          select: { price: true },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    }),
    prisma.leader.findFirst({
      where: { isActive: true, isFounder: true },
      select: { name: true, role: true, quote: true, imageUrl: true },
    }),
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    }),
    prisma.accolade.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
      select: { title: true, issuer: true, year: true },
    }),
  ]);
  // The hero resolves into a real photograph of the featured product rather
  // than a stock image, which is what makes the seed→product idea land.
  // What the shop has chosen wins outright, in the products' own sort order —
  // first into the large panel, the rest through the small cells. The fallback
  // is consulted only when nothing at all is ticked, and then in its own
  // declared order, so the two lists can never mix into a hero nobody arranged.
  const withPhoto = heroPacks.filter((p) => p.images[0]?.url);
  const chosenPacks = withPhoto.filter((p) => p.isHeroPack);
  const heroPackList = chosenPacks.length
    ? chosenPacks
    : FALLBACK_HERO_SLUGS.map((slug) =>
        withPhoto.find((p) => p.slug === slug),
      ).filter(Boolean);

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
  ].slice(0, 9);
  const settings = await getSettings();
  const freeShippingAt = Number(settings.get("shipping.freeThreshold") ?? 0);
  const codEnabled = settings.get("checkout.codEnabled") !== "false";

  // Slides come from Admin → Hero banner. Until any exist, the CMS hero copy
  // and the "Homepage hero" products stand in, in the same shape.
  const packshotFor = (slug) =>
    catalogue.find((p) => p.slug === slug)?.images[0]?.url ?? null;
  const parseFeatures = (text) =>
    (text ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((line) => {
        const [icon, ...rest] = line.split("|");
        return rest.length
          ? { icon: icon.trim().toLowerCase(), text: rest.join("|").trim() }
          : { icon: "leaf", text: icon.trim() };
      });
  const slides = heroSlides.length
    ? heroSlides.map((s) => ({
        key: s.id,
        eyebrow: s.eyebrow,
        title: s.title,
        subtitle: s.subtitle,
        tagline: s.tagline,
        body: s.body,
        features: parseFeatures(s.features),
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref || (s.productSlug ? `/product/${s.productSlug}` : null),
        secondaryLabel: s.secondaryLabel,
        secondaryHref: s.secondaryHref,
        image: s.imageUrl,
        packshot: s.productSlug ? packshotFor(s.productSlug) : null,
        videoUrl: s.videoUrl,
        videoLabel: s.videoLabel,
        linkHref: s.linkHref,
        hideText: s.hideText,
      }))
    : [
        {
          key: "hero",
          eyebrow: "MiracleTree Life Science · Madurai",
          title: hero.title,
          body: hero.subtitle,
          features: [],
          ctaLabel: hero.ctaLabel,
          ctaHref: hero.ctaHref,
          secondaryLabel: hero.secondaryLabel,
          secondaryHref: hero.secondaryHref,
          image: hero.image && heroSection?.mediaUrl ? hero.image.url : null,
          packshot: heroPackList[0]?.images[0]?.url ?? null,
        },
        ...heroPackList.slice(1, 4).map((p) => ({
          key: p.slug,
          eyebrow: p.category?.name ?? "Featured",
          title: p.name,
          body: p.shortDescription,
          features: [],
          ctaLabel: "Shop now",
          ctaHref: `/product/${p.slug}`,
          packshot: p.images[0]?.url ?? null,
        })),
      ];

  const firstImageIn = (slug) =>
    catalogue.find((p) => p.category?.slug === slug && p.images[0])?.images[0]
      ?.url ?? null;
  const categoryTiles = categories
    .filter((c) => c._count.products > 0)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      count: c._count.products,
      image: c.imageUrl || firstImageIn(c.slug),
    }));

  const usps = [
    { icon: "leaf", title: "Pure moringa", body: "Grown & milled in Madurai" },
    { icon: "sun", title: "CLHPD dried", body: "Colour and nutrients kept" },
    { icon: "shield", title: "Certified quality", body: "FSSAI · GMP · ISO 9001" },
    ...(freeShippingAt > 0
      ? [
          {
            icon: "truck",
            title: "Free shipping",
            body: `On orders above ${formatPrice(freeShippingAt)}`,
          },
        ]
      : []),
    ...(codEnabled
      ? [{ icon: "cash", title: "Cash on delivery", body: "Pay when it arrives" }]
      : []),
  ];

  const tabs = [
    {
      key: "bestsellers",
      label: "Bestsellers",
      products: catalogue.filter((p) => p.isBestSeller),
    },
    {
      key: "featured",
      label: "Trending",
      products: catalogue.filter((p) => p.isFeatured),
    },
    {
      key: "new",
      label: "New launches",
      products: catalogue.filter((p) => p.isNew),
    },
    ...categoryTiles.map((c) => ({
      key: c.slug,
      label: c.name,
      href: `/shop/${c.slug}`,
      products: catalogue.filter((p) => p.category?.slug === c.slug),
    })),
  ];

  const promoImage = (i) =>
    catalogue.filter((p) => p.images[0])[i]?.images[0]?.url ?? null;
  const tiles = [
    {
      // The shop's default sort puts bestsellers first.
      href: "/shop",
      tone: "green",
      eyebrow: "Customer favourites",
      title: "Shop our bestsellers",
      body: "Powders, teas, capsules, oils and snacks — all from the same tree.",
      cta: "Shop now",
      image:
        catalogue.find((p) => p.isBestSeller && p.images[0])?.images[0]?.url ??
        promoImage(0),
    },
    {
      href: "/moringa",
      tone: "berry",
      eyebrow: "The miracle tree",
      title: "Why moringa, and why ours",
      body: "Leaf, pod, flower, seed and gum — what each one does.",
      cta: "Discover",
      image: heroPackList[2]?.images[0]?.url ?? promoImage(1),
    },
  ];

  return (
    <>
      <HeroBanner slides={slides} />

      <CategoryCircles categories={categoryTiles} />

      <UspStrip items={usps} />

      {isActive(sections, "collection") ? (
        <ProductTabs
          title={sections.get("collection")?.title ?? "Our bestsellers"}
          subtitle={sections.get("collection")?.subtitle ?? null}
          viewAllHref={sections.get("collection")?.ctaHref ?? "/shop"}
          tabs={tabs}
        />
      ) : null}

      <PromoTiles tiles={tiles} />

      {isActive(sections, "why-moringa") ? (
        <WhyMoringa
          title={sections.get("why-moringa")?.title ?? "Why moringa"}
          subtitle={sections.get("why-moringa")?.subtitle ?? null}
        />
      ) : null}

      {isActive(sections, "reviews") ? (
        <SocialProof
          title={sections.get("reviews")?.title ?? "Loved by our customers"}
          subtitle={sections.get("reviews")?.subtitle ?? null}
          items={proof}
        />
      ) : null}

      <TrustSignals accolades={accolades} />

      {founder ? (
        <FounderBlock
          name={founder.name}
          role={founder.role}
          quote={founder.quote}
          imageUrl={founder.imageUrl}
        />
      ) : null}

      {isActive(sections, "faq") ? (
        <FaqSection
          title={sections.get("faq")?.title ?? "Questions, answered"}
          subtitle={sections.get("faq")?.subtitle}
          faqs={faqs.slice(0, 6)}
        />
      ) : null}

      {isActive(sections, "journal") ? (
        <JournalRail
          title={sections.get("journal")?.title ?? "From the journal"}
          subtitle={sections.get("journal")?.subtitle ?? null}
          ctaLabel={sections.get("journal")?.ctaLabel ?? "Read more"}
          ctaHref={sections.get("journal")?.ctaHref ?? "/about#field-notes"}
          articles={articles}
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
