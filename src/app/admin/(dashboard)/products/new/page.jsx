import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { PRODUCT_TYPE_OPTIONS } from "@/lib/shop";
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
};
export default async function NewProductPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });
  return (
    <>
      <PageHeader
        title="New product"
        description="Fill in the essentials and save. Images, variants and stock come next."
        breadcrumb={[{ label: "Products", href: "/admin/products" }, { label: "New" }]}
      />

      <ProductEditor
        draft={EMPTY}
        categories={categories}
        productTypes={PRODUCT_TYPE_OPTIONS}
        images={[]}
        variants={[]}
        reviewCount={0}
      />
    </>
  );
}
