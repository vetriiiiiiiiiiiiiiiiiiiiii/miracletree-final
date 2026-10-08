import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import { deleteTagAction, saveTagAction } from "@/app/actions/admin/content";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  await requireAdmin();

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  const fields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
      maxLength: 50,
      hint: "e.g., Vegan, Best Seller, New Arrival",
    },
  ];

  return (
    <>
      <PageHeader
        title="Tags"
        description="Simple tags to categorize or label products."
        breadcrumb={[{ label: "Content", href: "/admin/content" }, { label: "Tags" }]}
      />

      <RecordManager
        title={`${tags.length} tag${tags.length === 1 ? "" : "s"}`}
        description="Create tags here, then assign them to products in the product editor."
        addLabel="Add a tag"
        emptyMessage="No tags yet."
        deleteWarning="Products with this tag will not be deleted, but the tag itself will be removed."
        fields={fields}
        saveAction={saveTagAction}
        deleteAction={deleteTagAction}
        records={tags.map((tag) => ({
          id: tag.id,
          title: tag.name,
          subtitle: `Slug: ${tag.slug}`,
          badges: [
            { label: `${tag._count.products} products`, tone: "info" },
          ],
          values: {
            name: tag.name,
          },
        }))}
      />
    </>
  );
}
