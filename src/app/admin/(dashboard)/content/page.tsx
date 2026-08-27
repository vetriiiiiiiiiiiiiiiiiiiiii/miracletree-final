import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { HomepageBuilder } from "@/components/admin/HomepageBuilder";

export const dynamic = "force-dynamic";

/** Human labels and guidance for each homepage slot. */
const SECTION_META: Record<string, { label: string; hint: string }> = {
  hero: {
    label: "01 — Hero",
    hint: "The opening frame. Title, supporting line and both calls to action.",
  },
  tree: {
    label: "02 — The tree",
    hint: "The scroll-driven growth sequence. Copy only; the illustration is built in.",
  },
  "why-moringa": {
    label: "03 — Why moringa",
    hint: "The four facts about the plant and the process.",
  },
  "farm-to-product": {
    label: "04 — Farm to pack",
    hint: "The seven-step process rail.",
  },
  collection: {
    label: "05 — The collection",
    hint: "Horizontal product rail. Products come from those marked Featured.",
  },
  ingredients: {
    label: "06 — Ingredients",
    hint: "The five parts of the tree, driven by the Ingredients table.",
  },
  reviews: {
    label: "07 — Social proof",
    hint: "Approved reviews first, then testimonials. Nothing is invented here.",
  },
  story: {
    label: "08 — Brand story",
    hint: "The About teaser, with its own image.",
  },
  journal: { label: "09 — Journal", hint: "The three most recent published articles." },
  faq: { label: "10 — FAQ", hint: "The first six active questions." },
  "final-cta": { label: "11 — Closing", hint: "The return to the seed, and the final CTA." },
};

export default async function AdminContentPage() {
  await requireAdmin();

  const sections = await prisma.homepageSection.findMany({
    orderBy: { position: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Every section on the homepage is editable here — text, calls to action, images and order. Disable a section to remove it from the page without losing its content."
        actions={
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-200 transition-colors hover:border-cream-100"
          >
            Preview homepage
          </Link>
        }
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SubLink
          href="/admin/content/faqs"
          title="FAQs"
          body="Questions shown on the homepage, the FAQ page and product pages."
        />
        <SubLink
          href="/admin/content/testimonials"
          title="Testimonials"
          body="Standalone quotes, separate from product reviews."
        />
        <SubLink
          href="/admin/content/navigation"
          title="Navigation"
          body="Header and footer links."
        />
        <SubLink
          href="/admin/content/categories"
          title="Categories"
          body="Shop categories, their copy and SEO."
        />
        <SubLink
          href="/admin/content/announcements"
          title="Announcement bar"
          body="The strip above the header."
        />
        <SubLink
          href="/admin/settings"
          title="Policies & settings"
          body="Shipping thresholds, policy pages, default SEO."
        />
      </div>

      <HomepageBuilder
        sections={sections.map((section) => ({
          key: section.key,
          label: SECTION_META[section.key]?.label ?? section.key,
          hint: SECTION_META[section.key]?.hint ?? "",
          title: section.title ?? "",
          subtitle: section.subtitle ?? "",
          body: section.body ?? "",
          ctaLabel: section.ctaLabel ?? "",
          ctaHref: section.ctaHref ?? "",
          mediaUrl: section.mediaUrl ?? "",
          data: section.data ?? "",
          isActive: section.isActive,
          position: section.position,
        }))}
      />
    </>
  );
}

function SubLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-white/25">
        <h2 className="text-[0.95rem] text-cream-50">{title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-cream-400">{body}</p>
      </Card>
    </Link>
  );
}
