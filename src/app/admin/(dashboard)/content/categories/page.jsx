import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin/content";
export const dynamic = "force-dynamic";
const FIELDS = [
  { name: "name", label: "Name", type: "text", required: true, half: true },
  {
    name: "slug",
    label: "URL slug",
    type: "text",
    required: true,
    half: true,
    hint: "Appears as /shop/<slug>. Changing it breaks existing links.",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    rows: 3,
    maxLength: 600,
    hint: "Shown at the top of the category page.",
  },
  { name: "imageUrl", label: "Image URL", type: "text" },
  { name: "position", label: "Order", type: "number", half: true },
  { name: "isActive", label: "Visible in the shop", type: "checkbox", half: true },
  {
    name: "seoTitle",
    label: "SEO title",
    type: "text",
    maxLength: 70,
    hint: "Defaults to the category name.",
  },
  {
    name: "seoDescription",
    label: "Meta description",
    type: "textarea",
    rows: 2,
    maxLength: 180,
  },
];
export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <>
      <PageHeader
        title="Categories"
        description="Shop categories, their landing-page copy and SEO. Each one gets its own indexed page at /shop/<slug>."
        breadcrumb={[
          { label: "Content", href: "/admin/content" },
          { label: "Categories" },
        ]}
      />

      <RecordManager
        title={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
        addLabel="Add a category"
        emptyMessage="No categories yet."
        deleteWarning="A category can only be deleted once no products are assigned to it. To take it off the shop without deleting, uncheck 'Visible' instead."
        fields={FIELDS}
        saveAction={saveCategoryAction}
        deleteAction={deleteCategoryAction}
        records={categories.map((category) => ({
          id: category.id,
          title: category.name,
          subtitle: category.description ?? `/shop/${category.slug}`,
          badges: [
            {
              label: `${category._count.products} product${category._count.products === 1 ? "" : "s"}`,
              tone: "info",
            },
            ...(category.isActive ? [] : [{ label: "Hidden", tone: "neutral" }]),
          ],
          values: {
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            imageUrl: category.imageUrl ?? "",
            position: category.position,
            isActive: category.isActive,
            seoTitle: category.seoTitle ?? "",
            seoDescription: category.seoDescription ?? "",
          },
        }))}
      />
    </>
  );
}
