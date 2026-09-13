import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import {
  deleteTestimonialAction,
  saveTestimonialAction,
} from "@/app/actions/admin/content";
import { truncate } from "@/lib/utils";
export const dynamic = "force-dynamic";
const FIELDS = [
  { name: "authorName", label: "Name", type: "text", required: true, half: true },
  {
    name: "location",
    label: "Location",
    type: "text",
    half: true,
    placeholder: "Madurai",
  },
  {
    name: "body",
    label: "Quote",
    type: "textarea",
    required: true,
    rows: 4,
    maxLength: 1000,
    hint: "Use the customer's own words. Do not write these yourself.",
  },
  { name: "rating", label: "Rating (1–5)", type: "number", half: true },
  { name: "position", label: "Order", type: "number", half: true },
  { name: "imageUrl", label: "Photo URL", type: "text", hint: "Optional." },
  { name: "isActive", label: "Show on the site", type: "checkbox" },
];
export default async function AdminTestimonialsPage() {
  await requireAdmin();
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { position: "asc" },
  });
  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Standalone quotes for the homepage. These sit alongside product reviews, which are moderated separately."
        breadcrumb={[
          { label: "Content", href: "/admin/content" },
          { label: "Testimonials" },
        ]}
      />

      <Card className="mb-6">
        <p className="text-sm leading-relaxed text-cream-300">
          Testimonials should be real statements from real customers, used with their
          permission. Product reviews submitted through the site are managed under{" "}
          <Link
            href="/admin/reviews"
            className="underline underline-offset-4 hover:text-cream-50"
          >
            Reviews
          </Link>
          , where they can be approved and featured.
        </p>
      </Card>

      <RecordManager
        title={`${testimonials.length} testimonial${testimonials.length === 1 ? "" : "s"}`}
        addLabel="Add a testimonial"
        emptyMessage="No testimonials yet."
        deleteWarning="The quote is removed from the homepage and from your records."
        fields={FIELDS}
        saveAction={saveTestimonialAction}
        deleteAction={deleteTestimonialAction}
        records={testimonials.map((item) => ({
          id: item.id,
          title: item.authorName,
          subtitle: truncate(item.body, 160),
          badges: [
            { label: `${item.rating}/5` },
            ...(item.location ? [{ label: item.location, tone: "info" }] : []),
            ...(item.isActive ? [] : [{ label: "Hidden", tone: "neutral" }]),
          ],
          values: {
            authorName: item.authorName,
            location: item.location ?? "",
            body: item.body,
            rating: item.rating,
            position: item.position,
            imageUrl: item.imageUrl ?? "",
            isActive: item.isActive,
          },
        }))}
      />
    </>
  );
}
