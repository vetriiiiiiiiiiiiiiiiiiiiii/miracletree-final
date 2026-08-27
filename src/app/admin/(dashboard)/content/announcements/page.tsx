import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { RecordManager, type FieldSpec } from "@/components/admin/RecordManager";
import {
  deleteAnnouncementAction,
  saveAnnouncementAction,
} from "@/app/actions/admin/content";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FIELDS: FieldSpec[] = [
  {
    name: "message",
    label: "Message",
    type: "text",
    required: true,
    maxLength: 200,
    placeholder: "Free shipping on orders above ₹699",
  },
  { name: "href", label: "Link (optional)", type: "text", half: true, placeholder: "/shop" },
  { name: "position", label: "Order", type: "number", half: true },
  {
    name: "startsAt",
    label: "Starts",
    type: "date",
    half: true,
    hint: "Leave blank to start immediately.",
  },
  {
    name: "endsAt",
    label: "Ends",
    type: "date",
    half: true,
    hint: "Leave blank to run indefinitely.",
  },
  { name: "isActive", label: "Active", type: "checkbox" },
];

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const announcements = await prisma.announcement.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Announcement bar"
        description="The strip above the header. Only the first active announcement is shown, and it hides once the visitor scrolls."
        breadcrumb={[{ label: "Content", href: "/admin/content" }, { label: "Announcements" }]}
      />

      <Card className="mb-6">
        <p className="text-sm leading-relaxed text-cream-300">
          Keep it to one short sentence. The bar is the first thing a visitor reads and
          the easiest thing to make noisy — a shipping threshold or a live offer earns
          its place; a greeting does not.
        </p>
      </Card>

      <RecordManager
        title={`${announcements.length} announcement${announcements.length === 1 ? "" : "s"}`}
        addLabel="Add an announcement"
        emptyMessage="No announcements. The bar is hidden."
        deleteWarning="The announcement is removed permanently."
        fields={FIELDS}
        saveAction={saveAnnouncementAction}
        deleteAction={deleteAnnouncementAction}
        records={announcements.map((item) => ({
          id: item.id,
          title: item.message,
          subtitle: [
            item.href ? `Links to ${item.href}` : null,
            item.startsAt ? `From ${formatDate(item.startsAt)}` : null,
            item.endsAt ? `Until ${formatDate(item.endsAt)}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          badges: item.isActive
            ? [{ label: "Active", tone: "success" as const }]
            : [{ label: "Inactive", tone: "neutral" as const }],
          values: {
            message: item.message,
            href: item.href ?? "",
            position: item.position,
            startsAt: item.startsAt ? item.startsAt.toISOString().slice(0, 10) : "",
            endsAt: item.endsAt ? item.endsAt.toISOString().slice(0, 10) : "",
            isActive: item.isActive,
          },
        }))}
      />
    </>
  );
}
