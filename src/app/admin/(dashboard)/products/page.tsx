import Link from "next/link";
import Image from "next/image";
import { prisma, insensitive } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, Card, Table, Td, Tr, Pill, EmptyRow } from "@/components/admin/ui";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { ProductFilters } from "@/components/admin/ProductFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const where = {
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, ...insensitive } },
            { slug: { contains: params.q, ...insensitive } },
            { sku: { contains: params.q, ...insensitive } },
          ],
        }
      : {}),
  };

  const [products, total, categories, statusCounts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ status: "asc" }, { position: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        price: true,
        compareAtPrice: true,
        isFeatured: true,
        isBestSeller: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
        variants: {
          select: {
            id: true,
            inventory: { select: { onHand: true, reserved: true, trackInventory: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.product.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const counts = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"} matching the current filters.`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center bg-emerald-500 px-5 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400"
          >
            New product
          </Link>
        }
      />

      <ProductFilters
        categories={categories}
        counts={{
          all: (counts.published ?? 0) + (counts.draft ?? 0) + (counts.archived ?? 0),
          published: counts.published ?? 0,
          draft: counts.draft ?? 0,
          archived: counts.archived ?? 0,
        }}
      />

      <Card className="mt-6" padded={false}>
        <Table
          head={[
            "Product",
            "Category",
            { label: "Status", align: "center" },
            { label: "Stock", align: "right" },
            { label: "Price", align: "right" },
            "Updated",
            { label: "", align: "right", width: "3rem" },
          ]}
        >
          {products.length === 0 ? (
            <EmptyRow colSpan={7}>
              {params.q
                ? `No products matched “${params.q}”.`
                : "No products here yet. Create your first one."}
            </EmptyRow>
          ) : (
            products.map((product) => {
              const stock = product.variants.reduce((sum, variant) => {
                const inv = variant.inventory;
                if (!inv || !inv.trackInventory) return sum;
                return sum + Math.max(0, inv.onHand - inv.reserved);
              }, 0);
              const tracked = product.variants.some((v) => v.inventory?.trackInventory);

              return (
                <Tr key={product.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-ink-700">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].url}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain p-1"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="block truncate text-cream-50 hover:text-gold-300"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-cream-400">
                            {product.variants.length} variant
                            {product.variants.length === 1 ? "" : "s"}
                          </span>
                          {product.isFeatured ? <Pill tone="info">Featured</Pill> : null}
                          {product.isBestSeller ? <Pill tone="info">Bestseller</Pill> : null}
                        </div>
                      </div>
                    </div>
                  </Td>

                  <Td className="text-cream-400">{product.category?.name ?? "—"}</Td>

                  <Td align="center">
                    <Pill
                      tone={
                        product.status === "published"
                          ? "success"
                          : product.status === "draft"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {product.status}
                    </Pill>
                  </Td>

                  <Td align="right">
                    {!tracked ? (
                      <span className="text-xs text-cream-400">Untracked</span>
                    ) : (
                      <span
                        className={
                          stock <= 0
                            ? "tabular-nums text-[#e0a19c]"
                            : stock <= 10
                              ? "tabular-nums text-gold-300"
                              : "tabular-nums text-cream-200"
                        }
                      >
                        {stock}
                      </span>
                    )}
                  </Td>

                  <Td align="right" className="tabular-nums text-cream-50">
                    {formatPrice(product.price)}
                    {product.compareAtPrice && product.compareAtPrice > product.price ? (
                      <span className="ml-2 text-xs text-cream-400 line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    ) : null}
                  </Td>

                  <Td className="text-xs text-cream-400">{formatDate(product.updatedAt)}</Td>

                  <Td align="right">
                    <ProductRowActions
                      productId={product.id}
                      slug={product.slug}
                      status={product.status as "draft" | "published" | "archived"}
                    />
                  </Td>
                </Tr>
              );
            })
          )}
        </Table>
      </Card>

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          <p className="text-xs tabular-nums text-cream-400">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={buildHref(params, page - 1)}
                className="border border-border-subtle px-4 py-2 text-xs text-cream-300 hover:border-border-strong hover:text-cream-50"
              >
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={buildHref(params, page + 1)}
                className="border border-border-subtle px-4 py-2 text-xs text-cream-300 hover:border-border-strong hover:text-cream-50"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}

function buildHref(
  params: Record<string, string | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}
