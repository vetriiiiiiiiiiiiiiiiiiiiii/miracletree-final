import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ProductEditor, type ProductDraft } from "@/components/admin/ProductEditor";
import { PRODUCT_TYPE_OPTIONS } from "@/lib/shop";
import { FormMessage } from "@/components/ui/Field";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: {
          orderBy: { position: "asc" },
          include: { inventory: true },
        },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  const draft: ProductDraft = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? "",
    productType: product.productType ?? "",
    categoryId: product.categoryId ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    story: product.story ?? "",
    price: String(product.price / 100),
    compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice / 100) : "",
    taxRatePct: String(product.taxRatePct),
    weightGrams: product.weightGrams ? String(product.weightGrams) : "",
    dimensions: product.dimensions ?? "",
    status: product.status as "draft" | "published" | "archived",
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    isOnSale: product.isOnSale,
    model3dUrl: product.model3dUrl ?? "",
    videoUrl: product.videoUrl ?? "",
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    seoKeywords: product.seoKeywords ?? "",
    ogImageUrl: product.ogImageUrl ?? "",
  };

  return (
    <>
      <PageHeader
        title={product.name}
        description={`Last updated ${product.updatedAt.toLocaleString("en-IN")}`}
        breadcrumb={[
          { label: "Products", href: "/admin/products" },
          { label: product.name },
        ]}
      />

      {created ? (
        <div className="mb-6">
          <FormMessage tone="success">
            Product created. Add images and variants, then publish it when it&rsquo;s ready.
          </FormMessage>
        </div>
      ) : null}

      <ProductEditor
        draft={draft}
        categories={categories}
        productTypes={PRODUCT_TYPE_OPTIONS}
        images={product.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          width: image.width,
          height: image.height,
        }))}
        variants={product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          weightGrams: variant.weightGrams,
          imageUrl: variant.imageUrl,
          isActive: variant.isActive,
          onHand: variant.inventory?.onHand ?? 0,
          reserved: variant.inventory?.reserved ?? 0,
          lowStockAt: variant.inventory?.lowStockAt ?? 10,
        }))}
        reviewCount={product._count.reviews}
      />
    </>
  );
}
