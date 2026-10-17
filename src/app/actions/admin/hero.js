"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { fieldErrors, formText } from "@/lib/validation";
/**
 * Homepage hero slides: copy, background photograph, linked product and the
 * optional "watch our story" link.
 */
const text = (max) => z.string().trim().max(max).optional().or(z.literal(""));
// An internal path or a full https URL — never javascript: or similar.
const href = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v), {
    message: "Use a site path like /shop or a full https:// link.",
  })
  .optional()
  .or(z.literal(""));
const slideSchema = z.object({
  eyebrow: text(160),
  title: z.string().trim().min(1, "Give the slide a headline.").max(80),
  subtitle: text(120),
  tagline: text(160),
  body: text(600),
  features: text(600),
  ctaLabel: text(40),
  ctaHref: href,
  secondaryLabel: text(40),
  secondaryHref: href,
  imageUrl: href,
  mobileImageUrl: href,
  productSlug: text(200),
  videoUrl: href,
  videoLabel: text(40),
  linkHref: href,
  position: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
  hideText: z.boolean(),
});
const bool = (formData, key) =>
  formData.get(key) === "on" || formData.get(key) === "true";
const orNull = (v) => (v ? v : null);
export async function saveHeroSlideAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const fields = Object.fromEntries(
      Object.keys(slideSchema.shape)
        .filter((k) => !["position", "isActive", "hideText"].includes(k))
        .map((k) => [k, formText(formData, k)]),
    );
    const parsed = slideSchema.safeParse({
      ...fields,
      position: formData.get("position") || 0,
      isActive: bool(formData, "isActive"),
      hideText: bool(formData, "hideText"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const input = parsed.data;
    const data = {
      eyebrow: orNull(input.eyebrow),
      title: input.title,
      subtitle: orNull(input.subtitle),
      tagline: orNull(input.tagline),
      body: orNull(input.body),
      features: orNull(input.features),
      ctaLabel: orNull(input.ctaLabel),
      ctaHref: orNull(input.ctaHref),
      secondaryLabel: orNull(input.secondaryLabel),
      secondaryHref: orNull(input.secondaryHref),
      imageUrl: orNull(input.imageUrl),
      mobileImageUrl: orNull(input.mobileImageUrl),
      productSlug: orNull(input.productSlug),
      videoUrl: orNull(input.videoUrl),
      videoLabel: orNull(input.videoLabel),
      linkHref: orNull(input.linkHref),
      hideText: input.hideText,
      position: input.position,
      isActive: input.isActive,
    };
    const id = String(formData.get("id") ?? "");
    const record = id
      ? await prisma.heroSlide.update({ where: { id }, data })
      : await prisma.heroSlide.create({ data });
    await recordAudit({
      actorId: admin.id,
      action: id ? "heroSlide.updated" : "heroSlide.created",
      entity: "HeroSlide",
      entityId: record.id,
      meta: { title: record.title },
    });
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return { status: "success", message: id ? "Slide updated." : "Slide added." };
  } catch (error) {
    if (error instanceof AuthError)
      return { status: "error", message: error.message };
    console.error("[admin/hero]", error);
    return { status: "error", message: "Could not save that slide." };
  }
}
export async function deleteHeroSlideAction(id) {
  try {
    const admin = await requireAdmin();
    const record = await prisma.heroSlide.findUnique({
      where: { id },
      select: { title: true },
    });
    await prisma.heroSlide.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "heroSlide.deleted",
      entity: "HeroSlide",
      entityId: id,
      meta: { title: record?.title },
    });
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that slide." };
  }
}
