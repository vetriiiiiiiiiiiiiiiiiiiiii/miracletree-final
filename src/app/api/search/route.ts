import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRoute } from "@/lib/rate-limit";
import { stripHtml, truncate } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SearchHit = {
  kind: "product" | "article" | "faq" | "category" | "ingredient";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  image: string | null;
  price: number | null;
};

/**
 * Instant search across the catalogue and the editorial content. Kept as a
 * route handler rather than a Server Action so it can be called on every
 * keystroke with an AbortController, and cached at the edge later if needed.
 */
export async function GET(request: NextRequest) {
  // The most exposed endpoint on the site: no auth, and five LIKE queries per
  // call. The ceiling is high because this fires on every keystroke — a real
  // shopper searching hard might spend twenty in a minute, not sixty.
  const limited = await limitRoute({ name: "search", limit: 60, windowSeconds: 60 });
  if (limited) return limited;

  const term = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);

  if (term.length < 2) {
    return NextResponse.json({ hits: [], suggestions: await suggestions() });
  }

  const [products, articles, faqs, categories, ingredients] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "published",
        OR: [
          { name: { contains: term } },
          { shortDescription: { contains: term } },
          { category: { name: { contains: term } } },
          { ingredients: { some: { ingredient: { name: { contains: term } } } } },
        ],
      },
      take: 6,
      orderBy: [{ isFeatured: "desc" }, { position: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        shortDescription: true,
        images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.article.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: term } },
          { excerpt: { contains: term } },
          { content: { contains: term } },
        ],
      },
      take: 3,
      select: { id: true, title: true, slug: true, excerpt: true, heroImageUrl: true },
    }),
    prisma.faq.findMany({
      where: {
        isActive: true,
        OR: [{ question: { contains: term } }, { answer: { contains: term } }],
      },
      take: 3,
      select: { id: true, question: true, answer: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: term } },
      take: 3,
      select: { id: true, name: true, slug: true, description: true },
    }),
    prisma.ingredient.findMany({
      where: { name: { contains: term } },
      take: 3,
      select: { id: true, name: true, slug: true, description: true },
    }),
  ]);

  const hits: SearchHit[] = [
    ...products.map((p) => ({
      kind: "product" as const,
      id: p.id,
      title: p.name,
      subtitle: p.category?.name ?? p.shortDescription,
      href: `/product/${p.slug}`,
      image: p.images[0]?.url ?? null,
      price: p.price,
    })),
    ...categories.map((c) => ({
      kind: "category" as const,
      id: c.id,
      title: c.name,
      subtitle: c.description ? truncate(c.description, 70) : "Category",
      href: `/shop/${c.slug}`,
      image: null,
      price: null,
    })),
    ...ingredients.map((i) => ({
      kind: "ingredient" as const,
      id: i.id,
      title: i.name,
      subtitle: i.description ? truncate(i.description, 70) : "Ingredient",
      href: `/shop?ingredient=${i.slug}`,
      image: null,
      price: null,
    })),
    ...articles.map((a) => ({
      kind: "article" as const,
      id: a.id,
      title: a.title,
      subtitle: a.excerpt ? truncate(a.excerpt, 80) : "Journal",
      href: `/journal/${a.slug}`,
      image: a.heroImageUrl,
      price: null,
    })),
    ...faqs.map((f) => ({
      kind: "faq" as const,
      id: f.id,
      title: f.question,
      subtitle: truncate(stripHtml(f.answer), 80),
      href: `/faq#faq-${f.id}`,
      image: null,
      price: null,
    })),
  ];

  // With nothing matched, offer real products rather than a dead end.
  const fallback = hits.length === 0 ? await popularProducts() : [];

  return NextResponse.json({
    hits,
    fallback,
    suggestions: await suggestions(),
    term,
  });
}

async function suggestions() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    take: 5,
    select: { name: true, slug: true },
  });
  return categories.map((c) => ({ label: c.name, href: `/shop/${c.slug}` }));
}

async function popularProducts(): Promise<SearchHit[]> {
  const rows = await prisma.product.findMany({
    where: { status: "published", isBestSeller: true },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
      category: { select: { name: true } },
    },
  });

  return rows.map((p) => ({
    kind: "product" as const,
    id: p.id,
    title: p.name,
    subtitle: p.category?.name ?? null,
    href: `/product/${p.slug}`,
    image: p.images[0]?.url ?? null,
    price: p.price,
  }));
}
