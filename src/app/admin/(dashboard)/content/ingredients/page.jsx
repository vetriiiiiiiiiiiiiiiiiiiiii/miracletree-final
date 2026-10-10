import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import {
  deleteIngredientAction,
  saveIngredientAction,
} from "@/app/actions/admin/content";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminIngredientsPage() {
  await requireAdmin();

  const ingredients = await prisma.ingredient.findMany({
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
      hint: "e.g., Moringa Leaf",
    },
    {
      name: "origin",
      label: "Origin",
      type: "text",
      maxLength: 100,
      hint: "e.g., Sourced from Madurai, Tamil Nadu",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      rows: 3,
      maxLength: 1000,
      hint: "Brief explanation of this ingredient's properties.",
    },
    {
      name: "imageUrl",
      label: "Image",
      type: "image",
      folder: "ingredients",
      aspect: "aspect-square",
      hint: "Optional image for this ingredient.",
    },
  ];

  return (
    <>
      <PageHeader
        title="Ingredients"
        description="The base ingredients that can be mapped to products. These appear in the 'From the tree' section."
        breadcrumb={[
          { label: "Content", href: "/admin/content" },
          { label: "Ingredients" },
        ]}
      />

      <RecordManager
        title={`${ingredients.length} ingredient${ingredients.length === 1 ? "" : "s"}`}
        description="Create base ingredients here, then assign them to specific products in the product editor."
        addLabel="Add an ingredient"
        emptyMessage="No ingredients yet."
        deleteWarning="You cannot delete an ingredient if it is currently mapped to products."
        fields={fields}
        saveAction={saveIngredientAction}
        deleteAction={deleteIngredientAction}
        records={ingredients.map((ing) => ({
          id: ing.id,
          title: ing.name,
          subtitle: truncate(ing.description ?? "No description", 160),
          badges: [{ label: `${ing._count.products} products`, tone: "info" }],
          values: {
            name: ing.name,
            origin: ing.origin ?? "",
            description: ing.description ?? "",
            imageUrl: ing.imageUrl ?? "",
          },
        }))}
      />
    </>
  );
}
