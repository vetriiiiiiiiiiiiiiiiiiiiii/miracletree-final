import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { PRODUCT_TYPE_OPTIONS, getProductTypes } from "@/lib/shop";
export const dynamic = "force-dynamic";
const EMPTY = {
  id: null,
  name: "",
  slug: "",
  sku: "",
  productType: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  story: "",
  price: "",
  compareAtPrice: "",
  taxRatePct: "0",
  weightGrams: "",
  dimensions: "",
  status: "draft",
  isFeatured: false,
  isHeroPack: false,
  isNew: true,
  isBestSeller: false,
  isOnSale: false,
  model3dUrl: "",
  videoUrl: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  ogImageUrl: "",
  position: 9999,
};
export default async function NewProductPage() {
  await requireAdmin();
  const [categories, productTypes] = await Promise.all([
    prisma.category.findMany({
      orderBy: { position: "asc" },
      select: { id: true, name: true },
    }),
    getProductTypes(prisma),
  ]);
  return (
    <>
      <PageHeader
        title="New product"
        description="Fill in the essentials and save. Images, variants and stock come next."
        breadcrumb={[
          { label: "Products", href: "/admin/products" },
          { label: "New" },
        ]}
      />

      <ProductEditor
        draft={EMPTY}
        categories={categories}
        productTypes={productTypes}
        images={[]}
        variants={[]}
        reviewCount={0}
      />
    </>
  );
}
