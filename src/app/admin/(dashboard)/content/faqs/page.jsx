import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import { deleteFaqAction, saveFaqAction } from "@/app/actions/admin/content";
import { FAQ_CATEGORIES } from "@/lib/constants";
import { truncate } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function AdminFaqsPage() {
  await requireAdmin();
  const [faqs, products] = await Promise.all([
    prisma.faq.findMany({
      orderBy: [{ category: "asc" }, { position: "asc" }],
      include: { product: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { status: "published" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const fields = [
    {
      name: "question",
      label: "Question",
      type: "text",
      required: true,
      maxLength: 300,
    },
    {
      name: "answer",
      label: "Answer",
      type: "textarea",
      required: true,
      rows: 5,
      maxLength: 4000,
      hint: "Plain text. Answer the question directly — this is also used for FAQ structured data.",
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      half: true,
      options: FAQ_CATEGORIES.map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
      })),
    },
    {
      name: "productId",
      label: "Attach to a product",
      type: "select",
      half: true,
      hint: "Leave blank for a general question.",
      options: [
        { value: "", label: "General — shown site-wide" },
        ...products.map((product) => ({ value: product.id, label: product.name })),
      ],
    },
    {
      name: "position",
      label: "Order",
      type: "number",
      half: true,
      hint: "Lower numbers appear first within a category.",
    },
    { name: "isActive", label: "Visible on the site", type: "checkbox", half: true },
  ];
  return (
    <>
      <PageHeader
        title="FAQs"
        description="Shown on the FAQ page, grouped by category, and on the homepage. Product-specific questions also appear on that product's page."
        breadcrumb={[{ label: "Content", href: "/admin/content" }, { label: "FAQs" }]}
      />

      <RecordManager
        title={`${faqs.length} question${faqs.length === 1 ? "" : "s"}`}
        description="Only active questions are published, and only published ones appear in structured data."
        addLabel="Add a question"
        emptyMessage="No questions yet."
        deleteWarning="The question is removed from the site and from your records."
        fields={fields}
        saveAction={saveFaqAction}
        deleteAction={deleteFaqAction}
        records={faqs.map((faq) => ({
          id: faq.id,
          title: faq.question,
          subtitle: truncate(faq.answer, 160),
          badges: [
            { label: faq.category },
            ...(faq.product ? [{ label: faq.product.name, tone: "info" }] : []),
            ...(faq.isActive ? [] : [{ label: "Hidden", tone: "neutral" }]),
          ],
          values: {
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            productId: faq.productId ?? "",
            position: faq.position,
            isActive: faq.isActive,
          },
        }))}
      />
    </>
  );
}
