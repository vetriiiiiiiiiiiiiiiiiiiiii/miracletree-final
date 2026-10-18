import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/Section";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ShopControls, ShopSidebar } from "@/components/shop/ShopLayout";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ShopHero } from "@/components/shop/ShopHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";
import { getCategories, getIngredients, searchProducts } from "@/lib/queries";
import { shopQuerySchema } from "@/lib/validation";
import { buildFilterGroups, countActiveFilters } from "@/lib/shop";
import { breadcrumbSchema, buildMetadata, itemListSchema } from "@/lib/seo";
/** Every category is pre-rendered; new ones fall back to on-demand rendering. */

async function loadCategory(slug) {
  return prisma.category.findFirst({
    where: { slug, isActive: true },
    select: {
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      imageUrl: true,
    },
  });
}
export async function generateMetadata({ params }) {
  const { category: slug } = await params;
  const category = await loadCategory(slug);
  if (!category)
    return buildMetadata({
      title: "Not found",
      description: "",
      path: `/shop/${slug}`,
      noIndex: true,
    });
  return buildMetadata({
    title: category.seoTitle ?? `${category.name} — moringa from Madurai`,
    description:
      category.seoDescription ??
      category.description ??
      `Shop ${category.name.toLowerCase()} from Miracle Tree.`,
    path: `/shop/${category.slug}`,
    image: category.imageUrl,
  });
}
export default async function CategoryPage({ params, searchParams }) {
  const { category: slug } = await params;
  const raw = await searchParams;
  const category = await loadCategory(slug);
  if (!category) notFound();
  // The route segment is the category filter; a conflicting query param is ignored.
  const query = shopQuerySchema.parse({ ...raw, category: slug });
  const [result, categories, ingredients] = await Promise.all([
    searchProducts(query),
    getCategories(),
    getIngredients(),
  ]);
  const groups = buildFilterGroups(categories, ingredients);
  // The category itself is fixed by the URL here, so it is not offered as a filter.
  const scopedGroups = { ...groups, categories: [] };
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: category.name, path: `/shop/${category.slug}` },
  ];
  return (
    <>
      <JsonLd id="category-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {result.products.length ? (
        <JsonLd id="category-items" data={itemListSchema(result.products)} />
      ) : null}

      <div className="bg-ink pb-20 pt-6 md:pt-8">
        <Container>
          <Breadcrumbs items={crumbs} />

          <ShopHero
            title={category.name}
            description={category.description}
            total={result.total}
            categories={categories.filter((c) => c._count.products)}
            activeSlug={category.slug}
          />

          <div className="mt-8 grid gap-x-10 gap-y-6 lg:grid-cols-[15rem_1fr]">
            <Suspense fallback={<div />}>
              <ShopSidebar groups={scopedGroups} />
            </Suspense>

            <div className="min-w-0">
              <Suspense fallback={<div className="h-16" />}>
                <ShopControls
                  groups={scopedGroups}
                  total={result.total}
                  activeCount={countActiveFilters(raw)}
                />
              </Suspense>

              {result.products.length === 0 ? (
                <EmptyState
                  title={`Nothing in ${category.name} right now`}
                  body="Either everything here is out of stock, or the filters are too tight. Try clearing them."
                  actionLabel="Clear filters"
                  actionHref={`/shop/${category.slug}`}
                  secondaryLabel="Shop everything"
                  secondaryHref="/shop"
                />
              ) : (
                <>
                  <ProductGrid
                    layout={raw.view === "list" ? "list" : "grid"}
                    products={result.products}
                    listName={category.name}
                    columns={3}
                    priorityCount={3}
                    className="mt-10"
                    headingLabel={category.name}
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
        </Container>
      </div>
    </>
  );
}
