import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRoute } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Quick-view payload: everything the modal needs and nothing it doesn't.
 *
 * Kept separate from the product page's own query because this one is fetched
 * on demand from a grid — sending the full description, FAQs and review bodies
 * for a modal nobody may open would be wasteful.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Cheaper than search and edge-cacheable, so the ceiling is looser; it exists
  // to stop the catalogue being scraped in one pass.
  const limited = await limitRoute({ name: "quickview", limit: 120, windowSeconds: 60 });
  if (limited) return limited;

  const product = await prisma.product.findFirst({
    where: { slug, status: "published" },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      category: { select: { name: true } },
      images: {
        orderBy: { position: "asc" },
        take: 3,
        select: { url: true, alt: true },
      },
      benefits: {
        orderBy: { position: "asc" },
        take: 3,
        select: { title: true },
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
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ratingCount = product.reviews.length;
  const ratingAverage = ratingCount
    ? Math.round(
        (product.reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10,
      ) / 10
    : null;

  return NextResponse.json(
    {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      categoryName: product.category?.name ?? null,
      ratingAverage,
      ratingCount,
      images: product.images,
      benefits: product.benefits,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        imageUrl: variant.imageUrl,
        tracked: variant.inventory?.trackInventory ?? false,
        available: variant.inventory
          ? Math.max(0, variant.inventory.onHand - variant.inventory.reserved)
          : 0,
      })),
    },
    {
      // Safe to cache briefly at the edge: this is public catalogue data, and
      // stock is re-validated server-side on add-to-cart anyway.
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    },
  );
}
