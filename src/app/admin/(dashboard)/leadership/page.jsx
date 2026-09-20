import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card, StatCard } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import {
  deleteLeaderAction,
  deleteLeaderHighlightAction,
  saveLeaderAction,
  saveLeaderHighlightAction,
} from "@/app/actions/admin/leadership";
export const dynamic = "force-dynamic";
export const metadata = { title: "Leadership" };
const LEADER_FIELDS = [
  {
    name: "name",
    label: "Name",
    type: "text",
    required: true,
    maxLength: 160,
    half: true,
  },
  {
    name: "role",
    label: "Role",
    type: "text",
    required: true,
    maxLength: 160,
    half: true,
    placeholder: "Founder & Chief Executive",
  },
  {
    name: "credential",
    label: "Credential",
    type: "text",
    half: true,
    maxLength: 160,
    placeholder: "Engineer-agriculturist",
    hint: "The line under the name.",
  },
  {
    name: "position",
    label: "Order",
    type: "number",
    half: true,
    hint: "Lowest first.",
  },
  {
    name: "bio",
    label: "Short bio",
    type: "textarea",
    rows: 3,
    maxLength: 2000,
    hint: "One or two sentences. Used on the card and beside the portrait.",
  },
  {
    name: "longBio",
    label: "Full biography",
    type: "textarea",
    rows: 12,
    maxLength: 20000,
    hint: "Leave a blank line between paragraphs. Only shown for the featured founder.",
  },
  {
    name: "quote",
    label: "Pull quote",
    type: "textarea",
    rows: 2,
    maxLength: 600,
    hint: "Something they said, shown large above the biography. Quotation marks are added for you.",
  },
  {
    name: "imageUrl",
    label: "Portrait",
    type: "text",
    maxLength: 500,
    placeholder: "/uploads/portrait.webp",
    hint: "Upload in Media, then paste the path here. Without one, a monogram plate is shown.",
  },
  { name: "source", label: "Source", type: "text", half: true, maxLength: 160 },
  {
    name: "sourceUrl",
    label: "Source link",
    type: "text",
    half: true,
    placeholder: "https://…",
    hint: "Shown as a citation. A record nobody can check is worth less than one left off.",
  },
  {
    name: "isFounder",
    label: "Feature as founder",
    type: "checkbox",
    hint: "The featured profile at the top of the page. Ticking this unticks whoever holds it now.",
  },
  { name: "isActive", label: "Show on the page", type: "checkbox" },
];
const KIND_LABEL = {
  award: "Award",
  patent: "Patent",
  role: "Role",
  recognition: "Recognition",
};
export default async function LeadershipAdminPage() {
  await requireAdmin();
  const leaders = await prisma.leader.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { highlights: { orderBy: { position: "asc" } } },
  });
  const highlights = leaders.flatMap((leader) =>
    leader.highlights.map((h) => ({ ...h, leaderName: leader.name })),
  );
  const founder = leaders.find((l) => l.isFounder);
  const cited = leaders.filter((l) => l.sourceUrl).length;
  // The highlight form needs to know who it can attach to, and an entry with
  // no owner has nowhere to render — so the picker is built from live rows.
  const HIGHLIGHT_FIELDS = [
    {
      name: "leaderId",
      label: "Person",
      type: "select",
      required: true,
      options: leaders.map((l) => ({ value: l.id, label: l.name })),
    },
    {
      name: "kind",
      label: "Type",
      type: "select",
      half: true,
      options: [
        { value: "award", label: "Award" },
        { value: "patent", label: "Patent" },
        { value: "role", label: "Role" },
        { value: "recognition", label: "Recognition" },
      ],
    },
    {
      name: "year",
      label: "Year",
      type: "text",
      half: true,
      placeholder: "2022–23",
      hint: "Leave blank for a standing fact with no date.",
    },
    {
      name: "title",
      label: "What it is",
      type: "text",
      required: true,
      maxLength: 200,
    },
    { name: "body", label: "Detail", type: "textarea", rows: 3, maxLength: 2000 },
    {
      name: "position",
      label: "Order",
      type: "number",
      hint: "Lowest first, within that person.",
    },
  ];
  return (
    <>
      <PageHeader
        title="Leadership"
        description="The profiles and the record behind /leadership."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Profiles" value={String(leaders.length)} />
        <StatCard label="Record entries" value={String(highlights.length)} />
        <StatCard
          label="With a source link"
          value={`${cited}/${leaders.length}`}
          hint="Anything claimed on the page should be checkable."
        />
      </div>

      <Card>
        <p className="text-sm leading-relaxed">
          {founder ? (
            <>
              <strong>{founder.name}</strong> is the featured profile — the full
              biography, the pull quote and the record all show on the page. Everyone
              else appears in the grid below it with their short bio.
            </>
          ) : (
            <>
              No profile is marked as the founder yet, so the page will feature
              whichever profile sorts first. Tick &ldquo;Feature as founder&rdquo; on
              one of them.
            </>
          )}{" "}
          Unticking &ldquo;Show on the page&rdquo; hides a profile without deleting it —
          useful while a claim is being verified.
        </p>
      </Card>

      <RecordManager
        title="Profiles"
        addLabel="Add a person"
        emptyMessage="No profiles yet."
        deleteWarning="This removes the profile and every entry on their record. To hide them temporarily, untick 'Show on the page' instead."
        fields={LEADER_FIELDS}
        saveAction={saveLeaderAction}
        deleteAction={deleteLeaderAction}
        records={leaders.map((l) => ({
          id: l.id,
          title: l.name,
          subtitle: l.role,
          badges: [
            l.isActive
              ? { label: "Live", tone: "success" }
              : { label: "Hidden", tone: "neutral" },
            ...(l.isFounder ? [{ label: "Featured", tone: "info" }] : []),
            ...(l.highlights.length
              ? [{ label: `${l.highlights.length} on record`, tone: "neutral" }]
              : []),
            ...(l.sourceUrl ? [{ label: "Cited", tone: "info" }] : []),
          ],
          values: {
            name: l.name,
            role: l.role,
            credential: l.credential ?? "",
            bio: l.bio ?? "",
            longBio: l.longBio ?? "",
            quote: l.quote ?? "",
            imageUrl: l.imageUrl ?? "",
            source: l.source ?? "",
            sourceUrl: l.sourceUrl ?? "",
            isFounder: l.isFounder,
            position: l.position,
            isActive: l.isActive,
          },
        }))}
      />

      <RecordManager
        title="The record"
        addLabel="Add an entry"
        emptyMessage="Nothing on the record yet."
        deleteWarning="This removes the entry from that person's record."
        fields={HIGHLIGHT_FIELDS}
        saveAction={saveLeaderHighlightAction}
        deleteAction={deleteLeaderHighlightAction}
        records={highlights.map((h) => ({
          id: h.id,
          title: h.year ? `${h.year} — ${h.title}` : h.title,
          subtitle: h.body ?? undefined,
          badges: [
            { label: h.leaderName, tone: "neutral" },
            { label: KIND_LABEL[h.kind] ?? h.kind, tone: "info" },
          ],
          values: {
            leaderId: h.leaderId,
            kind: h.kind,
            year: h.year ?? "",
            title: h.title,
            body: h.body ?? "",
            position: h.position,
          },
        }))}
      />
    </>
  );
}
