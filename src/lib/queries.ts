import "server-only";
import { cache } from "react";
import { prisma, insensitive } from "./prisma";
import type { ShopQuery } from "./validation";

/**
 * Storefront reads. Everything here is wrapped in React `cache` so a page that
 * needs the same data in metadata and in the tree only queries once.
 */

const PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  price: true,
  compareAtPrice: true,
  productType: true,
  isFeatured: true,
  isBestSeller: true,
  isNew: true,
  isOnSale: true,
  publishedAt: true,
  position: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: { position: "asc" },
    take: 2,
    select: { url: true, alt: true, width: true, height: true },
  },
  variants: {
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      compareAtPrice: true,
      imageUrl: true,
      inventory: { select: { onHand: true, reserved: true, trackInventory: true } },
    },
  },
  reviews: { where: { status: "approved" }, select: { rating: true } },
} as const;

export type ProductCard = Awaited<ReturnType<typeof getFeaturedProducts>>[number];

/** Collapses the approved-review rows a card carries into an average + count. */
function withRating<T extends { reviews: { rating: number }[] }>(product: T) {
  const { reviews, ...rest } = product;
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : null;
  return { ...rest, ratingAverage: average, ratingCount: count };
}

function isInStock(variants: ProductCard["variants"]): boolean {
  return variants.some(
    (v) =>
      !v.inventory?.trackInventory ||
      (v.inventory ? v.inventory.onHand - v.inventory.reserved > 0 : false),
  );
}

export const getFeaturedProducts = cache(async (take = 6) => {
  const rows = await prisma.product.findMany({
    where: { status: "published", isFeatured: true },
    orderBy: { position: "asc" },
    take,
    select: PRODUCT_CARD_SELECT,
  });
  return rows.map(withRating);
});

export const getBestSellers = cache(async (take = 4) => {
  const rows = await prisma.product.findMany({
    where: { status: "published", isBestSeller: true },
    orderBy: { position: "asc" },
    take,
    select: PRODUCT_CARD_SELECT,
  });
  return rows.map(withRating);
});

export const getCategories = cache(async () =>
  prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      seoTitle: true,
      seoDescription: true,
      _count: { select: { products: { where: { status: "published" } } } },
    },
  }),
);

export const getCollections = cache(async () =>
  prisma.collection.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, name: true, slug: true, description: true },
  }),
);

export const getIngredients = cache(async () =>
  prisma.ingredient.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      origin: true,
      imageUrl: true,
      _count: { select: { products: true } },
    },
  }),
);

const PAGE_SIZE = 12;

/**
 * The shop listing. Text search and price filtering run in SQL; the stock and
 * rating filters run in memory because both depend on aggregates across related
 * rows that SQLite cannot filter on cheaply. The catalogue is small enough
 * (tens of products) that this is the right trade — revisit past ~2000 SKUs.
 */
export async function searchProducts(query: ShopQuery) {
  const where: Record<string, unknown> = { status: "published" };
  const and: Record<string, unknown>[] = [];

  if (query.q) {
    and.push({
      OR: [
        { name: { contains: query.q, ...insensitive } },
        { shortDescription: { contains: query.q, ...insensitive } },
        { description: { contains: query.q, ...insensitive } },
        { category: { name: { contains: query.q, ...insensitive } } },
        { ingredients: { some: { ingredient: { name: { contains: query.q, ...insensitive } } } } },
      ],
    });
  }
  if (query.category) and.push({ category: { slug: query.category } });
  if (query.collection)
    and.push({ collections: { some: { collection: { slug: query.collection } } } });
  if (query.type) and.push({ productType: query.type });
  if (query.ingredient)
    and.push({ ingredients: { some: { ingredient: { slug: query.ingredient } } } });
  if (query.min !== undefined) and.push({ price: { gte: Math.round(query.min * 100) } });
  if (query.max !== undefined) and.push({ price: { lte: Math.round(query.max * 100) } });
  if (query.offers) and.push({ isOnSale: true });
  if (and.length) where.AND = and;

  const orderBy = (() => {
    switch (query.sort) {
      case "price-asc":
        return [{ price: "asc" as const }];
      case "price-desc":
        return [{ price: "desc" as const }];
      case "newest":
        return [{ publishedAt: "desc" as const }];
      case "name":
        return [{ name: "asc" as const }];
      default:
        return [
          { isFeatured: "desc" as const },
          { isBestSeller: "desc" as const },
          { position: "asc" as const },
        ];
    }
  })();

  const rows = await prisma.product.findMany({
    where,
    orderBy,
    select: PRODUCT_CARD_SELECT,
  });

  let products = rows.map(withRating).map((p) => ({ ...p, inStock: isInStock(p.variants) }));

  if (query.availability === "in-stock") products = products.filter((p) => p.inStock);
  if (query.sort === "rating") {
    products.sort((a, b) => (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0));
  }

  const total = products.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pages);

  return {
    products: products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    pages,
    pageSize: PAGE_SIZE,
  };
}

export const getProductBySlug = cache(async (slug: string) => {
  const product = await prisma.product.findFirst({
    where: { slug, status: "published" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { inventory: true },
      },
      benefits: { orderBy: { position: "asc" } },
      usageSteps: { orderBy: { step: "asc" } },
      ingredients: { orderBy: { position: "asc" }, include: { ingredient: true } },
      faqs: { where: { isActive: true }, orderBy: { position: "asc" } },
      collections: { include: { collection: { select: { name: true, slug: true } } } },
      reviews: {
        where: { status: "approved" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          authorName: true,
          rating: true,
          title: true,
          body: true,
          isVerified: true,
          createdAt: true,
        },
      },
    },
  });
  if (!product) return null;

  const count = product.reviews.length;
  const average = count
    ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : null;

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: product.reviews.filter((r) => r.rating === star).length,
  }));

  return {
    ...product,
    ratingAverage: average,
    ratingCount: count,
    ratingBreakdown: breakdown,
    inStock: product.variants.some(
      (v) => !v.inventory?.trackInventory || (v.inventory?.onHand ?? 0) - (v.inventory?.reserved ?? 0) > 0,
    ),
  };
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/**
 * Recommendations. Explicit admin-set relations come first; the remainder is
 * filled from the same category so a product page never shows an empty rail.
 */
export const getRelatedProducts = cache(
  async (productId: string, categoryId: string | null, take = 4) => {
    const explicit = await prisma.productRelation.findMany({
      where: { sourceId: productId, kind: "related" },
      orderBy: { position: "asc" },
      take,
      select: { target: { select: PRODUCT_CARD_SELECT } },
    });

    const picked = explicit.map((r) => r.target);
    const have = new Set([productId, ...picked.map((p) => p.id)]);

    if (picked.length < take && categoryId) {
      const filler = await prisma.product.findMany({
        where: {
          status: "published",
          categoryId,
          id: { notIn: [...have] },
        },
        orderBy: { position: "asc" },
        take: take - picked.length,
        select: PRODUCT_CARD_SELECT,
      });
      picked.push(...filler);
    }

    return picked.map(withRating);
  },
);

export const getProductsByIds = cache(async (ids: string[]) => {
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, status: "published" },
    select: PRODUCT_CARD_SELECT,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean).map((p) => withRating(p!));
});

// ---------------------------------------------------------------- content

export const getHomepageSections = cache(async () => {
  const rows = await prisma.homepageSection.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  return new Map(rows.map((r) => [r.key, r]));
});

export const getNavigation = cache(async () => {
  const rows = await prisma.navigationItem.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
  return {
    header: rows.filter((r) => r.group === "header"),
    headerCompany: rows.filter((r) => r.group === "header-company"),
    footerShop: rows.filter((r) => r.group === "footer-shop"),
    footerCompany: rows.filter((r) => r.group === "footer-company"),
    footerSupport: rows.filter((r) => r.group === "footer-support"),
  };
});

export const getAnnouncements = cache(async () => {
  const now = new Date();
  return prisma.announcement.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { position: "asc" },
  });
});

export const getFaqs = cache(async (category?: string) =>
  prisma.faq.findMany({
    where: { isActive: true, productId: null, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { position: "asc" }],
  }),
);

export const getTestimonials = cache(async (take = 8) =>
  prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    take,
  }),
);

/** Approved product reviews, surfaced on the homepage as social proof. */
export const getFeaturedReviews = cache(async (take = 6) =>
  prisma.review.findMany({
    where: { status: "approved" },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      authorName: true,
      rating: true,
      title: true,
      body: true,
      isVerified: true,
      createdAt: true,
      product: { select: { name: true, slug: true } },
    },
  }),
);

export const getArticles = cache(async (opts?: { take?: number; category?: string }) =>
  prisma.article.findMany({
    where: {
      status: "published",
      ...(opts?.category ? { category: { slug: opts.category } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: opts?.take,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      heroImageUrl: true,
      authorName: true,
      readingMinutes: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
  }),
);

export const getArticleBySlug = cache(async (slug: string) =>
  prisma.article.findFirst({
    where: { slug, status: "published" },
    include: { category: true },
  }),
);

export const getArticleCategories = cache(async () =>
  prisma.articleCategory.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      slug: true,
      _count: { select: { articles: { where: { status: "published" } } } },
    },
  }),
);

export const getSettings = cache(async () => {
  const rows = await prisma.siteSetting.findMany();
  return new Map(rows.map((r) => [r.key, r.value]));
});

/** Reads a numeric setting, falling back when it is absent or malformed. */
export async function settingNumber(key: string, fallback: number): Promise<number> {
  const settings = await getSettings();
  const raw = settings.get(key);
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
