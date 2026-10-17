import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import {
  deleteHeroSlideAction,
  saveHeroSlideAction,
} from "@/app/actions/admin/hero";
export const dynamic = "force-dynamic";
export const metadata = { title: "Hero banner" };
export default async function HeroAdminPage() {
  await requireAdmin();
  const [slides, products] = await Promise.all([
    prisma.heroSlide.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    prisma.product.findMany({
      where: { status: "published" },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
  ]);
  const FIELDS = [
    {
      name: "imageUrl",
      label: "Background photograph",
      type: "image",
      folder: "hero",
      aspect: "aspect-video",
      hint: "A wide lifestyle photo, at least 1920×900. The left side sits under the text, so keep the subject to the right. Without one, the product's pack is shown on deep green.",
    },
    {
      name: "linkHref",
      label: "Click-through link (whole slide)",
      type: "text",
      maxLength: 500,
      placeholder: "/product/mogo-moringa-energy-bar",
      hint: "Where shoppers go when they click anywhere on the slide — a site path like /shop/super-foods, or a full https:// link. The buttons below keep their own links. Leave empty for no click-through.",
    },
    {
      name: "hideText",
      label: "Photo only — hide the text and buttons",
      type: "checkbox",
      hint: "For a banner that already has its headline and offer designed into the photo. Set a click-through link above so it still goes somewhere.",
    },
    {
      name: "eyebrow",
      label: "Small line above the headline",
      type: "text",
      maxLength: 160,
      placeholder: "Natural nutrition · Indian origin · Global goodness",
      hint: "Separate phrases with · to get the dots.",
    },
    { name: "title", label: "Headline", type: "text", required: true, maxLength: 80, half: true, placeholder: "Mogo" },
    { name: "subtitle", label: "Second line (accent colour)", type: "text", maxLength: 120, half: true, placeholder: "Moringa Energy Bar" },
    { name: "tagline", label: "Tagline", type: "text", maxLength: 160, placeholder: "Real ingredients. Lasting energy." },
    { name: "body", label: "Description", type: "textarea", rows: 3, maxLength: 600 },
    {
      name: "features",
      label: "Feature icons (up to 3)",
      type: "textarea",
      rows: 3,
      maxLength: 600,
      placeholder: "leaf | Rich in natural nutrition\nbolt | Plant-based energy\nflask | No artificial preservatives",
      hint: "One per line as icon | text. Icons: leaf, bolt, flask, sun, shield, heart.",
    },
    {
      name: "productSlug",
      label: "Product",
      type: "select",
      options: [
        { value: "", label: "— None —" },
        ...products.map((p) => ({ value: p.slug, label: p.name })),
      ],
      hint: "Its pack is shown when there is no background photo, and the main button links to it if you leave the link below empty.",
    },
    { name: "ctaLabel", label: "Main button text", type: "text", maxLength: 40, half: true, placeholder: "Shop Mogo" },
    { name: "ctaHref", label: "Main button link", type: "text", maxLength: 500, half: true, placeholder: "/product/…" },
    { name: "secondaryLabel", label: "Second button text", type: "text", maxLength: 40, half: true, placeholder: "Know more" },
    { name: "secondaryHref", label: "Second button link", type: "text", maxLength: 500, half: true, placeholder: "/innovation" },
    { name: "videoLabel", label: "Video link text", type: "text", maxLength: 40, half: true, placeholder: "Watch our story" },
    { name: "videoUrl", label: "Video link", type: "text", maxLength: 500, half: true, placeholder: "https://youtube.com/…", hint: "Opens in a new tab. Leave empty to hide." },
    { name: "position", label: "Order", type: "number", half: true, hint: "Lowest first." },
    { name: "isActive", label: "Show on the homepage", type: "checkbox" },
  ];
  return (
    <>
      <PageHeader
        title="Hero banner"
        description="The full-width slides at the top of the homepage."
      />
      <Card>
        <p className="text-sm leading-relaxed">
          Slides cross-fade every seven seconds, in order. For each one you
          can upload the photo, edit every line of text, set the two buttons
          and where they go, and set where a click anywhere on the slide goes.
          The text sits on the left over a dark shade, so the product or scene
          reads best on the right — or tick &ldquo;Photo only&rdquo; for a
          banner that already has its text designed in. With no visible slides
          the homepage falls back to the products ticked &ldquo;Homepage
          hero&rdquo;.
        </p>
      </Card>
      <RecordManager
        title="Slides"
        addLabel="Add a slide"
        emptyMessage="No slides yet."
        deleteWarning="This removes the slide from the homepage. To take it down for now, untick 'Show on the homepage' instead."
        fields={FIELDS}
        saveAction={saveHeroSlideAction}
        deleteAction={deleteHeroSlideAction}
        records={slides.map((s) => ({
          id: s.id,
          title: [s.title, s.subtitle].filter(Boolean).join(" — "),
          subtitle: s.tagline ?? s.body ?? undefined,
          badges: [
            s.isActive ? { label: "Live", tone: "success" } : { label: "Hidden", tone: "neutral" },
            s.imageUrl ? { label: "Photo", tone: "info" } : { label: "No photo", tone: "warning" },
            ...(s.linkHref ? [{ label: "Clickable", tone: "info" }] : []),
            ...(s.hideText ? [{ label: "Photo only", tone: "neutral" }] : []),
          ],
          values: {
            eyebrow: s.eyebrow ?? "",
            title: s.title,
            subtitle: s.subtitle ?? "",
            tagline: s.tagline ?? "",
            body: s.body ?? "",
            features: s.features ?? "",
            ctaLabel: s.ctaLabel ?? "",
            ctaHref: s.ctaHref ?? "",
            secondaryLabel: s.secondaryLabel ?? "",
            secondaryHref: s.secondaryHref ?? "",
            imageUrl: s.imageUrl ?? "",
            productSlug: s.productSlug ?? "",
            videoUrl: s.videoUrl ?? "",
            videoLabel: s.videoLabel ?? "",
            linkHref: s.linkHref ?? "",
            hideText: s.hideText,
            position: s.position,
            isActive: s.isActive,
          },
        }))}
      />
    </>
  );
}
