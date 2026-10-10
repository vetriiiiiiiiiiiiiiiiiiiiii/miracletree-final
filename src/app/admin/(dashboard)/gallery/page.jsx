import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import {
  deleteGalleryGroupAction,
  saveGalleryGroupAction,
} from "@/app/actions/admin/gallery";
export const dynamic = "force-dynamic";
export const metadata = { title: "Gallery" };
const GROUP_FIELDS = [
  {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
    maxLength: 120,
    half: true,
    placeholder: "Recognition",
  },
  {
    name: "slug",
    label: "Slug",
    type: "text",
    maxLength: 80,
    half: true,
    placeholder: "recognition",
    hint: "The page anchor, /gallery#slug. Left blank, it is made from the title.",
  },
  {
    name: "lede",
    label: "Introduction",
    type: "textarea",
    rows: 2,
    maxLength: 600,
    hint: "One line under the group's heading.",
  },
  {
    name: "position",
    label: "Order",
    type: "number",
    half: true,
    hint: "Lowest first.",
  },
  { name: "isActive", label: "Show on the page", type: "checkbox" },
];
export default async function GalleryAdminPage() {
  await requireAdmin();
  const groups = await prisma.galleryGroup.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
    include: { photos: { orderBy: { position: "asc" } } },
  });
  const photoCount = groups.reduce((n, g) => n + g.photos.length, 0);
  const hidden = groups.reduce(
    (n, g) => n + g.photos.filter((p) => !p.isActive).length,
    0,
  );
  return (
    <>
      <PageHeader
        title="Gallery"
        description="The groups and photographs on /gallery."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Groups" value={String(groups.length)} />
        <StatCard label="Photos" value={String(photoCount)} />
        <StatCard
          label="Hidden photos"
          value={String(hidden)}
          hint="Kept, but not shown on the page."
        />
      </div>

      <RecordManager
        title="Groups"
        addLabel="Add a group"
        emptyMessage="No groups yet. Add one, then upload photos into it."
        deleteWarning="This removes the group and every photo in it from the gallery. To hide it temporarily, untick 'Show on the page' instead."
        fields={GROUP_FIELDS}
        saveAction={saveGalleryGroupAction}
        deleteAction={deleteGalleryGroupAction}
        records={groups.map((g) => ({
          id: g.id,
          title: g.title,
          subtitle: g.lede ?? undefined,
          badges: [
            g.isActive
              ? { label: "Live", tone: "success" }
              : { label: "Hidden", tone: "neutral" },
            { label: `${g.photos.length} photos`, tone: "neutral" },
          ],
          values: {
            title: g.title,
            slug: g.slug,
            lede: g.lede ?? "",
            position: g.position,
            isActive: g.isActive,
          },
        }))}
      />

      <GalleryManager
        groups={groups.map((g) => ({
          id: g.id,
          title: g.title,
          slug: g.slug,
          isActive: g.isActive,
          photos: g.photos.map((p) => ({
            id: p.id,
            groupId: p.groupId,
            url: p.url,
            alt: p.alt,
            caption: p.caption,
            isActive: p.isActive,
          })),
        }))}
      />
    </>
  );
}
