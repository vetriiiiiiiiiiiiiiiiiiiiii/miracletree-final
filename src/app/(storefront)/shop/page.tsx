import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/layout/Section";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ShopSidebar, ShopControls } from "@/components/shop/ShopLayout";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategories,
  getCollections,
  getIngredients,
  searchProducts,
} from "@/lib/queries";
import { shopQuerySchema } from "@/lib/validation";
import { buildFilterGroups, countActiveFilters } from "@/lib/shop";
import { breadcrumbSchema, buildMetadata, itemListSchema } from "@/lib/seo";

export const revalidate = 300;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const term = typeof params.q === "string" ? params.q : null;

  return buildMetadata({
    title: term ? `Search: ${term}` : "Shop all moringa products",
    description:
      "Moringa leaf powder, teas, tablets, capsules, mixes, snacks and seed oil — grown and shade-dried in Madurai, Tamil Nadu.",
    path: "/shop",
    // Filtered and paginated permutations are index noise; canonical /shop and
    // the category pages carry the SEO weight.
    noIndex: Object.keys(params).length > 0,
  });
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = shopQuerySchema.parse(raw);

  const [result, categories, collections, ingredients] = await Promise.all([
    searchProducts(query),
    getCategories(),
    getCollections(),
    getIngredients(),
  ]);

  const groups = buildFilterGroups(categories, collections, ingredients);
  const activeCount = countActiveFilters(raw);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
  ];

  return (
    <>
      <JsonLd id="shop-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {result.products.length ? (
        <JsonLd id="shop-items" data={itemListSchema(result.products)} />
      ) : null}

      <div className="grain bg-ink pb-24 pt-12 md:pt-16">
        <Container>
          <Breadcrumbs items={crumbs} />

          <header className="mt-8 max-w-3xl">
            <h1 className="text-display text-cream-50">
              {query.q ? `Results for “${query.q}”` : "The collection"}
            </h1>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-cream-300">
              {query.q
                ? `${result.total} ${result.total === 1 ? "product" : "products"} matched your search.`
                : "Twenty-seven products, all from the same tree. Leaf, pod, flower, seed and gum, handled five different ways."}
            </p>
          </header>

          <div className="mt-14 grid gap-x-12 gap-y-8 lg:grid-cols-[15rem_1fr]">
            <Suspense fallback={<div />}>
              <ShopSidebar groups={groups} />
            </Suspense>

            <div className="min-w-0">
              <Suspense fallback={<div className="h-16" />}>
                <ShopControls groups={groups} total={result.total} activeCount={activeCount} />
              </Suspense>

              {result.products.length === 0 ? (
                <EmptyState
                  title="Nothing matched those filters"
                  body={
                    query.q
                      ? `We couldn't find anything for “${query.q}”. Try a broader term, or browse by category.`
                      : "Try loosening a filter or two — or start from a category."
                  }
                  actionLabel="Clear filters"
                  actionHref="/shop"
                  secondaryLabel="Browse bestsellers"
                  secondaryHref="/shop?collection=bestsellers"
                />
              ) : (
                <>
                  <ProductGrid
                    products={result.products}
                    listName={query.q ? `Search: ${query.q}` : "Shop"}
                    columns={3}
                    priorityCount={3}
                    className="mt-10"
                    headingLabel={query.q ? `Results for ${query.q}` : "Products"}
                  />

                  <Pagination
                    page={result.page}
                    pages={result.pages}
                    total={result.total}
                    pageSize={result.pageSize}
                  />
                </>
              )}
            </div>
          </div>

          {/* Crawlable category links, independent of the JS filter UI. */}
          <nav aria-label="Shop by category" className="mt-20 border-t border-border-subtle pt-10">
            <h2 className="eyebrow mb-5 text-gold-400">Shop by category</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/shop/${category.slug}`}
                    className="inline-block py-1.5 text-sm text-cream-300 underline-offset-4 hover:text-cream-50 hover:underline"
                  >
                    {category.name}{" "}
                    <span className="text-cream-400">({category._count.products})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
    </>
  );
}
