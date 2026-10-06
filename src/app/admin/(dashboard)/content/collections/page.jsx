import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import { deleteCollectionAction, saveCollectionAction } from "@/app/actions/admin/content";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  await requireAdmin();

  const collections = await prisma.collection.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const fields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      maxLength: 50,
      hint: "e.g., Summer Essentials",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      maxLength: 1000,
      hint: "Optional description for this collection.",
    },
    {
      name: "imageUrl",
      label: "Image URL",
      type: "text",
      hint: "Optional image for this collection.",
    },
    {
      name: "position",
      label: "Order",
      type: "number",
      half: true,
      hint: "Lower numbers appear first.",
    },
    {
      name: "isActive",
      label: "Visible",
      type: "checkbox",
      half: true,
    },
  ];

  return (
    <>
      <PageHeader
        title="Collections"
        description="Group products together into curated collections for marketing and discovery."
        breadcrumb={[{ label: "Content", href: "/admin/content" }, { label: "Collections" }]}
      />

      <RecordManager
        title={`${collections.length} collection${collections.length === 1 ? "" : "s"}`}
        description="Create collections here, then assign products to them in the product editor."
        addLabel="Add a collection"
        emptyMessage="No collections yet."
        deleteWarning="Products in this collection will not be deleted, but the collection itself will be removed."
        fields={fields}
        saveAction={saveCollectionAction}
        deleteAction={deleteCollectionAction}
        records={collections.map((col) => ({
          id: col.id,
          title: col.name,
          subtitle: truncate(col.description ?? "No description", 160),
          badges: [
            { label: `${col._count.products} products`, tone: "info" },
            ...(col.isActive ? [] : [{ label: "Hidden", tone: "neutral" }]),
          ],
          values: {
            name: col.name,
            description: col.description ?? "",
            imageUrl: col.imageUrl ?? "",
            position: col.position,
            isActive: col.isActive,
          },
        }))}
      />
    </>
  );
}
