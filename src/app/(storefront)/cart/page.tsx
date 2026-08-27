import type { Metadata } from "next";
import { Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCart } from "@/lib/cart";
import { getBestSellers, getProductsByIds } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Your bag",
  description: "Review your Miracle Tree order before checkout.",
  path: "/cart",
  noIndex: true,
});

export default async function CartPage() {
  const cart = await getCart();

  // Recommendations avoid what is already in the bag.
  const inCart = new Set(cart.lines.map((l) => l.productId));
  const bestSellers = await getBestSellers(6);
  let recommended = bestSellers.filter((p) => !inCart.has(p.id)).slice(0, 4);

  // If the bag already holds the bestsellers, fall back to same-category picks.
  if (recommended.length < 3 && cart.lines.length) {
    const extra = await getProductsByIds(cart.lines.map((l) => l.productId));
    recommended = [...recommended, ...extra.filter((p) => !inCart.has(p.id))].slice(0, 4);
  }

  return (
    <div className="grain bg-ink pb-24 pt-12 md:pt-16">
      <Container>
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Your bag", path: "/cart" },
          ]}
        />

        <h1 className="mt-8 text-display text-cream-50">Your bag</h1>

        <CartPageClient />

        {recommended.length ? (
          <section className="mt-24 border-t border-white/10 pt-14">
            <h2 className="text-title text-cream-50">Goes well with this</h2>
            <ProductGrid
              products={recommended}
              listName="Cart recommendations"
              columns={4}
              className="mt-10"
            />
          </section>
        ) : null}
      </Container>
    </div>
  );
}
