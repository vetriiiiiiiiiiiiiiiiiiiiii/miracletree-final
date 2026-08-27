import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { RecordManager, type FieldSpec } from "@/components/admin/RecordManager";
import { deleteNavItemAction, saveNavItemAction } from "@/app/actions/admin/content";

export const dynamic = "force-dynamic";

const GROUP_LABELS: Record<string, string> = {
  header: "Header",
  "footer-shop": "Footer · Shop",
  "footer-company": "Footer · Company",
  "footer-support": "Footer · Support",
};

const FIELDS: FieldSpec[] = [
  { name: "label", label: "Link text", type: "text", required: true, half: true },
  {
    name: "href",
    label: "Destination",
    type: "text",
    required: true,
    half: true,
    placeholder: "/shop",
    hint: "A path like /shop, or a full https:// URL.",
  },
  {
    name: "group",
    label: "Where it appears",
    type: "select",
    half: true,
    options: Object.entries(GROUP_LABELS).map(([value, label]) => ({ value, label })),
  },
  { name: "position", label: "Order", type: "number", half: true },
  { name: "isActive", label: "Visible", type: "checkbox" },
];

export default async function AdminNavigationPage() {
  await requireAdmin();

  const items = await prisma.navigationItem.findMany({
    orderBy: [{ group: "asc" }, { position: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Navigation"
        description="The header menu and the three footer columns. Changes appear across the site immediately."
        breadcrumb={[{ label: "Content", href: "/admin/content" }, { label: "Navigation" }]}
      />

      <RecordManager
        title={`${items.length} link${items.length === 1 ? "" : "s"}`}
        description="Order is set per group — lower numbers appear first."
        addLabel="Add a link"
        emptyMessage="No navigation links. The site will fall back to nothing, so add at least the essentials."
        deleteWarning="The link is removed from the site."
        fields={FIELDS}
        saveAction={saveNavItemAction}
        deleteAction={deleteNavItemAction}
        records={items.map((item) => ({
          id: item.id,
          title: item.label,
          subtitle: item.href,
          badges: [
            { label: GROUP_LABELS[item.group] ?? item.group, tone: "info" as const },
            ...(item.isActive ? [] : [{ label: "Hidden", tone: "neutral" as const }]),
          ],
          values: {
            label: item.label,
            href: item.href,
            group: item.group,
            position: item.position,
            isActive: item.isActive,
          },
        }))}
      />
    </>
  );
}
