import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import { EmptyState } from "@/components/ui/EmptyState";
import { WishlistGrid } from "@/components/account/WishlistGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Saved products",
  description: "Products you've saved for later.",
  path: "/account/wishlist",
  noIndex: true,
});

export default async function WishlistPage() {
  const user = await requireUser();

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          status: true,
          images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
          category: { select: { name: true } },
          variants: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              inventory: { select: { onHand: true, reserved: true, trackInventory: true } },
            },
          },
        },
      },
    },
  });

  // A product archived after it was saved should quietly drop out of the list
  // rather than link to a 404.
  const available = items.filter((item) => item.product.status === "published");

  if (!available.length) {
    return (
      <EmptyState
        icon="heart"
        title="Nothing saved yet"
        body="Tap the heart on any product to keep it here. Saved products stay on your account across devices."
        actionLabel="Explore the collection"
        actionHref="/shop"
      />
    );
  }

  return (
    <div>
      <h2 className="text-title text-cream-50">Saved products</h2>
      <p className="mt-3 text-sm text-cream-400">
        {available.length} {available.length === 1 ? "product" : "products"}
      </p>

      <WishlistGrid
        items={available.map((item) => ({
          id: item.id,
          productId: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          compareAtPrice: item.product.compareAtPrice,
          image: item.product.images[0]?.url ?? null,
          categoryName: item.product.category?.name ?? null,
          variantCount: item.product.variants.length,
          inStock: item.product.variants.some(
            (v) =>
              !v.inventory?.trackInventory ||
              (v.inventory ? v.inventory.onHand - v.inventory.reserved > 0 : false),
          ),
        }))}
      />
    </div>
  );
}
