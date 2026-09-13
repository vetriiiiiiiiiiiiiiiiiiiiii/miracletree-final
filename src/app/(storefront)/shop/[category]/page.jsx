import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/Section";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ShopControls, ShopSidebar } from "@/components/shop/ShopLayout";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";
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
export const dynamicParams = true;
/** Every category is pre-rendered; new ones fall back to on-demand rendering. */
export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return categories.map((c) => ({ category: c.slug }));
}
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
  const [result, categories, collections, ingredients] = await Promise.all([
    searchProducts(query),
    getCategories(),
    getCollections(),
    getIngredients(),
  ]);
  const groups = buildFilterGroups(categories, collections, ingredients);
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

      <div className="grain bg-ink pb-24 pt-12 md:pt-16">
        <Container>
          <Breadcrumbs items={crumbs} />

          <header className="mt-8 max-w-3xl">
            <p className="eyebrow mb-5 text-gold-400">Category</p>
            <h1 className="text-display text-cream-50">{category.name}</h1>
            {category.description ? (
              <p className="mt-5 max-w-[54ch] leading-relaxed text-cream-300">
                {category.description}
              </p>
            ) : null}
          </header>

          <div className="mt-14 grid gap-x-12 gap-y-8 lg:grid-cols-[15rem_1fr]">
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
