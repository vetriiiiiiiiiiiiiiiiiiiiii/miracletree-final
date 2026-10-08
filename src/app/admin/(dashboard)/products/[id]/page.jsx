import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { PRODUCT_TYPE_OPTIONS } from "@/lib/shop";
import { FormMessage } from "@/components/ui/Field";
export const dynamic = "force-dynamic";
export default async function EditProductPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const [product, categories, allIngredients, allCollections, allTags] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: {
          orderBy: { position: "asc" },
          include: { inventory: true },
        },
        benefits: { orderBy: { position: "asc" } },
        usageSteps: { orderBy: { step: "asc" } },
        ingredients: {
          orderBy: { position: "asc" },
          include: { ingredient: { select: { id: true, name: true } } },
        },
        collections: { select: { collectionId: true } },
        tags: { select: { tagId: true } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
    prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.collection.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();
  const draft = {
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
    status: product.status,
    isFeatured: product.isFeatured,
    isHeroPack: product.isHeroPack,
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
            Product created. Add images and variants, then publish it when it&rsquo;s
            ready.
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
        benefits={product.benefits.map((benefit) => ({
          id: benefit.id,
          title: benefit.title,
          body: benefit.body,
          icon: benefit.icon,
        }))}
        usageSteps={product.usageSteps.map((step) => ({
          id: step.id,
          step: step.step,
          title: step.title,
          body: step.body,
          imageUrl: step.imageUrl,
        }))}
        ingredients={product.ingredients}
        allIngredients={allIngredients}
        collections={allCollections}
        tags={allTags}
        selectedCollectionIds={product.collections.map(c => c.collectionId)}
        selectedTagIds={product.tags.map(t => t.tagId)}
        reviewCount={product._count.reviews}
      />
    </>
  );
}
