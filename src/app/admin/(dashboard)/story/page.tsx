import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card, StatCard } from "@/components/admin/ui";
import { RecordManager, type FieldSpec } from "@/components/admin/RecordManager";
import {
  deleteAccoladeAction,
  deleteCreditAction,
  deleteMilestoneAction,
  saveAccoladeAction,
  saveCreditAction,
  saveMilestoneAction,
} from "@/app/actions/admin/story";

export const dynamic = "force-dynamic";

export const metadata = { title: "Our Story" };

const MILESTONE_FIELDS: FieldSpec[] = [
  {
    name: "year",
    label: "Year",
    type: "text",
    required: true,
    half: true,
    placeholder: "2016",
    hint: "Shown in the handwritten margin. A range like 2016–18 is fine.",
  },
  { name: "position", label: "Order", type: "number", half: true, hint: "Lowest first." },
  {
    name: "title",
    label: "What happened",
    type: "text",
    required: true,
    maxLength: 160,
    placeholder: "The first pressing",
  },
  { name: "body", label: "Detail", type: "textarea", rows: 4, maxLength: 2000 },
  {
    name: "source",
    label: "Source",
    type: "text",
    half: true,
    maxLength: 160,
    placeholder: "Government of Tamil Nadu",
  },
  {
    name: "sourceUrl",
    label: "Source link",
    type: "text",
    half: true,
    placeholder: "https://…",
    hint: "Shown as a citation under the entry.",
  },
  { name: "isActive", label: "Show on the page", type: "checkbox" },
];

const ACCOLADE_FIELDS: FieldSpec[] = [
  {
    name: "kind",
    label: "Type",
    type: "select",
    half: true,
    options: [
      { value: "award", label: "Award" },
      { value: "certification", label: "Certification" },
      { value: "recognition", label: "Recognition" },
    ],
  },
  { name: "position", label: "Order", type: "number", half: true, hint: "Lowest first." },
  { name: "title", label: "Title", type: "text", required: true, maxLength: 200 },
  {
    name: "issuer",
    label: "Awarded by",
    type: "text",
    half: true,
    maxLength: 160,
    placeholder: "FSSAI",
  },
  { name: "year", label: "Year", type: "text", half: true, placeholder: "2021" },
  { name: "body", label: "Detail", type: "textarea", rows: 3, maxLength: 2000 },
  {
    name: "source",
    label: "Source",
    type: "text",
    half: true,
    maxLength: 160,
  },
  {
    name: "sourceUrl",
    label: "Source link",
    type: "text",
    half: true,
    placeholder: "https://…",
    hint: "Required whenever a source is named — an award nobody can check is worse than one left off.",
  },
  { name: "isActive", label: "Show on the page", type: "checkbox" },
];

const CREDIT_FIELDS: FieldSpec[] = [
  { name: "name", label: "Name", type: "text", required: true, maxLength: 160 },
  { name: "role", label: "Role", type: "text", required: true, maxLength: 160 },
  {
    name: "group",
    label: "Group",
    type: "select",
    half: true,
    options: [
      { value: "team", label: "Team" },
      { value: "partner", label: "Partner" },
      { value: "grower", label: "Grower" },
      { value: "design", label: "Design & build" },
    ],
  },
  { name: "position", label: "Order", type: "number", half: true, hint: "Lowest first." },
  { name: "body", label: "Detail", type: "textarea", rows: 3, maxLength: 2000 },
  {
    name: "url",
    label: "Link",
    type: "text",
    placeholder: "https://…",
    hint: "Optional. A partner's site, or the source of a borrowed idea.",
  },
  { name: "isActive", label: "Show on the page", type: "checkbox" },
];

const GROUP_LABEL: Record<string, string> = {
  team: "Team",
  partner: "Partner",
  grower: "Grower",
  design: "Design & build",
};

const KIND_LABEL: Record<string, string> = {
  award: "Award",
  certification: "Certification",
  recognition: "Recognition",
};

export default async function StoryAdminPage() {
  await requireAdmin();

  const [milestones, accolades, credits] = await Promise.all([
    prisma.milestone.findMany({ orderBy: [{ position: "asc" }, { year: "asc" }] }),
    prisma.accolade.findMany({ orderBy: [{ kind: "asc" }, { position: "asc" }] }),
    prisma.credit.findMany({ orderBy: [{ group: "asc" }, { position: "asc" }] }),
  ]);

  const cited = accolades.filter((a) => a.sourceUrl).length;

  return (
    <>
      <PageHeader
        title="Our Story"
        description="The timeline, the awards shelf and the credits behind /about."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Milestones" value={String(milestones.length)} />
        <StatCard label="Recognitions" value={String(accolades.length)} />
        <StatCard
          label="With a source link"
          value={`${cited}/${accolades.length}`}
          hint="Anything claimed on the page should be checkable."
        />
      </div>

      <Card>
        <p className="text-sm leading-relaxed">
          Everything on the Our Story page is stored here. Entries are shown in
          the order below, and unticking &ldquo;Show on the page&rdquo; hides one
          without deleting it — useful while a claim is being verified.
        </p>
      </Card>

      <RecordManager
        title="Timeline"
        addLabel="Add a milestone"
        emptyMessage="No milestones yet."
        deleteWarning="This removes the entry from the timeline. To hide it temporarily, untick 'Show on the page' instead."
        fields={MILESTONE_FIELDS}
        saveAction={saveMilestoneAction}
        deleteAction={deleteMilestoneAction}
        records={milestones.map((m) => ({
          id: m.id,
          title: `${m.year} — ${m.title}`,
          subtitle: m.body ?? undefined,
          badges: [
            m.isActive
              ? { label: "Live", tone: "success" as const }
              : { label: "Hidden", tone: "neutral" as const },
            ...(m.sourceUrl ? [{ label: "Cited", tone: "info" as const }] : []),
          ],
          values: {
            year: m.year,
            title: m.title,
            body: m.body ?? "",
            source: m.source ?? "",
            sourceUrl: m.sourceUrl ?? "",
            position: m.position,
            isActive: m.isActive,
          },
        }))}
      />

      <RecordManager
        title="Awards & certification"
        addLabel="Add a recognition"
        emptyMessage="Nothing listed yet."
        deleteWarning="This removes it from the page entirely."
        fields={ACCOLADE_FIELDS}
        saveAction={saveAccoladeAction}
        deleteAction={deleteAccoladeAction}
        records={accolades.map((a) => ({
          id: a.id,
          title: a.title,
          subtitle: [KIND_LABEL[a.kind] ?? a.kind, a.issuer, a.year]
            .filter(Boolean)
            .join(" · "),
          badges: [
            a.isActive
              ? { label: "Live", tone: "success" as const }
              : { label: "Hidden", tone: "neutral" as const },
            a.sourceUrl
              ? { label: "Cited", tone: "info" as const }
              : { label: "No source", tone: "warning" as const },
          ],
          values: {
            kind: a.kind,
            title: a.title,
            issuer: a.issuer ?? "",
            year: a.year ?? "",
            body: a.body ?? "",
            source: a.source ?? "",
            sourceUrl: a.sourceUrl ?? "",
            position: a.position,
            isActive: a.isActive,
          },
        }))}
      />

      <RecordManager
        title="Credits"
        addLabel="Add a credit"
        emptyMessage="No credits yet."
        deleteWarning="This removes them from the credits list."
        fields={CREDIT_FIELDS}
        saveAction={saveCreditAction}
        deleteAction={deleteCreditAction}
        records={credits.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: [c.role, GROUP_LABEL[c.group] ?? c.group].filter(Boolean).join(" · "),
          badges: [
            c.isActive
              ? { label: "Live", tone: "success" as const }
              : { label: "Hidden", tone: "neutral" as const },
            ...(c.url ? [{ label: "Linked", tone: "info" as const }] : []),
          ],
          values: {
            name: c.name,
            role: c.role,
            body: c.body ?? "",
            group: c.group,
            url: c.url ?? "",
            position: c.position,
            isActive: c.isActive,
          },
        }))}
      />
    </>
  );
}
