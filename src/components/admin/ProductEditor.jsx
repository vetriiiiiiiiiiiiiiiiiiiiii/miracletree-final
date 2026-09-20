"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { cn, slugify } from "@/lib/utils";
import { Input, Textarea, Select, Checkbox, FormMessage } from "@/components/ui/Field";
import { Card, FieldGroup, Pill } from "@/components/admin/ui";
import { ImageManager } from "@/components/admin/ImageManager";
import { VariantEditor } from "@/components/admin/VariantEditor";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { saveProductAction } from "@/app/actions/admin/products";
const INITIAL = { status: "idle" };
const TABS = [
  "General",
  "Media",
  "Pricing",
  "Variants",
  "Description",
  "SEO",
  "Advanced",
];
export function ProductEditor({
  draft,
  categories,
  productTypes,
  images,
  variants,
  reviewCount,
}) {
  const [state, action] = useActionState(saveProductAction, INITIAL);
  const [tab, setTab] = useState("General");
  const [name, setName] = useState(draft.name);
  const [slug, setSlug] = useState(draft.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(draft.slug));
  const [description, setDescription] = useState(draft.description);
  const [story, setStory] = useState(draft.story);
  const [seoTitle, setSeoTitle] = useState(draft.seoTitle);
  const [seoDescription, setSeoDescription] = useState(draft.seoDescription);
  // A new product's slug follows its name until the user edits the slug.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const isNew = !draft.id;
  // Jump to the tab holding the first error, so a validation message is never
  // hidden behind a tab the user cannot see.
  useEffect(() => {
    if (state.status !== "error" || !Object.keys(errors).length) return;
    const first = Object.keys(errors)[0];
    const location = {
      name: "General",
      slug: "General",
      categoryId: "General",
      shortDescription: "General",
      price: "Pricing",
      compareAtPrice: "Pricing",
      taxRatePct: "Pricing",
      description: "Description",
      story: "Description",
      seoTitle: "SEO",
      seoDescription: "SEO",
      model3dUrl: "Advanced",
      videoUrl: "Advanced",
    };
    setTab(location[first] ?? "General");
  }, [state, errors]);
  return (
    <form
      action={action}
      className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start"
    >
      {draft.id ? <input type="hidden" name="id" value={draft.id} /> : null}

      {/* Everything not on the visible tab still posts, so switching tabs never
            loses an edit. */}
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="story" value={story} />

      <div className="min-w-0">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Product sections"
          className="flex flex-wrap gap-1 border-b border-border-subtle"
        >
          {TABS.map((item) => {
            const disabled = isNew && (item === "Media" || item === "Variants");
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                disabled={disabled}
                onClick={() => setTab(item)}
                title={disabled ? "Save the product first" : undefined}
                className={cn(
                  "-mb-px border-b-2 px-4 py-3 text-[0.7rem] uppercase tracking-[0.12em] transition-colors",
                  tab === item
                    ? "border-gold-400 text-cream-50"
                    : "border-transparent text-cream-400 hover:text-cream-100",
                  disabled && "cursor-not-allowed opacity-35 hover:text-cream-400",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-7">
          {state.status === "error" ? (
            <div className="mb-6">
              <FormMessage>{state.message}</FormMessage>
            </div>
          ) : null}
          {state.status === "success" ? (
            <div className="mb-6">
              <FormMessage tone="success">{state.message}</FormMessage>
            </div>
          ) : null}

          {/* GENERAL */}
          <Panel active={tab === "General"}>
            <FieldGroup
              title="Identity"
              description="What the product is called and where it lives."
            >
              <Input
                label="Product name"
                name="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={errors.name}
              />

              <Input
                label="URL slug"
                name="slug"
                required
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                hint={`Storefront URL: /product/${slug || "…"}`}
                error={errors.slug}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Select
                  label="Category"
                  name="categoryId"
                  defaultValue={draft.categoryId}
                  options={[
                    { value: "", label: "No category" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
                <Select
                  label="Product type"
                  name="productType"
                  defaultValue={draft.productType}
                  options={[{ value: "", label: "Unspecified" }, ...productTypes]}
                  hint="Drives the storefront type filter."
                />
              </div>

              <Textarea
                label="Short description"
                name="shortDescription"
                rows={3}
                maxLength={400}
                defaultValue={draft.shortDescription}
                hint="Shown on product cards and in search results."
                error={errors.shortDescription}
              />
            </FieldGroup>

            <FieldGroup
              title="Merchandising"
              description="Where this product surfaces around the storefront."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Checkbox
                  name="isFeatured"
                  defaultChecked={draft.isFeatured}
                  label="Featured"
                  description="Appears in the homepage collection rail."
                />
                <Checkbox
                  name="isHeroPack"
                  defaultChecked={draft.isHeroPack}
                  label="Homepage hero"
                  description="One of the packs at the top of the homepage. The lowest sort order fills the large panel; the rest cycle through the small cells. Use a photograph cut out of its background."
                />
                <Checkbox
                  name="isBestSeller"
                  defaultChecked={draft.isBestSeller}
                  label="Bestseller"
                  description="Badged, and used for recommendations."
                />
                <Checkbox
                  name="isNew"
                  defaultChecked={draft.isNew}
                  label="New"
                  description="Shows a 'New' badge on cards."
                />
                <Checkbox
                  name="isOnSale"
                  defaultChecked={draft.isOnSale}
                  label="On offer"
                  description="Included in the 'On offer' shop filter."
                />
              </div>
            </FieldGroup>
          </Panel>

          {/* MEDIA */}
          <Panel active={tab === "Media"}>
            {draft.id ? (
              <FieldGroup
                title="Gallery"
                description="The first image is used on cards, in search and as the social share image."
              >
                <ImageManager productId={draft.id} images={images} />
              </FieldGroup>
            ) : (
              <p className="text-sm text-cream-400">
                Save the product first to add images.
              </p>
            )}
          </Panel>

          {/* PRICING */}
          <Panel active={tab === "Pricing"}>
            <FieldGroup
              title="Price"
              description="Enter rupees. The base price is what a card shows; each variant can override it."
            >
              <div className="grid gap-5 sm:grid-cols-3">
                <Input
                  label="Price (₹)"
                  name="price"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  defaultValue={draft.price}
                  error={errors.price}
                />
                <Input
                  label="Compare-at price (₹)"
                  name="compareAtPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={draft.compareAtPrice}
                  hint="Shown struck through."
                  error={errors.compareAtPrice}
                />
                <Input
                  label="Tax rate (%)"
                  name="taxRatePct"
                  type="number"
                  min={0}
                  max={50}
                  defaultValue={draft.taxRatePct}
                  hint="Prices are tax-inclusive."
                />
              </div>
            </FieldGroup>

            <FieldGroup title="Shipping" description="Used for courier weight bands.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Weight (grams)"
                  name="weightGrams"
                  type="number"
                  min={0}
                  defaultValue={draft.weightGrams}
                />
                <Input
                  label="Dimensions"
                  name="dimensions"
                  placeholder="12 × 8 × 4 cm"
                  defaultValue={draft.dimensions}
                />
              </div>
            </FieldGroup>
          </Panel>

          {/* VARIANTS */}
          <Panel active={tab === "Variants"}>
            {draft.id ? (
              <VariantEditor productId={draft.id} variants={variants} />
            ) : (
              <p className="text-sm text-cream-400">
                Save the product first. A &ldquo;Standard&rdquo; variant is created
                automatically, which you can then rename or add sizes alongside.
              </p>
            )}
          </Panel>

          {/* DESCRIPTION */}
          <Panel active={tab === "Description"}>
            <FieldGroup
              title="Full description"
              description="Appears on the product page. Formatting is limited to headings, lists, links and emphasis."
            >
              <RichTextEditor
                label="Description"
                value={description}
                onChange={setDescription}
              />
            </FieldGroup>

            <FieldGroup
              title="Product story"
              description="Optional. When set, this replaces the description in the 'Why this exists' section."
            >
              <RichTextEditor label="Story" value={story} onChange={setStory} />
            </FieldGroup>
          </Panel>

          {/* SEO */}
          <Panel active={tab === "SEO"}>
            <FieldGroup
              title="Search appearance"
              description="Leave blank to fall back to the product name and short description."
            >
              <Input
                label="SEO title"
                name="seoTitle"
                maxLength={70}
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                hint={`${seoTitle.length}/70 characters`}
                error={errors.seoTitle}
              />
              <Textarea
                label="Meta description"
                name="seoDescription"
                rows={3}
                maxLength={180}
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                hint={`${seoDescription.length}/180 characters — aim for 140–155`}
                error={errors.seoDescription}
              />
              <Input
                label="Keywords"
                name="seoKeywords"
                defaultValue={draft.seoKeywords}
                hint="Comma separated. Low weight for ranking, but used internally."
              />
              <Input
                label="Social share image URL"
                name="ogImageUrl"
                defaultValue={draft.ogImageUrl}
                hint="Defaults to the main product image."
              />
            </FieldGroup>

            {/* Search preview */}
            <FieldGroup
              title="Preview"
              description="Roughly how this appears in a search result."
            >
              <div className="max-w-[38rem] border border-border-subtle bg-white/[0.02] p-5">
                <p className="truncate text-xs text-leaf-300">
                  miracletree.in › product › {slug || "…"}
                </p>
                <p className="mt-1 truncate text-[1.05rem] text-[#8ab4f8]">
                  {seoTitle || `${name || "Product name"} — Miracle Tree`}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-cream-400">
                  {seoDescription ||
                    draft.shortDescription ||
                    "Add a meta description."}
                </p>
              </div>
            </FieldGroup>
          </Panel>

          {/* ADVANCED */}
          <Panel active={tab === "Advanced"}>
            <FieldGroup
              title="Identifiers"
              description="Used on packing slips and in your own records."
            >
              <Input label="Product SKU" name="sku" defaultValue={draft.sku} />
            </FieldGroup>

            <FieldGroup
              title="Rich media"
              description="Optional. A 3D model is lazy-loaded on the product page and always falls back to photography."
            >
              <Input
                label="3D model URL (.glb)"
                name="model3dUrl"
                defaultValue={draft.model3dUrl}
                error={errors.model3dUrl}
              />
              <Input
                label="Video URL"
                name="videoUrl"
                defaultValue={draft.videoUrl}
                error={errors.videoUrl}
              />
            </FieldGroup>

            {draft.id ? (
              <FieldGroup
                title="Related content"
                description="Managed from their own screens."
              >
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link
                    href={`/admin/reviews?product=${draft.id}`}
                    className="border border-border-subtle px-4 py-2 text-cream-200 hover:border-border-strong"
                  >
                    Reviews ({reviewCount})
                  </Link>
                  <Link
                    href="/admin/content/faqs"
                    className="border border-border-subtle px-4 py-2 text-cream-200 hover:border-border-strong"
                  >
                    Product FAQs
                  </Link>
                  <Link
                    href="/admin/inventory"
                    className="border border-border-subtle px-4 py-2 text-cream-200 hover:border-border-strong"
                  >
                    Stock levels
                  </Link>
                </div>
              </FieldGroup>
            ) : null}
          </Panel>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="grid gap-4 xl:sticky xl:top-24">
        <Card title="Publish">
          <div className="grid gap-4">
            <Select
              label="Status"
              name="status"
              defaultValue={draft.status}
              options={[
                { value: "draft", label: "Draft — hidden from the store" },
                { value: "published", label: "Published — live" },
                { value: "archived", label: "Archived — hidden, kept for records" },
              ]}
            />

            <SaveButton isNew={isNew} />

            {draft.id ? (
              <Link
                href={`/product/${draft.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
              >
                View on store
              </Link>
            ) : null}
          </div>
        </Card>

        {draft.id ? (
          <Card title="At a glance">
            <dl className="grid gap-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cream-400">Variants</dt>
                <dd className="tabular-nums text-cream-100">{variants.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cream-400">Images</dt>
                <dd className="tabular-nums text-cream-100">{images.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cream-400">Reviews</dt>
                <dd className="tabular-nums text-cream-100">{reviewCount}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-cream-400">In stock</dt>
                <dd>
                  <Pill
                    tone={
                      variants.some((v) => v.onHand - v.reserved > 0)
                        ? "success"
                        : "danger"
                    }
                  >
                    {variants.reduce(
                      (sum, v) => sum + Math.max(0, v.onHand - v.reserved),
                      0,
                    )}
                  </Pill>
                </dd>
              </div>
            </dl>
          </Card>
        ) : null}
      </aside>
    </form>
  );
}
function Panel({ active, children }) {
  return (
    <div
      role="tabpanel"
      hidden={!active}
      className={cn("grid gap-9", !active && "hidden")}
    >
      {children}
    </div>
  );
}
function SaveButton({ isNew }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-emerald-500 px-5 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
    </button>
  );
}
